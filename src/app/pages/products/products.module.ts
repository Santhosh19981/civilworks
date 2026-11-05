import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ProductsPage } from './products.page';
import { RouterModule, Routes } from '@angular/router';
import { NavDropdownComponent } from '../../components/nav-dropdown/nav-dropdown.component';

const routes: Routes = [
    {
        path: '',
        component: ProductsPage
    }
];

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        RouterModule.forChild(routes),
        NavDropdownComponent
    ],
    declarations: [ProductsPage]
})
export class ProductsPageModule { }
