import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Product, MainCategory, Category, SubCategory, Vendor } from '../models/product.model';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class ProductService {
    constructor(private http: HttpClient) { }

    getMainCategories(): Observable<MainCategory[]> {
        return this.http.get<any>(`${environment.apiUrl}/main-categories`)
            .pipe(map(res => res.data || []));
    }

    getCategories(mainCategoryId?: number | string): Observable<Category[]> {
        const params: any = {};
        if (mainCategoryId) params.main_category_id = mainCategoryId;
        return this.http.get<any>(`${environment.apiUrl}/categories`, { params })
            .pipe(map(res => res.data || []));
    }

    getSubcategories(params: any = {}): Observable<SubCategory[]> {
        return this.http.get<any>(`${environment.apiUrl}/subcategories`, { params })
            .pipe(map(res => res.data || []));
    }

    getVendors(subcategoryId?: number | string): Observable<Vendor[]> {
        const params: any = {};
        if (subcategoryId) params.subcategory_id = subcategoryId;
        return this.http.get<any>(`${environment.apiUrl}/vendors`, { params })
            .pipe(map(res => res.data || []));
    }

    getProducts(params: any = {}): Observable<Product[]> {
        return this.http.get<any>(`${environment.apiUrl}/products`, { params })
            .pipe(map(res => res.data || []));
    }

    getProductById(id: string | number): Observable<Product> {
        return this.http.get<any>(`${environment.apiUrl}/products/${id}`)
            .pipe(map(res => res.data));
    }

    getFeaturedProducts(limit: number = 6): Observable<Product[]> {
        return this.http.get<any>(`${environment.apiUrl}/products?featured=1`)
            .pipe(map(res => (res.data || []).slice(0, limit)));
    }

    getBanners(mainCategoryId?: number | string): Observable<any[]> {
        const params: any = {};
        if (mainCategoryId) params.main_category_id = mainCategoryId;
        return this.http.get<any>(`${environment.apiUrl}/banners`, { params })
            .pipe(map(res => res.data || []));
    }
}

