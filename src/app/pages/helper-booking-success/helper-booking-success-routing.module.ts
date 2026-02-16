import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HelperBookingSuccessPage } from './helper-booking-success.page';

const routes: Routes = [
  {
    path: '',
    component: HelperBookingSuccessPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HelperBookingSuccessPageRoutingModule {}
