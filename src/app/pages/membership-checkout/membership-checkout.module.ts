import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { MembershipCheckoutPageRoutingModule } from './membership-checkout-routing.module';
import { MembershipCheckoutPage } from './membership-checkout.page';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        MembershipCheckoutPageRoutingModule
    ],
    declarations: [MembershipCheckoutPage]
})
export class MembershipCheckoutPageModule { }

