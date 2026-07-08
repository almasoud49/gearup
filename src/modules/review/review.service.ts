import AppError from "../../errors/AppError";
import { prisma } from "../../lib/prisma";
import { TReview, TReviewFilters } from "./review.interface";

// ==================== CREATE REVIEW ====================
const createReviewIntoDB = async (payload: TReview) => {
    const { rating, comment, customerId, gearItemId } = payload;

    // 1. Check if gear exists
    const gear = await prisma.gearItem.findUnique({
        where: { id: gearItemId },
    });

    if (!gear) {
        throw new AppError(404, 'Gear item not found!');
    }

    // 2. Check if customer exists
    const customer = await prisma.user.findUnique({
        where: { id: customerId },
        select: { id: true, isSuspended: true },
    });

    if (!customer) {
        throw new AppError(404, 'Customer not found!');
    }

    if (customer.isSuspended) {
        throw new AppError(403, 'Your account has been suspended!');
    }

    // 3. Check if customer has rented and returned this gear
    const rental = await prisma.rentalOrder.findFirst({
        where: {
            customerId,
            gearItemId,
            status: 'RETURNED',
        },
    });

    if (!rental) {
        throw new AppError(400, 'You can only review gear that you have rented and returned!');
    }

    // 4. Check if customer already reviewed this gear
    const existingReview = await prisma.review.findFirst({
        where: {
            customerId,
            gearItemId,
        },
    });

    if (existingReview) {
        throw new AppError(409, 'You have already reviewed this gear!');
    }

    // 5. Create review
    const review = await prisma.review.create({
        data: {
            rating,
            comment,
            customerId,
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

// ==================== GET ALL REVIEWS ====================
const getAllReviewsFromDB = async (filters: TReviewFilters = {}) => {
    const { rating, gearItemId, customerId, searchTerm } = filters;

    const whereConditions: any = {};

    if (rating) {
        whereConditions.rating = rating;
    }

    if (gearItemId) {
        whereConditions.gearItemId = gearItemId;
    }

    if (customerId) {
        whereConditions.customerId = customerId;
    }

    if (searchTerm) {
        whereConditions.OR = [
            {
                gearItem: {
                    name: {
                        contains: searchTerm,
                        mode: 'insensitive',
                    },
                },
            },
            {
                customer: {
                    name: {
                        contains: searchTerm,
                        mode: 'insensitive',
                    },
                },
            },
            {
                comment: {
                    contains: searchTerm,
                    mode: 'insensitive',
                },
            },
        ];
    }

    const reviews = await prisma.review.findMany({
        where: whereConditions,
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
                    category: true,
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    return reviews;
};

// ==================== GET REVIEW BY ID ====================
const getReviewByIdFromDB = async (id: string) => {
    const review = await prisma.review.findUnique({
        where: { id },
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
                    category: true,
                },
            },
        },
    });

    if (!review) {
        throw new AppError(404, 'Review not found!');
    }

    return review;
};

// ==================== GET GEAR REVIEWS ====================
const getGearReviewsFromDB = async (gearItemId: string) => {
    const reviews = await prisma.review.findMany({
        where: { gearItemId },
        include: {
            customer: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;

    return {
        reviews,
        averageRating: Number(averageRating.toFixed(1)),
        totalReviews: reviews.length,
    };
};

// ==================== UPDATE REVIEW ====================
const updateReviewIntoDB = async (id: string, payload: Partial<TReview>, userId: string, userRole: string) => {
    // 1. Check if review exists
    const review = await prisma.review.findUnique({
        where: { id },
        include: {
            customer: true,
        },
    });

    if (!review) {
        throw new AppError(404, 'Review not found!');
    }

    // 2. Check authorization
    if (userRole !== 'ADMIN' && review.customerId !== userId) {
        throw new AppError(403, 'You are not authorized to update this review!');
    }

    // 3. Update review
    const updatedReview = await prisma.review.update({
        where: { id },
        data: payload,
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

    return updatedReview;
};

// ==================== DELETE REVIEW ====================
const deleteReviewFromDB = async (id: string, userId: string, userRole: string) => {
    // 1. Check if review exists
    const review = await prisma.review.findUnique({
        where: { id },
        include: {
            customer: true,
        },
    });

    if (!review) {
        throw new AppError(404, 'Review not found!');
    }

    // 2. Check authorization
    if (userRole !== 'ADMIN' && review.customerId !== userId) {
        throw new AppError(403, 'You are not authorized to delete this review!');
    }

    // 3. Delete review
    await prisma.review.delete({
        where: { id },
    });

    return null;
};

export const reviewService = {
    createReviewIntoDB,
    getAllReviewsFromDB,
    getReviewByIdFromDB,
    getGearReviewsFromDB,
    updateReviewIntoDB,
    deleteReviewFromDB,
};