import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CartService } from '../../services/cart.service';
import { Address } from '../../models/order.model';

@Component({
    selector: 'app-checkout',
    templateUrl: './checkout.page.html',
    styleUrls: ['./checkout.page.scss'],
})
export class CheckoutPage implements OnInit {
    checkoutForm!: FormGroup;
    total = 0;
    itemCount = 0;

    constructor(
        private formBuilder: FormBuilder,
        private cartService: CartService,
        private router: Router
    ) { }

    ngOnInit() {
        this.total = this.cartService.getCartTotal();
        this.itemCount = this.cartService.getCartCount();

        this.checkoutForm = this.formBuilder.group({
            name: ['', [
                Validators.required,
                Validators.minLength(3),
                Validators.maxLength(50),
                Validators.pattern(/^[a-zA-Z\s]+$/)
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
                Validators.maxLength(100)
            ]],
            addressLine2: ['', [
                Validators.maxLength(100)
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
            ]]
        });
    }

    // Helper methods to get form controls
    get name() { return this.checkoutForm.get('name'); }
    get phone() { return this.checkoutForm.get('phone'); }
    get addressLine1() { return this.checkoutForm.get('addressLine1'); }
    get addressLine2() { return this.checkoutForm.get('addressLine2'); }
    get city() { return this.checkoutForm.get('city'); }
    get state() { return this.checkoutForm.get('state'); }
    get pincode() { return this.checkoutForm.get('pincode'); }

    // Get error message for a field
    getErrorMessage(fieldName: string): string {
        const field = this.checkoutForm.get(fieldName);
        if (!field || !field.errors || !field.touched) return '';

        if (field.errors['required']) return `${this.getFieldLabel(fieldName)} is required`;
        if (field.errors['minlength']) return `Minimum ${field.errors['minlength'].requiredLength} characters required`;
        if (field.errors['maxlength']) return `Maximum ${field.errors['maxlength'].requiredLength} characters allowed`;
        if (field.errors['pattern']) return this.getPatternError(fieldName);

        return '';
    }

    private getFieldLabel(fieldName: string): string {
        const labels: { [key: string]: string } = {
            'name': 'Full Name',
            'phone': 'Phone Number',
            'addressLine1': 'Address Line 1',
            'addressLine2': 'Address Line 2',
            'city': 'City',
            'state': 'State',
            'pincode': 'Pincode'
        };
        return labels[fieldName] || fieldName;
    }

    private getPatternError(fieldName: string): string {
        const errors: { [key: string]: string } = {
            'name': 'Only letters and spaces allowed',
            'phone': 'Enter a valid 10-digit Indian mobile number',
            'city': 'Only letters and spaces allowed',
            'state': 'Only letters and spaces allowed',
            'pincode': 'Enter a valid 6-digit pincode'
        };
        return errors[fieldName] || 'Invalid format';
    }

    async proceedToPayment() {
        // Mark all fields as touched to show validation errors
        Object.keys(this.checkoutForm.controls).forEach(key => {
            this.checkoutForm.get(key)?.markAsTouched();
        });

        if (this.checkoutForm.valid) {
            const address: Address = this.checkoutForm.value;
            this.router.navigate(['/payment'], { state: { address } });
        } else {
            // Show error message for invalid form
            const firstError = this.getFirstErrorMessage();
            alert(`Please fix the following error: ${firstError}`);
        }
    }

    private getFirstErrorMessage(): string {
        const fields = ['name', 'phone', 'addressLine1', 'city', 'state', 'pincode'];
        for (const field of fields) {
            const error = this.getErrorMessage(field);
            if (error) return error;
        }
        return 'Please fill all required fields correctly';
    }

    goBack() {
        this.router.navigate(['/cart']);
    }
}
