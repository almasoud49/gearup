export type TRentalOrder = {
    startDate: Date;
    endDate: Date;
    gearItemId: string;
    customerId: string;
};

export type TRentalFilters = {
    status?: string;
    customerId?: string;
    providerId?: string;
    searchTerm?: string;
};