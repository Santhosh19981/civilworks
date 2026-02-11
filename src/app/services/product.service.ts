import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Product } from '../models/product.model';
import productsData from '../../data/products.json';

@Injectable({
    providedIn: 'root'
})
export class ProductService {
    private productsSubject = new BehaviorSubject<Product[]>([]);
    public products$: Observable<Product[]> = this.productsSubject.asObservable();

    constructor() {
        this.loadProducts();
    }

    private loadProducts(): void {
        this.productsSubject.next(productsData as Product[]);
    }

    getProducts(): Product[] {
        return this.productsSubject.value;
    }

    getProductById(id: string): Product | undefined {
        return this.productsSubject.value.find(p => p.id === id);
    }

    searchProducts(query: string): Product[] {
        const lowerQuery = query.toLowerCase();
        return this.productsSubject.value.filter(p =>
            p.name.toLowerCase().includes(lowerQuery) ||
            p.description.toLowerCase().includes(lowerQuery) ||
            p.category.toLowerCase().includes(lowerQuery)
        );
    }

    getProductsByCategory(category: string): Product[] {
        if (category === 'All') {
            return this.productsSubject.value;
        }
        return this.productsSubject.value.filter(p => p.category === category);
    }

    getCategories(): string[] {
        const categories = this.productsSubject.value.map(p => p.category);
        return ['All', ...Array.from(new Set(categories))];
    }

    getFeaturedProducts(limit: number = 6): Product[] {
        return this.productsSubject.value.slice(0, limit);
    }
}
