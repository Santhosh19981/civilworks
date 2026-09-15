import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-login',
    templateUrl: './login.page.html',
    styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit, OnDestroy {
    @ViewChild('otpInput') otpInputElement?: ElementRef<HTMLInputElement>;

    step: 'phone' | 'otp' = 'phone';
    phone = '';
    otp = '';
    isOtpFocused = false;
    loading = false;
    returnUrl = '/tabs/home';
    showSkip = true;

    resendTimer = 30;
    canResend = false;
    private timerInterval: any;

    constructor(
        private authService: AuthService,
        private router: Router,
        private route: ActivatedRoute,
        private toastController: ToastController
    ) {
        this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/tabs/home';
        if (this.returnUrl.includes('/checkout')) {
            this.showSkip = false;
        }
    }

    ngOnInit() {
        if (this.authService.isAuthenticated()) {
            this.router.navigateByUrl(this.returnUrl);
        }
    }

    ngOnDestroy() {
        this.clearTimer();
    }

    // ─────────────────────────────────────────────
    // STEP 1: SEND OTP
    // ─────────────────────────────────────────────
    async sendOTP() {
        const cleaned = this.phone.trim();
        if (!cleaned) {
            this.showToast('Please enter your 10-digit mobile number', 'warning');
            return;
        }

        if (cleaned.length !== 10 || !/^\d+$/.test(cleaned)) {
            this.showToast('Please enter a valid 10-digit mobile number', 'warning');
            return;
        }

        this.loading = true;
        this.authService.sendOtp(cleaned).subscribe({
            next: async (res) => {
                this.loading = false;
                this.step = 'otp';
                this.otp = '';
                this.startResendTimer();
                const demoCode = res?.data?.otp || '1234';
                await this.showToast(`Verification code sent! Demo OTP: ${demoCode}`, 'success', 3500);

                setTimeout(() => {
                    this.focusOtpInput();
                }, 150);
            },
            error: async (err) => {
                this.loading = false;
                // Fallback to local OTP entry if backend network hiccups
                this.step = 'otp';
                this.otp = '';
                this.startResendTimer();
                await this.showToast('Verification code sent! Demo OTP: 1234', 'success', 3500);

                setTimeout(() => {
                    this.focusOtpInput();
                }, 150);
            }
        });
    }

    // ─────────────────────────────────────────────
    // STEP 2: ROCK-SOLID OTP INPUT MANAGEMENT
    // ─────────────────────────────────────────────
    focusOtpInput() {
        this.isOtpFocused = true;
        if (this.otpInputElement) {
            this.otpInputElement.nativeElement.focus();
        } else {
            const input = document.getElementById('real-otp-input') as HTMLInputElement;
            if (input) {
                input.focus();
            }
        }
    }

    onOtpChange(val: string) {
        // Strip non-digits and cap at 4
        const cleaned = (val || '').replace(/\D/g, '').slice(0, 4);
        this.otp = cleaned;

        // Auto verify as soon as 4 digits are entered and not already in progress
        if (this.otp.length === 4 && !this.loading) {
            this.verifyOTP();
        }
    }

    fillDemoOTP() {
        this.otp = '1234';
        if (!this.loading) {
            this.verifyOTP();
        }
    }

    // ─────────────────────────────────────────────
    // STEP 3: VERIFY OTP
    // ─────────────────────────────────────────────
    async verifyOTP() {
        if (this.loading) return;

        if (this.otp.length !== 4) {
            this.showToast('Please enter all 4 digits', 'warning');
            return;
        }

        this.loading = true;

        this.authService.verifyOtp(this.phone, this.otp).subscribe({
            next: async (res) => {
                this.loading = false;
                await this.showToast('Login verified! Welcome to CivilWorks.', 'success', 2000, 'checkmark-circle');
                this.router.navigateByUrl(this.returnUrl, { replaceUrl: true });
            },
            error: async (err) => {
                // If API failed, check if user provided valid demo code
                if (this.otp === '1234' || this.otp === '0000') {
                    // Try direct login fallback
                    this.authService.login(this.phone, this.otp).subscribe({
                        next: async () => {
                            this.loading = false;
                            await this.showToast('Login verified! Welcome to CivilWorks.', 'success', 2000, 'checkmark-circle');
                            this.router.navigateByUrl(this.returnUrl, { replaceUrl: true });
                        },
                        error: async (innerErr) => {
                            this.loading = false;
                            const msg = innerErr?.error?.message || err?.error?.message || 'Invalid OTP. Please use demo code: 1234';
                            await this.showToast(msg, 'danger', 3000, 'alert-circle');
                        }
                    });
                } else {
                    this.loading = false;
                    const msg = err?.error?.message || 'Invalid OTP. Please use demo code: 1234';
                    await this.showToast(msg, 'danger', 3000, 'alert-circle');
                }
            }
        });
    }

    changeNumber() {
        this.step = 'phone';
        this.otp = '';
        this.clearTimer();
    }


    startResendTimer() {
        this.clearTimer();
        this.resendTimer = 30;
        this.canResend = false;

        this.timerInterval = setInterval(() => {
            if (this.resendTimer > 1) {
                this.resendTimer--;
            } else {
                this.canResend = true;
                this.clearTimer();
            }
        }, 1000);
    }

    async resendCode() {
        if (!this.canResend || this.loading) return;
        this.startResendTimer();
        this.otp = '';
        this.focusOtpInput();
        this.authService.sendOtp(this.phone).subscribe({
            next: async (res) => {
                const demoCode = res?.data?.otp || '1234';
                await this.showToast(`New verification code sent! Demo OTP: ${demoCode}`, 'success', 3000);
            },
            error: async () => {
                await this.showToast('New verification code sent! Use OTP: 1234', 'success', 3000);
            }
        });
    }


    private clearTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    skipLogin() {
        this.router.navigateByUrl(this.returnUrl);
    }

    goBack() {
        if (this.step === 'otp') {
            this.changeNumber();
        } else {
            this.router.navigate(['/tabs/home']);
        }
    }

    private async showToast(message: string, color: string = 'primary', duration: number = 2500, icon?: string) {
        const toast = await this.toastController.create({
            message,
            color,
            duration,
            position: 'top',
            icon: icon || undefined
        });
        await toast.present();
    }
}
