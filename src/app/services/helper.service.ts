import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Helper } from '../models/helper.model';
import helpersData from '../../data/helpers.json';

@Injectable({
    providedIn: 'root'
})
export class HelperService {
    private helpersSubject = new BehaviorSubject<Helper[]>([]);
    public helpers$: Observable<Helper[]> = this.helpersSubject.asObservable();

    constructor() {
        this.loadHelpers();
    }

    private loadHelpers(): void {
        this.helpersSubject.next(helpersData as Helper[]);
    }

    getHelpers(): Helper[] {
        return this.helpersSubject.value;
    }

    getHelperById(id: string): Helper | undefined {
        return this.helpersSubject.value.find(h => h.id === id);
    }
}
