import { AfterViewInit, Component, ElementRef, EventEmitter, Input, NgZone, OnDestroy, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { MapsService, PickedLocation } from '../../services/maps.service';

/**
 * Google Maps site picker: search an address, use the current location, or drag the pin.
 * Renders nothing until a Google Maps key is configured on the API.
 */
@Component({
    selector: 'app-site-location-picker',
    standalone: true,
    imports: [CommonModule, IonicModule],
    template: `
        <div class="slp-card" *ngIf="available">
            <div class="slp-head">
                <div class="slp-title">
                    <ion-icon name="location"></ion-icon>
                    <span>{{ title }}</span>
                </div>
                <button type="button" class="slp-locate" (click)="useCurrentLocation()" [disabled]="locating">
                    <ion-icon [name]="locating ? 'hourglass-outline' : 'locate-outline'"></ion-icon>
                    <span>{{ locating ? 'Locating...' : 'Use my current location' }}</span>
                </button>
            </div>
            <div class="slp-search" #searchHost></div>
            <div class="slp-map" #mapHost></div>
            <p class="slp-picked" *ngIf="picked">
                <ion-icon name="pin"></ion-icon>
                <span>{{ picked.formattedAddress || (picked.latitude + ', ' + picked.longitude) }}</span>
            </p>
            <p class="slp-hint" *ngIf="!error">Search your site, or drag the pin to the exact entrance. We fill Area, City, State and Pincode for you.</p>
            <p class="slp-error" *ngIf="error">{{ error }}</p>
        </div>
    `,
    styles: [`
        .slp-card { color-scheme: light; display: flex; flex-direction: column; gap: 10px; padding: 14px; margin: 4px 0 16px; border: 1px solid #e2e8f0; border-radius: 14px; background: #ffffff; }
        .slp-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
        .slp-title { display: inline-flex; align-items: center; gap: 6px; font-weight: 800; font-size: 13.5px; color: #0f172a; }
        .slp-title ion-icon { color: #ea580c; font-size: 18px; }
        .slp-locate { display: inline-flex; align-items: center; gap: 6px; border: 1px solid #bfdbfe; background: #eff6ff; color: #1d4ed8; font-size: 12.5px; font-weight: 700; padding: 7px 12px; border-radius: 9px; cursor: pointer; }
        .slp-locate:disabled { opacity: 0.7; cursor: progress; }
        .slp-search { width: 100%; }
        .slp-search > * { width: 100%; color-scheme: light; }
        .slp-map { width: 100%; height: 230px; border-radius: 12px; overflow: hidden; background: #f1f5f9; border: 1px solid #e2e8f0; }
        .slp-picked { display: flex; align-items: flex-start; gap: 6px; margin: 0; font-size: 12.5px; color: #0f172a; font-weight: 600; line-height: 1.4; }
        .slp-picked ion-icon { color: #ea580c; flex-shrink: 0; margin-top: 2px; }
        .slp-hint { margin: 0; font-size: 12px; color: #64748b; }
        .slp-error { margin: 0; font-size: 12px; color: #dc2626; }
        @media (max-width: 600px) { .slp-map { height: 200px; } .slp-locate { width: 100%; justify-content: center; } }
    `]
})
export class SiteLocationPickerComponent implements AfterViewInit, OnDestroy {
    @Input() title = 'Pin your site location';
    @Input() latitude: number | null = null;
    @Input() longitude: number | null = null;
    @Output() locationPicked = new EventEmitter<PickedLocation>();

    @ViewChild('searchHost') searchHost?: ElementRef<HTMLDivElement>;
    @ViewChild('mapHost') mapHost?: ElementRef<HTMLDivElement>;

    available = false;
    locating = false;
    error = '';
    picked: PickedLocation | null = null;

    private maps: any = null;
    private map: any = null;
    private marker: any = null;
    private geocoder: any = null;
    private destroyed = false;

    constructor(private mapsService: MapsService, private zone: NgZone) { }

    async ngAfterViewInit() {
        const maps = await this.mapsService.load();
        const cfg = await this.mapsService.getConfig();
        if (!maps || !cfg || this.destroyed) return;
        this.maps = maps;
        this.zone.run(() => { this.available = true; });
        // Wait for the *ngIf content to render
        await new Promise(r => setTimeout(r));
        if (this.destroyed || !this.mapHost || !this.searchHost) return;

        try {
            const [{ Map }, { AdvancedMarkerElement }, places, { Geocoder }] = await Promise.all([
                maps.importLibrary('maps'), maps.importLibrary('marker'), maps.importLibrary('places'), maps.importLibrary('geocoding')
            ]);
            const hasStart = this.latitude != null && this.longitude != null && !isNaN(Number(this.latitude)) && !isNaN(Number(this.longitude));
            const start = hasStart ? { lat: Number(this.latitude), lng: Number(this.longitude) } : { lat: 17.385, lng: 78.4867 };

            this.map = new Map(this.mapHost.nativeElement, {
                center: start, zoom: hasStart ? 17 : 11, mapId: cfg.mapId,
                streetViewControl: false, mapTypeControl: false, fullscreenControl: false, clickableIcons: false
            });
            this.marker = new AdvancedMarkerElement({ map: this.map, position: start, gmpDraggable: true, title: 'Site location' });
            this.marker.addListener('dragend', () => {
                const p = this.marker.position;
                this.reverseGeocode(this.coord(p, 'lat'), this.coord(p, 'lng'));
            });
            this.map.addListener('click', (e: any) => {
                if (!e?.latLng) return;
                const lat = this.coord(e.latLng, 'lat'), lng = this.coord(e.latLng, 'lng');
                this.moveTo(lat, lng, false);
                this.reverseGeocode(lat, lng);
            });
            this.geocoder = new Geocoder();

            const search = new places.PlaceAutocompleteElement({ includedRegionCodes: ['in'] });
            search.setAttribute('placeholder', 'Search site address, building or area');
            this.searchHost.nativeElement.appendChild(search);
            const onPlace = async (place: any) => {
                if (!place) return;
                try {
                    await place.fetchFields({ fields: ['addressComponents', 'location', 'formattedAddress'] });
                    if (!place.location) return;
                    const lat = this.coord(place.location, 'lat'), lng = this.coord(place.location, 'lng');
                    this.moveTo(lat, lng, true);
                    this.emit(this.mapsService.toPickedLocation(place.addressComponents || [], lat, lng, place.formattedAddress));
                } catch (err) {
                    console.error('Place lookup failed:', err);
                    this.zone.run(() => { this.error = 'Could not load that address. Try again or drag the pin.'; });
                }
            };
            search.addEventListener('gmp-select', (ev: any) => onPlace(ev.placePrediction?.toPlace?.()));
            search.addEventListener('gmp-placeselect', (ev: any) => onPlace(ev.place));
        } catch (err) {
            console.error('Google Maps failed to start:', err);
            this.zone.run(() => { this.error = 'Map could not load. You can still type the address below.'; });
        }
    }

    ngOnDestroy() {
        this.destroyed = true;
    }

    useCurrentLocation() {
        if (!navigator.geolocation) {
            this.error = 'Location is not available on this device. Search the address instead.';
            return;
        }
        this.locating = true;
        this.error = '';
        navigator.geolocation.getCurrentPosition(pos => {
            this.zone.run(() => { this.locating = false; });
            this.moveTo(pos.coords.latitude, pos.coords.longitude, true);
            this.reverseGeocode(pos.coords.latitude, pos.coords.longitude);
        }, () => {
            this.zone.run(() => {
                this.locating = false;
                this.error = 'Could not get your location. Allow location access, or search the address.';
            });
        }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 });
    }

    private moveTo(lat: number, lng: number, zoomIn: boolean) {
        if (!this.map || !this.marker) return;
        const pos = { lat, lng };
        this.marker.position = pos;
        this.map.panTo(pos);
        if (zoomIn) this.map.setZoom(17);
    }

    private async reverseGeocode(lat: number, lng: number) {
        try {
            const res = await this.geocoder.geocode({ location: { lat, lng } });
            const best = res?.results?.[0];
            this.emit(this.mapsService.toPickedLocation(best?.address_components || [], lat, lng, best?.formatted_address || ''));
        } catch (err) {
            // Keep the pinned coordinates even if the address lookup fails
            this.emit(this.mapsService.toPickedLocation([], lat, lng, ''));
        }
    }

    private emit(loc: PickedLocation) {
        this.zone.run(() => {
            this.picked = loc;
            this.error = '';
            this.locationPicked.emit(loc);
        });
    }

    /** Works for google.maps.LatLng (methods) and plain {lat, lng} objects. */
    private coord(point: any, key: 'lat' | 'lng'): number {
        return typeof point?.[key] === 'function' ? point[key]() : Number(point?.[key]);
    }
}
