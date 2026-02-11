import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { CartItem } from '../models/cart.model';
import { Product } from '../models/product.model';

@Injectable({
    providedIn: 'root'
})
export class CartService {
    private readonly CART_STORAGE_KEY = 'civilworks_cart';
    private cartSubject = new BehaviorSubject<CartItem[]>([]);
    public cart$: Observable<CartItem[]> = this.cartSubject.asObservable();

    constructor() {
        this.loadCart();
    }

    private loadCart(): void {
        const savedCart = localStorage.getItem(this.CART_STORAGE_KEY);
        if (savedCart) {
            try {
                const cart = JSON.parse(savedCart);
                this.cartSubject.next(cart);
            } catch (error) {
                console.error('Error loading cart:', error);
                this.cartSubject.next([]);
            }
        }
    }

    private saveCart(): void {
        localStorage.setItem(this.CART_STORAGE_KEY, JSON.stringify(this.cartSubject.value));
    }

    getCart(): CartItem[] {
        return this.cartSubject.value;
    }

    getCartCount(): number {
        return this.cartSubject.value.reduce((sum, item) => sum + item.quantity, 0);
    }

    getCartTotal(): number {
        return this.cartSubject.value.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    }

    addToCart(product: Product, quantity: number = 1): void {
        const currentCart = [...this.cartSubject.value];
        const existingItem = currentCart.find(item => item.product.id === product.id);

        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            currentCart.push({ product, quantity });
        }

        this.cartSubject.next(currentCart);
        this.saveCart();
    }

    updateQuantity(productId: string, quantity: number): void {
        const currentCart = [...this.cartSubject.value];
        const item = currentCart.find(item => item.product.id === productId);

        if (item) {
            if (quantity <= 0) {
                this.removeFromCart(productId);
            } else {
                item.quantity = quantity;
                this.cartSubject.next(currentCart);
                this.saveCart();
            }
        }
    }

    removeFromCart(productId: string): void {
        const currentCart = this.cartSubject.value.filter(item => item.product.id !== productId);
        this.cartSubject.next(currentCart);
        this.saveCart();
    }

    clearCart(): void {
        this.cartSubject.next([]);
        localStorage.removeItem(this.CART_STORAGE_KEY);
    }

    isInCart(productId: string): boolean {
        return this.cartSubject.value.some(item => item.product.id === productId);
    }

    getItemQuantity(productId: string): number {
        const item = this.cartSubject.value.find(item => item.product.id === productId);
        return item ? item.quantity : 0;
    }
}
