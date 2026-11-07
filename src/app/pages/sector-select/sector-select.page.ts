import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { ProductService } from '../../services/product.service';
import { MainCategory } from '../../models/product.model';

@Component({
    selector: 'app-sector-select',
    templateUrl: './sector-select.page.html',
    styleUrls: ['./sector-select.page.scss'],
})
export class SectorSelectPage implements OnInit {
    mainCategories: MainCategory[] = [];
    loading = true;
    loadFailed = false;
    selectedSectorId: number | null = null;

    constructor(
        private productService: ProductService,
        private router: Router,
        private location: Location
    ) { }

    ngOnInit() {
        const savedId = localStorage.getItem('selectedSectorId');
        if (savedId) {
            this.selectedSectorId = Number(savedId);
        }
        this.loadMainCategories();
    }

    loadMainCategories() {
        this.loading = true;
        this.loadFailed = false;
        this.productService.getMainCategories().subscribe({
            next: (data) => {
                this.mainCategories = (data || []).filter(m => m.status === 'active' || !m.status);
                this.loading = false;
            },
            error: (err) => {
                console.error('Failed to load main categories', err);
                this.loadFailed = true;
                this.loading = false;
            }
        });
    }

    trackBySectorId(_index: number, sector: MainCategory): number {
        return sector.id;
    }

    selectSector(sector: MainCategory) {
        this.selectedSectorId = sector.id;
        localStorage.setItem('selectedSectorId', String(sector.id));
        localStorage.setItem('selectedSectorName', sector.name);

        this.router.navigate(['/tabs/home'], {
            queryParams: { mainCategoryId: sector.id },
            replaceUrl: true
        });
    }

    browseAll() {
        localStorage.removeItem('selectedSectorId');
        localStorage.removeItem('selectedSectorName');
        this.router.navigate(['/tabs/home'], { replaceUrl: true });
    }

    goBack() {
        if (window.history.length > 1) {
            this.location.back();
        } else {
            this.router.navigate(['/tabs/home']);
        }
    }

    getSectorTheme(name: string): string {
        const lower = (name || '').toLowerCase();
        if (lower.includes('interior')) return 'theme-interiors';
        if (lower.includes('construct')) return 'theme-construction';
        if (lower.includes('real')) return 'theme-realestate';
        return 'theme-default';
    }

    getSectorIcon(name: string): string {
        const lower = (name || '').toLowerCase();
        if (lower.includes('interior')) return 'home';
        if (lower.includes('construct')) return 'business';
        if (lower.includes('real')) return 'map';
        if (lower.includes('electric')) return 'flash';
        if (lower.includes('plumb')) return 'water';
        return 'cube';
    }

    getSectorDescription(sector: MainCategory): string {
        const lower = (sector.name || '').toLowerCase();
        if (sector.description && sector.description.length > 25 && !sector.description.includes('kjsn')) {
            return sector.description;
        }
        if (lower.includes('construct')) {
            return 'Heavy civil building materials, equipment rental, industrial tools & structural essentials.';
        }
        if (lower.includes('interior')) {
            return 'Interior fittings, architectural hardware, modular kitchen systems & premium surface styling.';
        }
        if (lower.includes('real')) {
            return 'Commercial plots, premium residential developments, project land parcels & verified title deeds.';
        }
        return 'Verified supplies, specialized trade equipment, and on-demand civil engineering solutions.';
    }
}
