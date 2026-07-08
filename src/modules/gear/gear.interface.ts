export type TGearItem = {
    name: string;
    description: string;
    pricePerDay: number;
    brand?: string;
    availability?: boolean;
    stockQuantity: number;
    images: string[];
    specifications?: any;
    categoryId: string;
    providerId: string;
};

export type TGearFilters = {
    category?: string;
    brand?: string;
    minPrice?: number;
    maxPrice?: number;
    availability?: boolean;
    searchTerm?: string;
};