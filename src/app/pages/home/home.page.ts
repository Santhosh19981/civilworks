import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular';
import { ProductService } from '../../services/product.service';
import { RentalService } from '../../services/rental.service';
import { CartService } from '../../services/cart.service';
import { Product } from '../../models/product.model';
import { Rental } from '../../models/rental.model';

@Component({
    selector: 'app-home',
    templateUrl: './home.page.html',
    styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {
    @ViewChild(IonContent) content!: IonContent;

    banners = [
        { image: 'https://img.freepik.com/premium-photo/set-construction-tools-black-wall-background_154092-12367.jpg', 
            title: 'Heavy Equipment' },
        { image: 'https://png.pngtree.com/thumb_back/fw800/background/20251021/pngtree-construction-materials-and-tools-on-a-gray-background-image_19942823.webp', 
            title: 'Quality Materials' },
        // { image: 'https://miro.medium.com/1*TfIqQpwfXov287CCqjhetg.jpeg', 
        //     title: 'Build Your Dreams' }
    ];

    featuredProducts: Product[] = [];
    popularRentals: Rental[] = [];
    loading = true;
    currentSlide = 0;
    cartCount = 0;

    constructor(
        private productService: ProductService,
        private rentalService: RentalService,
        private cartService: CartService,
        private router: Router
    ) { }

    ngOnInit() {
        this.loadData();
        this.startBannerAutoSlide();

        // Subscribe to cart changes
        this.cartService.cart$.subscribe(() => {
            this.cartCount = this.cartService.getCartCount();
        });
    }

    loadData() {
        this.loading = true;
        setTimeout(() => {
            this.featuredProducts = this.productService.getFeaturedProducts(6);
            this.popularRentals = this.rentalService.getPopularRentals(6);
            this.loading = false;
        }, 500);
    }

    startBannerAutoSlide() {
        setInterval(() => {
            this.currentSlide = (this.currentSlide + 1) % this.banners.length;
        }, 4000);
    }

    handleRefresh(event: any) {
        this.loadData();
        setTimeout(() => {
            event.target.complete();
        }, 1000);
    }

    navigateToBuy() {
        this.router.navigate(['/tabs/products']);
    }

    navigateToRental() {
        this.router.navigate(['/tabs/rentals']);
    }

    viewProduct(productId: string) {
        this.router.navigate(['/product-detail', productId]);
    }

    viewRental(rentalId: string) {
        this.router.navigate(['/rental-detail', rentalId]);
    }

    viewAllProducts() {
        this.router.navigate(['/tabs/products']);
    }

    viewAllRentals() {
        this.router.navigate(['/tabs/rentals']);
    }
}
