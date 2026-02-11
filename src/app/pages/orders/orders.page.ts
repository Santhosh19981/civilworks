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
    orders: Order[] = [];
    loading = true;

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
            this.orders = this.orderService.getOrders();
            this.loading = false;
        }, 500);
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
