import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HelpersPage } from './helpers.page';

const routes: Routes = [
    {
        path: '',
        component: HelpersPage
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class HelpersPageRoutingModule { }
