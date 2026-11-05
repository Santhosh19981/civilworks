import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { RentalService } from '../../services/rental.service';
import { ToastController, NavController } from '@ionic/angular';

@Component({
    selector: 'app-rental-detail',
    templateUrl: './rental-detail.page.html',
    styleUrls: ['./rental-detail.page.scss'],
})
export class RentalDetailPage implements OnInit {
    rental: any;
    rentalParams: { label: string; value: string }[] = [];
    loading = true;
    daysCount = 1;
    totalAmount = 0;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private rentalService: RentalService,
        private toastController: ToastController,
        private navCtrl: NavController,
        private location: Location
    ) { }

    ngOnInit() {
        const rentalId = this.route.snapshot.paramMap.get('id');
        if (rentalId) {
            this.loadRental(rentalId);
        }
    }

    loadRental(id: string) {
        this.loading = true;
        this.rentalService.getRentalById(id).subscribe({
            next: (rental: any) => {
                this.rental = this.normalizeRental(rental);
                this.rentalParams = this.getDynamicParameters(this.rental);
                this.calculateTotal();
                this.loading = false;
            },
            error: (err: any) => {
                console.error('Error loading rental', err);
                this.loading = false;
            }
        });
    }

    normalizeRental(r: any): any {
        if (!r) return null;
        const id = String(r.id);
        const name = r.name || 'Machinery';
        const category = r.subcategory_name || r.category_name || r.category || 'Machinery';
        const pricePerDay = Number(r.price_per_day || r.pricePerDay || 0);
        const mobile = r.mobile || '';
        const description = r.description || '';
        const unitName = r.unit_name || 'Day';
        const mainCategoryName = r.main_category_name || '';
        const subcategoryName = r.subcategory_name || '';
        const categoryName = r.category_name || '';
        const available = r.available !== undefined ? Boolean(r.available) : true;

        let localImage = 'assets/rentals/jcb_3dx.jpg';
        const lower = name.toLowerCase();
        if (r.image && typeof r.image === 'string' && r.image.trim() !== '') {
            localImage = r.image;
        } else if (lower.includes('jcb') || lower.includes('backhoe') || lower.includes('loader')) {
            localImage = 'assets/rentals/jcb_3dx.jpg';
        } else if (lower.includes('caterpillar') || lower.includes('excavat') || lower.includes('cat')) {
            localImage = 'assets/rentals/excavator.jpg';
        } else if (lower.includes('jackhammer') || lower.includes('bosch') || lower.includes('breaker')) {
            localImage = 'assets/rentals/jackhammer.jpg';
        } else if (lower.includes('mixer') || lower.includes('concrete')) {
            localImage = 'assets/rentals/concrete_mixer.jpg';
        } else if (lower.includes('scaffold') || lower.includes('frame')) {
            localImage = 'assets/rentals/scaffolding.jpg';
        }

        return {
            ...r,
            id,
            name,
            category,
            categoryName,
            subcategoryName,
            mainCategoryName,
            pricePerDay,
            unitName,
            image: localImage,
            description,
            mobile,
            available
        };
    }

    getDynamicParameters(r: any): { label: string; value: string }[] {
        if (!r) return [];
        const params: { label: string; value: string }[] = [];
        if (r.name) params.push({ label: 'Equipment Name', value: r.name });
        if (r.mainCategoryName) params.push({ label: 'Industry Sector', value: r.mainCategoryName });
        if (r.categoryName) params.push({ label: 'Category', value: r.categoryName });
        if (r.subcategoryName) params.push({ label: 'Sub Category', value: r.subcategoryName });
        if (r.unitName) params.push({ label: 'Duration Unit', value: r.unitName });
        if (r.pricePerDay) params.push({ label: 'Rental Rate', value: '₹' + r.pricePerDay.toLocaleString() + ' / ' + (r.unitName || 'Day') });
        if (r.mobile) params.push({ label: 'Direct Support', value: r.mobile });
        params.push({ label: 'Availability', value: r.available ? 'Available for Rent' : 'Unavailable' });
        return params;
    }

    setPresetDays(days: number) {
        this.daysCount = days;
        this.calculateTotal();
    }

    incrementDays() {
        this.daysCount++;
        this.calculateTotal();
    }

    decrementDays() {
        if (this.daysCount > 1) {
            this.daysCount--;
            this.calculateTotal();
        }
    }

    calculateTotal() {
        if (this.rental && this.rental.pricePerDay) {
            this.totalAmount = this.rental.pricePerDay * this.daysCount;
        }
    }

    async placeBooking() {
        if (!this.rental) return;

        const bookingId = 'RENT' + Math.floor(1000 + Math.random() * 9000);
        const bookingData = {
            id: bookingId,
            bookingId: bookingId,
            rentalName: this.rental.name,
            serviceName: this.rental.name,
            days: this.daysCount,
            total: this.totalAmount,
            totalAmount: this.totalAmount,
            date: new Date().toISOString().split('T')[0],
            status: 'Booked',
            mobile: this.rental.mobile,
            type: 'rental',
            image: this.rental.image,
            main_category_name: this.rental.mainCategoryName || 'Construction'
        };

        this.router.navigate(['/checkout'], {
            state: { bookingData: bookingData }
        });
    }

    goBack() {
        if (window.history.length > 1) {
            this.location.back();
        } else {
            this.router.navigate(['/tabs/rentals']);
        }
    }

    onImageError(event: any) {
        const target = event.target as HTMLImageElement;
        if (target) {
            target.src = 'assets/rentals/jcb_3dx.jpg';
        }
    }
}
