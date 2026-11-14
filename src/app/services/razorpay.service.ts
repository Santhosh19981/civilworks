import { Injectable, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PaymentConfig {
    enabled: boolean;
    keyId: string | null;
    membershipPrice: number;
}

export type PaymentOutcome =
    | { status: 'paid'; data: any; message: string }
    | { status: 'cancelled' };

/**
 * Razorpay Checkout. The amount is always decided by the API; the app only opens the checkout
 * and sends the signed result back for verification.
 */
@Injectable({ providedIn: 'root' })
export class RazorpayService {
    private configPromise: Promise<PaymentConfig | null> | null = null;
    private scriptPromise: Promise<boolean> | null = null;

    constructor(private http: HttpClient, private zone: NgZone) { }

    getConfig(): Promise<PaymentConfig | null> {
        if (!this.configPromise) {
            this.configPromise = firstValueFrom(this.http.get<any>(`${environment.apiUrl}/payments/razorpay/config`))
                .then(res => res?.data || null)
                .catch(() => { this.configPromise = null; return null; });
        }
        return this.configPromise;
    }

    async isEnabled(): Promise<boolean> {
        return !!(await this.getConfig())?.enabled;
    }

    private loadScript(): Promise<boolean> {
        if ((window as any).Razorpay) return Promise.resolve(true);
        if (!this.scriptPromise) {
            this.scriptPromise = new Promise(resolve => {
                const s = document.createElement('script');
                s.src = 'https://checkout.razorpay.com/v1/checkout.js';
                s.async = true;
                s.onload = () => resolve(true);
                s.onerror = () => { this.scriptPromise = null; resolve(false); };
                document.body.appendChild(s);
            });
        }
        return this.scriptPromise;
    }

    /**
     * Pay for { purpose: 'membership' } or { purpose: 'order', order_id }.
     * Resolves 'paid' after the API verified the payment, or 'cancelled' if the customer closed the checkout.
     * Rejects with a readable message when the payment fails.
     */
    async pay(request: { purpose: 'membership' } | { purpose: 'order'; order_id: number | string }): Promise<PaymentOutcome> {
        if (!(await this.loadScript())) throw new Error('Could not load the payment window. Check your internet connection and try again.');

        let order: any;
        try {
            const res = await firstValueFrom(this.http.post<any>(`${environment.apiUrl}/payments/razorpay/order`, request));
            order = res.data;
        } catch (err: any) {
            throw new Error(err?.error?.message || 'Could not start the payment. Please try again.');
        }

        return new Promise<PaymentOutcome>((resolve, reject) => {
            let settled = false;
            const done = (fn: () => void) => { if (!settled) { settled = true; this.zone.run(fn); } };

            const rzp = new (window as any).Razorpay({
                key: order.key_id,
                order_id: order.razorpay_order_id,
                amount: order.amount,
                currency: order.currency,
                name: order.name,
                description: order.description,
                prefill: order.prefill,
                notes: order.notes,
                theme: { color: '#ea580c' },
                handler: async (resp: any) => {
                    try {
                        const verified = await firstValueFrom(this.http.post<any>(`${environment.apiUrl}/payments/razorpay/verify`, {
                            razorpay_order_id: resp.razorpay_order_id,
                            razorpay_payment_id: resp.razorpay_payment_id,
                            razorpay_signature: resp.razorpay_signature
                        }));
                        done(() => resolve({ status: 'paid', data: verified.data, message: verified.message }));
                    } catch (err: any) {
                        done(() => reject(new Error(err?.error?.message || 'Payment received; confirmation is taking longer than usual. It will update shortly.')));
                    }
                },
                modal: {
                    // A failed attempt keeps the window open for a retry; report it only if the customer gives up
                    ondismiss: () => done(() => lastFailure ? reject(new Error(lastFailure)) : resolve({ status: 'cancelled' }))
                }
            });
            let lastFailure = '';
            rzp.on('payment.failed', (resp: any) => {
                lastFailure = resp?.error?.description || 'Payment failed. Please try again or use another method.';
            });
            rzp.open();
        });
    }
}
