import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { OrderService } from '../../services/order.service';
import { Order } from '../../models/order.model';

@Component({
    selector: 'app-orders',
    templateUrl: './orders.page.html',
    styleUrls: ['./orders.page.scss'],
})
export class OrdersPage implements OnInit {
    orders: any[] = [];
    filteredOrders: any[] = [];
    loading = true;
    selectedFilter = 'All';

    constructor(
        private orderService: OrderService,
        private router: Router
    ) { }

    ngOnInit() {
        this.loadOrders();
    }

    ionViewWillEnter() {
        this.loadOrders();
    }

    loadOrders() {
        this.loading = true;
        setTimeout(() => {
            const productOrders = this.orderService.getOrders().map(o => ({ ...o, type: 'product' }));

            const helperBookings = JSON.parse(localStorage.getItem('civilworks_helper_bookings') || '[]').map((b: any) => ({
                id: b.bookingId,
                items: [{ product: { name: b.serviceName } }],
                serviceName: b.serviceName,
                total: b.totalAmount,
                status: b.status,
                date: new Date(b.date),
                type: 'helper',
                members: b.members,
                mobile: b.mobile
            }));

            const rentalBookings = JSON.parse(localStorage.getItem('civilworks_rental_bookings') || '[]').map((b: any) => ({
                id: b.bookingId,
                items: [{ product: { name: b.rentalName } }],
                serviceName: b.rentalName,
                total: b.totalAmount,
                status: b.status,
                date: new Date(b.date),
                type: 'rental',
                days: b.days,
                mobile: b.mobile
            }));

            this.orders = [...productOrders, ...helperBookings, ...rentalBookings].sort((a, b) => b.date.getTime() - a.date.getTime());
            this.applyFilter();
            this.loading = false;
        }, 500);
    }

    applyFilter() {
        if (this.selectedFilter === 'All') {
            this.filteredOrders = this.orders;
        } else if (this.selectedFilter === 'Products') {
            this.filteredOrders = this.orders.filter(o => o.type === 'product');
        } else if (this.selectedFilter === 'Rentals') {
            this.filteredOrders = this.orders.filter(o => o.type === 'rental'); // Note: if rental is distinct from product
        } else if (this.selectedFilter === 'Helpers') {
            this.filteredOrders = this.orders.filter(o => o.type === 'helper');
        }
    }

    handleRefresh(event: any) {
        this.loadOrders();
        setTimeout(() => {
            event.target.complete();
        }, 1000);
    }

    getStatusClass(status: string): string {
        switch (status) {
            case 'Packing':
                return 'status-packing';
            case 'Shipping':
                return 'status-shipping';
            case 'Delivered':
                return 'status-delivered';
            default:
                return '';
        }
    }

    getStatusIcon(status: string): string {
        switch (status) {
            case 'Packing':
                return 'cube';
            case 'Shipping':
                return 'car';
            case 'Delivered':
                return 'checkmark-circle';
            default:
                return 'time';
        }
    }

    navigateToHome() {
        this.router.navigate(['/tabs/home']);
    }
}
