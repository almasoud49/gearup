import { GearItem, Review, User } from "../../../generated/prisma/client";


export type TReview = {
    rating: number;
    comment?: string;
    customerId: string;
    gearItemId: string;
};

export type TReviewFilters = {
    rating?: number;
    gearItemId?: string;
    customerId?: string;
    searchTerm?: string;
};

export type TReviewWithRelations = Review & {
    customer: User;
    gearItem: GearItem;
};