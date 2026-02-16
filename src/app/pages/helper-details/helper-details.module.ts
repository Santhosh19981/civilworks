import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { HelperDetailsPageRoutingModule } from './helper-details-routing.module';

import { HelperDetailsPage } from './helper-details.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    HelperDetailsPageRoutingModule
  ],
  declarations: [HelperDetailsPage]
})
export class HelperDetailsPageModule {}
