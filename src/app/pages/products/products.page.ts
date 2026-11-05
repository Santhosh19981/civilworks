import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { ToastController, LoadingController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { OrderService } from '../../services/order.service';
import { AuthService } from '../../services/auth.service';
import { Product, SubCategory, Vendor, Category, MainCategory } from '../../models/product.model';
import { environment } from '../../../environments/environment';

@Component({
    selector: 'app-products',
    templateUrl: './products.page.html',
    styleUrls: ['./products.page.scss'],
})
export class ProductsPage implements OnInit, OnDestroy {
    products: Product[] = [];
    filteredProducts: Product[] = [];
    subcategories: SubCategory[] = [];
    mappedVendors: Vendor[] = [];

    mainCategoryId: number | null = null;
    categoryId: number | null = null;
    selectedSubcategoryId: number | null = null;
    selectedSubcategoryName: string = 'All';

    currentCategory: Category | null = null;
    currentMainCategory: MainCategory | null = null;

    searchQuery = '';
    sortBy = 'featured';
    loading = true;
    cartCount = 0;
    addingToCartId: string | number | null = null;
    rentalDurations: { [key: string]: number } = {};

    // Vendor Selection Popup State for Service Products
    showVendorModal = false;
    loadingVendors = false;
    selectedServiceProduct: any = null;
    serviceVendors: Vendor[] = [];

    // Edit Order Context (When navigated from Orders page "Edit Order")
    editOrderId: string | number | null = null;
    rawOrderId: string | number | null = null;
    editOrderNo: string | null = null;
    filterType: string | null = null;
    existingOrderServices: any[] = [];

    private querySub?: Subscription;
    private cartSub?: Subscription;

    constructor(
        private productService: ProductService,
        private cartService: CartService,
        private orderService: OrderService,
        private toastCtrl: ToastController,
        private loadingCtrl: LoadingController,
        private router: Router,
        private route: ActivatedRoute,
        private location: Location,
        private authService: AuthService
    ) { }

    ngOnInit() {
        this.cartSub = this.cartService.cart$.subscribe(() => {
            this.cartCount = this.cartService.getCartCount();
        });

        this.querySub = this.route.queryParams.subscribe(params => {
            const savedSector = localStorage.getItem('selectedSectorId');
            this.mainCategoryId = params['mainCategoryId'] ? Number(params['mainCategoryId']) : (savedSector ? Number(savedSector) : null);
            this.categoryId = params['categoryId'] ? Number(params['categoryId']) : null;
            this.selectedSubcategoryId = params['subcategoryId'] ? Number(params['subcategoryId']) : null;
            this.searchQuery = params['search'] || '';
            this.filterType = params['type'] || null;
            this.editOrderId = params['editOrderId'] || null;
            this.rawOrderId = params['rawId'] || params['editOrderId'] || null;
            this.editOrderNo = params['orderNo'] || params['editOrderId'] || null;

            if (this.editOrderId || this.rawOrderId) {
                this.loadExistingOrderServices();
            } else {
                this.existingOrderServices = [];
            }

            this.loadHierarchyAndProducts();
        });
    }

    loadExistingOrderServices(callback?: () => void) {
        const targetId = this.rawOrderId || this.editOrderId;
        if (!targetId) {
            if (callback) callback();
            return;
        }
        this.orderService.getOrderDetails(String(targetId)).subscribe({
            next: (order) => {
                if (order && order.services) {
                    this.existingOrderServices = (order.services || []).filter(
                        (s: any) => s.service_status !== 'removed'
                    );
                }
                if (callback) callback();
            },
            error: (err) => {
                console.error('Error loading order services for edit order', err);
                if (callback) callback();
            }
        });
    }

    ngOnDestroy() {
        if (this.querySub) this.querySub.unsubscribe();
        if (this.cartSub) this.cartSub.unsubscribe();
    }

    loadHierarchyAndProducts() {
        this.loading = true;
        this.currentMainCategory = null;
        this.currentCategory = null;
        this.subcategories = [];
        this.products = [];
        this.filteredProducts = [];

        // 1. If filterType is 'services' or editOrderId is present, specifically load services subcategories
        if (this.filterType === 'services' || this.editOrderId) {
            this.productService.getSubcategories({ type: 'services' }).subscribe({
                next: (subs) => {
                    const serviceSubs = (subs || []).filter(s => {
                        const t = ((s.type || '') as string).toLowerCase().trim();
                        return t === 'services' || t === 'service';
                    });
                    this.subcategories = serviceSubs.length > 0 ? serviceSubs : (subs || []);
                    if (this.selectedSubcategoryId) {
                        const found = this.subcategories.find(s => s.id == this.selectedSubcategoryId);
                        this.selectedSubcategoryName = found ? found.name : 'All Services';
                    } else {
                        this.selectedSubcategoryName = 'All Services';
                    }
                    this.loadVendors();
                    this.fetchProducts();
                },
                error: (err) => {
                    console.error('Error loading service subcategories', err);
                    this.fetchProducts();
                }
            });
            return;
        }

        // 1. Load Main Category
        if (this.mainCategoryId) {
            this.productService.getMainCategories().subscribe({
                next: (mainCats) => {
                    this.currentMainCategory = mainCats.find(m => m.id == this.mainCategoryId) || null;
                }
            });
        }

        // 2. Load Category
        if (this.categoryId) {
            this.productService.getCategories(this.mainCategoryId || undefined).subscribe({
                next: (cats) => {
                    this.currentCategory = cats.find(c => c.id == this.categoryId) || null;
                }
            });
        }

        // 3. Load Subcategories STRICTLY for this Category (or Main Category)
        const subParams: any = {};
        if (this.categoryId) {
            subParams.category_id = this.categoryId;
        } else if (this.mainCategoryId) {
            subParams.main_category_id = this.mainCategoryId;
        }

        this.productService.getSubcategories(subParams).subscribe({
            next: (subs) => {
                this.subcategories = subs || [];
                if (this.selectedSubcategoryId) {
                    const found = this.subcategories.find(s => s.id == this.selectedSubcategoryId);
                    this.selectedSubcategoryName = found ? found.name : 'All';
                } else {
                    this.selectedSubcategoryName = 'All';
                }
                this.loadVendors();
            },
            error: (err) => console.error('Error loading subcategories', err)
        });

        // 4. Load Products with STRICT isolation
        this.fetchProducts();
    }

    fetchProducts() {
        const prodParams: any = {};
        if (this.mainCategoryId) prodParams.main_category_id = this.mainCategoryId;
        if (this.categoryId) prodParams.category_id = this.categoryId;
        if (this.selectedSubcategoryId) prodParams.subcategory_id = this.selectedSubcategoryId;
        if (this.filterType === 'services' || this.editOrderId) prodParams.type = 'services';

        this.productService.getProducts(prodParams).subscribe({
            next: (products: Product[]) => {
                let list = products || [];

                // If in services mode, ensure service subcategories have an actionable service card
                if (this.filterType === 'services' || this.editOrderId) {
                    const availableSubs = this.subcategories.length > 0
                        ? this.subcategories
                        : [{ id: 34, name: 'General Construction Services', type: 'services', category_id: 1, image: '', description: '' }];

                    // When a specific subcategory is selected, ONLY consider that subcategory for fallback
                    const activeSubs = this.selectedSubcategoryId
                        ? availableSubs.filter(s => s.id == this.selectedSubcategoryId)
                        : availableSubs;

                    activeSubs.forEach((sub: any) => {
                        const hasProd = list.some(p => p.subcategory_id == sub.id);
                        if (!hasProd) {
                            list.push({
                                id: 'svc-' + sub.id,
                                name: sub.name,
                                price: 1500,
                                category: 'Services',
                                category_id: sub.category_id || 1,
                                category_name: 'Services',
                                subcategory_id: sub.id,
                                subcategory_name: sub.name,
                                unit_name: 'Service Execution',
                                product_type: 'services',
                                type: 'services',
                                status: 'active',
                                image: sub.image || 'assets/images/helpers/electrician.jpg',
                                description: sub.description || `Verified professional trade partner execution for ${sub.name}. Dedicated assignment with full assurance.`
                            } as any);
                        }
                    });
                }

                this.products = list;
                this.products.forEach(p => {
                    if (!this.rentalDurations[String(p.id)]) {
                        this.rentalDurations[String(p.id)] = 1;
                    }
                });
                this.filterProducts();
                this.loading = false;
            },
            error: (err: any) => {
                console.error('Error loading products', err);
                this.loading = false;
            }
        });
    }

    loadVendors() {
        // Fetch mapped vendors for current subcategory or all subcategories in category
        if (this.selectedSubcategoryId) {
            this.productService.getVendors(this.selectedSubcategoryId).subscribe({
                next: (vendors) => this.mappedVendors = vendors || [],
                error: (err) => console.error('Error loading vendors', err)
            });
        } else {
            this.mappedVendors = [];
        }
    }

    selectSubcategory(sub: SubCategory | null) {
        if (!sub) {
            this.selectedSubcategoryId = null;
            this.selectedSubcategoryName = (this.filterType === 'services' || this.editOrderId) ? 'All Services' : 'All';
        } else {
            this.selectedSubcategoryId = sub.id;
            this.selectedSubcategoryName = sub.name;
        }

        this.filterProducts();
        this.loadVendors();
        this.fetchProducts();
    }

    handleRefresh(event: any) {
        this.loadHierarchyAndProducts();
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

    setSortBy(sortType: string) {
        this.sortBy = sortType;
        this.filterProducts();
    }

    filterProducts() {
        let filtered = [...this.products];

        // Filter strictly by selected subcategory if chosen
        if (this.selectedSubcategoryId) {
            filtered = filtered.filter(p => Number(p.subcategory_id) === Number(this.selectedSubcategoryId));
        }

        // Filter strictly by selected category if chosen (when not in services mode)
        if (this.categoryId && !(this.filterType === 'services' || this.editOrderId)) {
            filtered = filtered.filter(p => Number(p.category_id) === Number(this.categoryId));
        }

        // Filter by search query
        if (this.searchQuery && this.searchQuery.trim()) {
            const query = this.searchQuery.toLowerCase().trim();
            filtered = filtered.filter(p =>
                (p.name && p.name.toLowerCase().includes(query)) ||
                (p.description && p.description.toLowerCase().includes(query)) ||
                (p.category_name && p.category_name.toLowerCase().includes(query)) ||
                (p.subcategory_name && p.subcategory_name.toLowerCase().includes(query))
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
        this.selectedSubcategoryId = null;
        this.selectedSubcategoryName = (this.filterType === 'services' || this.editOrderId) ? 'All Services' : 'All';
        this.searchQuery = '';
        this.sortBy = 'featured';
        this.loadVendors();
        this.fetchProducts();
    }

    getRentalDuration(productId: string | number): number {
        return this.rentalDurations[String(productId)] || 1;
    }

    incrementDuration(productId: string | number, event: Event) {
        event.stopPropagation();
        const id = String(productId);
        this.rentalDurations[id] = (this.rentalDurations[id] || 1) + 1;
    }

    decrementDuration(productId: string | number, event: Event) {
        event.stopPropagation();
        const id = String(productId);
        if ((this.rentalDurations[id] || 1) > 1) {
            this.rentalDurations[id] -= 1;
        }
    }

    isRenting(product: Product): boolean {
        return (product.product_type === 'renting' || product.type === 'renting') && !this.isContract(product);
    }

    isContract(product: any): boolean {
        const unit = (product.unit_name || '').toLowerCase();
        return unit.includes('contract completion') || unit.includes('contract');
    }

    isService(product: any): boolean {
        const isServ = product.product_type === 'services' || product.type === 'services' || (product as any).subcategory_type === 'services';
        return isServ || this.isContract(product);
    }

    viewProduct(productId: string | number) {
        this.router.navigate(['/product-detail', productId]);
    }

    onProductCardClick(product: Product) {
        if (this.isService(product)) {
            this.openVendorSelectionModal(product);
        } else {
            this.viewProduct(product.id);
        }
    }

    openVendorSelectionModal(product: any, event?: Event) {
        if (event) {
            event.stopPropagation();
        }
        const currentUrl = this.router.url;
        if (!this.authService.isAuthenticated()) {
            this.router.navigate(['/login'], {
                queryParams: { returnUrl: '/membership-checkout?returnUrl=' + encodeURIComponent(currentUrl) }
            });
            return;
        }
        if (!this.authService.isPlusMember()) {
            this.router.navigate(['/membership-checkout'], {
                queryParams: { returnUrl: currentUrl }
            });
            return;
        }
        this.selectedServiceProduct = product;
        this.showVendorModal = true;
        this.loadingVendors = true;
        this.serviceVendors = [];

        const subId = product.subcategory_id || this.selectedSubcategoryId;

        const proceedFetch = () => {
            this.productService.getVendors(subId || undefined).subscribe({
                next: (vendors) => {
                    this.loadingVendors = false;
                    let vendorList = vendors || [];

                    // User Requirement:
                    // If a vendor was selected for one service then he shouldn't be displayed in the same service page
                    // when editing orders, but he may appear in other services which he was tagged to.
                    if (this.editOrderId && this.existingOrderServices && this.existingOrderServices.length > 0) {
                        const assignedVendorIdsForThisService = this.existingOrderServices
                            .filter(s => Number(s.subcategory_id) === Number(subId) && s.service_status !== 'removed')
                            .map(s => Number(s.vendor_id));

                        vendorList = vendorList.filter(v => !assignedVendorIdsForThisService.includes(Number(v.id)));
                    }

                    this.serviceVendors = vendorList.map(v => ({
                        ...v,
                        image: v.image || ''
                    }));
                },
                error: (err) => {
                    console.error('Error fetching vendors for service', err);
                    this.loadingVendors = false;
                    this.serviceVendors = [];
                }
            });
        };

        if (this.editOrderId) {
            this.loadExistingOrderServices(proceedFetch);
        } else {
            proceedFetch();
        }
    }

    closeVendorModal() {
        this.showVendorModal = false;
        this.selectedServiceProduct = null;
        this.serviceVendors = [];
    }

    async selectVendorAndProceed(vendor: any) {
        const currentUrl = this.router.url;
        if (!this.authService.isAuthenticated()) {
            this.closeVendorModal();
            this.router.navigate(['/login'], {
                queryParams: { returnUrl: '/membership-checkout?returnUrl=' + encodeURIComponent(currentUrl) }
            });
            return;
        }
        if (!this.authService.isPlusMember()) {
            this.closeVendorModal();
            this.router.navigate(['/membership-checkout'], {
                queryParams: { returnUrl: currentUrl }
            });
            return;
        }
        if (!this.selectedServiceProduct) return;

        const currentServiceProduct = this.selectedServiceProduct;
        const subId = currentServiceProduct.subcategory_id;
        const price = Number(currentServiceProduct.price || 0);

        const serviceBooking = {
            type: 'service',
            product_id: currentServiceProduct.id,
            service_id: currentServiceProduct.id,
            service_name: currentServiceProduct.name,
            name: currentServiceProduct.name,
            category_name: currentServiceProduct.category_name,
            subcategory_id: subId,
            subcategory_name: currentServiceProduct.subcategory_name,
            unit_name: currentServiceProduct.unit_name || 'Service',
            price: price,
            total: price,
            totalAmount: price,
            image: this.getProductImage(currentServiceProduct),
            vendor: {
                id: vendor.id,
                name: vendor.name,
                image: vendor.image || '',
                mobile: vendor.mobile || ''
            },
            vendor_id: vendor.id,
            vendor_name: vendor.name,
            vendor_image: vendor.image || '',
            editOrderId: this.editOrderId,
            rawOrderId: this.rawOrderId,
            editOrderNo: this.editOrderNo
        };

        this.closeVendorModal();

        if (this.editOrderId) {
            // EDIT ORDER FLOW:
            // Do NOT ask for address or checkout details again!
            // Retain the existing Order ID and old details intact.
            // No payment process required!
            const targetOrderId = this.rawOrderId || this.editOrderId;
            const orderNo = this.editOrderNo || this.editOrderId;

            const loading = await this.loadingCtrl.create({
                message: `Adding ${currentServiceProduct.name} to Project #${orderNo}...`,
                spinner: 'crescent'
            });
            await loading.present();

            this.orderService.addServiceToOrder(targetOrderId, {
                subcategory_id: Number(subId),
                vendor_id: Number(vendor.id),
                service_name: currentServiceProduct.name,
                price: price,
                notes: ''
            }).subscribe({
                next: async (res: any) => {
                    await loading.dismiss();
                    localStorage.removeItem('civilworks_pending_service_booking');
                    localStorage.removeItem('civilworks_pending_booking');

                    const returnedOrder = res?.data?.order || null;
                    const returnedServices = res?.data?.services || [];

                    const toast = await this.toastCtrl.create({
                        message: `🎉 Service "${currentServiceProduct.name}" and dedicated vendor "${vendor.name}" added to Project #${orderNo}!`,
                        duration: 3500,
                        color: 'success',
                        position: 'top'
                    });
                    toast.present();

                    // Immediately navigate to order booking placed / thank you page with order details!
                    this.router.navigate(['/order-success'], {
                        state: {
                            orderId: orderNo,
                            rawOrderId: targetOrderId,
                            order: returnedOrder,
                            services: returnedServices,
                            isEdit: true,
                            isServiceOrder: true,
                            serviceName: currentServiceProduct.name,
                            vendorName: vendor.name,
                            vendorMobile: vendor.mobile,
                            vendorImage: vendor.image,
                            price: price,
                            message: `Service "${currentServiceProduct.name}" assigned to dedicated vendor "${vendor.name}" on Project #${orderNo}.`
                        }
                    });

                    this.editOrderId = null;
                    this.rawOrderId = null;
                    this.editOrderNo = null;
                },
                error: async (err: any) => {
                    await loading.dismiss();
                    console.error('Failed to add service to order:', err);
                    const toast = await this.toastCtrl.create({
                        message: err?.error?.message || 'Could not update project order. Please try again.',
                        duration: 4000,
                        color: 'danger',
                        position: 'top'
                    });
                    toast.present();
                }
            });
        } else {
            // NEW SERVICE BOOKING:
            // No payment process required! Route to checkout in service-only mode without payment gateways
            localStorage.setItem('civilworks_pending_service_booking', JSON.stringify(serviceBooking));
            localStorage.setItem('civilworks_pending_booking', JSON.stringify(serviceBooking));
            this.router.navigate(['/checkout'], { state: { serviceBooking, isServiceOrder: true } });
        }
    }

    cancelEditOrder() {
        this.editOrderId = null;
        this.rawOrderId = null;
        this.editOrderNo = null;
        this.router.navigate(['/tabs/orders'], { queryParams: { tab: 'services' } });
    }

    async addToCart(product: Product, event: Event) {
        event.stopPropagation();
        this.addingToCartId = product.id;

        const isRent = this.isRenting(product);
        const isContractWork = this.isContract(product);
        const duration = isRent ? this.getRentalDuration(product.id) : 1;

        this.cartService.addToCart(Number(product.id), 1, duration).subscribe({
            next: async () => {
                this.addingToCartId = null;
                const unitStr = product.unit_name ? ` per ${product.unit_name}` : '';
                const durationStr = isRent ? ` (${duration} ${product.unit_name || 'periods'})` : '';
                const actionVerb = isContractWork ? 'Booked contract for' : (isRent ? 'Rented' : 'Added');
                const toast = await this.toastCtrl.create({
                    message: `${actionVerb} "${product.name}"${durationStr} to cart!`,
                    duration: 2500,
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
            error: async (err) => {
                this.addingToCartId = null;
                const toast = await this.toastCtrl.create({
                    message: err.error?.message || 'Could not add to cart. Please try again.',
                    duration: 2500,
                    position: 'top',
                    color: 'danger'
                });
                await toast.present();
            }
        });
    }

    navigateToCategorySelection() {
        if (this.mainCategoryId) {
            this.router.navigate(['/tabs/home'], { queryParams: { mainCategoryId: this.mainCategoryId } });
        } else {
            this.router.navigate(['/tabs/home']);
        }
    }

    callVendor(mobile: string, event: Event) {
        event.stopPropagation();
        window.location.href = `tel:${mobile}`;
    }

    // ─────────────────────────────────────────────
    // Subcategory-Inherited & Clean Neutral Fallback (No Mock Data)
    // ─────────────────────────────────────────────
    getProductImage(product: any): string {
        if (!product) {
            return this.getCleanPlaceholder('Product');
        }
        if (product.image && typeof product.image === 'string' && product.image.trim() !== '' && !product.image.includes('null')) {
            return this.formatImageUrl(product.image);
        }
        if (product.subcategory_image && typeof product.subcategory_image === 'string' && product.subcategory_image.trim() !== '' && !product.subcategory_image.includes('null')) {
            return this.formatImageUrl(product.subcategory_image);
        }
        if (product.category_image && typeof product.category_image === 'string' && (product.category_image.startsWith('http') || product.category_image.startsWith('/uploads'))) {
            return this.formatImageUrl(product.category_image);
        }

        return this.getCleanPlaceholder(product.name || product.subcategory_name || product.category_name || 'Product');
    }

    formatImageUrl(url: string): string {
        if (!url) return '';
        if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('assets/')) {
            return url;
        }
        return `${environment.uploadUrl}${url.startsWith('/') ? '' : '/'}${url}`;
    }

    getCleanPlaceholder(title: string = 'Item'): string {
        const text = (title || 'Item').substring(0, 18);
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="100%" height="100%" fill="#0d1b2a"/><g fill="#ffffff" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"><circle cx="300" cy="180" r="46" fill="#f59e0b" opacity="0.95"/><path d="M288 180 L300 166 L312 180 M300 168 L300 194" stroke="#0d1b2a" stroke-width="4" stroke-linecap="round" fill="none"/><text x="300" y="255" font-size="20" font-weight="700" letter-spacing="0.5">${text}</text><text x="300" y="280" font-size="12" font-weight="500" opacity="0.6">Verified Inventory</text></g></svg>`;
        return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    }

    onImageError(event: any, product: any) {
        if (product?.subcategory_image && event.target.src !== product.subcategory_image) {
            event.target.src = this.formatImageUrl(product.subcategory_image);
        } else {
            event.target.src = this.getCleanPlaceholder(product?.name || 'Product');
        }
    }

    goBack() {
        if (this.mainCategoryId) {
            this.router.navigate(['/tabs/home'], { queryParams: { mainCategoryId: this.mainCategoryId } });
        } else if (window.history.length > 1) {
            this.location.back();
        } else {
            this.router.navigate(['/tabs/home']);
        }
    }
}
