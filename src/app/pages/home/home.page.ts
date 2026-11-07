import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { IonContent, ToastController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { ProductService } from '../../services/product.service';
import { RentalService } from '../../services/rental.service';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';
import { Product, MainCategory, Category } from '../../models/product.model';
import { Rental } from '../../models/rental.model';

import { ChatService } from '../../services/chat.service';
import { OrderService } from '../../services/order.service';
import { ChatPanelComponent } from '../../components/chat-panel/chat-panel.component';

export interface PromoBanner {
    id?: number;
    tag?: string;
    title: string;
    subtitle?: string;
    cta?: string;
    cta_link?: string;
    route?: string;
    assurance_badge?: string;
    badge?: string;
    image: string;
    main_category_id?: number;
    main_category_name?: string;
}

@Component({
    selector: 'app-home',
    templateUrl: './home.page.html',
    styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit, OnDestroy {
    @ViewChild(IonContent) content!: IonContent;
    @ViewChild('chatPanel') chatPanel?: ChatPanelComponent;

    banners: PromoBanner[] = [];

    mainCategories: MainCategory[] = [];
    sectorCategories: Category[] = [];
    featuredProducts: Product[] = [];
    popularRentals: Rental[] = [];
    hasRentalOrServiceSubcategories: boolean = false;
    hasRentalOrServiceProducts: boolean = false;
    showRentalSection: boolean = false;
    loading = true;
    currentSlide = 0;
    cartCount = 0;
    searchQuery = '';
    slideInterval: any;
    addingToCartId: string | number | null = null;
    activeSectorId: number | null = null;
    activeSectorName: string = '';

    // Floating Cap Chat State & Order Editing
    showChatPanel: boolean = false;
    unreadMessagesCount: number = 0;
    showEditModal: boolean = false;
    editingOrder: any = null;

    private cartSub?: Subscription;
    private routeSub?: Subscription;
    private chatSub?: Subscription;
    private userSub?: Subscription;

    constructor(
        private productService: ProductService,
        private rentalService: RentalService,
        private cartService: CartService,
        private chatService: ChatService,
        private orderService: OrderService,
        private toastCtrl: ToastController,
        private router: Router,
        private route: ActivatedRoute,
        public authService: AuthService
    ) { }

    ngOnInit() {
        this.routeSub = this.route.queryParams.subscribe(params => {
            if (params['mainCategoryId']) {
                this.activeSectorId = Number(params['mainCategoryId']);
                localStorage.setItem('selectedSectorId', String(this.activeSectorId));
            } else {
                const savedId = localStorage.getItem('selectedSectorId');
                this.activeSectorId = savedId ? Number(savedId) : null;
            }
            const savedName = localStorage.getItem('selectedSectorName');
            if (savedName) {
                this.activeSectorName = savedName;
            }
            this.loadData();
        });

        this.startBannerAutoSlide();

        this.cartSub = this.cartService.cart$.subscribe((cart) => {
            this.cartCount = cart?.items?.length || 0;
        });

        this.chatSub = this.chatService.unreadCount$.subscribe(count => {
            this.unreadMessagesCount = count;
        });
        this.chatService.loadConversations().subscribe({ error: () => {} });
        this.userSub = this.authService.user$.subscribe(() => {});
    }

    ngOnDestroy() {
        if (this.slideInterval) clearInterval(this.slideInterval);
        if (this.cartSub) this.cartSub.unsubscribe();
        if (this.routeSub) this.routeSub.unsubscribe();
        if (this.chatSub) this.chatSub.unsubscribe();
        if (this.userSub) this.userSub.unsubscribe();
    }

    toggleChatPanel() {
        this.showChatPanel = !this.showChatPanel;
    }

    openEditOrderFromChat(conv: any) {
        if (!conv) return;
        this.orderService.getOrderDetails(conv.order_id || conv.orderNo).subscribe({
            next: (orderDetails) => {
                this.editingOrder = orderDetails;
                this.showEditModal = true;
            },
            error: () => {
                this.editingOrder = {
                    id: conv.order_id,
                    order_no: conv.order_no,
                    services: conv.services || []
                };
                this.showEditModal = true;
            }
        });
    }

    loadData() {
        this.loading = true;
        this.hasRentalOrServiceSubcategories = false;
        this.hasRentalOrServiceProducts = false;
        this.showRentalSection = false;

        // Load Dynamic Active Main Categories from API
        this.productService.getMainCategories().subscribe({
            next: (mainCats) => {
                this.mainCategories = (mainCats || []).filter(m => m.status === 'active' || !m.status);
                if (this.activeSectorId) {
                    const found = this.mainCategories.find(m => m.id == this.activeSectorId);
                    if (found) {
                        this.activeSectorName = found.name;
                        localStorage.setItem('selectedSectorName', found.name);
                    }
                }
            },
            error: (err) => console.error('Error loading main categories', err)
        });

        // Load Dynamic Categories tagged to the active sector
        this.productService.getCategories(this.activeSectorId || undefined).subscribe({
            next: (cats) => {
                let list = cats || [];
                if (this.activeSectorId) {
                    const sectorId = Number(this.activeSectorId);
                    list = list.filter(c => {
                        if (Array.isArray(c.main_category_ids) && c.main_category_ids.map(Number).includes(sectorId)) {
                            return true;
                        }
                        return Number(c.main_category_id) === sectorId;
                    });
                }
                this.sectorCategories = list;
                this.checkLoading();
            },
            error: (err) => {
                console.error('Error loading sector categories', err);
                this.checkLoading();
            }
        });

        // Check if active sector has any subcategories configured with renting or services behavior
        const subParams: any = { limit: 100 };
        if (this.activeSectorId) {
            subParams.main_category_id = this.activeSectorId;
        }
        this.productService.getSubcategories(subParams).subscribe({
            next: (subs) => {
                let list = subs || [];
                if (this.activeSectorId) {
                    const sectorId = Number(this.activeSectorId);
                    list = list.filter(s => {
                        const sub: any = s;
                        if (Array.isArray(sub.main_category_ids) && sub.main_category_ids.map(Number).includes(sectorId)) {
                            return true;
                        }
                        return Number(sub.main_category_id) === sectorId;
                    });
                }
                const rentalOrServiceSubs = list.filter(s => {
                    const t = ((s.type || '') as string).toLowerCase().trim();
                    return t === 'renting' || t === 'services' || t === 'rental' || t === 'service';
                });
                this.hasRentalOrServiceSubcategories = rentalOrServiceSubs.length > 0;
                this.updateRentalSectionVisibility();
            },
            error: () => {
                this.hasRentalOrServiceSubcategories = false;
                this.updateRentalSectionVisibility();
            }
        });

        // Load Dynamic Hero Advertisements strictly isolated to active sector
        this.productService.getBanners(this.activeSectorId || undefined).subscribe({
            next: (banners) => {
                let list = banners || [];
                if (this.activeSectorId) {
                    list = list.filter(b => b.main_category_id == this.activeSectorId);
                }
                this.banners = list;
                this.currentSlide = 0;
                this.startBannerAutoSlide();
            },
            error: (err) => console.error('Error loading hero banners', err)
        });

        // Load Featured Products (scoped to sector if activeSectorId is set)
        const prodParams: any = { featured: 1 };
        if (this.activeSectorId) {
            prodParams.main_category_id = this.activeSectorId;
        }
        this.productService.getProducts(prodParams).subscribe({
            next: (products) => {
                let list = products || [];
                if (list.length === 0 && this.activeSectorId) {
                    this.productService.getProducts({ main_category_id: this.activeSectorId }).subscribe({
                        next: (allSectorProds) => {
                            this.featuredProducts = (allSectorProds || []).slice(0, 8);
                            this.checkProductTypes(allSectorProds || []);
                            this.checkLoading();
                        },
                        error: () => this.checkLoading()
                    });
                } else if (!this.activeSectorId) {
                    this.featuredProducts = list.slice(0, 8);
                    this.checkProductTypes(list);
                    this.checkLoading();
                } else {
                    this.featuredProducts = list.slice(0, 8);
                    this.checkProductTypes(list);
                    this.checkLoading();
                }
            },
            error: () => this.checkLoading()
        });

        // Load Popular Rentals strictly scoped to sector
        const rentalParams: any = { featured: 1 };
        if (this.activeSectorId) {
            rentalParams.main_category_id = this.activeSectorId;
        }
        this.rentalService.getRentals(rentalParams).subscribe({
            next: (rentals) => {
                let list = rentals || [];
                if (this.activeSectorId) {
                    list = list.filter(r => r.main_category_id == this.activeSectorId);
                }
                if (list.length === 0 && this.activeSectorId) {
                    this.rentalService.getRentals({ main_category_id: this.activeSectorId }).subscribe({
                        next: (allSectorRentals) => {
                            let allList = allSectorRentals || [];
                            if (this.activeSectorId) {
                                allList = allList.filter(r => r.main_category_id == this.activeSectorId);
                            }
                            this.popularRentals = allList;
                            this.updateRentalSectionVisibility();
                            this.checkLoading();
                        },
                        error: () => {
                            this.popularRentals = [];
                            this.updateRentalSectionVisibility();
                            this.checkLoading();
                        }
                    });
                } else {
                    this.popularRentals = list;
                    this.updateRentalSectionVisibility();
                    this.checkLoading();
                }
            },
            error: () => {
                this.popularRentals = [];
                this.updateRentalSectionVisibility();
                this.checkLoading();
            }
        });
    }

    checkProductTypes(prods: Product[]) {
        const rentalOrServiceProds = (prods || []).filter(p => {
            const pType = ((p.product_type || p.type || '') as string).toLowerCase().trim();
            const subType = (((p as any).subcategory_type || '') as string).toLowerCase().trim();
            return pType === 'renting' || pType === 'services' || pType === 'rental' || pType === 'service' ||
                   subType === 'renting' || subType === 'services' || subType === 'rental' || subType === 'service';
        });
        this.hasRentalOrServiceProducts = rentalOrServiceProds.length > 0;
        this.updateRentalSectionVisibility();
    }

    updateRentalSectionVisibility() {
        const hasRentals = this.popularRentals && this.popularRentals.length > 0;
        const hasRentalOrServiceType = this.hasRentalOrServiceSubcategories || this.hasRentalOrServiceProducts;

        // If in a specific sector: only show if the sector actually has renting/services capability OR rentals in DB, AND has items to display.
        // If "no product or sub category has rentals , services in the main category", this portion is removed completely.
        if (this.activeSectorId) {
            this.showRentalSection = (hasRentalOrServiceType || hasRentals) && hasRentals;
        } else {
            // All sectors view
            this.showRentalSection = hasRentals;
        }
    }

    switchSector() {
        this.router.navigate(['/sector-select']);
    }

    private checkLoading() {
        this.loading = false;
    }

    startBannerAutoSlide() {
        if (this.slideInterval) {
            clearInterval(this.slideInterval);
        }
        if (!this.banners || this.banners.length <= 1) return;
        this.slideInterval = setInterval(() => {
            if (this.banners.length > 0) {
                this.currentSlide = (this.currentSlide + 1) % this.banners.length;
            }
        }, 5000);
    }

    goToSlide(index: number) {
        this.currentSlide = index;
        this.startBannerAutoSlide();
    }

    nextSlide() {
        if (this.banners && this.banners.length > 0) {
            this.currentSlide = (this.currentSlide + 1) % this.banners.length;
        }
        this.startBannerAutoSlide();
    }

    prevSlide() {
        if (this.banners && this.banners.length > 0) {
            this.currentSlide = (this.currentSlide - 1 + this.banners.length) % this.banners.length;
        }
        this.startBannerAutoSlide();
    }


    get totalSlides(): number {
        return 1 + (this.banners ? this.banners.length : 0);
    }

    get isPlusMember(): boolean {
        return this.authService.isAuthenticated() && this.authService.isPlusMember();
    }

    // Artwork for the default hero slide, matched to the active sector.
    get heroScene(): string {
        return (this.activeSectorName || '').toLowerCase().includes('interior') ? 'interiors' : 'construction';
    }

    handleHeroCtaClick() {
        if (this.isPlusMember) {
            // Direct to chat box page (ensure conversation list is shown, not a specific chat directly)
            if (this.chatPanel) {
                this.chatPanel.openConversationList();
            }
            this.showChatPanel = true;
        } else {
            this.joinMembership();
        }
    }

    joinMembership() {
        const currentUrl = this.router.url;
        if (!this.authService.isAuthenticated()) {
            this.router.navigate(['/login'], {
                queryParams: { returnUrl: '/membership-checkout?returnUrl=' + encodeURIComponent(currentUrl) }
            });
            return;
        }
        this.router.navigate(['/membership-checkout'], {
            queryParams: { returnUrl: currentUrl }
        });
    }

    handleRefresh(event: any) {
        this.loadData();
        setTimeout(() => {
            event.target.complete();
        }, 1000);
    }

    onSearch() {
        const queryParams: any = {};
        if (this.activeSectorId) queryParams.mainCategoryId = this.activeSectorId;
        if (this.searchQuery && this.searchQuery.trim()) {
            queryParams.search = this.searchQuery.trim();
        }
        this.router.navigate(['/tabs/products'], { queryParams });
    }

    selectCategory(cat: any) {
        const queryParams: any = {};
        if (this.activeSectorId) queryParams.mainCategoryId = this.activeSectorId;

        if (typeof cat === 'object' && cat && cat.id) {
            queryParams.categoryId = cat.id;
            const name = (cat.name || '').toLowerCase();
            if (name.includes('machinery & equipment') || name === 'heavy machinery') {
                this.router.navigate(['/tabs/rentals'], { queryParams });
                return;
            }
            this.router.navigate(['/tabs/products'], { queryParams });
            return;
        }

        const catName = String(cat);
        queryParams.category = catName;
        if (catName.toLowerCase().includes('machinery') || catName.toLowerCase().includes('equipment')) {
            this.router.navigate(['/tabs/rentals'], { queryParams });
        } else {
            this.router.navigate(['/tabs/products'], { queryParams });
        }
    }

    getCategoryIcon(cat: any): string {
        const name = (cat.name || '').toLowerCase();
        if (name.includes('civil') || name.includes('interior')) return 'cube-outline';
        if (name.includes('machin') || name.includes('equipment') || name.includes('rental')) return 'construct-outline';
        if (name.includes('electr')) return 'flash-outline';
        if (name.includes('plumb')) return 'water-outline';
        if (name.includes('hardw') || name.includes('tool')) return 'hammer-outline';
        if (name.includes('furnit') || name.includes('architect')) return 'bed-outline';
        if (name.includes('estate') || name.includes('prop')) return 'business-outline';
        return 'grid-outline';
    }

    getCategoryThemeClass(cat: any, index: number): string {
        const name = (cat.name || '').toLowerCase();
        if (name.includes('civil') || name.includes('interior')) return 'theme-orange';
        if (name.includes('machin') || name.includes('equipment')) return 'theme-navy';
        if (name.includes('electr')) return 'theme-amber';
        if (name.includes('plumb')) return 'theme-cyan';
        if (name.includes('hardw') || name.includes('tool')) return 'theme-emerald';
        if (name.includes('furnit')) return 'theme-indigo';
        const themes = ['theme-orange', 'theme-navy', 'theme-amber', 'theme-cyan', 'theme-emerald', 'theme-indigo'];
        return themes[index % themes.length];
    }

    getCategoryDesc(cat: any): string {
        if (cat.description && typeof cat.description === 'string' && cat.description.trim() !== '') {
            return cat.description;
        }
        const name = (cat.name || '').toLowerCase();
        if (name.includes('civil')) return 'Cement, TMT Steel, Sand, Blocks & essential building supplies.';
        if (name.includes('machin') || name.includes('equipment')) return 'Heavy machinery, JCBs, cranes, mixers & tools on flexible rental.';
        if (name.includes('electr')) return 'Conduits, wires, switches, sockets, DB boards & industrial lighting.';
        if (name.includes('plumb')) return 'CPVC pipes, fittings, sanitary ware, bath fixtures & water tanks.';
        if (name.includes('hardw') || name.includes('tool')) return 'Construction tools, safety gear, laser levels & measurement instruments.';
        if (name.includes('furnit')) return 'Architectural hardware, wardrobe fittings, door locks & kitchen systems.';
        return `High-grade products, equipment & certified solutions mapped to ${cat.name}.`;
    }

    selectMainCategory(mainCat: MainCategory) {
        this.router.navigate(['/tabs/home'], {
            queryParams: { mainCategoryId: mainCat.id }
        });
    }

    viewAllCategories() {
        const queryParams: any = {};
        if (this.activeSectorId) queryParams.mainCategoryId = this.activeSectorId;
        this.router.navigate(['/tabs/products'], { queryParams });
    }

    navigateToBuy() {
        const queryParams: any = {};
        if (this.activeSectorId) queryParams.mainCategoryId = this.activeSectorId;
        this.router.navigate(['/tabs/products'], { queryParams });
    }

    navigateToRental() {
        const queryParams: any = {};
        if (this.activeSectorId) queryParams.mainCategoryId = this.activeSectorId;
        this.router.navigate(['/tabs/rentals'], { queryParams });
    }

    navigateToHelpers() {
        const queryParams: any = {};
        if (this.activeSectorId) queryParams.mainCategoryId = this.activeSectorId;
        this.router.navigate(['/helpers'], { queryParams });
    }

    viewProduct(productId: string | number) {
        this.router.navigate(['/product-detail', productId]);
    }

    isRenting(product: any): boolean {
        const t = ((product?.product_type || product?.type || product?.subcategory_type || '') as string).toLowerCase().trim();
        return t === 'renting' || t === 'rental';
    }

    isService(product: any): boolean {
        const t = ((product?.product_type || product?.type || product?.subcategory_type || '') as string).toLowerCase().trim();
        return t === 'services' || t === 'service';
    }

    viewRental(rentalId: string | number) {
        this.router.navigate(['/rental-detail', rentalId]);
    }

    viewAllProducts() {
        const queryParams: any = {};
        if (this.activeSectorId) queryParams.mainCategoryId = this.activeSectorId;
        this.router.navigate(['/tabs/products'], { queryParams });
    }

    viewAllRentals() {
        const queryParams: any = {};
        if (this.activeSectorId) queryParams.mainCategoryId = this.activeSectorId;
        this.router.navigate(['/tabs/rentals'], { queryParams });
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
                        InfraMart Genuine Material
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
                        InfraMart Fleet Equipment
                    </text>
                </svg>
            `);
        }
    }
}
