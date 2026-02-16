import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { HelpersPageRoutingModule } from './helpers-routing.module';
import { HelpersPage } from './helpers.page';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        HelpersPageRoutingModule
    ],
    declarations: [HelpersPage]
})
export class HelpersPageModule { }
