import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
    selector: 'app-order-success',
    templateUrl: './order-success.page.html',
    styleUrls: ['./order-success.page.scss'],
})
export class OrderSuccessPage implements OnInit {
    orderId = '';

    constructor(private router: Router) {
        const navigation = this.router.getCurrentNavigation();
        if (navigation?.extras.state) {
            this.orderId = navigation.extras.state['orderId'];
        }
    }

    ngOnInit() { }

    goToHome() {
        this.router.navigate(['/tabs/home']);
    }

    viewOrders() {
        this.router.navigate(['/tabs/orders']);
    }
}
