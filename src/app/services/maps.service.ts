import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface MapsConfig {
    enabled: boolean;
    apiKey: string | null;
    mapId: string;
    region: string;
}

/** A place picked on the map or from address search, split into the app's address fields. */
export interface PickedLocation {
    latitude: number;
    longitude: number;
    formattedAddress: string;
    area: string;
    city: string;
    state: string;
    pincode: string;
    landmark: string;
}

/**
 * Loads the Google Maps JavaScript API once, using the key served by the API (/config/maps).
 * Resolves to null when no key is configured, so map features simply stay hidden.
 */
@Injectable({ providedIn: 'root' })
export class MapsService {
    private configPromise: Promise<MapsConfig | null> | null = null;
    private loadPromise: Promise<any | null> | null = null;

    constructor(private http: HttpClient) { }

    getConfig(): Promise<MapsConfig | null> {
        if (!this.configPromise) {
            this.configPromise = firstValueFrom(this.http.get<any>(`${environment.apiUrl}/config/maps`))
                .then(res => (res?.data?.enabled && res.data.apiKey ? res.data as MapsConfig : null))
                .catch(() => null);
        }
        return this.configPromise;
    }

    /** google.maps namespace, or null when maps are not configured or fail to load. */
    load(): Promise<any | null> {
        if (!this.loadPromise) {
            this.loadPromise = this.getConfig().then(cfg => {
                if (!cfg) return null;
                const w = window as any;
                if (w.google?.maps?.importLibrary) return w.google.maps;
                return new Promise(resolve => {
                    const cb = '__inframartMapsReady';
                    w[cb] = () => resolve(w.google?.maps || null);
                    const s = document.createElement('script');
                    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(cfg.apiKey!)}&v=weekly&loading=async&region=${cfg.region || 'IN'}&callback=${cb}`;
                    s.async = true;
                    s.onerror = () => resolve(null);
                    document.head.appendChild(s);
                });
            }).catch(() => null);
        }
        return this.loadPromise;
    }

    /** Split Google address components (Places or Geocoder format) into InfraMart's fields. */
    toPickedLocation(components: any[], lat: number, lng: number, formattedAddress = ''): PickedLocation {
        const get = (type: string, short = false) => {
            const c = (components || []).find((x: any) => (x.types || []).includes(type));
            if (!c) return '';
            return (short ? (c.shortText ?? c.short_name) : (c.longText ?? c.long_name)) || '';
        };
        const plain = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
        const lettersOnly = (s: string) => plain(s).replace(/[^a-zA-Z\s]/g, '').replace(/\s+/g, ' ').trim();

        const city = lettersOnly(get('locality') || get('administrative_area_level_3') || get('administrative_area_level_2'));
        const areaParts = [get('sublocality_level_2'), get('sublocality_level_1') || get('sublocality') || get('neighborhood')]
            .map(plain).filter(Boolean);
        if (city && !areaParts.some(p => p.toLowerCase() === city.toLowerCase())) areaParts.push(city);
        const landmark = plain([get('premise'), get('route')].filter(Boolean).join(', '));

        return {
            latitude: Math.round(lat * 1e7) / 1e7,
            longitude: Math.round(lng * 1e7) / 1e7,
            formattedAddress: plain(formattedAddress || ''),
            area: Array.from(new Set(areaParts)).join(', ').slice(0, 120),
            city: city.slice(0, 50),
            state: lettersOnly(get('administrative_area_level_1')).slice(0, 50),
            pincode: (get('postal_code').match(/\d{6}/) || [''])[0],
            landmark: landmark.slice(0, 120)
        };
    }
}
