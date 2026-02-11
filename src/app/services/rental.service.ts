import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Rental } from '../models/rental.model';
import rentalsData from '../../data/rentals.json';

@Injectable({
    providedIn: 'root'
})
export class RentalService {
    private rentalsSubject = new BehaviorSubject<Rental[]>([]);
    public rentals$: Observable<Rental[]> = this.rentalsSubject.asObservable();

    constructor() {
        this.loadRentals();
    }

    private loadRentals(): void {
        this.rentalsSubject.next(rentalsData as Rental[]);
    }

    getRentals(): Rental[] {
        return this.rentalsSubject.value;
    }

    getRentalById(id: string): Rental | undefined {
        return this.rentalsSubject.value.find(r => r.id === id);
    }

    searchRentals(query: string): Rental[] {
        const lowerQuery = query.toLowerCase();
        return this.rentalsSubject.value.filter(r =>
            r.name.toLowerCase().includes(lowerQuery) ||
            r.description.toLowerCase().includes(lowerQuery) ||
            r.category.toLowerCase().includes(lowerQuery)
        );
    }

    getPopularRentals(limit: number = 6): Rental[] {
        return this.rentalsSubject.value.slice(0, limit);
    }
}
