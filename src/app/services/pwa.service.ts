import { Injectable, ApplicationRef } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { BehaviorSubject, filter, first } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class PwaService {
    private deferredPrompt: any = null;
    public showInstallPrompt$ = new BehaviorSubject<boolean>(false);
    public isIosDevice = false;
    public isStandalone = false;

    constructor(
        private swUpdate: SwUpdate,
        private appRef: ApplicationRef
    ) {
        this.initPwa();
    }

    private initPwa() {
        if (typeof window === 'undefined') return;

        // 1. Check if running in standalone mode (already installed PWA)
        const isStandaloneMatch = window.matchMedia('(display-mode: standalone)').matches;
        const isIosStandalone = (window.navigator as any).standalone === true;
        this.isStandalone = isStandaloneMatch || isIosStandalone;

        // 2. Check iOS
        const userAgent = window.navigator.userAgent.toLowerCase();
        this.isIosDevice = /iphone|ipad|ipod/.test(userAgent) && !this.isStandalone;

        // 3. Listen for Android/Chromium beforeinstallprompt
        window.addEventListener('beforeinstallprompt', (e: Event) => {
            e.preventDefault();
            this.deferredPrompt = e;
            const dismissedAt = localStorage.getItem('cw_pwa_dismissed');
            const now = Date.now();
            // Don't show if user dismissed within the last 2 days
            if (!dismissedAt || now - parseInt(dismissedAt, 10) > 2 * 24 * 60 * 60 * 1000) {
                if (!this.isStandalone) {
                    this.showInstallPrompt$.next(true);
                }
            }
        });

        // 4. Listen for appinstalled event
        window.addEventListener('appinstalled', () => {
            this.deferredPrompt = null;
            this.showInstallPrompt$.next(false);
            console.log('CivilWorks PWA successfully installed!');
        });

        // 5. Automatic updates handling with SwUpdate
        if (this.swUpdate.isEnabled) {
            this.swUpdate.versionUpdates
                .pipe(filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY'))
                .subscribe(() => {
                    console.log('New CivilWorks update available, reloading to apply latest version...');
                    this.swUpdate.activateUpdate().then(() => document.location.reload());
                });

            // Periodically check for updates once application is stable
            this.appRef.isStable.pipe(first(isStable => isStable === true)).subscribe(() => {
                this.swUpdate.checkForUpdate().catch(() => {});
            });
        }
    }

    public installApp(): Promise<boolean> {
        if (!this.deferredPrompt) {
            return Promise.resolve(false);
        }

        this.deferredPrompt.prompt();
        return this.deferredPrompt.userChoice.then((choiceResult: { outcome: string }) => {
            if (choiceResult.outcome === 'accepted') {
                this.deferredPrompt = null;
                this.showInstallPrompt$.next(false);
                return true;
            }
            return false;
        });
    }

    public dismissInstallPrompt() {
        this.showInstallPrompt$.next(false);
        if (typeof window !== 'undefined') {
            localStorage.setItem('cw_pwa_dismissed', Date.now().toString());
        }
    }
}

