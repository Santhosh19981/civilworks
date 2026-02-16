import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RentalService } from '../../services/rental.service';
import { Rental } from '../../models/rental.model';
import { ToastController, NavController } from '@ionic/angular';

@Component({
    selector: 'app-rental-detail',
    templateUrl: './rental-detail.page.html',
    styleUrls: ['./rental-detail.page.scss'],
})
export class RentalDetailPage implements OnInit {
    rental: Rental | undefined;
    loading = true;
    daysCount = 1;
    totalAmount = 0;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private rentalService: RentalService,
        private toastController: ToastController,
        private navCtrl: NavController
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
            this.calculateTotal();
            this.loading = false;
        }, 500);
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
        if (this.rental) {
            this.totalAmount = this.daysCount * this.rental.pricePerDay;
        }
    }

    async placeBooking() {
        if (!this.rental) return;

        // Create booking object
        const bookingId = 'RENT' + Math.floor(1000 + Math.random() * 9000);
        const bookingData = {
            id: bookingId,
            bookingId: bookingId,
            rentalName: this.rental.name,
            serviceName: this.rental.name,
            days: this.daysCount,
            total: this.totalAmount, // for compatibility
            totalAmount: this.totalAmount,
            date: new Date(),
            status: 'Booked',
            mobile: this.rental.mobile,
            type: 'rental'
        };

        // Save to LocalStorage
        const existingBookings = JSON.parse(localStorage.getItem('civilworks_rental_bookings') || '[]');
        existingBookings.push(bookingData);
        localStorage.setItem('civilworks_rental_bookings', JSON.stringify(existingBookings));

        const toast = await this.toastController.create({
            message: 'Rental booking placed successfully!',
            duration: 2000,
            color: 'success',
            position: 'bottom'
        });
        toast.present();

        this.router.navigate(['/rental-booking-success'], {
            state: { booking: bookingData }
        });
    }

    goBack() {
        this.navCtrl.back();
    }
}
