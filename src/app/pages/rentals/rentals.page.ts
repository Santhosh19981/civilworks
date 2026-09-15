import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RentalService } from '../../services/rental.service';
import { Rental } from '../../models/rental.model';

@Component({
    selector: 'app-rentals',
    templateUrl: './rentals.page.html',
    styleUrls: ['./rentals.page.scss'],
})
export class RentalsPage implements OnInit {
    rentals: any[] = [];
    filteredRentals: any[] = [];
    searchQuery = '';
    selectedCategory = 'All';
    categories = ['All', 'Heavy Machinery', 'Power Tools', 'Concrete Equipment', 'Scaffolding & Formwork'];
    sortBy = 'popular';
    loading = true;

    constructor(
        private rentalService: RentalService,
        private router: Router
    ) { }

    ngOnInit() {
        this.loadRentals();
    }

    loadRentals() {
        this.loading = true;
        this.rentalService.getRentals().subscribe({
            next: (rentals: any[]) => {
                const list = Array.isArray(rentals) ? rentals : [];
                this.rentals = list.map(r => this.normalizeRental(r));
                this.filterRentals();
                this.loading = false;
            },
            error: (err: any) => {
                console.error('Error loading rentals', err);
                this.loading = false;
            }
        });
    }

    normalizeRental(r: any): any {
        const id = String(r.id);
        const name = r.name || 'Machinery';
        const category = r.category_name || r.category || 'Heavy Machinery';
        const pricePerDay = Number(r.price_per_day || r.pricePerDay || 0);
        const mobile = r.mobile || '+91 98765 43210';
        const description = r.description || 'Reliable construction equipment inspected and ready for heavy-duty site work.';

        let localImage = 'assets/rentals/jcb_3dx.jpg';
        const lower = name.toLowerCase();
        if (lower.includes('jcb') || lower.includes('backhoe') || lower.includes('loader')) {
            localImage = 'assets/rentals/jcb_3dx.jpg';
        } else if (lower.includes('caterpillar') || lower.includes('excavat') || lower.includes('cat')) {
            localImage = 'assets/rentals/excavator.jpg';
        } else if (lower.includes('jackhammer') || lower.includes('bosch') || lower.includes('breaker')) {
            localImage = 'assets/rentals/jackhammer.jpg';
        } else if (lower.includes('mixer') || lower.includes('concrete')) {
            localImage = 'assets/rentals/concrete_mixer.jpg';
        } else if (lower.includes('scaffold') || lower.includes('frame')) {
            localImage = 'assets/rentals/scaffolding.jpg';
        } else if (r.image && typeof r.image === 'string' && r.image.trim() !== '') {
            localImage = r.image;
        }

        const specs = this.getMachineSpecs(name);

        return {
            ...r,
            id,
            name,
            category,
            pricePerDay,
            image: localImage,
            description,
            mobile,
            rating: 4.9,
            reviewCount: 24 + (Number(r.id) * 7),
            specs,
            badge: lower.includes('scaffold') || lower.includes('jackhammer') ? 'Direct Dispatch' : 'Certified Operator',
            fuelType: lower.includes('jackhammer') ? 'Electric' : (lower.includes('scaffold') ? 'Q235 Steel' : 'Diesel'),
            availability: 'Available Today'
        };
    }

    getMachineSpecs(name: string): string[] {
        const lower = name.toLowerCase();
        if (lower.includes('jcb') || lower.includes('backhoe')) {
            return ['76 HP Turbo Engine', '0.24 m³ Bucket', 'Max Dig 4.77m', 'Operator Included'];
        }
        if (lower.includes('caterpillar') || lower.includes('excavat')) {
            return ['146 HP Cat Engine', '1.0 m³ Bucket', '20.5 Ton Capacity', 'AC Cabin Included'];
        }
        if (lower.includes('jackhammer') || lower.includes('breaker')) {
            return ['1750W Motor', '41J Impact Energy', 'Vibration Damped', '2 Chisels Included'];
        }
        if (lower.includes('mixer') || lower.includes('concrete')) {
            return ['6 HP Diesel Engine', '200L Batch Capacity', 'Cast Iron Drum', 'Tow Hitch Wheel'];
        }
        if (lower.includes('scaffold')) {
            return ['Galvanized Q235 Steel', '2.0m x 1.2m Frame', 'Anti-Slip Walkways', 'Safety Guardrails'];
        }
        return ['50-Point Site Tested', 'Transit Insurance', '24/7 Field Tech', 'Instant Dispatch'];
    }

    handleRefresh(event: any) {
        this.loadRentals();
        setTimeout(() => {
            event.target.complete();
        }, 1000);
    }

    onSearchChange(event: any) {
        this.searchQuery = event.detail.value || '';
        this.filterRentals();
    }

    setCategory(category: string) {
        this.selectedCategory = category;
        this.filterRentals();
    }

    onSortChange(event: any) {
        this.sortBy = event.detail.value || 'popular';
        this.filterRentals();
    }

    filterRentals() {
        let result = [...this.rentals];

        // Category filter
        if (this.selectedCategory && this.selectedCategory !== 'All') {
            result = result.filter(r => (r.category || '').toLowerCase() === this.selectedCategory.toLowerCase());
        }

        // Search filter
        if (this.searchQuery.trim()) {
            const query = this.searchQuery.toLowerCase();
            result = result.filter(r =>
                (r.name || '').toLowerCase().includes(query) ||
                (r.description || '').toLowerCase().includes(query) ||
                (r.category || '').toLowerCase().includes(query)
            );
        }

        // Sort
        if (this.sortBy === 'price-low') {
            result.sort((a, b) => a.pricePerDay - b.pricePerDay);
        } else if (this.sortBy === 'price-high') {
            result.sort((a, b) => b.pricePerDay - a.pricePerDay);
        } else {
            result.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
        }

        this.filteredRentals = result;
    }

    viewRental(rentalId: string) {
        this.router.navigate(['/rental-detail', rentalId]);
    }

    onImageError(event: any) {
        const target = event.target as HTMLImageElement;
        if (target) {
            target.src = 'assets/rentals/jcb_3dx.jpg';
        }
    }
}
