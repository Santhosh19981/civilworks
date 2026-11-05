import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { Subscription } from 'rxjs';
import { RentalService } from '../../services/rental.service';
import { Rental } from '../../models/rental.model';

@Component({
    selector: 'app-rentals',
    templateUrl: './rentals.page.html',
    styleUrls: ['./rentals.page.scss'],
})
export class RentalsPage implements OnInit, OnDestroy {
    rentals: any[] = [];
    filteredRentals: any[] = [];
    searchQuery = '';
    selectedCategory = 'All';
    categories = ['All'];
    sortBy = 'popular';
    loading = true;
    mainCategoryId: number | null = null;
    categoryId: number | null = null;
    private routeSub?: Subscription;

    constructor(
        private rentalService: RentalService,
        private router: Router,
        private route: ActivatedRoute,
        private location: Location
    ) { }

    ngOnInit() {
        this.routeSub = this.route.queryParams.subscribe(params => {
            const savedSector = localStorage.getItem('selectedSectorId');
            this.mainCategoryId = params['mainCategoryId'] ? Number(params['mainCategoryId']) : (params['main_category_id'] ? Number(params['main_category_id']) : (savedSector ? Number(savedSector) : null));
            this.categoryId = params['categoryId'] ? Number(params['categoryId']) : (params['category_id'] ? Number(params['category_id']) : null);
            if (params['search']) {
                this.searchQuery = params['search'];
            }
            this.loadRentals();
        });
    }

    ngOnDestroy() {
        if (this.routeSub) {
            this.routeSub.unsubscribe();
        }
    }

    loadRentals() {
        this.loading = true;
        this.rentals = [];
        this.filteredRentals = [];

        const params: any = {};
        if (this.mainCategoryId) {
            params.main_category_id = this.mainCategoryId;
        }
        if (this.categoryId) {
            params.category_id = this.categoryId;
        }
        params.limit = 50;

        this.rentalService.getRentals(params).subscribe({
            next: (rentals: any[]) => {
                const list = Array.isArray(rentals) ? rentals : [];
                this.rentals = list.map(r => this.normalizeRental(r));
                const extractedCats = Array.from(new Set(this.rentals.map(r => r.category).filter(Boolean)));
                if (extractedCats.length > 0) {
                    this.categories = ['All', ...extractedCats];
                } else {
                    this.categories = ['All'];
                }
                if (this.selectedCategory && this.selectedCategory !== 'All' && !this.categories.includes(this.selectedCategory)) {
                    this.selectedCategory = 'All';
                }
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
        const category = r.subcategory_name || r.display_category_name || r.category_name || r.category || 'Heavy Machinery';
        const pricePerDay = Number(r.price_per_day || r.pricePerDay || 0);
        const mobile = r.mobile || '+91 98765 43210';
        const description = r.description || 'Reliable construction equipment inspected and ready for heavy-duty site work.';

        let localImage = 'assets/rentals/jcb_3dx.jpg';
        if (r.image && typeof r.image === 'string' && r.image.trim() !== '') {
            localImage = r.image;
        } else {
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
            }
        }

        const unitName = r.unit_name || 'Day';

        return {
            ...r,
            id,
            name,
            category,
            pricePerDay,
            unitName,
            image: localImage,
            description,
            mobile,
            available: r.available !== undefined ? Boolean(r.available) : true
        };
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

    goBack() {
        if (window.history.length > 1) {
            this.location.back();
        } else {
            this.router.navigate(['/tabs/home']);
        }
    }

    onImageError(event: any) {
        const target = event.target as HTMLImageElement;
        if (target) {
            target.src = 'assets/rentals/jcb_3dx.jpg';
        }
    }
}
