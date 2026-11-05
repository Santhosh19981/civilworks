import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { HomePage } from './home.page';
import { RouterModule, Routes } from '@angular/router';
import { NavDropdownComponent } from '../../components/nav-dropdown/nav-dropdown.component';
import { ChatPanelComponent } from '../../components/chat-panel/chat-panel.component';
import { EditOrderModalComponent } from '../../components/edit-order-modal/edit-order-modal.component';

const routes: Routes = [
    {
        path: '',
        component: HomePage
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
    declarations: [HomePage]
})
export class HomePageModule { }
