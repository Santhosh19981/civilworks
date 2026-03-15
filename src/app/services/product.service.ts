import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Product } from '../models/product.model';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class ProductService {
    constructor(private http: HttpClient) { }

    getProducts(params: any = {}): Observable<Product[]> {
        return this.http.get<any>(`${environment.apiUrl}/products`, { params })
            .pipe(map(res => res.data));
    }

    getProductById(id: string): Observable<Product> {
        return this.http.get<any>(`${environment.apiUrl}/products/${id}`)
            .pipe(map(res => res.data));
    }

    getCategories(): Observable<any[]> {
        return this.http.get<any>(`${environment.apiUrl}/categories`)
            .pipe(map(res => res.data));
    }

    getFeaturedProducts(limit: number = 6): Observable<Product[]> {
        return this.http.get<any>(`${environment.apiUrl}/products?featured=1`)
            .pipe(map(res => res.data.slice(0, limit)));
    }
}
