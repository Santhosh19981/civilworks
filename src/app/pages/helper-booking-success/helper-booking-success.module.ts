import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { HelperBookingSuccessPageRoutingModule } from './helper-booking-success-routing.module';

import { HelperBookingSuccessPage } from './helper-booking-success.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    HelperBookingSuccessPageRoutingModule
  ],
  declarations: [HelperBookingSuccessPage]
})
export class HelperBookingSuccessPageModule {}
