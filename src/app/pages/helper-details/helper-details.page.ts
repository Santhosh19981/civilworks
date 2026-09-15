import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HelperService } from '../../services/helper.service';
import { ToastController, NavController } from '@ionic/angular';

@Component({
    selector: 'app-helper-details',
    templateUrl: './helper-details.page.html',
    styleUrls: ['./helper-details.page.scss'],
})
export class HelperDetailsPage implements OnInit {
    helper: any;
    loading = true;
    membersCount = 1;
    daysCount = 1;
    totalAmount = 0;
    discountAmount = 0;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private helperService: HelperService,
        private toastController: ToastController,
        private navCtrl: NavController
    ) { }

    ngOnInit() {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.loadHelper(id);
        }
    }

    loadHelper(id: string) {
        this.loading = true;
        this.helperService.getHelperById(id).subscribe({
            next: (data: any) => {
                if (data) {
                    this.helper = this.normalizeHelper(data);
                    this.calculateTotal();
                }
                this.loading = false;
            },
            error: (err: any) => {
                console.error('Error loading live helper from API', err);
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

    incrementMembers() {
        if (this.membersCount < 20) {
            this.membersCount++;
            this.calculateTotal();
        }
    }

    decrementMembers() {
        if (this.membersCount > 1) {
            this.membersCount--;
            this.calculateTotal();
        }
    }

    incrementDays() {
        if (this.daysCount < 60) {
            this.daysCount++;
            this.calculateTotal();
        }
    }

    decrementDays() {
        if (this.daysCount > 1) {
            this.daysCount--;
            this.calculateTotal();
        }
    }

    calculateTotal() {
        if (this.helper && this.helper.pricePerDay) {
            const subtotal = this.membersCount * this.daysCount * this.helper.pricePerDay;
            let discount = 0;
            if (this.daysCount >= 7) {
                discount = Math.round(subtotal * 0.10);
            } else if (this.daysCount >= 3) {
                discount = Math.round(subtotal * 0.05);
            }
            this.discountAmount = discount;
            this.totalAmount = subtotal - discount;
        }
    }

    async placeBooking() {
        if (!this.helper) return;

        const bookingId = 'HELP' + Math.floor(1000 + Math.random() * 9000);
        const bookingData = {
            id: bookingId,
            bookingId: bookingId,
            serviceName: this.helper.name,
            trade: this.helper.category || this.helper.name,
            members: this.membersCount,
            days: this.daysCount,
            total: this.totalAmount,
            totalAmount: this.totalAmount,
            date: new Date().toISOString().split('T')[0],
            status: 'Booked',
            mobile: this.helper.mobile,
            type: 'helper',
            image: this.helper.image
        };

        this.router.navigate(['/checkout'], {
            state: { bookingData: bookingData }
        });
    }

    goBack() {
        this.navCtrl.back();
    }

    onImageError(event: any) {
        const target = event.target as HTMLImageElement;
        if (target) {
            target.src = 'assets/images/helpers/electrician.jpg';
        }
    }
}
