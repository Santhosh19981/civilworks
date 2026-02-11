import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
    selector: 'app-splash',
    templateUrl: './splash.page.html',
    styleUrls: ['./splash.page.scss'],
})
export class SplashPage implements OnInit {

    constructor(private router: Router) { }

    ngOnInit() {
        // Navigate to tabs after 3 seconds
        setTimeout(() => {
            this.router.navigateByUrl('/tabs/home', { replaceUrl: true });
        }, 3000);
    }
}
