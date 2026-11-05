import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { HelperService } from '../../services/helper.service';
import { NavController } from '@ionic/angular';

@Component({
    selector: 'app-helper-details',
    templateUrl: './helper-details.page.html',
    styleUrls: ['./helper-details.page.scss'],
})
export class HelperDetailsPage implements OnInit {
    helper: any;
    helperParams: { label: string; value: string }[] = [];
    loading = true;
    daysCount = 1;
    membersCount = 1;
    totalAmount = 0;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private helperService: HelperService,
        private navCtrl: NavController,
        private location: Location
    ) { }

    ngOnInit() {
        const helperId = this.route.snapshot.paramMap.get('id');
        if (helperId) {
            this.loadHelper(helperId);
        }
    }

    loadHelper(id: string) {
        this.loading = true;
        this.helperService.getHelperById(id).subscribe({
            next: (helper: any) => {
                this.helper = this.normalizeHelper(helper);
                this.helperParams = this.getDynamicParameters(this.helper);
                this.calculateTotal();
                this.loading = false;
            },
            error: (err: any) => {
                console.error('Error loading helper', err);
                this.loading = false;
            }
        });
    }

    normalizeHelper(h: any): any {
        const id = String(h.id);
        const name = h.service_name || h.name || 'Skilled Helper';
        const pricePerDay = Number(h.price_per_day || h.pricePerDay || 500);
        const mobile = h.mobile || '';
        const description = h.description || '';
        const status = h.status || 'active';
        const category = h.category_name || h.subcategory_name || h.category || '';

        let image = h.image;
        if (!image || typeof image !== 'string' || image.trim() === '' || image === 'null') {
            const lower = name.toLowerCase();
            if (lower.includes('carpenter')) image = 'assets/images/helpers/carpenter.avif';
            else if (lower.includes('electrician')) image = 'assets/images/helpers/electrician.jpg';
            else if (lower.includes('plumber')) image = 'assets/images/helpers/plumber.webp';
            else if (lower.includes('mason')) image = 'assets/images/helpers/mason.webp';
            else if (lower.includes('painter')) image = 'assets/images/helpers/painter.jpg';
            else if (lower.includes('tile')) image = 'assets/images/helpers/tileworker.jpg';
            else if (lower.includes('steel') || lower.includes('rebar')) image = 'assets/images/helpers/steelfixer.webp';
            else if (lower.includes('fabricat') || lower.includes('weld')) image = 'assets/images/helpers/fabricator.jpg';
            else if (lower.includes('waterproof')) image = 'assets/images/helpers/waterproofing.jpg';
            else if (lower.includes('ac') || lower.includes('hvac')) image = 'assets/images/helpers/ac_technician.jpg';
            else image = 'assets/images/helpers/electrician.jpg';
        }

        return {
            ...h,
            id,
            name,
            service_name: name,
            pricePerDay,
            mobile,
            description,
            status,
            image,
            category
        };
    }

    getDynamicParameters(h: any): { label: string; value: string }[] {
        if (!h) return [];
        const params: { label: string; value: string }[] = [];
        if (h.service_name || h.name) params.push({ label: 'Trade / Service', value: h.service_name || h.name });
        if (h.category) params.push({ label: 'Category', value: h.category });
        if (h.pricePerDay) params.push({ label: 'Daily Rate', value: '₹' + h.pricePerDay.toLocaleString() + ' / Day' });
        if (h.mobile) params.push({ label: 'Contact Support', value: h.mobile });
        params.push({ label: 'Service Status', value: h.status === 'active' ? 'Available for Booking' : 'Unavailable' });
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

    incrementMembers() {
        this.membersCount++;
        this.calculateTotal();
    }

    decrementMembers() {
        if (this.membersCount > 1) {
            this.membersCount--;
            this.calculateTotal();
        }
    }

    calculateTotal() {
        if (this.helper && this.helper.pricePerDay) {
            this.totalAmount = this.helper.pricePerDay * this.daysCount * this.membersCount;
        }
    }

    async placeBooking() {
        if (!this.helper) return;

        const bookingId = 'HELP' + Math.floor(1000 + Math.random() * 9000);
        const bookingData = {
            id: bookingId,
            bookingId: bookingId,
            serviceName: this.helper.service_name || this.helper.name,
            trade: this.helper.service_name || this.helper.name,
            members: this.membersCount,
            days: this.daysCount,
            total: this.totalAmount,
            totalAmount: this.totalAmount,
            date: new Date().toISOString().split('T')[0],
            status: 'Booked',
            mobile: this.helper.mobile,
            type: 'helper',
            image: this.helper.image,
            main_category_name: this.helper.main_category_name || 'Construction'
        };

        this.router.navigate(['/checkout'], {
            state: { bookingData: bookingData }
        });
    }

    goBack() {
        if (window.history.length > 1) {
            this.location.back();
        } else {
            this.router.navigate(['/helpers']);
        }
    }

    onImageError(event: any) {
        const target = event.target as HTMLImageElement;
        if (target) {
            target.src = 'assets/images/helpers/electrician.jpg';
        }
    }
}
