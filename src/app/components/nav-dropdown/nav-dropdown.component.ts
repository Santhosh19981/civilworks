import { Component, OnInit, OnDestroy, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-nav-dropdown',
    standalone: true,
    imports: [CommonModule, IonicModule],
    templateUrl: './nav-dropdown.component.html',
    styleUrls: ['./nav-dropdown.component.scss']
})
export class NavDropdownComponent implements OnInit, OnDestroy {
    isOpen = false;
    currentUrl = '';
    activeSectorName = 'Construction';
    private routerSub?: Subscription;

    constructor(
        private router: Router,
        private elementRef: ElementRef
    ) { }

    ngOnInit() {
        this.currentUrl = this.router.url;
        this.loadActiveSector();

        this.routerSub = this.router.events
            .pipe(filter(e => e instanceof NavigationEnd))
            .subscribe((e: any) => {
                this.currentUrl = e.urlAfterRedirects || e.url;
                this.loadActiveSector();
                this.isOpen = false;
            });
    }

    ngOnDestroy() {
        this.routerSub?.unsubscribe();
    }

    loadActiveSector() {
        this.activeSectorName = localStorage.getItem('selectedSectorName') || 'Construction';
    }

    toggle() {
        this.isOpen = !this.isOpen;
        if (this.isOpen) {
            this.loadActiveSector();
        }
    }

    close() {
        this.isOpen = false;
    }

    navigate(url: string) {
        this.isOpen = false;
        this.router.navigateByUrl(url);
    }

    isActive(url: string): boolean {
        return this.currentUrl.startsWith(url);
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent) {
        if (this.isOpen && !this.elementRef.nativeElement.contains(event.target)) {
            this.isOpen = false;
        }
    }

    @HostListener('document:keydown.escape')
    onEscape() {
        this.isOpen = false;
    }
}
