export type TProviderGear = {
    name: string;
    description: string;
    pricePerDay: number;
    brand?: string;
    availability?: boolean;
    stockQuantity: number;
    images: string[];
    specifications?: any;
    categoryId: string;
};

export type TUpdateGear = {
    name?: string;
    description?: string;
    pricePerDay?: number;
    brand?: string;
    availability?: boolean;
    stockQuantity?: number;
    images?: string[];
    specifications?: any;
    categoryId?: string;
};

export type TOrderStatusUpdate = {
    status: 'CONFIRMED' | 'PAID' | 'PICKED_UP' | 'RETURNED' | 'CANCELLED';
};

export type TProviderStats = {
    totalGear: number;
    availableGear: number;
    unavailableGear: number;
    totalOrders: number;
    pendingOrders: number;
    completedOrders: number;
};