
import httpStatus from "http-status";
import AppError from "../../errors/AppError";
import {prisma} from "../../lib/prisma";
import type { TGearItem } from "./gear.interface";
import { getPagination, createMeta } from "../../utils/pagination";
import { buildSearchConditions } from "../../utils/search";
import { validateCategory, validateGear, validateGearBasic } from "../../utils/common";
import { Prisma } from "../../../generated/prisma/client";

const createGearIntoDB = async (payload: TGearItem) => {
    const { categoryId, providerId, name, stockQuantity, ...rest } = payload;

    await validateCategory(categoryId);

    const provider = await prisma.user.findUnique({
        where: { id: providerId },
        select: { id: true, role: true, isSuspended: true },
    });

    if (!provider) {
        throw new AppError(httpStatus.NOT_FOUND, 'Provider not found!');
    }

    if (provider.isSuspended) {
        throw new AppError(httpStatus.FORBIDDEN, 'Provider account is suspended!');
    }

    if (provider.role !== 'PROVIDER' && provider.role !== 'ADMIN') {
        throw new AppError(httpStatus.FORBIDDEN, 'Only providers and admins can create gear!');
    }

    const existingGear = await prisma.gearItem.findFirst({
        where: {
            name: {
                equals: name,
                mode: 'insensitive',
            },
            providerId: providerId,
        },
    });

    if (existingGear) {
        throw new AppError(httpStatus.CONFLICT, 'You already have a gear item with this name!');
    }

    const finalStockQuantity = stockQuantity || 1;

    return await prisma.gearItem.create({
        data: {
            name,
            description: rest.description,
            pricePerDay: rest.pricePerDay,
            brand: rest.brand ?? null,
            stockQuantity: finalStockQuantity,
            availability: finalStockQuantity > 0,
            images: rest.images,
            specifications: rest.specifications,
            categoryId,
            providerId,
        },
        include: {
            provider: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                },
            },
            category: true,
        },
    });
};

const getAllGearFromDB = async (query: any) => {
    const { limit, page, skip, sortBy, sortOrder } = getPagination(query);

    const andConditions: Prisma.GearItemWhereInput[] = [];

    if (query.searchTerm) {
        andConditions.push(...buildSearchConditions(query.searchTerm, ['name', 'description', 'brand']));
    }

    if (query.category) {
        andConditions.push({
            category: {
                name: {
                    equals: query.category,
                    mode: "insensitive",
                },
            },
        });
    }

    if (query.brand) {
        andConditions.push({
            brand: {
                equals: query.brand,
                mode: "insensitive",
            },
        });
    }

    if (query.minPrice) {
        andConditions.push({
            pricePerDay: {
                gte: Number(query.minPrice),
            },
        });
    }

    if (query.maxPrice) {
        andConditions.push({
            pricePerDay: {
                lte: Number(query.maxPrice),
            },
        });
    }

    if (query.availability !== undefined) {
        andConditions.push({
            availability: query.availability === "true",
        });
    }

    andConditions.push({
        stockQuantity: {
            gt: 0,
        },
    });

    const gearItems = await prisma.gearItem.findMany({
        where: { AND: andConditions },
        take: limit,
        skip: skip,
        orderBy: { [sortBy]: sortOrder },
        include: {
            provider: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
            category: true,
            reviews: {
                select: {
                    rating: true,
                    comment: true,
                    createdAt: true,
                    customer: {
                        select: {
                            name: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: "desc",
                },
            },
            _count: {
                select: {
                    reviews: true,
                },
            },
        },
    });

    const totalGearCount = await prisma.gearItem.count({
        where: { AND: andConditions },
    });

    const gearWithRating = gearItems.map((gear) => {
        const totalRating = gear.reviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = gear.reviews.length > 0 ? totalRating / gear.reviews.length : 0;

        return {
            ...gear,
            averageRating: Number(averageRating.toFixed(1)),
            totalReviews: gear._count.reviews,
        };
    });

    return {
        data: gearWithRating,
        meta: createMeta(page, limit, totalGearCount),
    };
};

const getGearByIdFromDB = async (id: string) => {
    const gear = await validateGear(id);

    const totalRating = gear.reviews.reduce((sum: number, review: any) => sum + review.rating, 0);
    const averageRating = gear.reviews.length > 0 ? totalRating / gear.reviews.length : 0;

    return {
        ...gear,
        averageRating: Number(averageRating.toFixed(1)),
        totalReviews: gear._count.reviews,
    };
};

const updateGearIntoDB = async (id: string, payload: Partial<TGearItem>, providerId: string) => {
    const gear = await validateGearBasic(id);

    if (gear.providerId !== providerId) {
        throw new AppError(httpStatus.FORBIDDEN, 'You are not authorized to update this gear!');
    }

    if (payload.categoryId) {
        await validateCategory(payload.categoryId);
    }

    return await prisma.gearItem.update({
        where: { id },
        data: payload,
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
    });
};

const deleteGearFromDB = async (id: string, providerId: string) => {
    const gear = await validateGearBasic(id);

    if (gear.providerId !== providerId) {
        throw new AppError(httpStatus.FORBIDDEN, 'You are not authorized to delete this gear!');
    }

    if (gear.rentalOrders.length > 0) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Cannot delete gear with active rentals!');
    }

    await prisma.gearItem.delete({ where: { id } });
    return null;
};

const getProviderGearFromDB = async (providerId: string) => {
    return await prisma.gearItem.findMany({
        where: { providerId },
        include: {
            category: true,
            rentalOrders: {
                select: {
                    id: true,
                    status: true,
                    startDate: true,
                    endDate: true,
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
            },
            _count: {
                select: {
                    rentalOrders: true,
                    reviews: true,
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
    });
};

export const gearService = {
    createGearIntoDB,
    getAllGearFromDB,
    getGearByIdFromDB,
    updateGearIntoDB,
    deleteGearFromDB,
    getProviderGearFromDB,
};