import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, ToastController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { ProductService } from '../../services/product.service';
import { RentalService } from '../../services/rental.service';
import { CartService } from '../../services/cart.service';
import { Product } from '../../models/product.model';
import { Rental } from '../../models/rental.model';

export interface CategoryItem {
    id?: number;
    name: string;
    icon: string;
    itemCount?: string;
    color?: string;
}

export interface PromoBanner {
    tag: string;
    title: string;
    subtitle: string;
    cta: string;
    image: string;
    route: string;
}

@Component({
    selector: 'app-home',
    templateUrl: './home.page.html',
    styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit, OnDestroy {
    @ViewChild(IonContent) content!: IonContent;

    banners: PromoBanner[] = [
        {
            tag: 'DIRECT WHOLESALE',
            title: 'Quality Building Materials',
            subtitle: 'Direct supply on Cement, TMT Steel, Sand & Site Essentials at bulk rates',
            cta: 'Explore Materials',
            image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80',
            route: '/tabs/products'
        },
        {
            tag: 'EXPRESS SITE DISPATCH',
            title: 'Heavy Equipment & Machinery',
            subtitle: 'JCB 3DX, Excavators, Cranes & Mixers with certified operators at your site',
            cta: 'Rent Machinery',
            image: 'https://images.unsplash.com/photo-1541625602330-2277a1cd1f59?auto=format&fit=crop&w=1200&q=80',
            route: '/tabs/rentals'
        },
        {
            tag: 'VERIFIED WORKFORCE',
            title: 'Skilled Construction Labor',
            subtitle: 'Certified masons, carpenters, electricians & helpers on flexible daily contracts',
            cta: 'Book Workers',
            image: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=1200&q=80',
            route: '/helpers'
        }
    ];

    quickCategories: CategoryItem[] = [
        { name: 'Cement & Sand', icon: 'cube-outline', itemCount: '40+ items', color: '#F97316' },
        { name: 'Steel & TMT', icon: 'layers-outline', itemCount: '25+ items', color: '#0284C7' },
        { name: 'Construction Tools', icon: 'construct-outline', itemCount: '60+ items', color: '#EAB308' },
        { name: 'Safety Equipment', icon: 'shield-checkmark-outline', itemCount: '30+ items', color: '#10B981' },
        { name: 'Plumbing & Pipes', icon: 'water-outline', itemCount: '50+ items', color: '#06B6D4' },
        { name: 'Electrical & Lighting', icon: 'flash-outline', itemCount: '35+ items', color: '#8B5CF6' },
        { name: 'Hardware & Fittings', icon: 'hardware-chip-outline', itemCount: '45+ items', color: '#EC4899' },
        { name: 'Heavy Machinery', icon: 'speedometer-outline', itemCount: '15+ fleet', color: '#F59E0B' }
    ];

    featuredProducts: Product[] = [];
    popularRentals: Rental[] = [];
    loading = true;
    currentSlide = 0;
    cartCount = 0;
    searchQuery = '';
    slideInterval: any;
    addingToCartId: string | number | null = null;
    private cartSub?: Subscription;

    constructor(
        private productService: ProductService,
        private rentalService: RentalService,
        private cartService: CartService,
        private toastCtrl: ToastController,
        private router: Router
    ) { }

    ngOnInit() {
        this.loadData();
        this.startBannerAutoSlide();

        this.cartSub = this.cartService.cart$.subscribe((cart) => {
            this.cartCount = cart?.items?.length || 0;
        });
    }

    ngOnDestroy() {
        if (this.slideInterval) {
            clearInterval(this.slideInterval);
        }
        if (this.cartSub) {
            this.cartSub.unsubscribe();
        }
    }

    loadData() {
        this.loading = true;

        // Load Featured Products
        this.productService.getFeaturedProducts(8).subscribe({
            next: (products) => {
                this.featuredProducts = products;
                this.checkLoading();
            },
            error: () => this.checkLoading()
        });

        // Load Popular Rentals
        this.rentalService.getRentals({ featured: 1 }).subscribe({
            next: (rentals) => {
                this.popularRentals = rentals;
                this.checkLoading();
            },
            error: () => this.checkLoading()
        });
    }

    private checkLoading() {
        this.loading = false;
    }

    startBannerAutoSlide() {
        if (this.slideInterval) {
            clearInterval(this.slideInterval);
        }
        this.slideInterval = setInterval(() => {
            this.currentSlide = (this.currentSlide + 1) % this.banners.length;
        }, 5000);
    }

    goToSlide(index: number) {
        this.currentSlide = index;
        this.startBannerAutoSlide();
    }

    nextSlide() {
        this.currentSlide = (this.currentSlide + 1) % this.banners.length;
        this.startBannerAutoSlide();
    }

    prevSlide() {
        this.currentSlide = (this.currentSlide - 1 + this.banners.length) % this.banners.length;
        this.startBannerAutoSlide();
    }

    handleRefresh(event: any) {
        this.loadData();
        setTimeout(() => {
            event.target.complete();
        }, 1000);
    }

    onSearch() {
        if (this.searchQuery && this.searchQuery.trim()) {
            this.router.navigate(['/tabs/products'], {
                queryParams: { search: this.searchQuery.trim() }
            });
        } else {
            this.router.navigate(['/tabs/products']);
        }
    }

    selectCategory(catName: string) {
        if (catName === 'Heavy Machinery') {
            this.router.navigate(['/tabs/rentals']);
        } else {
            this.router.navigate(['/tabs/products'], {
                queryParams: { category: catName }
            });
        }
    }

    navigateToBuy() {
        this.router.navigate(['/tabs/products']);
    }

    navigateToRental() {
        this.router.navigate(['/tabs/rentals']);
    }

    navigateToHelpers() {
        this.router.navigate(['/helpers']);
    }

    viewProduct(productId: string | number) {
        this.router.navigate(['/product-detail', productId]);
    }

    viewRental(rentalId: string | number) {
        this.router.navigate(['/rental-detail', rentalId]);
    }

    viewAllProducts() {
        this.router.navigate(['/tabs/products']);
    }

    viewAllRentals() {
        this.router.navigate(['/tabs/rentals']);
    }

    async addToCart(product: any, event: Event) {
        event.stopPropagation();
        this.addingToCartId = product.id;

        this.cartService.addToCart(Number(product.id), 1).subscribe({
            next: async () => {
                this.addingToCartId = null;
                const toast = await this.toastCtrl.create({
                    message: `Added "${product.name}" to cart`,
                    duration: 2000,
                    position: 'top',
                    color: 'success',
                    buttons: [
                        {
                            text: 'View Cart',
                            handler: () => {
                                this.router.navigate(['/cart']);
                            }
                        }
                    ]
                });
                await toast.present();
            },
            error: async () => {
                this.addingToCartId = null;
                const toast = await this.toastCtrl.create({
                    message: 'Could not add to cart. Please try again.',
                    duration: 2000,
                    position: 'top',
                    color: 'danger'
                });
                await toast.present();
            }
        });
    }

    getProductImage(product: any): string {
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

    getRentalImage(rental: any): string {
        if (rental.image && typeof rental.image === 'string' && rental.image.trim() !== '') {
            return rental.image;
        }
        return 'https://images.unsplash.com/photo-1579412691515-6807865f375b?auto=format&fit=crop&w=500&q=80';
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
                        CivilWorks Genuine Material
                    </text>
                </svg>
            `);
        }
    }

    onRentalImageError(event: any) {
        const target = event.target as HTMLImageElement;
        if (target) {
            target.src = 'data:image/svg+xml;utf8,' + encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
                    <rect width="100%" height="100%" fill="#0f172a"/>
                    <circle cx="200" cy="180" r="50" fill="none" stroke="#0ea5e9" stroke-width="6"/>
                    <path d="M175 180 L225 180 M200 155 L200 205" stroke="#0ea5e9" stroke-width="6" stroke-linecap="round"/>
                    <text x="50%" y="280" dominant-baseline="middle" text-anchor="middle" fill="#94a3b8" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="600">
                        CivilWorks Fleet Equipment
                    </text>
                </svg>
            `);
        }
    }
}
