import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { User } from '../models/user.model';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private readonly AUTH_STORAGE_KEY = 'civilworks_user';
    private readonly TOKEN_KEY = 'civilworks_token';

    private userSubject = new BehaviorSubject<User | null>(null);
    public user$: Observable<User | null> = this.userSubject.asObservable();

    constructor(private http: HttpClient) {
        this.loadUser();
    }

    private loadUser(): void {
        const savedUser = localStorage.getItem(this.AUTH_STORAGE_KEY);
        if (savedUser) {
            try {
                this.userSubject.next(JSON.parse(savedUser));
            } catch (error) {
                console.error('Error loading user:', error);
                this.userSubject.next(null);
            }
        }
    }

    isAuthenticated(): boolean {
        return !!localStorage.getItem(this.TOKEN_KEY);
    }

    getUser(): User | null {
        return this.userSubject.value;
    }

    login(mobile: string, password: string): Observable<any> {
        return this.http.post<any>(`${environment.apiUrl}/auth/login`, { mobile, password })
            .pipe(
                tap(res => {
                    if (res.status === 'success') {
                        localStorage.setItem(this.TOKEN_KEY, res.data.token);
                        localStorage.setItem(this.AUTH_STORAGE_KEY, JSON.stringify(res.data.user));
                        this.userSubject.next(res.data.user);
                    }
                })
            );
    }

    register(userData: any): Observable<any> {
        return this.http.post<any>(`${environment.apiUrl}/auth/register`, userData)
            .pipe(
                tap(res => {
                    if (res.status === 'success') {
                        localStorage.setItem(this.TOKEN_KEY, res.data.token);
                        localStorage.setItem(this.AUTH_STORAGE_KEY, JSON.stringify(res.data.user));
                        this.userSubject.next(res.data.user);
                    }
                })
            );
    }

    logout(): void {
        this.userSubject.next(null);
        localStorage.removeItem(this.AUTH_STORAGE_KEY);
        localStorage.removeItem(this.TOKEN_KEY);
    }

    updateUserProfile(data: any): Observable<any> {
        return this.http.put<any>(`${environment.apiUrl}/auth/me`, data)
            .pipe(
                tap(res => {
                    if (res.status === 'success') {
                        localStorage.setItem(this.AUTH_STORAGE_KEY, JSON.stringify(res.data.user));
                        this.userSubject.next(res.data.user);
                    }
                })
            );
    }
}
