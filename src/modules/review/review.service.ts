import { Prisma } from "../../../generated/prisma/client";
import httpStatus from "http-status";
import AppError from "../../errors/AppError";
import {prisma} from "../../lib/prisma";
import { TReview } from "./review.interface";
import { getPagination, createMeta } from "../../utils/pagination";
import { validateGear } from "../../utils/common";
import { findUserById } from "../../utils/user";

const createReviewIntoDB = async (payload: TReview) => {
    const { rating, comment, customerId, gearItemId } = payload;

    await validateGear(gearItemId);

    const customer = await findUserById(customerId);

    if (customer.isSuspended) {
        throw new AppError(httpStatus.FORBIDDEN, 'Your account has been suspended!');
    }   
    const rental = await prisma.rentalOrder.findFirst({
        where: {
            customerId,
            gearItemId,
            status: 'RETURNED',
        },
    });

    if (!rental) {
        throw new AppError(httpStatus.BAD_REQUEST, 'You can only review gear that you have rented and returned!');
    }
  
    const existingReview = await prisma.review.findFirst({
        where: {
            customerId,
            gearItemId,
        },
    });

    if (existingReview) {
        throw new AppError(httpStatus.CONFLICT, 'You have already reviewed this gear!');
    }

    return await prisma.review.create({
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
};

const getAllReviewsFromDB = async (query: any) => {
    const { limit, page, skip, sortBy, sortOrder } = getPagination(query);

    const andConditions: Prisma.ReviewWhereInput[] = [];

    if (query.rating) {
        andConditions.push({
            rating: Number(query.rating),
        });
    }

    if (query.gearItemId) {
        andConditions.push({ gearItemId: query.gearItemId });
    }

    if (query.customerId) {
        andConditions.push({ customerId: query.customerId });
    }

    if (query.searchTerm) {
        andConditions.push({
            OR: [
                {
                    comment: {
                        contains: query.searchTerm,
                        mode: "insensitive",
                    },
                },
                {
                    gearItem: {
                        name: {
                            contains: query.searchTerm,
                            mode: "insensitive",
                        },
                    },
                },
                {
                    customer: {
                        name: {
                            contains: query.searchTerm,
                            mode: "insensitive",
                        },
                    },
                },
            ],
        });
    }

    const reviews = await prisma.review.findMany({
        where: { AND: andConditions },
        take: limit,
        skip: skip,
        orderBy: { [sortBy]: sortOrder },
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

    const totalReviewCount = await prisma.review.count({
        where: { AND: andConditions },
    });

    return {
        data: reviews,
        meta: createMeta(page, limit, totalReviewCount),
    };
};

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
        throw new AppError(httpStatus.NOT_FOUND, 'Review not found!');
    }

    return review;
};

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

    const totalRating = reviews.reduce((sum: any, review: { rating: any; }) => sum + review.rating, 0);
    const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;

    return {
        reviews,
        averageRating: Number(averageRating.toFixed(1)),
        totalReviews: reviews.length,
    };
};

const updateReviewIntoDB = async (id: string, payload: Partial<TReview>, userId: string, userRole: string) => {
    const review = await prisma.review.findUnique({
        where: { id },
        include: {
            customer: true,
        },
    });

    if (!review) {
        throw new AppError(httpStatus.NOT_FOUND, 'Review not found!');
    }

    if (userRole !== 'ADMIN' && review.customerId !== userId) {
        throw new AppError(httpStatus.FORBIDDEN, 'You are not authorized to update this review!');
    }

    return await prisma.review.update({
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
};

const deleteReviewFromDB = async (id: string, userId: string, userRole: string) => {
    const review = await prisma.review.findUnique({
        where: { id },
        include: {
            customer: true,
        },
    });

    if (!review) {
        throw new AppError(httpStatus.NOT_FOUND, 'Review not found!');
    }

    if (userRole !== 'ADMIN' && review.customerId !== userId) {
        throw new AppError(httpStatus.FORBIDDEN, 'You are not authorized to delete this review!');
    }

    await prisma.review.delete({ where: { id } });
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