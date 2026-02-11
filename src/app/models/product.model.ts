export interface Product {
    id: string;
    name: string;
    image: string;
    price: number;
    description: string;
    category: string;
    unit?: string;
    inStock: boolean;
}
