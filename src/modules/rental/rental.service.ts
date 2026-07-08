import AppError from "../../errors/AppError";
import { prisma } from "../../lib/prisma";
import { TRentalOrder, TRentalFilters } from "./rental.interface";

const createRentalIntoDB = async (payload: TRentalOrder) => {
    const { startDate, endDate, gearItemId, customerId } = payload;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    // 1. Validate dates
    if (start < now) {
        throw new AppError(400, 'Start date cannot be in the past!');
    }

    if (end <= start) {
        throw new AppError(400, 'End date must be after start date!');
    }

    // 2. Check if gear exists and is available
    const gear = await prisma.gearItem.findUnique({
        where: { id: gearItemId },
        include: {
            provider: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    isSuspended: true,
                },
            },
        },
    });

    if (!gear) {
        throw new AppError(404, 'Gear item not found!');
    }

    if (!gear.availability || gear.stockQuantity < 1) {
        throw new AppError(400, 'Gear item is not available for rent!');
    }

    // 3. Check if gear belongs to the same customer
    if (gear.providerId === customerId) {
        throw new AppError(400, 'You cannot rent your own gear!');
    }

    // 4. Check if provider is suspended
    if (gear.provider.isSuspended) {
        throw new AppError(403, 'Provider account is suspended!');
    }

    // 5. Check if customer exists and is not suspended
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

    // 6. Check for overlapping rentals
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
        throw new AppError(409, 'This gear is already booked for the selected dates!');
    }

    // 7. Calculate total price
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const totalPrice = gear.pricePerDay * days;

    // 8. Create rental order
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

    // 9. Update gear stock
    await prisma.gearItem.update({
        where: { id: gearItemId },
        data: {
            stockQuantity: { decrement: 1 },
            availability: gear.stockQuantity - 1 <= 0 ? false : true,
        },
    });

    return rental;
};

// ==================== GET ALL RENTALS ====================
const getAllRentalsFromDB = async (filters: TRentalFilters = {}) => {
    const { status, customerId, providerId, searchTerm } = filters;

    const whereConditions: any = {};

    if (status) {
        whereConditions.status = status;
    }

    if (customerId) {
        whereConditions.customerId = customerId;
    }

    if (providerId) {
        whereConditions.gearItem = {
            providerId: providerId,
        };
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
        ];
    }

    const rentals = await prisma.rentalOrder.findMany({
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
            payment: true,
            review: true,
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    return rentals;
};

// ==================== GET RENTAL BY ID ====================
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
        throw new AppError(404, 'Rental order not found!');
    }

    // Check authorization
    if (userRole === 'CUSTOMER' && rental.customerId !== userId) {
        throw new AppError(403, 'You are not authorized to view this rental!');
    }

    if (userRole === 'PROVIDER' && rental.gearItem.providerId !== userId) {
        throw new AppError(403, 'You are not authorized to view this rental!');
    }

    return rental;
};

// ==================== GET USER RENTALS ====================
const getUserRentalsFromDB = async (userId: string) => {
    const rentals = await prisma.rentalOrder.findMany({
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

    return rentals;
};

// ==================== CANCEL RENTAL ====================
const cancelRentalFromDB = async (id: string, userId: string) => {
    const rental = await prisma.rentalOrder.findUnique({
        where: { id },
        include: {
            gearItem: true,
        },
    });

    if (!rental) {
        throw new AppError(404, 'Rental order not found!');
    }

    if (rental.customerId !== userId) {
        throw new AppError(403, 'You are not authorized to cancel this rental!');
    }

    if (rental.status !== 'PLACED') {
        throw new AppError(400, `Cannot cancel rental with status: ${rental.status}`);
    }

    // Update rental status
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

    // Restore gear stock
    await prisma.gearItem.update({
        where: { id: rental.gearItemId },
        data: {
            stockQuantity: { increment: 1 },
            availability: true,
        },
    });

    return cancelledRental;
};

// ==================== RENTAL STATS ====================
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