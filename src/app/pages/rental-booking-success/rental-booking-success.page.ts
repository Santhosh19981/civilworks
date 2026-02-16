import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
    selector: 'app-rental-booking-success',
    templateUrl: './rental-booking-success.page.html',
    styleUrls: ['./rental-booking-success.page.scss'],
})
export class RentalBookingSuccessPage implements OnInit {
    booking: any;

    constructor(private router: Router) {
        const navigation = this.router.getCurrentNavigation();
        if (navigation && navigation.extras.state) {
            this.booking = navigation.extras.state['booking'];
        }
    }

    ngOnInit() {
        if (!this.booking) {
            this.booking = {
                bookingId: 'RENT1023',
                rentalName: 'Hydraulic Excavator',
                days: 3,
                totalAmount: 25500,
                mobile: '9876543210'
            };
        }
    }

    goToHome() {
        this.router.navigate(['/tabs/home']);
    }

    callOwner() {
        if (this.booking && this.booking.mobile) {
            window.location.href = `tel:${this.booking.mobile}`;
        }
    }
}
