import { Component, OnInit } from '@angular/core';
import { PickedLocation } from '../../services/maps.service';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { AlertController, ToastController } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';
import { OrderService } from '../../services/order.service';
import { CartService } from '../../services/cart.service';
import { User } from '../../models/user.model';

@Component({
    selector: 'app-profile',
    templateUrl: './profile.page.html',
    styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements OnInit {
    user: User | null = null;
    activeSectorName: string = 'Construction';
    activeSectorId: number = 1;
    totalOrdersCount: number = 0;
    cartCount: number = 0;

    // Interactive preferences
    preferences = {
        whatsappAlerts: true,
        smsGatePass: true,
        materialPriceUpdates: false
    };

    // Edit Profile Modal
    isEditModalOpen: boolean = false;
    isSaving: boolean = false;
    editForm = {
        name: '',
        email: '',
        phone: '',
        flat_no: '',
        landmark: '',
        area_locality: '',
        delivery_address: ''
    };
    /** Location pinned on Google Maps in the edit form (saved with the profile address). */
    editLocation: { latitude: number | null; longitude: number | null; city: string; state: string; pincode: string } =
        { latitude: null, longitude: null, city: '', state: '', pincode: '' };

    constructor(
        private authService: AuthService,
        private orderService: OrderService,
        private cartService: CartService,
        private router: Router,
        private alertController: AlertController,
        private toastController: ToastController,
        private location: Location
    ) { }

    ngOnInit() {
        this.authService.user$.subscribe(user => {
            this.user = user;
            if (user && user.preferences) {
                this.preferences = { ...this.preferences, ...user.preferences };
            }
        });
        this.authService.checkAuth().subscribe();
        this.loadProfileData();
        this.loadSavedPreferences();
    }

    ionViewWillEnter() {
        const currentUser = this.authService.getUser();
        if (!currentUser || !this.authService.isAuthenticated()) {
            this.user = null;
            return;
        }
        this.user = currentUser;
        this.authService.checkAuth().subscribe();
        this.loadProfileData();
    }

    loadProfileData() {
        this.activeSectorName = localStorage.getItem('selectedSectorName') || 'Construction';
        this.activeSectorId = Number(localStorage.getItem('selectedSectorId')) || 1;
        this.cartCount = this.cartService.getCartCount();

        const currentUserId = this.user?.id;

        // Strictly isolate orders to the current logged-in customer ID
        this.orderService.getMyOrders().subscribe({
            next: (apiOrders: any[]) => {
                this.totalOrdersCount = (apiOrders || []).length;
            },
            error: () => {
                let count = 0;
                try {
                    const localProducts = JSON.parse(localStorage.getItem('civilworks_product_orders') || '[]');
                    const localRentals = JSON.parse(localStorage.getItem('civilworks_rental_bookings') || '[]');
                    const localHelpers = JSON.parse(localStorage.getItem('civilworks_helper_bookings') || '[]');
                    const filteredProducts = localProducts.filter((p: any) => currentUserId ? (p.user_id && p.user_id == currentUserId) : false);
                    const filteredRentals = localRentals.filter((r: any) => currentUserId ? (r.user_id && r.user_id == currentUserId) : false);
                    const filteredHelpers = localHelpers.filter((h: any) => currentUserId ? (h.user_id && h.user_id == currentUserId) : false);
                    count = filteredProducts.length + filteredRentals.length + filteredHelpers.length;
                } catch (e) {
                    count = 0;
                }
                this.totalOrdersCount = count;
            }
        });
    }

    loadSavedPreferences() {
        try {
            const saved = localStorage.getItem('civilworks_profile_prefs');
            if (saved) {
                this.preferences = { ...this.preferences, ...JSON.parse(saved) };
            }
        } catch (e) { }
    }

    togglePreference(key: 'whatsappAlerts' | 'smsGatePass' | 'materialPriceUpdates') {
        this.preferences[key] = !this.preferences[key];
        localStorage.setItem('civilworks_profile_prefs', JSON.stringify(this.preferences));

        // Persist preference updates to database
        if (this.user) {
            this.authService.updateUserProfile({ preferences: this.preferences }).subscribe({
                next: () => {},
                error: () => {}
            });
        }

        this.showToastNotification(
            this.preferences[key] ? 'Preference enabled' : 'Preference disabled'
        );
    }

    openEditModal() {
        const userPrefs = this.user?.preferences || this.preferences || {};
        let flat_no = userPrefs.flat_no || userPrefs.address?.flat_no || '';
        let landmark = userPrefs.landmark || userPrefs.address?.landmark || '';
        let area_locality = userPrefs.area_locality || userPrefs.address?.area_locality || '';

        // If not found in preferences, parse components from site_location
        if (!flat_no && !landmark && !area_locality && this.user?.site_location) {
            const parts = this.user.site_location.split(',').map((p: string) => p.trim());
            if (parts.length >= 3) {
                flat_no = parts[0];
                landmark = parts[1];
                area_locality = parts.slice(2).join(', ');
            } else if (parts.length === 2) {
                flat_no = parts[0];
                area_locality = parts[1];
            } else if (parts.length === 1) {
                flat_no = parts[0];
            }
        }

        const combinedAddress = [flat_no, landmark, area_locality].map(s => s?.trim()).filter(Boolean).join(', ') 
            || this.user?.site_location || '';

        this.editForm = {
            name: this.user?.name || '',
            email: this.user?.email || '',
            phone: this.user?.mobile || this.user?.phone || '',
            flat_no: flat_no,
            landmark: landmark,
            area_locality: area_locality,
            delivery_address: combinedAddress
        };
        this.editLocation = {
            latitude: userPrefs.latitude ?? null,
            longitude: userPrefs.longitude ?? null,
            city: userPrefs.city || '',
            state: userPrefs.state || '',
            pincode: userPrefs.pincode || ''
        };
        this.isEditModalOpen = true;
    }

    /** Address picked on Google Maps: fill Area / Locality and remember the exact location. */
    onSiteLocationPicked(loc: PickedLocation) {
        const statePin = [loc.state, loc.pincode].filter(Boolean).join(' ');
        const area = [loc.area, statePin].filter(Boolean).join(', ');
        if (area) this.editForm.area_locality = area.slice(0, 120);
        if (loc.landmark && !this.editForm.landmark) this.editForm.landmark = loc.landmark;
        this.editLocation = {
            latitude: loc.latitude,
            longitude: loc.longitude,
            city: loc.city || this.editLocation.city,
            state: loc.state || this.editLocation.state,
            pincode: loc.pincode || this.editLocation.pincode
        };
    }

    closeEditModal() {
        this.isEditModalOpen = false;
        this.isSaving = false;
    }

    async saveProfile() {
        this.isSaving = true;
        const flatNo = this.editForm.flat_no?.trim() || '';
        const landmark = this.editForm.landmark?.trim() || '';
        const areaLocality = this.editForm.area_locality?.trim() || '';
        const combinedAddress = [flatNo, landmark, areaLocality].filter(Boolean).join(', ');

        const updatedPrefs = {
            ...this.preferences,
            flat_no: flatNo,
            landmark: landmark,
            area_locality: areaLocality,
            ...(this.editLocation.latitude != null && this.editLocation.longitude != null
                ? { latitude: this.editLocation.latitude, longitude: this.editLocation.longitude } : {}),
            ...(this.editLocation.city ? { city: this.editLocation.city } : {}),
            ...(this.editLocation.state ? { state: this.editLocation.state } : {}),
            ...(this.editLocation.pincode ? { pincode: this.editLocation.pincode } : {})
        };

        const updatedData: any = {
            name: this.editForm.name?.trim() || null,
            email: this.editForm.email?.trim() || null,
            mobile: this.editForm.phone?.trim() || this.user?.mobile,
            phone: this.editForm.phone?.trim() || this.user?.mobile,
            site_location: combinedAddress || null,
            designation: null,
            organization: null,
            safety_clearance: null,
            preferences: updatedPrefs
        };

        this.authService.updateUserProfile(updatedData).subscribe({
            next: (res) => {
                this.isSaving = false;
                this.isEditModalOpen = false;
                this.preferences = updatedPrefs;
                localStorage.setItem('civilworks_profile_prefs', JSON.stringify(updatedPrefs));
                const updatedUser = res?.data?.user || res?.data || { ...this.user, ...updatedData };
                updatedUser.preferences = updatedPrefs;
                updatedUser.site_location = combinedAddress;
                this.user = updatedUser;
                this.showToastNotification('Profile updated successfully!', 'success');
            },
            error: (err) => {
                this.isSaving = false;
                const msg = err?.error?.message || 'Failed to update profile. Please try again.';
                this.showToastNotification(msg, 'danger');
            }
        });
    }

    async copyToClipboard(text?: string | null, label: string = 'Text') {
        if (!text) return;
        try {
            if (navigator?.clipboard?.writeText) {
                await navigator.clipboard.writeText(text);
            } else {
                const textArea = document.createElement('textarea');
                textArea.value = text;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
            }
            this.showToastNotification(`${label} copied to clipboard!`, 'success');
        } catch (err) {
            this.showToastNotification(`Copied: ${text}`, 'success');
        }
    }

    async showToastNotification(message: string, color: string = 'dark', showLoginAction: boolean = false) {
        const buttons: any[] = [];
        if (showLoginAction) {
            buttons.push({
                text: 'Sign In',
                handler: () => {
                    this.router.navigate(['/login'], { queryParams: { returnUrl: '/tabs/profile' } });
                }
            });
        }
        buttons.push({ text: 'OK', role: 'cancel' });

        const toast = await this.toastController.create({
            message,
            duration: 3000,
            position: 'bottom',
            color: color === 'success' ? 'success' : (color === 'warning' ? 'warning' : 'dark'),
            buttons
        });
        await toast.present();
    }

    async logout() {
        const alert = await this.alertController.create({
            header: 'Confirm Sign Out',
            subHeader: 'Customer Account',
            message: 'Are you sure you want to sign out of your InfraMart account?',
            cssClass: 'custom-logout-alert',
            buttons: [
                {
                    text: 'Cancel',
                    role: 'cancel',
                    cssClass: 'alert-btn-cancel'
                },
                {
                    text: 'Sign Out',
                    role: 'destructive',
                    cssClass: 'alert-btn-logout',
                    handler: () => {
                        this.authService.logout();
                        this.user = null;
                        this.showToastNotification('You have been signed out successfully.', 'dark', true);
                    }
                }
            ]
        });

        await alert.present();
    }

    getInitials(name?: string): string {
        if (!name || !name.trim()) return 'CW';
        const parts = name.trim().split(' ');
        if (parts.length >= 2 && parts[0] && parts[1]) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.slice(0, 2).toUpperCase();
    }

    goBack() {
        if (window.history.length > 1) {
            this.location.back();
        } else {
            this.router.navigate(['/tabs/home']);
        }
    }
}
