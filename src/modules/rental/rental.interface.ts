import { GearItem, Payment, RentalOrder, Review, User } from "../../../generated/prisma/client";

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
    startDate?: Date;
    endDate?: Date;
    searchTerm?: string;
};

export type TRentalWithRelations = RentalOrder & {
    customer: User;
    gearItem: GearItem & {
        provider: User;
        category: any;
    };
    payment?: Payment;
    review?: Review;
};