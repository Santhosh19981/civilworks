import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { Product } from '../../models/product.model';

@Component({
    selector: 'app-products',
    templateUrl: './products.page.html',
    styleUrls: ['./products.page.scss'],
})
export class ProductsPage implements OnInit {
    products: Product[] = [];
    filteredProducts: Product[] = [];
    categories: string[] = [];
    selectedCategory = 'All';
    searchQuery = '';
    loading = true;
    cartCount = 0;

    constructor(
        private productService: ProductService,
        private cartService: CartService,
        private router: Router
    ) { }

    ngOnInit() {
        this.loadProducts();

        // Subscribe to cart changes
        this.cartService.cart$.subscribe(() => {
            this.cartCount = this.cartService.getCartCount();
        });
    }

    loadProducts() {
        this.loading = true;
        setTimeout(() => {
            this.products = this.productService.getProducts();
            this.filteredProducts = [...this.products];
            this.categories = this.productService.getCategories();
            this.loading = false;
        }, 500);
    }

    handleRefresh(event: any) {
        this.loadProducts();
        setTimeout(() => {
            event.target.complete();
        }, 1000);
    }

    onSearchChange(event: any) {
        this.searchQuery = event.detail.value || '';
        this.filterProducts();
    }

    selectCategory(category: string) {
        this.selectedCategory = category;
        this.filterProducts();
    }

    filterProducts() {
        let filtered = this.products;

        // Filter by category
        if (this.selectedCategory !== 'All') {
            filtered = filtered.filter(p => p.category === this.selectedCategory);
        }

        // Filter by search query
        if (this.searchQuery.trim()) {
            const query = this.searchQuery.toLowerCase();
            filtered = filtered.filter(p =>
                p.name.toLowerCase().includes(query) ||
                p.description.toLowerCase().includes(query) ||
                p.category.toLowerCase().includes(query)
            );
        }

        this.filteredProducts = filtered;
    }

    viewProduct(productId: string) {
        this.router.navigate(['/product-detail', productId]);
    }
}
