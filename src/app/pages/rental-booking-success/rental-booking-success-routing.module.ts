import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { RentalBookingSuccessPage } from './rental-booking-success.page';

const routes: Routes = [
    {
        path: '',
        component: RentalBookingSuccessPage
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class RentalBookingSuccessPageRoutingModule { }
