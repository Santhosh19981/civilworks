import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HelperDetailsPage } from './helper-details.page';

const routes: Routes = [
  {
    path: '',
    component: HelperDetailsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HelperDetailsPageRoutingModule {}
