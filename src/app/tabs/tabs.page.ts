import { Component } from '@angular/core';
import { CartService } from '../services/cart.service';

@Component({
    selector: 'app-tabs',
    templateUrl: 'tabs.page.html',
    styleUrls: ['tabs.page.scss']
})
export class TabsPage {
    cartCount = 0;

    constructor(private cartService: CartService) {
        this.cartService.cart$.subscribe(() => {
            this.cartCount = this.cartService.getCartCount();
        });
    }
}
