import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { ToastController } from '@ionic/angular';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { Product, Vendor } from '../../models/product.model';
import { environment } from '../../../environments/environment';

@Component({
    selector: 'app-product-detail',
    templateUrl: './product-detail.page.html',
    styleUrls: ['./product-detail.page.scss'],
})
export class ProductDetailPage implements OnInit {
    product: any;
    quantity = 1;
    rentalDuration = 1;
    loading = true;
    addingToCart = false;
    cartCount = 0;
    activeTab: 'specs' | 'features' | 'reviews' = 'specs';
    activeImage = '';
    galleryThumbnails: string[] = [];
    specsList: { label: string; value: string }[] = [];
    featureBullets: string[] = [];
    relatedProducts: any[] = [];
    pincodeInput = '500081';
    pincodeMessage = 'Fast Site Dispatch available for Hyderabad (Within 24 Hours)';

    // Vendor Selection Modal State for Services
    showVendorModal = false;
    loadingVendors = false;
    serviceVendors: Vendor[] = [];

    get isRenting(): boolean {
        return (this.product?.product_type === 'renting' || this.product?.type === 'renting') && !this.isService && !this.isHelper;
    }

    get isHelper(): boolean {
        if (!this.product) return false;
        const type = (this.product.product_type || this.product.type || this.product.subcategory_type || '').toLowerCase();
        return type === 'helpers' || type === 'helper';
    }

    get parsedSkills(): string[] {
        if (!this.product?.skills) return [];
        if (Array.isArray(this.product.skills)) return this.product.skills;
        try {
            return JSON.parse(this.product.skills);
        } catch (e) {
            return typeof this.product.skills === 'string'
                ? this.product.skills.split(',').map((s: string) => s.trim())
                : [];
        }
    }

    get isService(): boolean {
        if (!this.product) return false;
        if (this.isHelper) return false;
        const type = (this.product.product_type || this.product.type || this.product.subcategory_type || '').toLowerCase();
        return type === 'services' || type === 'service' || (this.product.unit_name || '').toLowerCase().includes('contract');
    }

    incrementDuration() {
        this.rentalDuration++;
    }

    decrementDuration() {
        if (this.rentalDuration > 1) {
            this.rentalDuration--;
        }
    }

    openVendorSelectionModal() {
        if (!this.product) return;
        this.showVendorModal = true;
        this.loadingVendors = true;
        this.serviceVendors = [];

        const subId = this.product.subcategory_id;
        this.productService.getVendors(subId || undefined).subscribe({
            next: (vendors) => {
                this.loadingVendors = false;
                this.serviceVendors = (vendors || []).map(v => ({
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
    }

    closeVendorModal() {
        this.showVendorModal = false;
        this.serviceVendors = [];
    }

    selectVendorAndProceed(vendor: any) {
        if (!this.product) return;

        const serviceBooking = {
            type: 'service',
            product_id: this.product.id,
            service_id: this.product.id,
            service_name: this.product.name,
            name: this.product.name,
            category_name: this.product.category_name,
            subcategory_id: this.product.subcategory_id,
            subcategory_name: this.product.subcategory_name,
            unit_name: this.product.unit_name || 'Service',
            price: Number(this.product.price || 0),
            total: Number(this.product.price || 0) * (this.quantity || 1),
            totalAmount: Number(this.product.price || 0) * (this.quantity || 1),
            quantity: this.quantity || 1,
            image: this.getProductImage(this.product),
            vendor: {
                id: vendor.id,
                name: vendor.name,
                image: vendor.image || ''
            },
            vendor_id: vendor.id,
            vendor_name: vendor.name,
            vendor_image: vendor.image || ''
        };

        localStorage.setItem('civilworks_pending_service_booking', JSON.stringify(serviceBooking));
        localStorage.setItem('civilworks_pending_booking', JSON.stringify(serviceBooking));

        this.closeVendorModal();
        this.router.navigate(['/payment'], { state: { serviceBooking } });
    }

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private productService: ProductService,
        private cartService: CartService,
        private toastController: ToastController,
        private location: Location
    ) { }

    ngOnInit() {
        this.route.paramMap.subscribe(params => {
            const productId = params.get('id');
            if (productId) {
                this.loadProduct(productId);
            }
        });

        this.cartCount = this.cartService.getCartCount();
        this.cartService.cart$.subscribe(() => {
            this.cartCount = this.cartService.getCartCount();
        });
    }

    loadProduct(id: string) {
        this.loading = true;
        this.productService.getProductById(id).subscribe({
            next: (product: any) => {
                this.product = product;
                const mainImg = this.getProductImage(product);
                this.activeImage = mainImg;
                this.galleryThumbnails = [mainImg];
                this.specsList = this.generateSpecs(product);
                this.featureBullets = this.generateFeatureBullets(product);
                this.loadRelatedProducts(product.category_id || product.category);
                this.loading = false;
            },
            error: (err: any) => {
                console.error('Error loading product', err);
                this.loading = false;
            }
        });
    }

    loadRelatedProducts(categoryId?: any) {
        this.productService.getProducts({ limit: 4 }).subscribe({
            next: (products: any[]) => {
                const list = Array.isArray(products) ? products : [];
                this.relatedProducts = list
                    .filter(p => String(p.id) !== String(this.product?.id))
                    .slice(0, 4);
            },
            error: () => {}
        });
    }

    selectImage(img: string) {
        this.activeImage = img;
    }

    setQuantity(qty: number) {
        if (qty >= 1) {
            this.quantity = qty;
        }
    }

    decreaseQuantity() {
        if (this.quantity > 1) {
            this.quantity--;
        }
    }

    increaseQuantity() {
        this.quantity++;
    }

    get unitPrice(): number {
        if (!this.product) return 0;
        return Number(this.product.price || 0);
    }

    get subtotal(): number {
        return this.unitPrice * this.quantity;
    }

    generateSpecs(product: any): { label: string; value: string }[] {
        if (!product) return [];
        const specs: { label: string; value: string }[] = [];

        if (product.name) {
            specs.push({ label: 'Product Name', value: product.name });
        }
        if (product.category_name || product.category) {
            specs.push({ label: 'Category', value: product.category_name || product.category });
        }
        if (product.subcategory_name || product.subcategory) {
            specs.push({ label: 'Subcategory', value: product.subcategory_name || product.subcategory });
        }
        if (product.main_category_name) {
            specs.push({ label: 'Sector / Industry', value: product.main_category_name });
        }
        if (product.unit_name) {
            specs.push({ label: 'Measurement Unit', value: product.unit_name });
        }
        if (product.measurement_type) {
            specs.push({ label: 'Measurement Type', value: product.measurement_type });
        }
        if (product.product_type || product.type) {
            specs.push({ label: 'Procurement Type', value: (product.product_type || product.type).toUpperCase() });
        }
        // Only show stock specification for selling products (never for rentals or services)
        if (!this.isRenting && !this.isService && product.stock !== undefined && product.stock !== null) {
            specs.push({ label: 'Available Stock', value: `${product.stock} ${product.unit_name || 'Units'}` });
        }
        if (product.status) {
            specs.push({ label: 'Status', value: product.status.toUpperCase() });
        }

        return specs;
    }

    generateFeatureBullets(product: any): string[] {
        if (!product || !product.description) return [];
        const points = product.description
            .split(/\r?\n|\.\s+/)
            .map((s: string) => s.trim())
            .filter((s: string) => s.length > 5);
        if (points.length > 0) return points;
        return [product.description];
    }

    checkPincode() {
        if (this.pincodeInput && this.pincodeInput.length === 6) {
            this.pincodeMessage = `Express delivery verified for ${this.pincodeInput} (Dispatch in 4-6 hours)`;
        } else {
            this.pincodeMessage = 'Please enter a valid 6-digit site pincode.';
        }
    }

    async addToCart() {
        if (this.product) {
            if (this.isService) {
                this.openVendorSelectionModal();
                return;
            }
            this.addingToCart = true;
            const duration = this.isRenting ? this.rentalDuration : 1;
            this.cartService.addToCart(+this.product.id, this.quantity, duration).subscribe({
                next: async () => {
                    this.addingToCart = false;
                    const durationStr = this.isRenting ? ` for ${duration} ${this.product.unit_name || 'periods'}` : '';
                    const toast = await this.toastController.create({
                        message: `${this.isRenting ? 'Rented' : 'Added'} ${this.quantity} × "${this.product!.name}"${durationStr} to cart!`,
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
                    this.addingToCart = false;
                    const toast = await this.toastController.create({
                        message: err.error?.message || `Could not add to cart.`,
                        duration: 2000,
                        position: 'top',
                        color: 'danger'
                    });
                    await toast.present();
                }
            });
        }
    }

    buyNow() {
        if (this.product) {
            if (this.isService) {
                this.openVendorSelectionModal();
                return;
            }
            if (this.isHelper) {
                const helperBooking = {
                    type: 'helper',
                    order_type: 'helper',
                    product_id: this.product.id,
                    name: this.product.name,
                    category_name: this.product.category_name,
                    subcategory_id: this.product.subcategory_id,
                    subcategory_name: this.product.subcategory_name,
                    unit_name: this.product.unit_name || 'Worker',
                    price: Number(this.product.price || 0),
                    quantity: this.quantity || 1,
                    total: Number(this.product.price || 0) * (this.quantity || 1),
                    totalAmount: Number(this.product.price || 0) * (this.quantity || 1),
                    skills: this.parsedSkills,
                    image: this.getProductImage(this.product),
                    product: this.product
                };
                localStorage.setItem('civilworks_pending_helper_booking', JSON.stringify(helperBooking));
                this.router.navigate(['/checkout'], { state: { helperBooking } });
                return;
            }
            const duration = this.isRenting ? this.rentalDuration : 1;
            this.cartService.addToCart(+this.product.id, this.quantity, duration).subscribe({
                next: () => {
                    this.router.navigate(['/cart']);
                },
                error: () => {
                    this.router.navigate(['/cart']);
                }
            });
        }
    }

    goBack() {
        if (window.history.length > 1) {
            this.location.back();
        } else {
            this.router.navigate(['/tabs/products']);
        }
    }

    viewProduct(id: any) {
        this.router.navigate(['/product-detail', id]);
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
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500"><rect width="100%" height="100%" fill="#0d1b2a"/><g fill="#ffffff" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"><circle cx="400" cy="220" r="56" fill="#f59e0b" opacity="0.95"/><path d="M386 220 L400 204 L414 220 M400 206 L400 236" stroke="#0d1b2a" stroke-width="5" stroke-linecap="round" fill="none"/><text x="400" y="315" font-size="24" font-weight="700" letter-spacing="0.5">${text}</text><text x="400" y="345" font-size="14" font-weight="500" opacity="0.6">Verified Site Catalog Item</text></g></svg>`;
        return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    }

    onImageError(event: any, product: any) {
        if (product?.subcategory_image && event.target.src !== product.subcategory_image) {
            event.target.src = this.formatImageUrl(product.subcategory_image);
        } else {
            event.target.src = this.getCleanPlaceholder(product?.name || 'Product');
        }
    }
}
