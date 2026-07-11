import { Prisma } from "../../../generated/prisma/client";
import httpStatus from "http-status";
import AppError from "../../errors/AppError";
import { prisma } from "../../lib/prisma";
import { TRentalOrder } from "./rental.interface";
import { getPagination, createMeta } from "../../utils/pagination";
import { validateGear, validateRental} from "../../utils/common";
import { findUserById } from "../../utils/user";

const createRentalIntoDB = async (payload: TRentalOrder) => {
    const { startDate, endDate, gearItemId, customerId } = payload;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    if (start < now) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Start date cannot be in the past!');
    }

    if (end <= start) {
        throw new AppError(httpStatus.BAD_REQUEST, 'End date must be after start date!');
    }

    const gear = await validateGear(gearItemId);

    if (!gear.availability || gear.stockQuantity < 1) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Gear item is not available for rent!');
    }

    if (gear.providerId === customerId) {
        throw new AppError(httpStatus.BAD_REQUEST, 'You cannot rent your own gear!');
    }

    if (gear.provider.isSuspended) {
        throw new AppError(httpStatus.FORBIDDEN, 'Provider account is suspended!');
    }

    const customer = await findUserById(customerId);

    if (customer.isSuspended) {
        throw new AppError(httpStatus.FORBIDDEN, 'Your account has been suspended!');
    }

    // Check overlapping rentals
    const overlappingRental = await prisma.rentalOrder.findFirst({
        where: {
            gearItemId,
            status: {
                in: ['PLACED', 'CONFIRMED', 'PAID', 'PICKED_UP'],
            },
            OR: [
                {
                    AND: [
                        { startDate: { lte: start } },
                        { endDate: { gte: start } },
                    ],
                },
                {
                    AND: [
                        { startDate: { lte: end } },
                        { endDate: { gte: end } },
                    ],
                },
                {
                    AND: [
                        { startDate: { gte: start } },
                        { endDate: { lte: end } },
                    ],
                },
            ],
        },
    });

    if (overlappingRental) {
        throw new AppError(httpStatus.CONFLICT, 'This gear is already booked for the selected dates!');
    }

    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const totalPrice = gear.pricePerDay * days;

    const rental = await prisma.rentalOrder.create({
        data: {
            startDate: start,
            endDate: end,
            totalPrice,
            customerId,
            gearItemId,
            status: 'PLACED',
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
                    category: true,
                },
            },
        },
    });

    await prisma.gearItem.update({
        where: { id: gearItemId },
        data: {
            stockQuantity: { decrement: 1 },
            availability: gear.stockQuantity - 1 <= 0 ? false : true,
        },
    });

    return rental;
};

const getAllRentalsFromDB = async (query: any, userId: string, userRole: string) => {
    const { limit, page, skip, sortBy, sortOrder } = getPagination(query);

    const andConditions: Prisma.RentalOrderWhereInput[] = [];

    if (query.status) {
        andConditions.push({ status: query.status });
    }

    if (query.searchTerm) {
        andConditions.push({
            OR: [
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

    if (userRole === "CUSTOMER") {
        andConditions.push({ customerId: userId });
    } else if (userRole === "PROVIDER") {
        andConditions.push({
            gearItem: {
                providerId: userId,
            },
        });
    }

    if (query.startDate) {
        andConditions.push({
            startDate: {
                gte: new Date(query.startDate),
            },
        });
    }

    if (query.endDate) {
        andConditions.push({
            endDate: {
                lte: new Date(query.endDate),
            },
        });
    }

    const rentals = await prisma.rentalOrder.findMany({
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
            payment: true,
            review: true,
        },
    });

    const totalRentalCount = await prisma.rentalOrder.count({
        where: { AND: andConditions },
    });

    return {
        data: rentals,
        meta: createMeta(page, limit, totalRentalCount),
    };
};

const getRentalByIdFromDB = async (id: string, userId: string, userRole: string) => {
    const rental = await prisma.rentalOrder.findUnique({
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
            payment: true,
            review: {
                include: {
                    customer: {
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

    if (!rental) {
        throw new AppError(httpStatus.NOT_FOUND, 'Rental order not found!');
    }

    if (userRole === 'CUSTOMER' && rental.customerId !== userId) {
        throw new AppError(httpStatus.FORBIDDEN, 'You are not authorized to view this rental!');
    }

    if (userRole === 'PROVIDER' && rental.gearItem.providerId !== userId) {
        throw new AppError(httpStatus.FORBIDDEN, 'You are not authorized to view this rental!');
    }

    return rental;
};

const getUserRentalsFromDB = async (userId: string) => {
    return await prisma.rentalOrder.findMany({
        where: { customerId: userId },
        include: {
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
            payment: true,
            review: true,
        },
        orderBy: {
            createdAt: 'desc',
        },
    });
};

const cancelRentalFromDB = async (id: string, userId: string) => {
    const rental = await validateRental(id);

    if (rental.customerId !== userId) {
        throw new AppError(httpStatus.FORBIDDEN, 'You are not authorized to cancel this rental!');
    }

    if (rental.status !== 'PLACED') {
        throw new AppError(httpStatus.BAD_REQUEST, `Cannot cancel rental with status: ${rental.status}`);
    }

    const cancelledRental = await prisma.rentalOrder.update({
        where: { id },
        data: { status: 'CANCELLED' },
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

    await prisma.gearItem.update({
        where: { id: rental.gearItemId },
        data: {
            stockQuantity: { increment: 1 },
            availability: true,
        },
    });

    return cancelledRental;
};

const getRentalStatsFromDB = async (userId: string, userRole: string) => {
    let whereCondition: any = {};

    if (userRole === 'CUSTOMER') {
        whereCondition.customerId = userId;
    } else if (userRole === 'PROVIDER') {
        whereCondition.gearItem = {
            providerId: userId,
        };
    }

    const stats = await prisma.$transaction([
        prisma.rentalOrder.count({ where: whereCondition }),
        prisma.rentalOrder.count({
            where: {
                ...whereCondition,
                status: 'PLACED',
            },
        }),
        prisma.rentalOrder.count({
            where: {
                ...whereCondition,
                status: 'CONFIRMED',
            },
        }),
        prisma.rentalOrder.count({
            where: {
                ...whereCondition,
                status: 'PAID',
            },
        }),
        prisma.rentalOrder.count({
            where: {
                ...whereCondition,
                status: 'PICKED_UP',
            },
        }),
        prisma.rentalOrder.count({
            where: {
                ...whereCondition,
                status: 'RETURNED',
            },
        }),
        prisma.rentalOrder.count({
            where: {
                ...whereCondition,
                status: 'CANCELLED',
            },
        }),
    ]);

    return {
        total: stats[0],
        placed: stats[1],
        confirmed: stats[2],
        paid: stats[3],
        pickedUp: stats[4],
        returned: stats[5],
        cancelled: stats[6],
    };
};

export const rentalService = {
    createRentalIntoDB,
    getAllRentalsFromDB,
    getRentalByIdFromDB,
    getUserRentalsFromDB,
    cancelRentalFromDB,
    getRentalStatsFromDB,
};