import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class OrderService {
    constructor(private http: HttpClient) { }

    placeOrder(orderData: any): Observable<any> {
        return this.http.post<any>(`${environment.apiUrl}/orders`, orderData);
    }

    getMyOrders(): Observable<any[]> {
        return this.http.get<any>(`${environment.apiUrl}/orders/my-orders`)
            .pipe(map(res => res.data));
    }

    // Alias for backward compatibility
    getOrders(): Observable<any[]> {
        return this.getMyOrders();
    }

    getOrderDetails(id: string): Observable<any> {
        return this.http.get<any>(`${environment.apiUrl}/orders/${id}`)
            .pipe(map(res => res.data));
    }

    // Creates an order from cart items, total, address and payment method
    createOrder(cartItems: any[], total: number, address: any, paymentMethod: string): Observable<any> {
        const orderData = {
            items: cartItems,
            total,
            address,
            payment_method: paymentMethod
        };
        return this.placeOrder(orderData);
    }

    // Order Editing (Multi-Service Editable Orders)
    addServiceToOrder(orderId: number | string, data: { subcategory_id: number; vendor_id: number; service_name?: string; price?: number; notes?: string }): Observable<any> {
        return this.http.post<any>(`${environment.apiUrl}/orders/${orderId}/services`, data);
    }

    removeServiceFromOrder(orderId: number | string, serviceId: number | string): Observable<any> {
        return this.http.delete<any>(`${environment.apiUrl}/orders/${orderId}/services/${serviceId}`);
    }

    reselectVendor(orderId: number | string, serviceId: number | string, data: { vendor_id: number; notes?: string }): Observable<any> {
        return this.http.put<any>(`${environment.apiUrl}/orders/${orderId}/services/${serviceId}/reselect-vendor`, data);
    }

    // Address Management
    getAddresses(): Observable<any[]> {
        return this.http.get<any>(`${environment.apiUrl}/addresses`)
            .pipe(map(res => res.data));
    }

    addAddress(address: any): Observable<any> {
        return this.http.post<any>(`${environment.apiUrl}/addresses`, address);
    }

    updateAddress(id: number, address: any): Observable<any> {
        return this.http.put<any>(`${environment.apiUrl}/addresses/${id}`, address);
    }

    deleteAddress(id: number): Observable<any> {
        return this.http.delete<any>(`${environment.apiUrl}/addresses/${id}`);
    }
}

