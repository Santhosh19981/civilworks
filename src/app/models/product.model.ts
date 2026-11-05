export interface Product {
    id: string | number;
    name: string;
    image?: string;
    price: number;
    description?: string;
    category?: string;
    category_id?: number;
    category_name?: string;
    subcategory_id?: number;
    subcategory_name?: string;
    unit_id?: number;
    unit_name?: string;
    unit_category?: string;
    main_category_id?: number;
    main_category_name?: string;
    product_type?: 'selling' | 'renting' | 'services' | string;
    type?: 'selling' | 'renting' | 'services' | string;
    measurement_type?: 'weight' | 'length' | 'quantity' | 'volume' | 'duration' | string;
    stock?: number;
    status?: string;
    unit?: string;
    inStock?: boolean;
}

export interface MainCategory {
    id: number;
    name: string;
    description?: string;
    icon?: string;
    status: string;
}

export interface Category {
    id: number;
    name: string;
    main_category_id: number;
    main_category_name?: string;
    main_category_ids?: number[];
    main_category_names?: string[];
    description?: string;
    image?: string;
    status: string;
}

export interface SubCategory {
    id: number;
    name: string;
    category_id: number;
    category_name?: string;
    type: 'selling' | 'renting' | 'services' | string;
    measurement_type?: 'weight' | 'length' | 'quantity' | 'volume' | 'duration' | string;
    description?: string;
    status: string;
}

export interface Vendor {
    id: number;
    name: string;
    mobile: string;
    email?: string;
    image?: string;
    status: string;
    services?: SubCategory[];
}
