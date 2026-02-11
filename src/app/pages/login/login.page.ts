import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-login',
    templateUrl: './login.page.html',
    styleUrls: ['./login.page.scss'],
})
export class LoginPage {
    step: 'phone' | 'otp' = 'phone';
    phoneOrEmail = '';
    otp = '';
    returnUrl = '/tabs/home';

    constructor(
        private authService: AuthService,
        private router: Router,
        private route: ActivatedRoute,
        private toastController: ToastController
    ) {
        this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/tabs/home';
    }

    async sendOTP() {
        if (this.phoneOrEmail.trim()) {
            this.step = 'otp';
            const toast = await this.toastController.create({
                message: 'OTP sent! Use 1234 to login',
                duration: 3000,
                position: 'bottom',
                color: 'success'
            });
            await toast.present();
        }
    }

    async verifyOTP() {
        const success = this.authService.login(this.phoneOrEmail, this.otp);

        if (success) {
            const toast = await this.toastController.create({
                message: 'Login successful!',
                duration: 2000,
                position: 'bottom',
                color: 'success',
                icon: 'checkmark-circle'
            });
            await toast.present();

            this.router.navigateByUrl(this.returnUrl);
        } else {
            const toast = await this.toastController.create({
                message: 'Invalid OTP. Please use 1234',
                duration: 2000,
                position: 'bottom',
                color: 'danger',
                icon: 'close-circle'
            });
            await toast.present();
        }
    }

    goBack() {
        if (this.step === 'otp') {
            this.step = 'phone';
            this.otp = '';
        } else {
            this.router.navigate(['/tabs/home']);
        }
    }
}
