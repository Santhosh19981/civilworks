import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';

@Component({
    selector: 'app-profile',
    templateUrl: './profile.page.html',
    styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements OnInit {
    user: User | null = null;

    constructor(
        private authService: AuthService,
        private router: Router,
        private alertController: AlertController
    ) { }

    ngOnInit() {
        this.authService.user$.subscribe(user => {
            this.user = user;
        });
    }

    async logout() {
        const alert = await this.alertController.create({
            header: 'Logout',
            message: 'Are you sure you want to logout?',
            buttons: [
                {
                    text: 'Cancel',
                    role: 'cancel'
                },
                {
                    text: 'Logout',
                    role: 'destructive',
                    handler: () => {
                        this.authService.logout();
                        this.router.navigate(['/tabs/home']);
                    }
                }
            ]
        });

        await alert.present();
    }
}
