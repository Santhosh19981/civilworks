import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-helper-booking-success',
  templateUrl: './helper-booking-success.page.html',
  styleUrls: ['./helper-booking-success.page.scss'],
})
export class HelperBookingSuccessPage implements OnInit {
  booking: any;

  constructor(private router: Router) {
    const navigation = this.router.getCurrentNavigation();
    if (navigation && navigation.extras.state) {
      this.booking = navigation.extras.state['booking'];
    }
  }

  ngOnInit() {
    if (!this.booking) {
      // Fallback or demonstration data
      this.booking = {
        bookingId: 'HELP1023',
        serviceName: 'Carpenter',
        members: 3,
        totalAmount: 3600,
        mobile: '9876543210'
      };
    }
  }

  goToHome() {
    this.router.navigate(['/tabs/home']);
  }

  callHelper() {
    if (this.booking && this.booking.mobile) {
      window.location.href = `tel:${this.booking.mobile}`;
    }
  }
}
