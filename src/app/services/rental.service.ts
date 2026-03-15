import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class RentalService {
    constructor(private http: HttpClient) { }
    getRentals(params: any = {}): Observable<any[]> {
        return this.http.get<any>(`${environment.apiUrl}/rentals`, { params }).pipe(map(res => res.data));
    }
    getRentalById(id: string): Observable<any> {
        return this.http.get<any>(`${environment.apiUrl}/rentals/${id}`).pipe(map(res => res.data));
    }
}

@Injectable({
    providedIn: 'root'
})
export class HelperService {
    constructor(private http: HttpClient) { }
    getHelpers(params: any = {}): Observable<any[]> {
        return this.http.get<any>(`${environment.apiUrl}/helpers`, { params }).pipe(map(res => res.data));
    }
    getHelperById(id: string): Observable<any> {
        return this.http.get<any>(`${environment.apiUrl}/helpers/${id}`).pipe(map(res => res.data));
    }
}
