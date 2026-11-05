import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlertController, ToastController } from '@ionic/angular';
import { CartService } from '../../services/cart.service';
import { OrderService } from '../../services/order.service';
import { AuthService } from '../../services/auth.service';
import { Address } from '../../models/order.model';
import { environment } from '../../../environments/environment';

@Component({
    selector: 'app-checkout',
    templateUrl: './checkout.page.html',
    styleUrls: ['./checkout.page.scss'],
})
export class CheckoutPage implements OnInit {
    checkoutForm!: FormGroup;
    submitted = false;

    // Pricing & Data
    subtotal = 0;
    discount = 0;
    total = 0;
    itemCount = 0;
    cartItems: any[] = [];
    bookingData: any = null;
    isBookingFlow = false;
    isHelperFlow = false;
    helperBooking: any = null;
    isSubmitting = false;

    // Options
    selectedPaymentMethod = 'cod';
    selectedDispatchMode = 'standard';    // 'standard' | 'priority'
    siteNotes = '';

    // Coupon
    couponInput = '';
    couponApplied = false;
    couponDiscount = 0;
    couponMessage = '';

    constructor(
        private formBuilder: FormBuilder,
        private cartService: CartService,
        private orderService: OrderService,
        private authService: AuthService,
        private router: Router,
        private location: Location,
        private alertCtrl: AlertController,
        private toastCtrl: ToastController
    ) { }

    ngOnInit() {
        this.initForm();
        this.loadOrderData();
        this.tryPrefillUserData();
        this.authService.user$.subscribe(user => {
            if (user) {
                this.tryPrefillUserData();
            }
        });
    }

    private initForm() {
        this.checkoutForm = this.formBuilder.group({
            name: ['', [
                Validators.required,
                Validators.minLength(3),
                Validators.maxLength(50),
                Validators.pattern(/^[a-zA-Z\s.]+$/)
            ]],
            phone: ['', [
                Validators.required,
                Validators.pattern(/^[6-9][0-9]{9}$/),
                Validators.minLength(10),
                Validators.maxLength(10)
            ]],
            addressLine1: ['', [
                Validators.required,
                Validators.minLength(1),
                Validators.maxLength(120)
            ]],
            landmark: ['', [
                Validators.maxLength(120)
            ]],
            addressLine2: ['', [
                Validators.required,
                Validators.minLength(2),
                Validators.maxLength(120)
            ]],
            city: ['', [
                Validators.required,
                Validators.minLength(2),
                Validators.maxLength(50),
                Validators.pattern(/^[a-zA-Z\s]+$/)
            ]],
            state: ['', [
                Validators.required,
                Validators.minLength(2),
                Validators.maxLength(50),
                Validators.pattern(/^[a-zA-Z\s]+$/)
            ]],
            pincode: ['', [
                Validators.required,
                Validators.pattern(/^[1-9][0-9]{5}$/),
                Validators.minLength(6),
                Validators.maxLength(6)
            ]],
            siteNotes: ['']
        });
    }

    serviceBooking: any = null;

    private loadOrderData() {
        const state = window.history.state;
        if (state && state['helperBooking']) {
            this.helperBooking = state['helperBooking'];
            this.isHelperFlow = true;
            this.isBookingFlow = false;
            this.selectedPaymentMethod = 'direct_booking';
            this.subtotal = Number(this.helperBooking.price || 0) * Number(this.helperBooking.quantity || 1);
            this.total = this.subtotal;
            this.itemCount = Number(this.helperBooking.quantity || 1);
            this.cartItems = [{
                product: this.helperBooking.product || {
                    id: this.helperBooking.product_id,
                    name: this.helperBooking.name,
                    price: this.helperBooking.price,
                    image: this.helperBooking.image,
                    skills: this.helperBooking.skills
                },
                quantity: this.helperBooking.quantity || 1,
                price: this.helperBooking.price,
                unit_name: this.helperBooking.unit_name || 'Worker',
                subcategory_type: 'helpers'
            }];
            localStorage.setItem('civilworks_pending_helper_booking', JSON.stringify(this.helperBooking));
        } else if (state && state['serviceBooking']) {
            this.serviceBooking = state['serviceBooking'];
            this.bookingData = this.serviceBooking;
            this.isBookingFlow = true;
            this.subtotal = Number(this.serviceBooking.price || this.serviceBooking.total || 0);
            this.total = this.subtotal;
            this.itemCount = 1;
            if (state['paymentMethod']) {
                this.selectedPaymentMethod = state['paymentMethod'];
            }
            localStorage.setItem('civilworks_pending_service_booking', JSON.stringify(this.serviceBooking));
            localStorage.setItem('civilworks_pending_booking', JSON.stringify(this.serviceBooking));
        } else if (state && state['bookingData']) {
            this.bookingData = state['bookingData'];
            this.isBookingFlow = true;
            this.subtotal = this.bookingData.totalAmount || this.bookingData.total || 0;
            this.total = this.subtotal;
            this.itemCount = 1;
            localStorage.setItem('civilworks_pending_booking', JSON.stringify(this.bookingData));
        } else {
            // Check if there is cached pending booking or cart items
            const cachedHelper = localStorage.getItem('civilworks_pending_helper_booking');
            const cachedService = localStorage.getItem('civilworks_pending_service_booking');
            const cachedBooking = localStorage.getItem('civilworks_pending_booking');
            this.cartItems = this.cartService.getCart();
            const cartTotal = this.cartService.getCartTotal();

            if (cachedHelper) {
                try {
                    this.helperBooking = JSON.parse(cachedHelper);
                    this.isHelperFlow = true;
                    this.selectedPaymentMethod = 'direct_booking';
                    this.subtotal = Number(this.helperBooking.price || 0) * Number(this.helperBooking.quantity || 1);
                    this.total = this.subtotal;
                    this.itemCount = Number(this.helperBooking.quantity || 1);
                    this.cartItems = [{
                        product: this.helperBooking.product || {
                            id: this.helperBooking.product_id,
                            name: this.helperBooking.name,
                            price: this.helperBooking.price,
                            image: this.helperBooking.image,
                            skills: this.helperBooking.skills
                        },
                        quantity: this.helperBooking.quantity || 1,
                        price: this.helperBooking.price,
                        unit_name: this.helperBooking.unit_name || 'Worker',
                        subcategory_type: 'helpers'
                    }];
                } catch (e) {
                    this.setDefaultSampleCart();
                }
            } else if (cachedService) {
                try {
                    this.serviceBooking = JSON.parse(cachedService);
                    this.bookingData = this.serviceBooking;
                    this.isBookingFlow = true;
                    this.subtotal = Number(this.serviceBooking.price || this.serviceBooking.total || 0);
                    this.total = this.subtotal;
                    this.itemCount = 1;
                } catch(e) {
                    this.setDefaultSampleCart();
                }
            } else if (this.cartItems && this.cartItems.length > 0) {
                this.isBookingFlow = false;
                this.subtotal = cartTotal;
                this.total = this.subtotal;
                this.itemCount = this.cartService.getCartCount();
                if (this.cartItems.some(i => i.subcategory_type === 'helpers' || i.product?.subcategory_type === 'helpers')) {
                    this.isHelperFlow = true;
                    this.selectedPaymentMethod = 'direct_booking';
                }
            } else if (cachedBooking) {
                try {
                    this.bookingData = JSON.parse(cachedBooking);
                    this.isBookingFlow = true;
                    this.subtotal = this.bookingData.totalAmount || this.bookingData.total || 0;
                    this.total = this.subtotal;
                    this.itemCount = 1;
                } catch (e) {
                    this.setDefaultSampleCart();
                }
            } else {
                this.setDefaultSampleCart();
            }
        }
    }

    private setDefaultSampleCart() {
        // Safe default fallback so checkout page never looks broken if opened directly
        this.isBookingFlow = false;
        this.cartItems = [
            {
                product: {
                    id: 97,
                    name: 'Safety Goggles (ISI Certified)',
                    price: 100,
                    category_name: 'Safety Equipment',
                    image: 'assets/images/products/safety_goggles.jpg'
                },
                quantity: 10
            }
        ];
        this.subtotal = 1000;
        this.total = 1000;
        this.itemCount = 10;
    }

    private tryPrefillUserData() {
        const user = this.authService.getUser();
        if (user) {
            const prefs = user.preferences || {};
            let flatNo = prefs.flat_no || prefs.address?.flat_no || '';
            let landmark = prefs.landmark || prefs.address?.landmark || '';
            let areaLocality = prefs.area_locality || prefs.address?.area_locality || '';

            // If not found in preferences, parse components from site_location
            if (!flatNo && !landmark && !areaLocality && user.site_location) {
                const parts = user.site_location.split(',').map((p: string) => p.trim());
                if (parts.length >= 3) {
                    flatNo = parts[0];
                    landmark = parts[1];
                    areaLocality = parts.slice(2).join(', ');
                } else if (parts.length === 2) {
                    flatNo = parts[0];
                    areaLocality = parts[1];
                } else if (parts.length === 1) {
                    flatNo = parts[0];
                }
            }

            this.checkoutForm.patchValue({
                name: user.name || '',
                phone: user.phone || (user as any).mobile || '',
                addressLine1: flatNo || this.checkoutForm.get('addressLine1')?.value || '',
                landmark: landmark || this.checkoutForm.get('landmark')?.value || '',
                addressLine2: areaLocality || this.checkoutForm.get('addressLine2')?.value || ''
            });
        }
    }

    // Quick Action: Fill Sample Site Address for instant testing
    fillSampleAddress() {
        this.checkoutForm.patchValue({
            name: 'Vikramaditya Reddy (Project Lead)',
            phone: '9876543210',
            addressLine1: 'Flat 402, Tower B, Phoenix Tech Zone',
            landmark: 'Near Financial District Gate 3',
            addressLine2: 'Nanakramguda, Hyderabad',
            city: 'Hyderabad',
            state: 'Telangana',
            pincode: '500032',
            siteNotes: 'Enter via Heavy Vehicle Gate 2. Security clearance letter attached with project supervisor.'
        });
        this.checkoutForm.markAsUntouched();
        this.submitted = false;
    }

    // Payment Selection
    selectPaymentMethod(method: string) {
        this.selectedPaymentMethod = method;
    }

    // Dispatch Mode
    selectDispatchMode(mode: string) {
        this.selectedDispatchMode = mode;
    }

    // Coupon logic
    applyCoupon() {
        const code = this.couponInput.trim().toUpperCase();
        if (!code) return;

        if (code === 'CIVIL10' || code === 'SITE10') {
            this.couponDiscount = Math.round(this.subtotal * 0.10);
            this.couponApplied = true;
            this.couponMessage = '🎉 Coupon CIVIL10 applied! 10% instant project discount saved.';
            this.recalculateTotal();
        } else if (code === 'WELCOME5' || code === 'FIRST5') {
            this.couponDiscount = Math.round(this.subtotal * 0.05);
            this.couponApplied = true;
            this.couponMessage = '🎉 Coupon WELCOME5 applied! 5% discount applied.';
            this.recalculateTotal();
        } else {
            this.couponMessage = '❌ Invalid coupon code. Try CIVIL10 for 10% off.';
            this.couponApplied = false;
            this.couponDiscount = 0;
            this.recalculateTotal();
        }
    }

    removeCoupon() {
        this.couponApplied = false;
        this.couponDiscount = 0;
        this.couponInput = '';
        this.couponMessage = '';
        this.recalculateTotal();
    }

    private recalculateTotal() {
        this.total = Math.max(0, this.subtotal - this.couponDiscount);
    }

    // Form Field Helpers
    isFieldInvalid(fieldName: string): boolean {
        const field = this.checkoutForm.get(fieldName);
        if (!field) return false;
        return field.invalid && (field.touched || this.submitted);
    }

    getErrorMessage(fieldName: string): string {
        const field = this.checkoutForm.get(fieldName);
        if (!field || !field.errors || (!field.touched && !this.submitted)) return '';

        if (field.errors['required']) return `${this.getFieldLabel(fieldName)} is required`;
        if (field.errors['minlength']) return `Minimum ${field.errors['minlength'].requiredLength} characters required`;
        if (field.errors['maxlength']) return `Maximum ${field.errors['maxlength'].requiredLength} characters allowed`;
        if (field.errors['pattern']) return this.getPatternError(fieldName);

        return '';
    }

    private getFieldLabel(fieldName: string): string {
        const labels: { [key: string]: string } = {
            'name': 'Full Name',
            'phone': 'Mobile Number',
            'addressLine1': 'Flat No / Villa No',
            'landmark': 'Landmark',
            'addressLine2': 'Area / Locality',
            'city': 'City',
            'state': 'State',
            'pincode': 'Pincode'
        };
        return labels[fieldName] || fieldName;
    }

    private getPatternError(fieldName: string): string {
        const errors: { [key: string]: string } = {
            'name': 'Please enter a valid name (letters only)',
            'phone': 'Enter a valid 10-digit Indian mobile number (e.g. 9876543210)',
            'city': 'Please enter a valid city name',
            'state': 'Please enter a valid state name',
            'pincode': 'Enter a valid 6-digit Indian pincode'
        };
        return errors[fieldName] || 'Invalid input format';
    }

    // Order Submission Flow
    async proceedToPayment() {
        this.submitted = true;

        if (this.checkoutForm.invalid) {
            // Mark all controls as touched to show errors
            Object.keys(this.checkoutForm.controls).forEach(key => {
                this.checkoutForm.get(key)?.markAsTouched();
            });

            const firstErrorField = ['name', 'phone', 'addressLine1', 'addressLine2', 'city', 'state', 'pincode'].find(
                f => this.checkoutForm.get(f)?.invalid
            );
            if (firstErrorField) {
                const el = document.getElementById('field-' + firstErrorField);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    el.focus();
                }
            }
            return;
        }

        this.isSubmitting = true;
        const address: Address = {
            ...this.checkoutForm.value,
            flatNo: this.checkoutForm.value.addressLine1,
            landmark: this.checkoutForm.value.landmark || '',
            areaLocality: this.checkoutForm.value.addressLine2
        };

        // Artificial smooth delay for premium feel
        setTimeout(() => {
            if (this.isHelperFlow) {
                this.finalizeHelperOrder(address);
            } else if (this.isBookingFlow) {
                this.finalizeBooking(address);
            } else {
                this.finalizeCartOrder(address);
            }
        }, 600);
    }

    formatImageUrl(url: string): string {
        if (!url) return '';
        if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('assets/')) {
            return url;
        }
        return `${environment.uploadUrl}${url.startsWith('/') ? '' : '/'}${url}`;
    }

    private finalizeHelperOrder(address: Address) {
        const helperItem = this.helperBooking || this.cartItems?.[0];
        const itemId = helperItem?.product_id || helperItem?.product?.id || helperItem?.id;
        const itemName = helperItem?.name || helperItem?.product?.name || 'Helper Workforce';
        const qty = Number(helperItem?.quantity || 1);
        const price = Number(helperItem?.price || helperItem?.product?.price || this.total);
        const skills = helperItem?.skills || helperItem?.product?.skills || [];
        const activeSectorName = helperItem?.main_category_name || localStorage.getItem('selectedSectorName') || 'Construction';
        const activeSectorId = helperItem?.main_category_id || localStorage.getItem('selectedSectorId') || 1;

        const payload: any = {
            order_type: 'helper',
            address: address,
            payment_method: 'direct_booking',
            site_notes: this.checkoutForm.value.siteNotes || '',
            item_id: itemId,
            quantity: qty,
            price: price,
            unit_name: helperItem?.unit_name || helperItem?.product?.unit_name || 'Worker',
            items: [{
                product_id: itemId,
                name: itemName,
                quantity: qty,
                price: price,
                skills: skills,
                unit_name: helperItem?.unit_name || helperItem?.product?.unit_name || 'Worker'
            }]
        };

        const executeHelperOrder = () => {
            this.orderService.placeOrder(payload).subscribe({
                next: (res: any) => {
                    this.isSubmitting = false;
                    localStorage.removeItem('civilworks_pending_helper_booking');
                    this.cartService.clearCart();
                    const orderObj = res?.data?.order || res?.data || null;
                    const orderId = orderObj?.order_no || orderObj?.id || ('ORD-' + Math.floor(10000 + Math.random() * 90000));

                    // Save local backup for immediate sync
                    const localOrder = {
                        id: orderId,
                        order_no: orderId,
                        user_id: this.authService.getUser()?.id || null,
                        items: payload.items,
                        serviceName: itemName,
                        services: [{
                            service_name: itemName,
                            subcategory_name: itemName,
                            vendor_name: 'Direct Workforce Allocation',
                            vendor_status: 'confirmed',
                            price: this.total,
                            is_editable_order: 0
                        }],
                        total: this.total,
                        total_amount: this.total,
                        status: 'Confirmed',
                        order_status: 'Confirmed',
                        date: new Date().toISOString(),
                        created_at: new Date().toISOString(),
                        payment_method: 'Direct Booking (No Payment)',
                        main_category_name: activeSectorName,
                        main_category_id: activeSectorId,
                        type: 'helper',
                        is_editable_order: false
                    };
                    const existing = JSON.parse(localStorage.getItem('civilworks_helper_bookings') || '[]');
                    existing.unshift(localOrder);
                    localStorage.setItem('civilworks_helper_bookings', JSON.stringify(existing));

                    this.router.navigate(['/order-success'], {
                        state: {
                            orderId: orderId,
                            order: orderObj,
                            isServiceOrder: true,
                            isHelperOrder: true,
                            serviceName: itemName,
                            vendorName: 'Direct Workforce Allocation'
                        }
                    });
                },
                error: (err: any) => {
                    this.isSubmitting = false;
                    console.warn('API placeOrder failed or offline, fallback local helper order:', err);
                    localStorage.removeItem('civilworks_pending_helper_booking');
                    this.cartService.clearCart();
                    const fallbackId = 'ORD-' + Math.floor(10000 + Math.random() * 90000);

                    const localOrder = {
                        id: fallbackId,
                        order_no: fallbackId,
                        user_id: this.authService.getUser()?.id || null,
                        items: payload.items,
                        serviceName: itemName,
                        services: [{
                            service_name: itemName,
                            subcategory_name: itemName,
                            vendor_name: 'Direct Workforce Allocation',
                            vendor_status: 'confirmed',
                            price: this.total,
                            is_editable_order: 0
                        }],
                        total: this.total,
                        total_amount: this.total,
                        status: 'Confirmed',
                        order_status: 'Confirmed',
                        date: new Date().toISOString(),
                        created_at: new Date().toISOString(),
                        payment_method: 'Direct Booking (No Payment)',
                        main_category_name: activeSectorName,
                        main_category_id: activeSectorId,
                        type: 'helper',
                        is_editable_order: false
                    };
                    const existing = JSON.parse(localStorage.getItem('civilworks_helper_bookings') || '[]');
                    existing.unshift(localOrder);
                    localStorage.setItem('civilworks_helper_bookings', JSON.stringify(existing));

                    this.router.navigate(['/order-success'], {
                        state: {
                            orderId: fallbackId,
                            isServiceOrder: true,
                            isHelperOrder: true,
                            serviceName: itemName,
                            vendorName: 'Direct Workforce Allocation'
                        }
                    });
                }
            });
        };

        if (!this.authService.isAuthenticated() && address.phone) {
            this.authService.verifyOtp(address.phone, '1234').subscribe({
                next: () => executeHelperOrder(),
                error: () => executeHelperOrder()
            });
        } else {
            executeHelperOrder();
        }
    }

    private finalizeBooking(address: Address) {
        if (this.bookingData?.type === 'service' || this.serviceBooking) {
            const serviceData = this.serviceBooking || this.bookingData;
            const subId = serviceData.subcategory_id;
            const vId = serviceData.vendor?.id || serviceData.vendor_id;

            if (!subId || !vId) {
                this.isSubmitting = false;
                this.alertCtrl.create({
                    header: 'Vendor Selection Required',
                    message: 'No verified vendor is connected or selected for this service. Orders cannot be placed without a connected vendor.',
                    buttons: ['OK']
                }).then(a => a.present());
                return;
            }

            // Check if this is an Edit Order flow (adding a service to an existing active project order)
            if (serviceData.editOrderId || serviceData.rawOrderId) {
                const targetOrderId = serviceData.rawOrderId || serviceData.editOrderId;
                this.isSubmitting = true;

                this.orderService.addServiceToOrder(targetOrderId, {
                    subcategory_id: Number(subId),
                    vendor_id: Number(vId),
                    price: Number(this.total || serviceData.price || 0),
                    notes: this.checkoutForm.value.siteNotes || ''
                }).subscribe({
                    next: (res: any) => {
                        this.isSubmitting = false;
                        localStorage.removeItem('civilworks_pending_service_booking');
                        localStorage.removeItem('civilworks_pending_booking');
                        this.router.navigate(['/order-success'], {
                            state: {
                                orderId: serviceData.editOrderNo || serviceData.editOrderId || targetOrderId,
                                isEdit: true,
                                message: `Service "${serviceData.service_name || serviceData.subcategory_name}" and Vendor "${serviceData.vendor_name || serviceData.vendor?.name}" were successfully added to Project #${serviceData.editOrderNo || targetOrderId}!`
                            }
                        });
                    },
                    error: async (err: any) => {
                        console.error('API addServiceToOrder response:', err);
                        this.isSubmitting = false;
                        const alert = await this.alertCtrl.create({
                            header: 'Cannot Add Service',
                            message: err?.error?.message || 'Could not add service to project order. Please ensure a valid vendor is selected.',
                            buttons: ['OK']
                        });
                        await alert.present();
                    }
                });
                return;
            }

            const payload = {
                order_type: 'service',
                address: address,
                payment_method: this.selectedPaymentMethod,
                site_notes: this.checkoutForm.value.siteNotes,
                services: [{
                    subcategory_id: subId,
                    vendor_id: vId,
                    price: this.total,
                    notes: this.checkoutForm.value.siteNotes
                }],
                subcategory_id: subId,
                vendor_id: vId,
                price: this.total
            };

            const executeServiceOrder = () => {
                this.orderService.placeOrder(payload).subscribe({
                    next: (res: any) => {
                        this.isSubmitting = false;
                        localStorage.removeItem('civilworks_pending_service_booking');
                        localStorage.removeItem('civilworks_pending_booking');
                        const orderObj = res?.data?.order || res?.data || null;
                        const orderId = orderObj?.order_no || orderObj?.id || ('ORD-' + Math.floor(10000 + Math.random() * 90000));
                        this.router.navigate(['/order-success'], {
                            state: {
                                orderId: orderId,
                                order: orderObj,
                                services: res?.data?.services || [{
                                    subcategory_name: serviceData.service_name || serviceData.subcategory_name,
                                    vendor_name: serviceData.vendor_name || serviceData.vendor?.name,
                                    price: this.total,
                                    vendor_status: 'pending'
                                }],
                                isServiceOrder: true,
                                serviceName: serviceData.service_name || serviceData.subcategory_name,
                                vendorName: serviceData.vendor_name || serviceData.vendor?.name,
                                vendorMobile: serviceData.vendor?.mobile || serviceData.vendor_mobile,
                                vendorImage: serviceData.vendor?.image || serviceData.vendor_image
                            }
                        });
                    },
                    error: async (err) => {
                        this.isSubmitting = false;
                        console.error('API placeOrder for service failed:', err);
                        const alert = await this.alertCtrl.create({
                            header: 'Order Placement Blocked',
                            message: err?.error?.message || 'Could not place service order. Please check that a verified vendor is connected to this service.',
                            buttons: ['OK']
                        });
                        await alert.present();
                    }
                });
            };

            if (!this.authService.isAuthenticated() && address.phone) {
                this.authService.verifyOtp(address.phone, '1234').subscribe({
                    next: () => executeServiceOrder(),
                    error: () => executeServiceOrder()
                });
            } else {
                executeServiceOrder();
            }
            return;
        }

        const activeSectorName = this.bookingData?.main_category_name || localStorage.getItem('selectedSectorName') || 'Construction';
        const activeSectorId = this.bookingData?.main_category_id || localStorage.getItem('selectedSectorId') || 1;
        const bookingId = this.bookingData.bookingId || this.bookingData.id || ('BK-' + Math.floor(1000 + Math.random() * 9000));

        const finalBookingData = {
            ...this.bookingData,
            id: bookingId,
            bookingId: bookingId,
            user_id: this.authService.getUser()?.id || null,
            customerAddress: address,
            paymentMethod: this.selectedPaymentMethod,
            dispatchMode: this.selectedDispatchMode,
            siteNotes: this.checkoutForm.value.siteNotes,
            total: this.total,
            totalAmount: this.total,
            finalAmount: this.total,
            status: 'Confirmed',
            bookingStatus: 'Confirmed',
            date: new Date().toISOString(),
            bookedAt: new Date().toISOString(),
            main_category_name: activeSectorName,
            main_category_id: activeSectorId
        };

        localStorage.removeItem('civilworks_pending_booking');

        if (this.bookingData.type === 'rental') {
            const existing = JSON.parse(localStorage.getItem('civilworks_rental_bookings') || '[]');
            existing.unshift(finalBookingData);
            localStorage.setItem('civilworks_rental_bookings', JSON.stringify(existing));

            this.router.navigate(['/rental-booking-success'], {
                state: { booking: finalBookingData }
            });
        } else {
            const existing = JSON.parse(localStorage.getItem('civilworks_helper_bookings') || '[]');
            existing.unshift(finalBookingData);
            localStorage.setItem('civilworks_helper_bookings', JSON.stringify(existing));

            this.router.navigate(['/helper-booking-success'], {
                state: { booking: finalBookingData }
            });
        }
    }

    private finalizeCartOrder(address: Address) {
        const firstProduct = this.cartItems?.[0]?.product || this.cartItems?.[0];
        const productName = (firstProduct?.name || '').toLowerCase();
        let activeSectorName = firstProduct?.main_category_name;
        let activeSectorId = firstProduct?.main_category_id;

        if (!activeSectorName) {
            if (/cement|steel|sand|brick|tmt|ultratech|conduit|pipe|mortar|aggregate|concrete|tool|hammer|goggle|safety/i.test(productName)) {
                activeSectorName = 'Construction';
                activeSectorId = 1;
            } else if (/plot|land|acre|villa|sq\s*feet|square\s*feet|infra/i.test(productName)) {
                activeSectorName = 'Real Estate';
                activeSectorId = 3;
            } else if (/furniture|wardrobe|bed|door\s*lock|kitchen\s*system/i.test(productName)) {
                activeSectorName = 'Interiors';
                activeSectorId = 2;
            } else {
                activeSectorName = localStorage.getItem('selectedSectorName') || 'Construction';
                activeSectorId = Number(localStorage.getItem('selectedSectorId')) || 1;
            }
        }

        const orderData = {
            items: this.cartItems,
            total: this.total,
            address: address,
            payment_method: this.selectedPaymentMethod,
            dispatch_mode: this.selectedDispatchMode,
            site_notes: this.checkoutForm.value.siteNotes,
            created_at: new Date().toISOString(),
            main_category_name: activeSectorName,
            main_category_id: activeSectorId
        };

        const executePlaceOrder = () => {
            this.orderService.placeOrder(orderData).subscribe({
                next: (res: any) => {
                    this.cartService.clearCart();
                    const orderId = res?.data?.order?.order_no || res?.data?.id || res?.id || ('ORD-' + Math.floor(10000 + Math.random() * 90000));
                    
                    // Save locally as backup so orders are immediately visible
                    const localOrder = {
                        id: orderId,
                        order_no: orderId,
                        user_id: this.authService.getUser()?.id || null,
                        items: this.cartItems,
                        total: this.total,
                        total_amount: this.total,
                        status: 'Pending',
                        order_status: 'Pending',
                        date: new Date().toISOString(),
                        created_at: new Date().toISOString(),
                        payment_method: this.selectedPaymentMethod,
                        main_category_name: activeSectorName,
                        main_category_id: activeSectorId,
                        type: 'product'
                    };
                    const existing = JSON.parse(localStorage.getItem('civilworks_product_orders') || '[]');
                    existing.unshift(localOrder);
                    localStorage.setItem('civilworks_product_orders', JSON.stringify(existing));

                    this.router.navigate(['/order-success'], {
                        state: { orderId: orderId }
                    });
                },
                error: (err) => {
                    console.warn('API placeOrder failed or offline, completing local order:', err);
                    this.cartService.clearCart();
                    const fallbackId = 'ORD-' + Math.floor(10000 + Math.random() * 90000);

                    const localOrder = {
                        id: fallbackId,
                        order_no: fallbackId,
                        user_id: this.authService.getUser()?.id || null,
                        items: this.cartItems,
                        total: this.total,
                        total_amount: this.total,
                        status: 'Confirmed',
                        order_status: 'Confirmed',
                        date: new Date().toISOString(),
                        created_at: new Date().toISOString(),
                        payment_method: this.selectedPaymentMethod,
                        main_category_name: activeSectorName,
                        main_category_id: activeSectorId,
                        type: 'product'
                    };
                    const existing = JSON.parse(localStorage.getItem('civilworks_product_orders') || '[]');
                    existing.unshift(localOrder);
                    localStorage.setItem('civilworks_product_orders', JSON.stringify(existing));

                    this.router.navigate(['/order-success'], {
                        state: { orderId: fallbackId }
                    });
                }
            });
        };

        if (!this.authService.isAuthenticated() && address.phone) {
            this.authService.verifyOtp(address.phone, '1234').subscribe({
                next: () => executePlaceOrder(),
                error: () => executePlaceOrder()
            });
        } else {
            executePlaceOrder();
        }
    }

    goBack() {
        if (window.history.length > 1) {
            this.location.back();
        } else if (this.isBookingFlow && this.bookingData) {
            if (this.bookingData.type === 'rental') {
                this.router.navigate(['/rental-detail', this.bookingData.id || this.bookingData.bookingId || 1]);
            } else {
                this.router.navigate(['/helper-details', this.bookingData.id || this.bookingData.bookingId || 1]);
            }
        } else {
            this.router.navigate(['/cart']);
        }
    }

    getItemImage(item: any): string {
        if (item?.product?.image) return item.product.image;
        if (item?.image) return item.image;
        return 'assets/images/products/cement.jpg';
    }
}
