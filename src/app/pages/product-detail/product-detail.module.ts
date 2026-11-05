import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ProductDetailPage } from './product-detail.page';
import { RouterModule, Routes } from '@angular/router';
import { NavDropdownComponent } from '../../components/nav-dropdown/nav-dropdown.component';

const routes: Routes = [
    {
        path: '',
        component: ProductDetailPage
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
    declarations: [ProductDetailPage]
})
export class ProductDetailPageModule { }
