import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
    selector: 'app-rental-booking-success',
    templateUrl: './rental-booking-success.page.html',
    styleUrls: ['./rental-booking-success.page.scss'],
})
export class RentalBookingSuccessPage implements OnInit {
    booking: any;
    copied = false;
    estimatedArrival = 'Today, within 3 - 4 hours';
    formattedDate = '';
    returnDate = '';
    baseRental = 4500;
    logisticsFee = 400;
    gstAmount = 230;
    totalAmount = 5130;
    equipmentImage = 'assets/rentals/concrete_mixer.jpg';
    equipmentName = 'Concrete Mixer 10/7 (Diesel)';

    constructor(private router: Router) {
        const navigation = this.router.getCurrentNavigation();
        if (navigation && navigation.extras.state && navigation.extras.state['booking']) {
            this.booking = navigation.extras.state['booking'];
        }
    }

    ngOnInit() {
        if (!this.booking) {
            // Check localStorage for the most recent rental booking
            const stored = localStorage.getItem('civilworks_rental_bookings');
            if (stored) {
                try {
                    const bookings = JSON.parse(stored);
                    if (bookings && bookings.length > 0) {
                        this.booking = bookings[0];
                    }
                } catch (e) {
                    console.error('Error parsing stored rental bookings', e);
                }
            }
        }

        // Fallback default if completely fresh direct URL access
        if (!this.booking) {
            this.booking = {
                bookingId: 'RENT8556',
                rentalName: 'Concrete Mixer 10/7 (Diesel)',
                serviceName: 'Concrete Mixer 10/7 (Diesel)',
                days: 3,
                totalAmount: 5130,
                mobile: '9876543212',
                date: new Date().toISOString().split('T')[0],
                image: 'assets/rentals/concrete_mixer.jpg',
                paymentMethod: 'pay_on_site',
                dispatchMode: 'priority',
                siteName: 'Phoenix Tech Zone - Tower B',
                customerAddress: {
                    name: 'Vikramaditya Reddy',
                    addressLine1: 'Phoenix Tech Zone, Tower B',
                    addressLine2: 'Financial District, Nanakramguda',
                    city: 'Hyderabad',
                    state: 'Telangana',
                    pincode: '500032'
                }
            };
        }

        // Normalize equipment name and image
        this.equipmentName = this.booking.rentalName || this.booking.serviceName || 'Concrete Mixer 10/7 (Diesel)';
        if (this.booking.image) {
            this.equipmentImage = this.booking.image;
        } else {
            const lower = this.equipmentName.toLowerCase();
            if (lower.includes('mixer')) this.equipmentImage = 'assets/rentals/concrete_mixer.jpg';
            else if (lower.includes('excavator') || lower.includes('jcb')) this.equipmentImage = 'assets/rentals/jcb_3dx.jpg';
            else if (lower.includes('jackhammer') || lower.includes('breaker')) this.equipmentImage = 'assets/rentals/jackhammer.jpg';
            else if (lower.includes('scaffolding')) this.equipmentImage = 'assets/rentals/scaffolding.jpg';
            else this.equipmentImage = 'assets/rentals/concrete_mixer.jpg';
        }

        // Calculate financials
        this.totalAmount = this.booking.totalAmount || 5130;
        const rawBase = Math.round(this.totalAmount * 0.85);
        this.baseRental = rawBase;
        this.gstAmount = Math.round(this.totalAmount * 0.05);
        this.logisticsFee = this.totalAmount - this.baseRental - this.gstAmount;

        const today = new Date();
        this.formattedDate = today.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });

        const daysToAdd = parseInt(this.booking.days) || 3;
        const returnD = new Date();
        returnD.setDate(today.getDate() + daysToAdd);
        this.returnDate = returnD.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    }

    copyBookingId() {
        const id = this.booking?.bookingId || this.booking?.id || 'RENT8556';
        navigator.clipboard?.writeText(id).then(() => {
            this.copied = true;
            setTimeout(() => this.copied = false, 2500);
        }).catch(() => {
            this.copied = true;
            setTimeout(() => this.copied = false, 2500);
        });
    }

    downloadReceipt() {
        window.print();
    }

    trackDispatch() {
        this.router.navigate(['/tabs/orders']);
    }

    goToHome() {
        this.router.navigate(['/tabs/home']);
    }

    browseRentals() {
        this.router.navigate(['/tabs/rentals']);
    }

    callLogistics() {
        const phone = this.booking?.mobile || '9876543212';
        window.location.href = `tel:${phone}`;
    }

    callOwner() {
        this.callLogistics();
    }

    openWhatsAppSupport() {
        const id = this.booking?.bookingId || this.booking?.id || 'RENT8556';
        const msg = encodeURIComponent(`Hi InfraMart Logistics, I need an update on my machinery rental #${id} (${this.equipmentName}).`);
        window.open(`https://wa.me/919876543210?text=${msg}`, '_blank');
    }
}

