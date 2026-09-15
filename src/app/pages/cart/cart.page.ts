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

    getProductImage(product: any): string {
        if (!product) return 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=500&q=80';
        if (product.image && typeof product.image === 'string' && product.image.trim() !== '') {
            return product.image;
        }

        const name = (product.name || '').toLowerCase();
        const cat = (product.category || product.category_name || '').toLowerCase();

        // 1. Helmet / Hard Hat (must check before generic 'safety')
        if (name.includes('helmet') || name.includes('hat')) {
            return 'assets/products/safety_helmet.jpg';
        }
        // 2. Safety Goggles / Protective Eyewear
        if (name.includes('goggle') || name.includes('glasses') || name.includes('eyewear')) {
            return 'assets/products/safety_goggles.jpg';
        }
        // 3. Safety Boots & Shoes
        if (name.includes('shoe') || name.includes('boot')) {
            return 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=500&q=80';
        }
        // 4. Trowels (Concrete Finishing & Masonry)
        if (name.includes('trowel') || name.includes('finishing') || name.includes('masonry')) {
            return 'assets/products/concrete_trowel.jpg';
        }
        // 5. Hammers (Brick Hammer, Claw Hammer)
        if (name.includes('hammer')) {
            return 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?auto=format&fit=crop&w=500&q=80';
        }
        // 6. Chisel Sets
        if (name.includes('chisel')) {
            return 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?auto=format&fit=crop&w=500&q=80';
        }
        // 7. Measuring Tape
        if (name.includes('tape') || name.includes('measure') || name.includes('meter')) {
            return 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=500&q=80';
        }
        // 8. Spirit Level / Laser Level
        if (name.includes('level') || name.includes('laser') || name.includes('spirit')) {
            return 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=500&q=80';
        }
        // 9. Cement & Sand
        if (name.includes('cement') || cat.includes('cement') || name.includes('sand') || cat.includes('sand')) {
            return 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=500&q=80';
        }
        // 10. Steel & TMT Rods
        if (name.includes('steel') || name.includes('tmt') || name.includes('rod') || cat.includes('steel')) {
            return 'https://images.unsplash.com/photo-1535813547-99c456a41d4a?auto=format&fit=crop&w=500&q=80';
        }
        // 11. Plumbing & Pipes
        if (name.includes('pipe') || cat.includes('plumbing')) {
            return 'https://images.unsplash.com/photo-1607400201515-c2c41c07d307?auto=format&fit=crop&w=500&q=80';
        }
        // 12. Generic Safety Gear
        if (name.includes('safety') || cat.includes('safety')) {
            return 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=500&q=80';
        }
        return 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=500&q=80';
    }

    onImageError(event: any, product?: any) {
        const target = event.target as HTMLImageElement;
        if (target) {
            target.src = 'data:image/svg+xml;utf8,' + encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
                    <rect width="100%" height="100%" fill="#1e293b"/>
                    <g fill="none" stroke="#f97316" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" transform="translate(150, 140) scale(4)">
                        <polygon points="12 2 2 7 12 12 22 7 12 2"/>
                        <polyline points="2 17 12 22 22 17"/>
                        <polyline points="2 12 12 17 22 12"/>
                    </g>
                    <text x="50%" y="300" dominant-baseline="middle" text-anchor="middle" fill="#94a3b8" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="600">
                        CivilWorks
                    </text>
                </svg>
            `);
        }
    }
}
