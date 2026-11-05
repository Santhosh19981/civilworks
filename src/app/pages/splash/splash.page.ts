import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-splash',
    templateUrl: './splash.page.html',
    styleUrls: ['./splash.page.scss'],
})
export class SplashPage implements OnInit {

    constructor(
        private router: Router,
        private authService: AuthService
    ) { }

    ngOnInit() {
        const isAuth = this.authService.isAuthenticated();
        const delay = isAuth ? 400 : 1000;
        setTimeout(() => {
            if (this.authService.isAuthenticated()) {
                this.router.navigateByUrl('/sector-select', { replaceUrl: true });
            } else {
                this.router.navigateByUrl('/login', { replaceUrl: true });
            }
        }, delay);
    }

}
