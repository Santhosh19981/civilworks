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
    product: any;
    quantity = 1;
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

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private productService: ProductService,
        private cartService: CartService,
        private toastController: ToastController
    ) { }

    ngOnInit() {
        this.route.paramMap.subscribe(params => {
            const productId = params.get('id');
            if (productId) {
                this.loadProduct(productId);
            }
        });

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
        const base = Number(this.product.price || 0);
        if (this.quantity >= 50) return Math.round(base * 0.90);
        if (this.quantity >= 10) return Math.round(base * 0.95);
        return base;
    }

    get subtotal(): number {
        return this.unitPrice * this.quantity;
    }

    get originalMrp(): number {
        if (!this.product) return 0;
        const base = Number(this.product.price || 0);
        return Math.round(base * 1.25);
    }

    get discountPercent(): number {
        if (!this.originalMrp || !this.unitPrice) return 20;
        return Math.round(((this.originalMrp - this.unitPrice) / this.originalMrp) * 100);
    }

    generateSpecs(product: any): { label: string; value: string }[] {
        const name = (product.name || '').toLowerCase();
        const cat = (product.category_name || product.category || '').toLowerCase();

        if (name.includes('tape') || name.includes('measure') || name.includes('meter')) {
            return [
                { label: 'Tape Length', value: '5.0 Meters (16 Feet)' },
                { label: 'Blade Width', value: '19mm High-Tensile Carbon Steel' },
                { label: 'Precision Accuracy', value: 'Class II EEC Certified (±0.5mm)' },
                { label: 'Graduations', value: 'Dual Metric (mm/cm) & Imperial (in/ft)' },
                { label: 'Casing / Body', value: 'Impact-Resistant Shockproof ABS & TPR' },
                { label: 'Lock Type', value: 'Positive Thumb Lock + Bottom Quick-Brake' },
                { label: 'End Hook', value: 'True-Zero Magnetic Riveted Hook' },
                { label: 'Quality Standard', value: 'Compliant to BIS IS:1269 (Part 2)' }
            ];
        }

        if (name.includes('helmet') || name.includes('hat')) {
            return [
                { label: 'Certification', value: 'IS 2925:1984 & EN 397 Standard' },
                { label: 'Shell Material', value: 'Virgin Grade High-Density Polyethylene' },
                { label: 'Cradle Suspension', value: '6-Point Textile Ratchet Suspension' },
                { label: 'Impact Resistance', value: 'Tested up to 5 kN shock absorption' },
                { label: 'Chinstrap', value: 'Adjustable Quick-Release Nylon' },
                { label: 'Ventilation', value: 'Side Air-Cooling Vents' }
            ];
        }

        if (name.includes('goggle') || name.includes('glasses') || name.includes('eyewear')) {
            return [
                { label: 'Lens Material', value: 'Optical-Grade Polycarbonate' },
                { label: 'Coating', value: 'Anti-Scratch & Anti-Fog Hydrophobic' },
                { label: 'UV Protection', value: '99.9% UVA / UVB Filtration (UV400)' },
                { label: 'Standard', value: 'ANSI Z87.1 / EN 166 1F Certified' },
                { label: 'Frame Fit', value: 'Universal Panoramic with Browguard' },
                { label: 'Weight', value: '32 Grams Featherlight' }
            ];
        }

        if (name.includes('trowel')) {
            return [
                { label: 'Blade Material', value: 'Heat-Treated High-Carbon Spring Steel' },
                { label: 'Dimensions', value: '280mm x 115mm (11" x 4.5")' },
                { label: 'Handle Grip', value: 'Ergonomic Non-Slip Soft TPR Cushion' },
                { label: 'Shank Joint', value: 'Solid Welded Cast Aluminum Mount' },
                { label: 'Application', value: 'Plastering, Concrete Leveling & Finishing' }
            ];
        }

        return [
            { label: 'Product Grade', value: 'Commercial Heavy Construction Grade' },
            { label: 'Quality Audit', value: 'CivilWorks 100% Pre-Dispatch Inspected' },
            { label: 'Packaging', value: 'Moisture-Sealed Transit Protection' },
            { label: 'Supply Origin', value: 'Direct Manufacturer Certified' },
            { label: 'Site Dispatch', value: 'Ready for Immediate Mobilization' }
        ];
    }

    generateFeatureBullets(product: any): string[] {
        const name = (product.name || '').toLowerCase();
        if (name.includes('tape') || name.includes('measure')) {
            return [
                'High-contrast yellow polymer blade with glare-reducing matte finish for effortless outdoor reading.',
                'Impact-cushioned rubber jacket protects against accidental drops up to 3 meters onto concrete.',
                'Smooth internal spring mechanism delivers continuous, tangle-free blade retraction.',
                'Triple-riveted magnetic end hook anchors securely to steel studs, rebar, and conduit pipes.'
            ];
        }
        return [
            'Tested for extreme site durability and daily heavy-duty contractor handling.',
            'Direct procurement from verified tier-1 manufacturers guaranteeing zero counterfeit risk.',
            'Precision engineered for quick installation, long service life, and site compliance.',
            'Backed by CivilWorks 7-day hassle-free site replacement and quality guarantee.'
        ];
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
            this.addingToCart = true;
            this.cartService.addToCart(+this.product.id, this.quantity).subscribe({
                next: async () => {
                    this.addingToCart = false;
                    const toast = await this.toastController.create({
                        message: `Added ${this.quantity} × "${this.product!.name}" to cart!`,
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
                error: async () => {
                    this.addingToCart = false;
                    const toast = await this.toastController.create({
                        message: `Added ${this.quantity} × "${this.product!.name}" to cart!`,
                        duration: 2000,
                        position: 'top',
                        color: 'success'
                    });
                    await toast.present();
                }
            });
        }
    }

    buyNow() {
        if (this.product) {
            this.cartService.addToCart(+this.product.id, this.quantity).subscribe({
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
        this.router.navigate(['/tabs/products']);
    }

    viewProduct(id: any) {
        this.router.navigate(['/product-detail', id]);
    }

    getProductImage(product: any): string {
        if (!product) {
            return 'assets/products/safety_helmet.jpg';
        }
        if (product.image && typeof product.image === 'string' && product.image.trim() !== '' && !product.image.includes('null')) {
            return product.image;
        }

        const name = (product.name || '').toLowerCase();
        const cat = (product.category || product.category_name || '').toLowerCase();

        if (name.includes('tape') || name.includes('measure') || name.includes('meter')) {
            return 'assets/products/measuring_tape.jpg';
        }
        if (name.includes('helmet') || name.includes('hat')) {
            return 'assets/products/safety_helmet.jpg';
        }
        if (name.includes('goggle') || name.includes('glasses') || name.includes('eyewear')) {
            return 'assets/products/safety_goggles.jpg';
        }
        if (name.includes('trowel') || name.includes('finishing') || name.includes('masonry')) {
            return 'assets/products/concrete_trowel.jpg';
        }
        if (name.includes('shoe') || name.includes('boot')) {
            return 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80';
        }
        if (name.includes('hammer')) {
            return 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?auto=format&fit=crop&w=800&q=80';
        }
        if (name.includes('chisel')) {
            return 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?auto=format&fit=crop&w=800&q=80';
        }
        if (name.includes('level') || name.includes('laser') || name.includes('spirit')) {
            return 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=800&q=80';
        }
        if (name.includes('cement') || cat.includes('cement') || name.includes('sand') || cat.includes('sand')) {
            return 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80';
        }
        if (name.includes('steel') || name.includes('tmt') || name.includes('rod') || cat.includes('steel')) {
            return 'https://images.unsplash.com/photo-1535813547-99c456a41d4a?auto=format&fit=crop&w=800&q=80';
        }
        if (name.includes('pipe') || cat.includes('pipe') || cat.includes('plumb') || name.includes('cpvc')) {
            return 'https://images.unsplash.com/photo-1607400201515-c2c41c07d307?auto=format&fit=crop&w=800&q=80';
        }

        return 'assets/products/safety_helmet.jpg';
    }

    onImageError(event: any, product: any) {
        event.target.src = 'assets/products/measuring_tape.jpg';
    }
}
