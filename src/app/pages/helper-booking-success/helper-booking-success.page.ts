import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-helper-booking-success',
  templateUrl: './helper-booking-success.page.html',
  styleUrls: ['./helper-booking-success.page.scss'],
})
export class HelperBookingSuccessPage implements OnInit {
  booking: any;
  copied = false;
  formattedDate = '';
  reportingTime = 'Tomorrow at 08:30 AM';
  leadSupervisor = 'Ramesh Kumar (Grade-A Certified)';
  wagePerMember = 1200;
  serviceName = 'Carpentry & Shuttering Specialists';
  membersCount = 3;
  totalAmount = 3600;

  constructor(private router: Router) {
    const navigation = this.router.getCurrentNavigation();
    if (navigation && navigation.extras.state) {
      this.booking = navigation.extras.state['booking'];
    }
  }

  ngOnInit() {
    if (!this.booking) {
      const stored = localStorage.getItem('civilworks_helper_bookings');
      if (stored) {
        try {
          const bookings = JSON.parse(stored);
          if (bookings && bookings.length > 0) {
            this.booking = bookings[0];
          }
        } catch (e) {
          console.error('Error reading helper bookings', e);
        }
      }
    }

    if (!this.booking) {
      this.booking = {
        bookingId: 'HELP1023',
        serviceName: 'Carpentry & Formwork Team',
        members: 3,
        totalAmount: 3600,
        mobile: '9876543210',
        date: new Date().toISOString().split('T')[0],
        siteName: 'Phoenix Tech Zone, Tower B',
        address: 'Financial District, Nanakramguda, Hyderabad - 500032',
        supervisor: 'Ramesh Kumar (Team Lead)'
      };
    }

    this.serviceName = this.booking.serviceName || 'Skilled Construction Crew';
    this.membersCount = parseInt(this.booking.members) || 3;
    this.totalAmount = this.booking.totalAmount || 3600;
    this.wagePerMember = Math.round(this.totalAmount / this.membersCount);

    const today = new Date();
    this.formattedDate = today.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  copyBookingId() {
    const id = this.booking?.bookingId || 'HELP1023';
    navigator.clipboard?.writeText(id).then(() => {
      this.copied = true;
      setTimeout(() => this.copied = false, 2500);
    }).catch(() => {
      this.copied = true;
      setTimeout(() => this.copied = false, 2500);
    });
  }

  downloadPass() {
    window.print();
  }

  trackDeployment() {
    this.router.navigate(['/tabs/orders']);
  }

  goToHome() {
    this.router.navigate(['/tabs/home']);
  }

  browseHelpers() {
    this.router.navigate(['/tabs/helpers']);
  }

  callHelper() {
    const phone = this.booking?.mobile || '9876543210';
    window.location.href = `tel:${phone}`;
  }

  openWhatsApp() {
    const id = this.booking?.bookingId || 'HELP1023';
    const msg = encodeURIComponent(`Hi CivilWorks Labor Desk, I have a query regarding workforce deployment #${id} (${this.serviceName}).`);
    window.open(`https://wa.me/919876543210?text=${msg}`, '_blank');
  }
}

