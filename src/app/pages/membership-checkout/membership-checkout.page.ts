import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastController, AlertController, LoadingController } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-membership-checkout',
    templateUrl: './membership-checkout.page.html',
    styleUrls: ['./membership-checkout.page.scss'],
})
export class MembershipCheckoutPage implements OnInit {
    formData = {
        name: '',
        mobile: '',
        email: '',
        city: '',
        address: ''
    };

    isProcessing = false;
    showRazorpayModal = false;
    selectedRzpMethod: 'upi' | 'card' | 'netbanking' = 'upi';
    returnUrl = '/tabs/products';
    get isLoggedIn(): boolean {
        return this.authService.isAuthenticated();
    }

    goToLogin() {
        this.router.navigate(['/login'], {
            queryParams: { returnUrl: '/membership-checkout?returnUrl=' + encodeURIComponent(this.returnUrl) }
        });
    }

    constructor(
        private authService: AuthService,
        private router: Router,
        private route: ActivatedRoute,
        private toastCtrl: ToastController,
        private alertCtrl: AlertController,
        private loadingCtrl: LoadingController
    ) { }

    ngOnInit() {
        // Read returnUrl from query params if available
        const returnUrlParam = this.route.snapshot.queryParams['returnUrl'];
        if (returnUrlParam) {
            this.returnUrl = returnUrlParam;
        }

        // Prepopulate with logged in user details if available
        const user: any = this.authService.getUser();
        if (user) {
            this.formData.name = user.name || '';
            this.formData.mobile = user.mobile || '';
            this.formData.email = user.email || '';
            this.formData.city = user.site_location || user.city || '';
        }
    }

    goBack() {
        this.router.navigateByUrl(this.returnUrl);
    }

    async startRazorpayPayment() {
        if (!this.formData.name.trim() || !this.formData.mobile.trim()) {
            const toast = await this.toastCtrl.create({
                message: 'Please fill in your Name and Mobile Number.',
                duration: 2500,
                color: 'warning',
                position: 'top'
            });
            toast.present();
            return;
        }

        // If user is not authenticated, redirect to login with OTP
        if (!this.authService.isAuthenticated()) {
            const toast = await this.toastCtrl.create({
                message: 'Please log in with OTP first to activate your Plus Membership.',
                duration: 2500,
                color: 'primary',
                position: 'top'
            });
            toast.present();
            this.router.navigate(['/login'], {
                queryParams: { returnUrl: '/membership-checkout?returnUrl=' + encodeURIComponent(this.returnUrl) }
            });
            return;
        }

        // Open Razorpay Demo modal
        this.showRazorpayModal = true;
    }

    async completeDemoPayment() {
        this.isProcessing = true;
        const fakePaymentId = 'pay_rzp_demo_' + Math.random().toString(36).substring(2, 10).toUpperCase();

        const loading = await this.loadingCtrl.create({
            message: 'Processing payment with Razorpay...',
            spinner: 'crescent'
        });
        await loading.present();

        this.authService.upgradeMembership({
            plan: 'annual_plus',
            payment_id: fakePaymentId,
            amount: 999
        }).subscribe({
            next: async (res) => {
                await loading.dismiss();
                this.isProcessing = false;
                this.showRazorpayModal = false;

                const alert = await this.alertCtrl.create({
                    header: '🎉 Welcome to Plus!',
                    subHeader: 'InfraMart Plus Membership Activated',
                    message: 'Your payment was successful. You now have full access to select vendors and book all services directly.',
                    buttons: [
                        {
                            text: 'Start Booking Now',
                            handler: () => {
                                this.router.navigateByUrl(this.returnUrl);
                            }
                        }
                    ]
                });
                await alert.present();
            },
            error: async (err) => {
                await loading.dismiss();
                this.isProcessing = false;
                console.error('Membership activation error:', err);
                const toast = await this.toastCtrl.create({
                    message: err?.error?.message || 'Payment processing failed. Please try again.',
                    duration: 3500,
                    color: 'danger',
                    position: 'top'
                });
                toast.present();
            }
        });
    }
}
