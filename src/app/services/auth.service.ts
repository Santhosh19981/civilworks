import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { User } from '../models/user.model';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private readonly AUTH_STORAGE_KEY = 'civilworks_user';
    private readonly VALID_OTP = '1234';

    private userSubject = new BehaviorSubject<User | null>(null);
    public user$: Observable<User | null> = this.userSubject.asObservable();

    constructor() {
        this.loadUser();
    }

    private loadUser(): void {
        const savedUser = localStorage.getItem(this.AUTH_STORAGE_KEY);
        if (savedUser) {
            try {
                const user = JSON.parse(savedUser);
                this.userSubject.next(user);
            } catch (error) {
                console.error('Error loading user:', error);
                this.userSubject.next(null);
            }
        }
    }

    private saveUser(user: User): void {
        localStorage.setItem(this.AUTH_STORAGE_KEY, JSON.stringify(user));
    }

    isAuthenticated(): boolean {
        return this.userSubject.value?.isAuthenticated || false;
    }

    getUser(): User | null {
        return this.userSubject.value;
    }

    verifyOTP(otp: string): boolean {
        return otp === this.VALID_OTP;
    }

    login(phoneOrEmail: string, otp: string): boolean {
        if (this.verifyOTP(otp)) {
            const user: User = {
                id: this.generateUserId(),
                name: 'Guest User',
                email: phoneOrEmail.includes('@') ? phoneOrEmail : '',
                phone: phoneOrEmail.includes('@') ? '' : phoneOrEmail,
                isAuthenticated: true
            };

            this.userSubject.next(user);
            this.saveUser(user);
            return true;
        }
        return false;
    }

    logout(): void {
        this.userSubject.next(null);
        localStorage.removeItem(this.AUTH_STORAGE_KEY);
    }

    updateUserProfile(name: string, email: string, phone: string): void {
        const currentUser = this.userSubject.value;
        if (currentUser) {
            const updatedUser: User = {
                ...currentUser,
                name,
                email,
                phone
            };
            this.userSubject.next(updatedUser);
            this.saveUser(updatedUser);
        }
    }

    private generateUserId(): string {
        return `USER${Date.now()}${Math.floor(Math.random() * 1000)}`;
    }
}
