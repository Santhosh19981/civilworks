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
    rentals: Rental[] = [];
    filteredRentals: Rental[] = [];
    searchQuery = '';
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
        setTimeout(() => {
            this.rentals = this.rentalService.getRentals();
            this.filteredRentals = [...this.rentals];
            this.loading = false;
        }, 500);
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

    filterRentals() {
        if (this.searchQuery.trim()) {
            const query = this.searchQuery.toLowerCase();
            this.filteredRentals = this.rentals.filter(r =>
                r.name.toLowerCase().includes(query) ||
                r.description.toLowerCase().includes(query) ||
                r.category.toLowerCase().includes(query)
            );
        } else {
            this.filteredRentals = [...this.rentals];
        }
    }

    viewRental(rentalId: string) {
        this.router.navigate(['/rental-detail', rentalId]);
    }
}
