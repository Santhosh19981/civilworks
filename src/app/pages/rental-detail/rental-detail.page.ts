import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RentalService } from '../../services/rental.service';
import { ToastController, NavController } from '@ionic/angular';

@Component({
    selector: 'app-rental-detail',
    templateUrl: './rental-detail.page.html',
    styleUrls: ['./rental-detail.page.scss'],
})
export class RentalDetailPage implements OnInit {
    rental: any;
    loading = true;
    daysCount = 1;
    totalAmount = 0;
    discountAmount = 0;
    includeOperator = true;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private rentalService: RentalService,
        private toastController: ToastController,
        private navCtrl: NavController
    ) { }

    ngOnInit() {
        const rentalId = this.route.snapshot.paramMap.get('id');
        if (rentalId) {
            this.loadRental(rentalId);
        }
    }

    loadRental(id: string) {
        this.loading = true;
        this.rentalService.getRentalById(id).subscribe({
            next: (rental: any) => {
                this.rental = this.normalizeRental(rental);
                this.calculateTotal();
                this.loading = false;
            },
            error: (err: any) => {
                console.error('Error loading rental', err);
                this.loading = false;
            }
        });
    }

    normalizeRental(r: any): any {
        if (!r) return null;
        const id = String(r.id);
        const name = r.name || 'Machinery';
        const category = r.category_name || r.category || 'Heavy Machinery';
        const pricePerDay = Number(r.price_per_day || r.pricePerDay || 0);
        const mobile = r.mobile || '+91 98765 43210';
        const description = r.description || 'Reliable construction equipment inspected and certified for immediate on-site deployment.';

        let localImage = 'assets/rentals/jcb_3dx.jpg';
        const lower = name.toLowerCase();
        if (lower.includes('jcb') || lower.includes('backhoe') || lower.includes('loader')) {
            localImage = 'assets/rentals/jcb_3dx.jpg';
        } else if (lower.includes('caterpillar') || lower.includes('excavat') || lower.includes('cat')) {
            localImage = 'assets/rentals/excavator.jpg';
        } else if (lower.includes('jackhammer') || lower.includes('bosch') || lower.includes('breaker')) {
            localImage = 'assets/rentals/jackhammer.jpg';
        } else if (lower.includes('mixer') || lower.includes('concrete')) {
            localImage = 'assets/rentals/concrete_mixer.jpg';
        } else if (lower.includes('scaffold') || lower.includes('frame')) {
            localImage = 'assets/rentals/scaffolding.jpg';
        } else if (r.image && typeof r.image === 'string' && r.image.trim() !== '') {
            localImage = r.image;
        }

        return {
            ...r,
            id,
            name,
            category,
            pricePerDay,
            image: localImage,
            description,
            mobile,
            rating: 4.9,
            reviewCount: 38,
            fuelType: lower.includes('jackhammer') ? 'Electric 220V' : (lower.includes('scaffold') ? 'Galvanized Q235' : 'Diesel Engine'),
            specsMatrix: this.getMachineSpecsMatrix(name),
            operatorIncluded: !lower.includes('jackhammer') && !lower.includes('scaffold'),
            dispatchLeadTime: 'Within 4 Hours'
        };
    }

    getMachineSpecsMatrix(name: string): { label: string; value: string }[] {
        const lower = name.toLowerCase();
        if (lower.includes('jcb') || lower.includes('backhoe')) {
            return [
                { label: 'Engine Power', value: '76 HP Turbocharged' },
                { label: 'Bucket Capacity', value: '0.24 m³ Excavator / 1.0 m³ Shovel' },
                { label: 'Max Dig Depth', value: '4.77 Meters' },
                { label: 'Operating Weight', value: '7,460 kg' },
                { label: 'Operator', value: 'Certified Driver Included' },
                { label: 'Insurance', value: 'Comprehensive Site Cover' }
            ];
        }
        if (lower.includes('caterpillar') || lower.includes('excavat')) {
            return [
                { label: 'Engine Power', value: '146 HP Cat C4.4 ACERT' },
                { label: 'Bucket Capacity', value: '1.0 m³ Heavy-Duty' },
                { label: 'Operating Weight', value: '20,500 kg (20.5 Ton)' },
                { label: 'Max Reach', value: '9.87 Meters' },
                { label: 'Cabin', value: 'Air-Conditioned ROPS Certified' },
                { label: 'Fuel Efficiency', value: 'Up to 20% lower fuel use' }
            ];
        }
        if (lower.includes('jackhammer') || lower.includes('breaker')) {
            return [
                { label: 'Power Input', value: '1,750 Watts Heavy Duty' },
                { label: 'Impact Energy', value: '41 Joules' },
                { label: 'Impact Rate', value: '1,300 BPM' },
                { label: 'Vibration Control', value: 'Vibration Control Dampers' },
                { label: 'Accessories', value: '1 Pointed + 1 Flat Chisel' },
                { label: 'Weight', value: '16.5 kg Ergonomic' }
            ];
        }
        if (lower.includes('mixer') || lower.includes('concrete')) {
            return [
                { label: 'Engine', value: '6 HP Air-Cooled Diesel' },
                { label: 'Drum Capacity', value: '200 Litres (10/7 CFT)' },
                { label: 'Batch Output', value: '140 Litres Mixed Concrete' },
                { label: 'Drum Speed', value: '18-20 RPM' },
                { label: 'Mobility', value: 'Pneumatic Towing Wheels' },
                { label: 'Chassis', value: 'Heavy Channel Iron' }
            ];
        }
        if (lower.includes('scaffold')) {
            return [
                { label: 'Material', value: 'High Tensile Q235 Steel' },
                { label: 'Frame Size', value: '2.0m Height x 1.2m Width' },
                { label: 'Surface Finish', value: 'Hot-Dip Galvanized Anti-Rust' },
                { label: 'Components', value: 'H-Frames, Cross Braces, Joint Pins' },
                { label: 'Load Rating', value: 'Up to 450 kg/m² Uniform Load' },
                { label: 'Safety', value: 'EN 12810 Standard Compliance' }
            ];
        }
        return [
            { label: 'Certification', value: 'CivilWorks 50-Pt Inspected' },
            { label: 'Deployment', value: 'Same-Day Dispatch' },
            { label: 'Support', value: '24/7 Field Maintenance' },
            { label: 'Insurance', value: 'Included in Base Rental' }
        ];
    }

    setPresetDays(days: number) {
        this.daysCount = days;
        this.calculateTotal();
    }

    incrementDays() {
        this.daysCount++;
        this.calculateTotal();
    }

    decrementDays() {
        if (this.daysCount > 1) {
            this.daysCount--;
            this.calculateTotal();
        }
    }

    calculateTotal() {
        if (this.rental && this.rental.pricePerDay) {
            const base = this.rental.pricePerDay * this.daysCount;
            let discount = 0;
            if (this.daysCount >= 30) {
                discount = Math.round(base * 0.20);
            } else if (this.daysCount >= 7) {
                discount = Math.round(base * 0.10);
            } else if (this.daysCount >= 3) {
                discount = Math.round(base * 0.05);
            }
            this.discountAmount = discount;
            this.totalAmount = base - discount;
        }
    }

    async placeBooking() {
        if (!this.rental) return;

        const bookingId = 'RENT' + Math.floor(1000 + Math.random() * 9000);
        const bookingData = {
            id: bookingId,
            bookingId: bookingId,
            rentalName: this.rental.name,
            serviceName: this.rental.name,
            days: this.daysCount,
            total: this.totalAmount,
            totalAmount: this.totalAmount,
            date: new Date().toISOString().split('T')[0],
            status: 'Booked',
            mobile: this.rental.mobile,
            type: 'rental',
            image: this.rental.image
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
            target.src = 'assets/rentals/jcb_3dx.jpg';
        }
    }
}
