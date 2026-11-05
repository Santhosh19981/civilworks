export interface User {
    id: string | number;
    name: string;
    email: string;
    phone?: string;
    mobile?: string;
    designation?: string;
    organization?: string;
    site_location?: string;
    safety_clearance?: string;
    preferences?: any;
    role?: string;
    role_id?: number;
    isAuthenticated?: boolean;
    is_plus_member?: number | boolean | string;
    plus_membership_plan?: string;
    plus_membership_expiry?: string;
}
