import { CartItem } from './cart.model';

export type OrderStatus = 'Packing' | 'Shipping' | 'Delivered';

export interface Order {
    id: string;
    items: CartItem[];
    total: number;
    status: OrderStatus;
    date: Date;
    address: Address;
    paymentMethod: 'online' | 'cod';
}

export interface Address {
    name: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
}
