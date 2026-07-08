export type TUserStatusUpdate = {
    isSuspended: boolean;
};

export type TUserRoleUpdate = {
    role: 'CUSTOMER' | 'PROVIDER';
};

export type TAdminStats = {
    totalUsers: number;
    totalProviders: number;
    totalCustomers: number;
    totalGear: number;
    totalRentals: number;
    totalRevenue: number;
    pendingRentals: number;
    activeRentals: number;
    completedRentals: number;
};

export type TUserFilter = {
    role?: 'CUSTOMER' | 'PROVIDER' | 'ADMIN';
    isSuspended?: boolean;
    searchTerm?: string;
};