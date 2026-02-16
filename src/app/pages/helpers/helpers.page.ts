import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HelperService } from '../../services/helper.service';
import { Helper } from '../../models/helper.model';

@Component({
    selector: 'app-helpers',
    templateUrl: './helpers.page.html',
    styleUrls: ['./helpers.page.scss'],
})
export class HelpersPage implements OnInit {
    helpers: Helper[] = [];
    loading = true;

    constructor(
        private helperService: HelperService,
        private router: Router
    ) { }

    ngOnInit() {
        this.loadHelpers();
    }

    loadHelpers() {
        this.loading = true;
        setTimeout(() => {
            this.helpers = this.helperService.getHelpers();
            this.loading = false;
        }, 1000);
    }

    handleRefresh(event: any) {
        this.loadHelpers();
        setTimeout(() => {
            event.target.complete();
        }, 1000);
    }

    viewHelper(id: string) {
        this.router.navigate(['/helper-details', id]);
    }
}
