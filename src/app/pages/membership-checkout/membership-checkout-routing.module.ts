import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MembershipCheckoutPage } from './membership-checkout.page';

const routes: Routes = [
    {
        path: '',
        component: MembershipCheckoutPage
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class MembershipCheckoutPageRoutingModule { }

