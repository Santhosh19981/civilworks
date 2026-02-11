import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Order, OrderStatus, Address } from '../models/order.model';
import { CartItem } from '../models/cart.model';

@Injectable({
    providedIn: 'root'
})
export class OrderService {
    private readonly ORDERS_STORAGE_KEY = 'civilworks_orders';
    private ordersSubject = new BehaviorSubject<Order[]>([]);
    public orders$: Observable<Order[]> = this.ordersSubject.asObservable();

    constructor() {
        this.loadOrders();
    }

    private loadOrders(): void {
        const savedOrders = localStorage.getItem(this.ORDERS_STORAGE_KEY);
        if (savedOrders) {
            try {
                const orders = JSON.parse(savedOrders);
                // Convert date strings back to Date objects
                orders.forEach((order: Order) => {
                    order.date = new Date(order.date);
                });
                this.ordersSubject.next(orders);
            } catch (error) {
                console.error('Error loading orders:', error);
                this.ordersSubject.next([]);
            }
        }
    }

    private saveOrders(): void {
        localStorage.setItem(this.ORDERS_STORAGE_KEY, JSON.stringify(this.ordersSubject.value));
    }

    getOrders(): Order[] {
        return this.ordersSubject.value.sort((a, b) => b.date.getTime() - a.date.getTime());
    }

    getOrderById(id: string): Order | undefined {
        return this.ordersSubject.value.find(o => o.id === id);
    }

    createOrder(items: CartItem[], total: number, address: Address, paymentMethod: 'online' | 'cod'): Order {
        const order: Order = {
            id: this.generateOrderId(),
            items: items,
            total: total,
            status: 'Packing',
            date: new Date(),
            address: address,
            paymentMethod: paymentMethod
        };

        const currentOrders = [...this.ordersSubject.value, order];
        this.ordersSubject.next(currentOrders);
        this.saveOrders();

        // Start automatic status progression
        this.simulateOrderProgress(order.id);

        return order;
    }

    // private generateOrderId(): string {
    //     const timestamp = Date.now();
    //     const random = Math.floor(Math.random() * 10000);
    //     return `CW${timestamp}${random}`;
    // }

    private generateOrderId(): string {
        const random = Math.floor(1000 + Math.random() * 9000);
        return `CW${random}`;
    }

    private simulateOrderProgress(orderId: string): void {
        // Packing -> Shipping after 10 seconds
        setTimeout(() => {
            this.updateOrderStatus(orderId, 'Shipping');
        }, 10000);

        // Shipping -> Delivered after 20 seconds
        setTimeout(() => {
            this.updateOrderStatus(orderId, 'Delivered');
        }, 30000);
    }

    private updateOrderStatus(orderId: string, status: OrderStatus): void {
        const currentOrders = [...this.ordersSubject.value];
        const order = currentOrders.find(o => o.id === orderId);

        if (order) {
            order.status = status;
            this.ordersSubject.next(currentOrders);
            this.saveOrders();
        }
    }

    getOrderStatusProgress(status: OrderStatus): number {
        switch (status) {
            case 'Packing':
                return 33;
            case 'Shipping':
                return 66;
            case 'Delivered':
                return 100;
            default:
                return 0;
        }
    }
}
