import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
    selector: 'app-order-success',
    templateUrl: './order-success.page.html',
    styleUrls: ['./order-success.page.scss'],
})
export class OrderSuccessPage implements OnInit {
    orderId = '';
    order: any;
    copied = false;
    formattedDate = '';
    deliveryEta = 'Tomorrow, by 11:00 AM';

    constructor(private router: Router) {
        const navigation = this.router.getCurrentNavigation();
        if (navigation?.extras?.state) {
            this.orderId = navigation.extras.state['orderId'] || '';
            this.order = navigation.extras.state['order'] || null;
        }
    }

    ngOnInit() {
        if (!this.orderId) {
            // Check localStorage
            const stored = localStorage.getItem('civilworks_last_order');
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    this.order = parsed;
                    this.orderId = parsed.id || parsed.orderId || 'ORD' + Math.floor(100000 + Math.random() * 900000);
                } catch (e) {
                    console.error('Error parsing stored order', e);
                }
            }
        }

        if (!this.orderId) {
            this.orderId = 'ORD-782941';
        }

        if (!this.order) {
            this.order = {
                orderId: this.orderId,
                itemsCount: 3,
                totalAmount: 18450,
                paymentMethod: 'Cash / Pay on Delivery',
                deliveryType: 'Express Flatbed Logistics',
                siteName: 'Phoenix Tech Zone, Tower B',
                address: 'Financial District, Nanakramguda, Hyderabad - 500032',
                customerName: 'Vikramaditya Reddy',
                phone: '+91 9876543212'
            };
        }

        const today = new Date();
        this.formattedDate = today.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    }

    copyOrderId() {
        navigator.clipboard?.writeText(this.orderId).then(() => {
            this.copied = true;
            setTimeout(() => this.copied = false, 2500);
        }).catch(() => {
            this.copied = true;
            setTimeout(() => this.copied = false, 2500);
        });
    }

    downloadInvoice() {
        window.print();
    }

    goToHome() {
        this.router.navigate(['/tabs/home']);
    }

    viewOrders() {
        this.router.navigate(['/tabs/orders']);
    }

    continueShopping() {
        this.router.navigate(['/tabs/home']);
    }

    openWhatsApp() {
        const msg = encodeURIComponent(`Hi CivilWorks Materials Team, I would like to track my order #${this.orderId}.`);
        window.open(`https://wa.me/919876543210?text=${msg}`, '_blank');
    }

    callLogistics() {
        window.location.href = 'tel:18004259675';
    }
}

