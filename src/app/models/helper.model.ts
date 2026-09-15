export interface Helper {
    id: string;
    name: string;
    image: string;
    description: string;
    mobile: string;
    pricePerDay: number;
    category?: string;
    experience?: string;
    rating?: number;
    reviewCount?: number;
    skills?: string[];
    badge?: string;
    toolsProvided?: boolean;
}
