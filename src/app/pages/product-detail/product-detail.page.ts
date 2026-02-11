import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { Product } from '../../models/product.model';

@Component({
    selector: 'app-product-detail',
    templateUrl: './product-detail.page.html',
    styleUrls: ['./product-detail.page.scss'],
})
export class ProductDetailPage implements OnInit {
    product: Product | undefined;
    quantity = 1;
    loading = true;
    cartCount = 0;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private productService: ProductService,
        private cartService: CartService,
        private toastController: ToastController
    ) { }

    ngOnInit() {
        const productId = this.route.snapshot.paramMap.get('id');
        if (productId) {
            this.loadProduct(productId);
        }

        // Subscribe to cart changes
        this.cartService.cart$.subscribe(() => {
            this.cartCount = this.cartService.getCartCount();
        });
    }

    loadProduct(id: string) {
        this.loading = true;
        setTimeout(() => {
            this.product = this.productService.getProductById(id);
            this.loading = false;
        }, 300);
    }

    decreaseQuantity() {
        if (this.quantity > 1) {
            this.quantity--;
        }
    }

    increaseQuantity() {
        this.quantity++;
    }

    async addToCart() {
        if (this.product) {
            this.cartService.addToCart(this.product, this.quantity);

            const toast = await this.toastController.create({
                message: `${this.product.name} added to cart!`,
                duration: 2000,
                position: 'bottom',
                color: 'success',
                icon: 'checkmark-circle'
            });
            await toast.present();

            this.quantity = 1;
        }
    }

    goBack() {
        this.router.navigate(['/tabs/products']);
    }
}
