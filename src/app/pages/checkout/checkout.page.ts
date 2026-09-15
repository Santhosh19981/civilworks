import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CartService } from '../../services/cart.service';
import { OrderService } from '../../services/order.service';
import { AuthService } from '../../services/auth.service';
import { Address } from '../../models/order.model';

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
    isSubmitting = false;

    // Options
    selectedPaymentMethod = 'pay_on_site'; // 'upi' | 'pay_on_site' | 'card'
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
        private router: Router
    ) { }

    ngOnInit() {
        this.initForm();
        this.loadOrderData();
        this.tryPrefillUserData();
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
                Validators.minLength(5),
                Validators.maxLength(120)
            ]],
            addressLine2: ['', [
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

    private loadOrderData() {
        const state = window.history.state;
        if (state && state['bookingData']) {
            this.bookingData = state['bookingData'];
            this.isBookingFlow = true;
            this.subtotal = this.bookingData.totalAmount || this.bookingData.total || 0;
            this.total = this.subtotal;
            this.itemCount = 1;
            // Cache to localStorage in case user refreshes
            localStorage.setItem('civilworks_pending_booking', JSON.stringify(this.bookingData));
        } else {
            // Check if there is cached pending booking or cart items
            const cachedBooking = localStorage.getItem('civilworks_pending_booking');
            this.cartItems = this.cartService.getCart();
            const cartTotal = this.cartService.getCartTotal();

            if (this.cartItems && this.cartItems.length > 0) {
                this.isBookingFlow = false;
                this.subtotal = cartTotal;
                this.total = this.subtotal;
                this.itemCount = this.cartService.getCartCount();
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
            this.checkoutForm.patchValue({
                name: user.name || '',
                phone: user.phone || (user as any).mobile || ''
            });
        }
    }

    // Quick Action: Fill Sample Site Address for instant testing
    fillSampleAddress() {
        this.checkoutForm.patchValue({
            name: 'Vikramaditya Reddy (Project Lead)',
            phone: '9876543210',
            addressLine1: 'Tower B, Phoenix Tech Zone, Nanakramguda',
            addressLine2: 'Near Financial District Gate 3',
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
            'addressLine1': 'Site / Building Address',
            'addressLine2': 'Street / Landmark',
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

            const firstErrorField = ['name', 'phone', 'addressLine1', 'city', 'state', 'pincode'].find(
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
        const address: Address = this.checkoutForm.value;

        // Artificial smooth delay for premium feel
        setTimeout(() => {
            if (this.isBookingFlow) {
                this.finalizeBooking(address);
            } else {
                this.finalizeCartOrder(address);
            }
            this.isSubmitting = false;
        }, 600);
    }

    private finalizeBooking(address: Address) {
        const finalBookingData = {
            ...this.bookingData,
            customerAddress: address,
            paymentMethod: this.selectedPaymentMethod,
            dispatchMode: this.selectedDispatchMode,
            siteNotes: this.checkoutForm.value.siteNotes,
            finalAmount: this.total,
            bookingStatus: 'Confirmed',
            bookedAt: new Date().toISOString()
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
        const orderData = {
            items: this.cartItems,
            total: this.total,
            address: address,
            payment_method: this.selectedPaymentMethod,
            dispatch_mode: this.selectedDispatchMode,
            site_notes: this.checkoutForm.value.siteNotes,
            created_at: new Date().toISOString()
        };

        this.orderService.placeOrder(orderData).subscribe({
            next: (res: any) => {
                this.cartService.clearCart();
                const orderId = res?.data?.id || res?.id || ('CW-' + Math.floor(10000 + Math.random() * 90000));
                this.router.navigate(['/order-success'], {
                    state: { orderId: orderId }
                });
            },
            error: (err) => {
                console.warn('API placeOrder failed or offline, completing local order:', err);
                this.cartService.clearCart();
                const fallbackId = 'CW-' + Math.floor(10000 + Math.random() * 90000);
                this.router.navigate(['/order-success'], {
                    state: { orderId: fallbackId }
                });
            }
        });
    }

    goBack() {
        if (this.isBookingFlow && this.bookingData) {
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
