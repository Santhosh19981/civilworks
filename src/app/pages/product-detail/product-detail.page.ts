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
        this.productService.getProductById(id).subscribe({
            next: (product: Product) => {
                this.product = product;
                this.loading = false;
            },
            error: (err: any) => {
                console.error('Error loading product', err);
                this.loading = false;
            }
        });
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
            this.cartService.addToCart(+this.product.id, this.quantity).subscribe({
                next: async () => {
                    const toast = await this.toastController.create({
                        message: `${this.product!.name} added to cart!`,
                        duration: 2000,
                        position: 'bottom',
                        color: 'success',
                        icon: 'checkmark-circle'
                    });
                    await toast.present();
                    this.quantity = 1;
                },
                error: async (err: any) => {
                    console.error('Add to cart failed', err);
                    const toast = await this.toastController.create({
                        message: 'Failed to add item to cart. Please login.',
                        duration: 2000,
                        position: 'bottom',
                        color: 'danger'
                    });
                    await toast.present();
                }
            });
        }
    }

    goBack() {
        this.router.navigate(['/tabs/products']);
    }
}

