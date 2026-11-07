import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { OrderService } from '../../services/order.service';
import { environment } from '../../../environments/environment';

@Component({
    selector: 'app-order-success',
    templateUrl: './order-success.page.html',
    styleUrls: ['./order-success.page.scss'],
})
export class OrderSuccessPage implements OnInit {
    orderId = '';
    order: any = null;
    services: any[] = [];
    isEdit = false;
    isServiceOrder = false;
    serviceName = '';
    vendorName = '';
    vendorMobile = '';
    vendorImage = '';
    price = 0;
    message = '';

    copied = false;
    formattedDate = '';
    deliveryEta = 'Tomorrow, by 11:00 AM';

    constructor(
        private router: Router,
        private orderService: OrderService
    ) {
        const navigation = this.router.getCurrentNavigation();
        const state = navigation?.extras?.state || window.history.state;
        if (state) {
            this.orderId = state['orderId'] || '';
            this.order = state['order'] || null;
            this.services = state['services'] || [];
            this.isEdit = !!state['isEdit'];
            this.isServiceOrder = !!state['isServiceOrder'];
            this.serviceName = state['serviceName'] || '';
            this.vendorName = state['vendorName'] || '';
            this.vendorMobile = state['vendorMobile'] || '';
            this.vendorImage = state['vendorImage'] || '';
            this.price = state['price'] || 0;
            this.message = state['message'] || '';
        }
    }

    ngOnInit() {
        if (!this.orderId) {
            // Check localStorage fallback
            const stored = localStorage.getItem('civilworks_last_order');
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    this.order = parsed;
                    this.orderId = parsed.id || parsed.orderId || parsed.order_no || 'ORD-OT8POP';
                    if (parsed.order_type === 'service' || (parsed.services && parsed.services.length > 0)) {
                        this.isServiceOrder = true;
                    }
                } catch (e) {
                    console.error('Error parsing stored order', e);
                }
            }
        }

        if (!this.orderId) {
            this.orderId = 'ORD-OT8POP';
        }

        // Fetch live order details to show preserved site coordinates and active service list
        if (this.orderId) {
            this.orderService.getOrderDetails(this.orderId).subscribe({
                next: (res: any) => {
                    if (res) {
                        this.order = res;
                        if (res.order_type === 'service' || (res.services && res.services.length > 0)) {
                            this.isServiceOrder = true;
                        }
                        if (res.services && res.services.length > 0) {
                            this.services = res.services;
                            const latest = res.services[res.services.length - 1];
                            if (!this.serviceName && latest) this.serviceName = latest.subcategory_name;
                            if (!this.vendorName && latest) this.vendorName = latest.vendor_name;
                            if (!this.vendorMobile && latest) this.vendorMobile = latest.vendor_mobile;
                            if (!this.vendorImage && latest) this.vendorImage = latest.vendor_image;
                        }
                    }
                },
                error: (e) => {
                    console.log('Order fetched from state/cache:', e);
                }
            });
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
        this.router.navigate(['/tabs/orders'], {
            queryParams: { tab: this.isServiceOrder ? 'services' : 'products' }
        });
    }

    continueShopping() {
        this.router.navigate(['/tabs/products'], {
            queryParams: { type: this.isServiceOrder ? 'services' : 'all' }
        });
    }

    addAnotherService() {
        this.router.navigate(['/tabs/products'], {
            queryParams: {
                type: 'services',
                editOrderId: this.orderId,
                rawId: this.order?.id || this.orderId,
                orderNo: this.orderId
            }
        });
    }

    callVendor() {
        const ph = this.vendorMobile || this.order?.vendor_mobile || '9912379539';
        window.location.href = `tel:${ph}`;
    }

    openWhatsApp() {
        const msg = encodeURIComponent(`Hi InfraMart Team, I have a query regarding my project order #${this.orderId}.`);
        window.open(`https://wa.me/919876543210?text=${msg}`, '_blank');
    }

    callLogistics() {
        window.location.href = 'tel:18004259675';
    }

    formatImageUrl(url: string): string {
        if (!url) return '';
        if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('assets/')) {
            return url;
        }
        return `${environment.uploadUrl}${url.startsWith('/') ? '' : '/'}${url}`;
    }
}
