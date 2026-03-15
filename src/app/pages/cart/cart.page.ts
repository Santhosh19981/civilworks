import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';
import { CartItem } from '../../models/cart.model';

@Component({
    selector: 'app-cart',
    templateUrl: './cart.page.html',
    styleUrls: ['./cart.page.scss'],
})
export class CartPage implements OnInit {
    cartItems: CartItem[] = [];
    total = 0;

    constructor(
        private cartService: CartService,
        private authService: AuthService,
        private router: Router,
        private alertController: AlertController
    ) { }

    ngOnInit() {
        this.cartService.cart$.subscribe(cart => {
            if (cart) {
                this.cartItems = cart.items;
                this.total = cart.subtotal;
            }
        });
    }

    increaseQuantity(itemId: number) {
        const item = this.cartItems.find(i => i.id === itemId);
        if (item) {
            this.cartService.updateQuantity(itemId, item.quantity + 1).subscribe();
        }
    }

    decreaseQuantity(itemId: number) {
        const item = this.cartItems.find(i => i.id === itemId);
        if (item && item.quantity > 1) {
            this.cartService.updateQuantity(itemId, item.quantity - 1).subscribe();
        }
    }

    async removeItem(itemId: number) {
        const alert = await this.alertController.create({
            header: 'Remove Item',
            message: 'Are you sure you want to remove this item from cart?',
            buttons: [
                {
                    text: 'Cancel',
                    role: 'cancel'
                },
                {
                    text: 'Remove',
                    role: 'destructive',
                    handler: () => {
                        this.cartService.removeItem(itemId).subscribe();
                    }
                }
            ]
        });

        await alert.present();
    }

    async proceedToCheckout() {
        if (!this.authService.isAuthenticated()) {
            // Show login modal
            this.router.navigate(['/login'], { queryParams: { returnUrl: '/checkout' } });
        } else {
            this.router.navigate(['/checkout']);
        }
    }

    continueShopping() {
        this.router.navigate(['/tabs/products']);
    }
}
