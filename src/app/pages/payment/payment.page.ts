import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { OrderService } from '../../services/order.service';
import { Address } from '../../models/order.model';

@Component({
    selector: 'app-payment',
    templateUrl: './payment.page.html',
    styleUrls: ['./payment.page.scss'],
})
export class PaymentPage implements OnInit {
    total = 0;
    address: Address | null = null;

    constructor(
        private cartService: CartService,
        private orderService: OrderService,
        private router: Router
    ) {
        const navigation = this.router.getCurrentNavigation();
        if (navigation?.extras.state) {
            this.address = navigation.extras.state['address'];
        }
    }

    ngOnInit() {
        this.total = this.cartService.getCartTotal();
    }

    async payNow() {
        await this.placeOrder('online');
    }

    async cashOnDelivery() {
        await this.placeOrder('cod');
    }

    private async placeOrder(paymentMethod: 'online' | 'cod') {
        if (this.address) {
            const cartItems = this.cartService.getCart();
            const order = this.orderService.createOrder(
                cartItems,
                this.total,
                this.address,
                paymentMethod
            );

            // Clear cart
            this.cartService.clearCart();

            // Navigate to success page
            this.router.navigate(['/order-success'], {
                state: { orderId: order.id }
            });
        }
    }

    goBack() {
        this.router.navigate(['/checkout']);
    }
}
