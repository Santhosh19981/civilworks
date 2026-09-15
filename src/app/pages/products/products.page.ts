import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { Product } from '../../models/product.model';

@Component({
    selector: 'app-products',
    templateUrl: './products.page.html',
    styleUrls: ['./products.page.scss'],
})
export class ProductsPage implements OnInit, OnDestroy {
    products: Product[] = [];
    filteredProducts: Product[] = [];
    categories: string[] = ['All'];
    selectedCategory = 'All';
    searchQuery = '';
    sortBy = 'featured';
    loading = true;
    cartCount = 0;
    addingToCartId: string | number | null = null;
    private querySub?: Subscription;
    private cartSub?: Subscription;

    constructor(
        private productService: ProductService,
        private cartService: CartService,
        private toastCtrl: ToastController,
        private router: Router,
        private route: ActivatedRoute
    ) { }

    ngOnInit() {
        this.loadProducts();

        this.cartSub = this.cartService.cart$.subscribe(() => {
            this.cartCount = this.cartService.getCartCount();
        });

        // Listen to navigation query parameters (e.g. from Home page category or search)
        this.querySub = this.route.queryParams.subscribe(params => {
            if (params['category']) {
                this.selectedCategory = params['category'];
            }
            if (params['search']) {
                this.searchQuery = params['search'];
            }
            if (this.products.length > 0) {
                this.filterProducts();
            }
        });
    }

    ngOnDestroy() {
        if (this.querySub) this.querySub.unsubscribe();
        if (this.cartSub) this.cartSub.unsubscribe();
    }

    loadProducts() {
        this.loading = true;
        this.productService.getProducts().subscribe({
            next: (products: Product[]) => {
                this.products = products || [];
                this.filterProducts();
                this.loading = false;
            },
            error: (err: any) => {
                console.error('Error loading products', err);
                this.loading = false;
            }
        });

        this.productService.getCategories().subscribe({
            next: (cats: any[]) => {
                const fetched = cats.map((c: any) => c.name || c);
                this.categories = ['All', ...fetched];
            },
            error: (err: any) => console.error('Error loading categories', err)
        });
    }

    handleRefresh(event: any) {
        this.loadProducts();
        setTimeout(() => {
            event.target.complete();
        }, 800);
    }

    onSearchChange(event: any) {
        this.searchQuery = event.detail.value || '';
        this.filterProducts();
    }

    clearSearch() {
        this.searchQuery = '';
        this.filterProducts();
    }

    selectCategory(category: string) {
        this.selectedCategory = category;
        this.filterProducts();
    }

    setSortBy(sortType: string) {
        this.sortBy = sortType;
        this.filterProducts();
    }

    filterProducts() {
        let filtered = [...this.products];

        // Filter by category
        if (this.selectedCategory && this.selectedCategory !== 'All') {
            const catLower = this.selectedCategory.toLowerCase();
            filtered = filtered.filter(p => {
                const prodCat = (p.category || (p as any).category_name || '').toLowerCase();
                return prodCat.includes(catLower) || catLower.includes(prodCat);
            });
        }

        // Filter by search query
        if (this.searchQuery && this.searchQuery.trim()) {
            const query = this.searchQuery.toLowerCase().trim();
            filtered = filtered.filter(p =>
                (p.name && p.name.toLowerCase().includes(query)) ||
                (p.description && p.description.toLowerCase().includes(query)) ||
                (p.category && p.category.toLowerCase().includes(query)) ||
                ((p as any).category_name && (p as any).category_name.toLowerCase().includes(query))
            );
        }

        // Sort products
        if (this.sortBy === 'price-asc') {
            filtered.sort((a, b) => Number(a.price) - Number(b.price));
        } else if (this.sortBy === 'price-desc') {
            filtered.sort((a, b) => Number(b.price) - Number(a.price));
        } else if (this.sortBy === 'name') {
            filtered.sort((a, b) => a.name.localeCompare(b.name));
        }

        this.filteredProducts = filtered;
    }

    resetFilters() {
        this.selectedCategory = 'All';
        this.searchQuery = '';
        this.sortBy = 'featured';
        this.filterProducts();
    }

    viewProduct(productId: string | number) {
        this.router.navigate(['/product-detail', productId]);
    }

    async addToCart(product: Product, event: Event) {
        event.stopPropagation();
        this.addingToCartId = product.id;

        this.cartService.addToCart(Number(product.id), 1).subscribe({
            next: async () => {
                this.addingToCartId = null;
                const toast = await this.toastCtrl.create({
                    message: `Added "${product.name}" to cart!`,
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

    // ─────────────────────────────────────────────
    // Bulletproof Image Fallback Mapping
    // ─────────────────────────────────────────────
    getProductImage(product: any): string {
        if (product.image && typeof product.image === 'string' && product.image.trim() !== '' && !product.image.includes('null')) {
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
            return 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80';
        }
        // 4. Trowels (Concrete Finishing & Masonry)
        if (name.includes('trowel') || name.includes('finishing') || name.includes('masonry')) {
            return 'assets/products/concrete_trowel.jpg';
        }
        // 5. Hammers (Brick Hammer, Claw Hammer)
        if (name.includes('hammer')) {
            return 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?auto=format&fit=crop&w=600&q=80';
        }
        // 6. Chisel Sets
        if (name.includes('chisel')) {
            return 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?auto=format&fit=crop&w=600&q=80';
        }
        // 7. Measuring Tape
        if (name.includes('tape') || name.includes('measure') || name.includes('meter')) {
            return 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=600&q=80';
        }
        // 8. Spirit Level / Laser Level
        if (name.includes('level') || name.includes('laser') || name.includes('spirit')) {
            return 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=600&q=80';
        }
        // 9. Cement & Sand
        if (name.includes('cement') || cat.includes('cement') || name.includes('sand') || cat.includes('sand')) {
            return 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80';
        }
        // 10. Steel & TMT Rods
        if (name.includes('steel') || name.includes('tmt') || name.includes('rod') || cat.includes('steel')) {
            return 'https://images.unsplash.com/photo-1535813547-99c456a41d4a?auto=format&fit=crop&w=600&q=80';
        }
        // 11. Plumbing & Pipes
        if (name.includes('pipe') || cat.includes('pipe') || cat.includes('plumb') || name.includes('cpvc')) {
            return 'https://images.unsplash.com/photo-1607400201515-c2c41c07d307?auto=format&fit=crop&w=600&q=80';
        }
        // 12. Generic Safety Gear
        if (name.includes('safety') || cat.includes('safety')) {
            return 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80';
        }

        return 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=600&q=80';
    }

    onImageError(event: any, product: any) {
        event.target.src = 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=600&q=80';
    }
}
