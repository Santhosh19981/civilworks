import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RentalService } from '../../services/rental.service';
import { Rental } from '../../models/rental.model';

@Component({
    selector: 'app-rental-detail',
    templateUrl: './rental-detail.page.html',
    styleUrls: ['./rental-detail.page.scss'],
})
export class RentalDetailPage implements OnInit {
    rental: Rental | undefined;
    loading = true;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private rentalService: RentalService
    ) { }

    ngOnInit() {
        const rentalId = this.route.snapshot.paramMap.get('id');
        if (rentalId) {
            this.loadRental(rentalId);
        }
    }

    loadRental(id: string) {
        this.loading = true;
        setTimeout(() => {
            this.rental = this.rentalService.getRentalById(id);
            this.loading = false;
        }, 300);
    }

    callNow() {
        if (this.rental) {
            window.location.href = `tel:${this.rental.mobile}`;
        }
    }

    goBack() {
        this.router.navigate(['/tabs/rentals']);
    }
}
