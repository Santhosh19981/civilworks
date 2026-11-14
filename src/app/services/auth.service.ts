import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
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
        const token = localStorage.getItem(this.TOKEN_KEY);
        const savedUser = localStorage.getItem(this.AUTH_STORAGE_KEY);

        if (token && savedUser) {
            try {
                if (this.isTokenExpired(token)) {
                    this.logout();
                    return;
                }
                const parsedUser = JSON.parse(savedUser);
                this.userSubject.next(parsedUser);
            } catch (error) {
                console.error('Error loading user session:', error);
                this.logout();
            }
        } else {
            this.userSubject.next(null);
        }
    }

    getToken(): string | null {
        return localStorage.getItem(this.TOKEN_KEY);
    }

    isAuthenticated(): boolean {
        const token = this.getToken();
        const user = localStorage.getItem(this.AUTH_STORAGE_KEY);
        if (!token || !user) return false;
        return !this.isTokenExpired(token);
    }

    private isTokenExpired(token: string): boolean {
        try {
            const parts = token.split('.');
            if (parts.length !== 3) return false; // Non-JWT string fallback
            const payload = JSON.parse(atob(parts[1]));
            if (payload && payload.exp) {
                return (payload.exp * 1000) < Date.now();
            }
            return false;
        } catch {
            return false;
        }
    }

    getUser(): User | null {
        return this.userSubject.value;
    }

    setSession(user: any, token: string): void {
        const prevUser = this.getUser();
        if (prevUser && prevUser.id !== user.id) {
            localStorage.removeItem('civilworks_product_orders');
            localStorage.removeItem('civilworks_helper_bookings');
            localStorage.removeItem('civilworks_rental_bookings');
            localStorage.removeItem('civilworks_profile_prefs');
            localStorage.removeItem('civilworks_last_order');
        }
        localStorage.setItem(this.TOKEN_KEY, token);
        localStorage.setItem(this.AUTH_STORAGE_KEY, JSON.stringify(user));
        this.userSubject.next(user);
    }

    /**
     * Send OTP via Backend
     */
    sendOtp(mobile: string): Observable<any> {
        return this.http.post<any>(`${environment.apiUrl}/auth/send-otp`, { mobile });
    }

    /**
     * Verify Mobile OTP and establish authenticated session
     */
    verifyOtp(mobile: string, otp: string): Observable<any> {
        return this.http.post<any>(`${environment.apiUrl}/auth/verify-otp`, { mobile, otp })
            .pipe(
                tap(res => {
                    if (res?.status === 'success' && res.data?.token) {
                        this.setSession(res.data.user, res.data.token);
                    }
                })
            );
    }

    login(mobile: string, password: string): Observable<any> {
        return this.http.post<any>(`${environment.apiUrl}/auth/login`, { mobile, password })
            .pipe(
                tap(res => {
                    if (res?.status === 'success' && res.data?.token) {
                        this.setSession(res.data.user, res.data.token);
                    }
                })
            );
    }

    register(userData: any): Observable<any> {
        return this.http.post<any>(`${environment.apiUrl}/auth/register`, userData)
            .pipe(
                tap(res => {
                    if (res?.status === 'success' && res.data?.token) {
                        this.setSession(res.data.user, res.data.token);
                    }
                })
            );
    }

    logout(): void {
        this.userSubject.next(null);
        localStorage.removeItem(this.AUTH_STORAGE_KEY);
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem('civilworks_user');
        localStorage.removeItem('civilworks_token');
        localStorage.removeItem('civilworks_product_orders');
        localStorage.removeItem('civilworks_helper_bookings');
        localStorage.removeItem('civilworks_rental_bookings');
        localStorage.removeItem('civilworks_profile_prefs');
        localStorage.removeItem('civilworks_last_order');
    }

    updateUserProfile(data: any): Observable<any> {
        return this.http.put<any>(`${environment.apiUrl}/auth/me`, data)
            .pipe(
                tap(res => {
                    const updatedUser = res?.data?.user || res?.data;
                    if (res?.status === 'success' && updatedUser) {
                        const existingUser = this.getUser() || {};
                        const merged = { ...existingUser, ...updatedUser };
                        localStorage.setItem(this.AUTH_STORAGE_KEY, JSON.stringify(merged));
                        this.userSubject.next(merged);
                    }
                })
            );
    }

    isPlusMember(): boolean {
        const u: any = this.getUser();
        return !!(u && (u.is_plus_member === 1 || u.is_plus_member === true || u.is_plus_member === '1'));
    }

    upgradeMembership(data: { plan: string; payment_id: string; amount: number }): Observable<any> {
        return this.http.post<any>(`${environment.apiUrl}/users/upgrade-membership`, data)
            .pipe(
                tap((res: any) => {
                    const updatedUser = res?.data?.user;
                    if (res?.status === 'success' && updatedUser) {
                        const existingUser = this.getUser() || {};
                        const merged = { ...existingUser, ...updatedUser };
                        localStorage.setItem(this.AUTH_STORAGE_KEY, JSON.stringify(merged));
                        this.userSubject.next(merged);
                    }
                })
            );
    }

    /** Merge fresh user details from the server into the stored session (e.g. after a membership payment). */
    applyUserUpdate(updatedUser: any) {
        if (!updatedUser) return;
        const merged = { ...(this.getUser() || {}), ...updatedUser };
        localStorage.setItem(this.AUTH_STORAGE_KEY, JSON.stringify(merged));
        this.userSubject.next(merged);
    }

    checkAuth(): Observable<any> {
        if (!this.isAuthenticated()) {
            return of(null);
        }
        return this.http.get<any>(`${environment.apiUrl}/auth/me`).pipe(
            tap(res => {
                if (res?.status === 'success' && res.data?.user) {
                    const token = this.getToken();
                    if (token) {
                        this.setSession(res.data.user, token);
                    }
                }
            }),
            catchError(err => {
                if (err.status === 401 || err.status === 403 || err.status === 404) {
                    this.logout();
                }
                return of(null);
            })
        );
    }
}

