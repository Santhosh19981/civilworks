import { Product } from './product.model';

export interface CartItem {
    id: number;
    user_id?: number;
    product_id: number;
    product: Product;
    quantity: number;
    rental_duration?: number | null;
    unit_id?: number | null;
    unit_name?: string;
    subcategory_type?: 'selling' | 'renting' | 'services' | string;
    measurement_type?: string;
    item_total?: number;
    created_at?: string;
    updated_at?: string;
}
