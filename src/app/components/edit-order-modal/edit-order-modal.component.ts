import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController, AlertController } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { OrderService } from '../../services/order.service';

import { Router } from '@angular/router';

@Component({
    selector: 'app-edit-order-modal',
    templateUrl: './edit-order-modal.component.html',
    styleUrls: ['./edit-order-modal.component.scss'],
    standalone: true,
    imports: [CommonModule, FormsModule, IonicModule]
})
export class EditOrderModalComponent implements OnInit {
    @Input() order: any = null;
    @Output() close = new EventEmitter<void>();
    @Output() orderUpdated = new EventEmitter<any>();

    activeTab: 'current' | 'add' = 'current';

    // Adding service state
    serviceSubcategories: any[] = [];
    selectedSubcategoryId: number | null = null;
    availableVendors: any[] = [];
    selectedVendorId: number | null = null;
    serviceNotes: string = '';
    estimatedPrice: number = 0;
    loadingVendors = false;
    submitting = false;

    // Reselect Vendor State
    reselectService: any = null;
    reselectVendors: any[] = [];
    selectedReselectVendorId: number | null = null;

    constructor(
        private http: HttpClient,
        private orderService: OrderService,
        private toastCtrl: ToastController,
        private alertCtrl: AlertController,
        private router: Router
    ) { }

    goToServicesCatalog() {
        this.close.emit();
        const orderId = this.order?.orderNo || this.order?.order_no || this.order?.id || this.order?.rawId;
        const rawId = this.order?.rawId || this.order?.id;
        this.router.navigate(['/tabs/products'], {
            queryParams: {
                type: 'services',
                editOrderId: orderId,
                rawId: rawId,
                orderNo: orderId
            }
        });
    }

    ngOnInit() {
        this.loadServiceSubcategories();
    }

    loadServiceSubcategories() {
        this.http.get<any>(`${environment.apiUrl}/subcategories?type=services&all=true`).subscribe({
            next: (res) => {
                this.serviceSubcategories = (res.data || []).filter((s: any) => s.status === 'active');
            },
            error: (err) => console.error('Failed to load subcategories', err)
        });
    }

    onSubcategorySelect() {
        this.selectedVendorId = null;
        this.availableVendors = [];
        if (!this.selectedSubcategoryId) return;

        this.loadingVendors = true;
        this.http.get<any>(`${environment.apiUrl}/vendors?subcategory_id=${this.selectedSubcategoryId}`).subscribe({
            next: (res) => {
                const assignedVendorIds = (this.order?.services || [])
                    .filter((s: any) => Number(s.subcategory_id) === Number(this.selectedSubcategoryId) && s.service_status !== 'removed')
                    .map((s: any) => Number(s.vendor_id));

                this.availableVendors = (res.data || []).filter((v: any) => !assignedVendorIds.includes(Number(v.id)));
                this.loadingVendors = false;
            },
            error: (err) => {
                console.error('Failed to load vendors for subcategory', err);
                this.loadingVendors = false;
            }
        });
    }

    async submitAddService() {
        if (!this.selectedSubcategoryId || !this.selectedVendorId) {
            this.showToast('Please select both a service and a vendor', 'warning');
            return;
        }

        const orderId = this.order.rawId || this.order.id;
        this.submitting = true;

        const selectedSub = this.serviceSubcategories.find(s => s.id == this.selectedSubcategoryId);

        this.orderService.addServiceToOrder(orderId, {
            subcategory_id: Number(this.selectedSubcategoryId),
            vendor_id: Number(this.selectedVendorId),
            service_name: selectedSub?.name || 'Service',
            price: Number(this.estimatedPrice || 0),
            notes: this.serviceNotes
        }).subscribe({
            next: (res) => {
                this.submitting = false;
                this.showToast('Service added successfully! Request sent to vendor.', 'success');
                this.activeTab = 'current';
                this.selectedSubcategoryId = null;
                this.selectedVendorId = null;
                this.serviceNotes = '';
                this.estimatedPrice = 0;
                this.orderUpdated.emit(res.data);
            },
            error: (err) => {
                this.submitting = false;
                const msg = err.error?.message || 'Failed to add service';
                this.showToast(msg, 'danger');
            }
        });
    }

    async confirmRemoveService(service: any) {
        const alert = await this.alertCtrl.create({
            header: 'Remove Service?',
            message: `Are you sure you want to remove "${service.subcategory_name || 'this service'}" from the project?`,
            buttons: [
                { text: 'Cancel', role: 'cancel' },
                {
                    text: 'Remove',
                    role: 'destructive',
                    handler: () => {
                        this.executeRemoveService(service);
                    }
                }
            ]
        });
        await alert.present();
    }

    private executeRemoveService(service: any) {
        const orderId = this.order.rawId || this.order.id;
        this.orderService.removeServiceFromOrder(orderId, service.id).subscribe({
            next: () => {
                this.showToast('Service removed from project.', 'success');
                // Locally mark as removed
                if (this.order.services) {
                    this.order.services = this.order.services.filter((s: any) => s.id !== service.id);
                }
                this.orderUpdated.emit(this.order);
            },
            error: (err) => {
                const msg = err.error?.message || 'Failed to remove service';
                this.showToast(msg, 'danger');
            }
        });
    }

    openReselectVendor(service: any) {
        this.reselectService = service;
        this.selectedReselectVendorId = null;
        this.reselectVendors = [];

        this.http.get<any>(`${environment.apiUrl}/vendors?subcategory_id=${service.subcategory_id}`).subscribe({
            next: (res) => {
                // Filter out previous vendor
                this.reselectVendors = (res.data || []).filter((v: any) => v.id !== service.vendor_id);
            },
            error: (err) => console.error('Failed to load replacement vendors', err)
        });
    }

    cancelReselect() {
        this.reselectService = null;
        this.selectedReselectVendorId = null;
        this.reselectVendors = [];
    }

    submitReselectVendor() {
        if (!this.selectedReselectVendorId || !this.reselectService) {
            this.showToast('Please select a replacement vendor', 'warning');
            return;
        }

        const orderId = this.order.rawId || this.order.id;
        this.orderService.reselectVendor(orderId, this.reselectService.id, {
            vendor_id: Number(this.selectedReselectVendorId)
        }).subscribe({
            next: (res) => {
                this.showToast('Replacement vendor selected. Request sent.', 'success');
                this.cancelReselect();
                this.orderUpdated.emit(res.data);
            },
            error: (err) => {
                const msg = err.error?.message || 'Failed to reselect vendor';
                this.showToast(msg, 'danger');
            }
        });
    }

    private async showToast(message: string, color: string = 'dark') {
        const toast = await this.toastCtrl.create({
            message,
            duration: 3000,
            position: 'top',
            color
        });
        await toast.present();
    }
}
