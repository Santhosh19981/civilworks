import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { OrdersPage } from './orders.page';
import { RouterModule, Routes } from '@angular/router';
import { NavDropdownComponent } from '../../components/nav-dropdown/nav-dropdown.component';
import { ChatPanelComponent } from '../../components/chat-panel/chat-panel.component';
import { EditOrderModalComponent } from '../../components/edit-order-modal/edit-order-modal.component';

const routes: Routes = [
    {
        path: '',
        component: OrdersPage
    }
];

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        RouterModule.forChild(routes),
        NavDropdownComponent,
        ChatPanelComponent,
        EditOrderModalComponent
    ],
    declarations: [OrdersPage]
})
export class OrdersPageModule { }
