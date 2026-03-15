import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class CartService {
    private cartSubject = new BehaviorSubject<any>(null);
    public cart$ = this.cartSubject.asObservable();

    constructor(private http: HttpClient) {
        this.loadCart();
    }

    loadCart() {
        this.http.get<any>(`${environment.apiUrl}/cart`).subscribe({
            next: (res) => this.cartSubject.next(res.data),
            error: (err) => console.error('Error loading cart', err)
        });
    }

    addToCart(product_id: number, quantity: number = 1): Observable<any> {
        return this.http.post<any>(`${environment.apiUrl}/cart`, { product_id, quantity })
            .pipe(tap(res => this.cartSubject.next(res.data)));
    }

    updateQuantity(itemId: number, quantity: number): Observable<any> {
        return this.http.put<any>(`${environment.apiUrl}/cart/${itemId}`, { quantity })
            .pipe(tap(res => this.cartSubject.next(res.data)));
    }

    removeItem(itemId: number): Observable<any> {
        return this.http.delete<any>(`${environment.apiUrl}/cart/${itemId}`)
            .pipe(tap(res => this.cartSubject.next(res.data)));
    }

    clearCart() {
        this.cartSubject.next({ items: [], subtotal: 0 });
    }

    // ── Synchronous helpers (read from BehaviorSubject snapshot) ──

    getCart(): any[] {
        const cart = this.cartSubject.getValue();
        return cart?.items ?? [];
    }

    getCartCount(): number {
        const cart = this.cartSubject.getValue();
        if (!cart?.items) return 0;
        return cart.items.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);
    }

    getCartTotal(): number {
        const cart = this.cartSubject.getValue();
        return cart?.subtotal ?? 0;
    }
}
