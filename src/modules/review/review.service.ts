import AppError from "../../errors/AppError";
import { prisma } from "../../lib/prisma";
import { TReview } from "./review.interface";

const createReview = async (payload: any) => {
    const { rating, comment, gearItemId } = payload;

    // 1. Check if gear exists
    const gear = await prisma.gearItem.findUnique({
        where: { id: gearItemId },
    });

    if (!gear) {
        throw new AppError(404, 'Gear item not found!');
    }

    // 2. Get or create default customer
    let defaultCustomer = await prisma.user.findFirst({
        where: {
            role: 'CUSTOMER',
            isSuspended: false,
        },
        select: { id: true },
    });

    if (!defaultCustomer) {
        // Create a default customer if none exists
        const newCustomer = await prisma.user.create({
            data: {
                name: 'Default Customer',
                email: 'default@customer.com',
                password: '$2b$10$defaultPasswordHash',
                role: 'CUSTOMER',
            },
            select: { id: true },
        });
        defaultCustomer = newCustomer;
        console.log('🔓 Created default customer:', defaultCustomer.id);
    }

    // 3. Check if default customer already reviewed this gear
    const existingReview = await prisma.review.findFirst({
        where: {
            customerId: defaultCustomer.id,
            gearItemId,
        },
    });

    if (existingReview) {
        throw new AppError(409, 'This gear already has a review from the default customer!');
    }

    // 4. Create review
    const review = await prisma.review.create({
        data: {
            rating,
            comment: comment || '',
            customerId: defaultCustomer.id,
            gearItemId,
        },
        include: {
            customer: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
            gearItem: {
                include: {
                    provider: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
            },
        },
    });

    return review;
};


export const reviewService = {
    createReview
}