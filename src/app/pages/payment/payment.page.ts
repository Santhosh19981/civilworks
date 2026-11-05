import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { CartService } from '../../services/cart.service';
import { OrderService } from '../../services/order.service';
import { Address } from '../../models/order.model';
import { environment } from '../../../environments/environment';

@Component({
    selector: 'app-payment',
    templateUrl: './payment.page.html',
    styleUrls: ['./payment.page.scss'],
})
export class PaymentPage implements OnInit {
    total = 0;
    address: Address | null = null;
    serviceBooking: any = null;
    selectedPaymentMethod: 'online' | 'cod' | 'upi' = 'online';

    constructor(
        private cartService: CartService,
        private orderService: OrderService,
        private router: Router,
        private location: Location
    ) {
        const navigation = this.router.getCurrentNavigation();
        if (navigation?.extras.state) {
            this.address = navigation.extras.state['address'] || null;
            this.serviceBooking = navigation.extras.state['serviceBooking'] || null;
        }
    }

    ngOnInit() {
        if (!this.serviceBooking) {
            const state = window.history.state;
            if (state && state['serviceBooking']) {
                this.serviceBooking = state['serviceBooking'];
            } else {
                const cached = localStorage.getItem('civilworks_pending_service_booking');
                if (cached) {
                    try {
                        this.serviceBooking = JSON.parse(cached);
                    } catch (e) {}
                }
            }
        }

        if (this.serviceBooking) {
            this.total = Number(this.serviceBooking.price || this.serviceBooking.total || 0);
        } else {
            this.total = this.cartService.getCartTotal();
        }
    }

    selectPaymentMethod(method: 'online' | 'cod' | 'upi') {
        this.selectedPaymentMethod = method;
    }

    proceedToCheckout() {
        if (this.serviceBooking) {
            this.router.navigate(['/checkout'], {
                state: {
                    serviceBooking: this.serviceBooking,
                    paymentMethod: this.selectedPaymentMethod
                }
            });
        } else {
            this.router.navigate(['/checkout'], {
                state: {
                    paymentMethod: this.selectedPaymentMethod
                }
            });
        }
    }

    formatImageUrl(url: string): string {
        if (!url) return '';
        if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('assets/')) {
            return url;
        }
        return `${environment.uploadUrl}${url.startsWith('/') ? '' : '/'}${url}`;
    }

    goBack() {
        if (window.history.length > 1) {
            this.location.back();
        } else {
            this.router.navigate(['/tabs/products']);
        }
    }
}
