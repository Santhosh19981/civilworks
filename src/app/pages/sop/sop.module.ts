import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { SOPPageRoutingModule } from './sop-routing.module';
import { SOPPage } from './sop.page';
import { ChatPanelComponent } from '../../components/chat-panel/chat-panel.component';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        SOPPageRoutingModule,
        ChatPanelComponent
    ],
    declarations: [SOPPage]
})
export class SOPPageModule { }
