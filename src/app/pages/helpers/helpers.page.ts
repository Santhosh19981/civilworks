import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { Subscription } from 'rxjs';
import { HelperService } from '../../services/helper.service';

@Component({
    selector: 'app-helpers',
    templateUrl: './helpers.page.html',
    styleUrls: ['./helpers.page.scss'],
})
export class HelpersPage implements OnInit, OnDestroy {
    helpers: any[] = [];
    filteredHelpers: any[] = [];
    searchQuery = '';
    selectedCategory = 'All';
    categories: string[] = ['All'];
    sortBy = 'rating';
    loading = true;
    mainCategoryId: number | null = null;
    private routeSub?: Subscription;

    constructor(
        private helperService: HelperService,
        private router: Router,
        private route: ActivatedRoute,
        private location: Location
    ) { }

    ngOnInit() {
        this.routeSub = this.route.queryParams.subscribe(params => {
            const savedSector = localStorage.getItem('selectedSectorId');
            this.mainCategoryId = params['mainCategoryId'] ? Number(params['mainCategoryId']) : (savedSector ? Number(savedSector) : null);
            this.loadHelpers();
        });
    }

    ngOnDestroy() {
        if (this.routeSub) {
            this.routeSub.unsubscribe();
        }
    }

    loadHelpers() {
        this.loading = true;
        this.helpers = [];
        this.filteredHelpers = [];

        const params: any = { limit: 100 };
        if (this.mainCategoryId) {
            params.main_category_id = this.mainCategoryId;
        }

        this.helperService.getHelpers(params).subscribe({
            next: (data: any[]) => {
                const list = Array.isArray(data) ? data : [];
                this.helpers = list.map(h => this.normalizeHelper(h));

                // Dynamically build category list from live database records
                const catSet = new Set<string>();
                catSet.add('All');
                this.helpers.forEach(h => {
                    if (h.category) catSet.add(h.category);
                });
                this.categories = Array.from(catSet);

                this.filterHelpers();
                this.loading = false;
            },
            error: (err: any) => {
                console.error('Error loading live helpers from API', err);
                this.loading = false;
            }
        });
    }

    normalizeHelper(h: any): any {
        const id = String(h.id);
        const name = h.service_name || h.name || 'Skilled Helper';
        const pricePerDay = Number(h.price_per_day || h.pricePerDay || 500);
        const mobile = h.mobile || '+91 98765 43210';
        const description = h.description || `Certified professional ${name.toLowerCase()} available for site construction and renovation work.`;
        const status = h.status || 'active';

        // Dynamic image: use admin provided image if valid, otherwise select local high-res trade image
        let image = h.image;
        if (!image || typeof image !== 'string' || image.trim() === '' || image === 'null') {
            const lower = name.toLowerCase();
            if (lower.includes('carpenter')) image = 'assets/images/helpers/carpenter.avif';
            else if (lower.includes('electrician')) image = 'assets/images/helpers/electrician.jpg';
            else if (lower.includes('plumber')) image = 'assets/images/helpers/plumber.webp';
            else if (lower.includes('mason')) image = 'assets/images/helpers/mason.webp';
            else if (lower.includes('painter')) image = 'assets/images/helpers/painter.jpg';
            else if (lower.includes('tile')) image = 'assets/images/helpers/tileworker.jpg';
            else if (lower.includes('steel') || lower.includes('rebar')) image = 'assets/images/helpers/steelfixer.webp';
            else if (lower.includes('fabricat') || lower.includes('weld')) image = 'assets/images/helpers/fabricator.jpg';
            else if (lower.includes('waterproof')) image = 'assets/images/helpers/waterproofing.jpg';
            else if (lower.includes('ac') || lower.includes('hvac')) image = 'assets/images/helpers/ac_technician.jpg';
            else image = 'assets/images/helpers/electrician.jpg';
        }

        const category = h.category || this.getDynamicCategory(name);
        const skills = h.skills || this.getDynamicSkills(name);

        return {
            ...h,
            id,
            name,
            service_name: name,
            pricePerDay,
            mobile,
            description,
            status,
            image,
            category,
            rating: 4.8 + ((Number(h.id) * 3) % 3) * 0.1,
            reviewCount: 45 + (Number(h.id) * 19),
            experience: `${5 + (Number(h.id) % 8)}+ Years`,
            skills,
            badge: this.getDynamicBadge(name),
            toolsProvided: true
        };
    }

    getDynamicCategory(name: string): string {
        const lower = name.toLowerCase();
        if (lower.includes('carpenter')) return 'Carpentry & Joinery';
        if (lower.includes('electrician')) return 'Electrical & Wiring';
        if (lower.includes('plumber')) return 'Plumbing & Drainage';
        if (lower.includes('mason')) return 'Masonry & Plastering';
        if (lower.includes('painter')) return 'Painting & Finishing';
        if (lower.includes('tile')) return 'Tiling & Flooring';
        if (lower.includes('steel') || lower.includes('rebar')) return 'Structural & Rebar';
        if (lower.includes('fabricat') || lower.includes('weld')) return 'Welding & Fabrication';
        if (lower.includes('waterproof')) return 'Waterproofing & Sealing';
        if (lower.includes('ac') || lower.includes('hvac')) return 'HVAC & Cooling';
        return 'General Construction';
    }

    getDynamicSkills(name: string): string[] {
        const lower = name.toLowerCase();
        if (lower.includes('carpenter')) return ['Modular Kitchen', 'Door Framing', 'Formwork', 'Wood Finishing'];
        if (lower.includes('electrician')) return ['3-Phase DB Dressing', 'Conduit Piping', 'Load Balancing', 'Earthing & Safety'];
        if (lower.includes('plumber')) return ['Concealed Piping', 'Pressure Testing', 'Sanitary Fixtures', 'Drainage Systems'];
        if (lower.includes('mason')) return ['AAC Block Laying', 'Smooth Plastering', 'Lintel & Column', 'Water Leveling'];
        if (lower.includes('painter')) return ['Wall Putty Finish', 'Exterior Waterproofing', 'Texture Paints', 'Spray Polish'];
        if (lower.includes('tile')) return ['Laser Alignment', 'Italian Marble', 'Epoxy Grouting', 'Granite Slabs'];
        if (lower.includes('steel') || lower.includes('rebar')) return ['BBS Cutting', 'Column Binding', 'Beam Rebar', 'Raft Mesh'];
        if (lower.includes('fabricat') || lower.includes('weld')) return ['MIG/ARC Welding', 'Steel Truss Sheds', 'I-Beam Erection', 'Safety Railings'];
        if (lower.includes('waterproof')) return ['Polymer Membrane', 'Pressure Grouting', 'Terrace Coating', 'Expansion Joints'];
        if (lower.includes('ac') || lower.includes('hvac')) return ['Copper Piping', 'Gas Leak Testing', 'VRV/VRF Systems', 'Duct Installation'];
        return ['Site Operations', 'Safety Compliant', 'Heavy Lifting', 'Tool Handling'];
    }

    getDynamicBadge(name: string): string {
        const lower = name.toLowerCase();
        if (lower.includes('mason')) return 'Lead Foreman';
        if (lower.includes('electrician')) return 'Govt. Licensed';
        if (lower.includes('carpenter')) return 'Master Craftsman';
        if (lower.includes('weld') || lower.includes('fabricat')) return 'Certified Welder';
        if (lower.includes('tile')) return 'Top Rated';
        if (lower.includes('waterproof')) return '10-Yr Guarantee Pro';
        return 'Verified Pro';
    }

    handleRefresh(event: any) {
        this.loadHelpers();
        setTimeout(() => {
            event.target.complete();
        }, 800);
    }

    onSearchChange(event: any) {
        this.searchQuery = event.detail.value || '';
        this.filterHelpers();
    }

    setCategory(category: string) {
        this.selectedCategory = category;
        this.filterHelpers();
    }

    onSortChange(event: any) {
        this.sortBy = event.detail.value || 'rating';
        this.filterHelpers();
    }

    filterHelpers() {
        let result = [...this.helpers];

        // Filter Category
        if (this.selectedCategory && this.selectedCategory !== 'All') {
            result = result.filter(h =>
                (h.category || '').toLowerCase() === this.selectedCategory.toLowerCase() ||
                (h.name || '').toLowerCase().includes(this.selectedCategory.toLowerCase().split(' ')[0])
            );
        }

        // Filter Search
        if (this.searchQuery.trim()) {
            const query = this.searchQuery.toLowerCase();
            result = result.filter(h =>
                (h.name || '').toLowerCase().includes(query) ||
                (h.description || '').toLowerCase().includes(query) ||
                (h.category || '').toLowerCase().includes(query) ||
                (h.skills && h.skills.some((s: string) => s.toLowerCase().includes(query)))
            );
        }

        // Sort
        if (this.sortBy === 'price-low') {
            result.sort((a, b) => a.pricePerDay - b.pricePerDay);
        } else if (this.sortBy === 'price-high') {
            result.sort((a, b) => b.pricePerDay - a.pricePerDay);
        } else {
            result.sort((a, b) => (b.rating || 4.5) - (a.rating || 4.5));
        }

        this.filteredHelpers = result;
    }

    viewHelper(id: string) {
        this.router.navigate(['/helper-details', id]);
    }

    goBack() {
        if (window.history.length > 1) {
            this.location.back();
        } else {
            this.router.navigate(['/tabs/home']);
        }
    }

    onImageError(event: any) {
        const target = event.target as HTMLImageElement;
        if (target) {
            target.src = 'assets/images/helpers/electrician.jpg';
        }
    }
}
