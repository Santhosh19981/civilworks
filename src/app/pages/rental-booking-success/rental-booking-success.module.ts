import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RentalBookingSuccessPageRoutingModule } from './rental-booking-success-routing.module';
import { RentalBookingSuccessPage } from './rental-booking-success.page';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        RentalBookingSuccessPageRoutingModule
    ],
    declarations: [RentalBookingSuccessPage]
})
export class RentalBookingSuccessPageModule { }
