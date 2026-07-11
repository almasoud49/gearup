import httpStatus from "http-status";
import AppError from "../errors/AppError";
import { prisma } from "../lib/prisma";

export const validateCategory = async (categoryId: string) => {
    const category = await prisma.category.findUnique({
        where: { id: categoryId },
    });
    
    if (!category) {
        throw new AppError(httpStatus.NOT_FOUND, 'Category not found!');
    }
    return category;
};

export const validateGear = async (gearId: string) => {
    const gear = await prisma.gearItem.findUnique({
        where: { id: gearId },
        include: {
            provider: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    isSuspended: true,
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
                            id: true,
                            name: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
            },
            rentalOrders: {
                where: {
                    status: {
                        in: ['PLACED', 'CONFIRMED', 'PAID', 'PICKED_UP'],
                    },
                },
            },
            _count: {
                select: {
                    reviews: true,
                },
            },
        },
    });
    
    if (!gear) {
        throw new AppError(httpStatus.NOT_FOUND, 'Gear item not found!');
    }
    return gear;
};

export const validateGearBasic = async (gearId: string) => {
    const gear = await prisma.gearItem.findUnique({
        where: { id: gearId },
        include: {
            provider: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    isSuspended: true,
                },
            },
            rentalOrders: {
                where: {
                    status: {
                        in: ['PLACED', 'CONFIRMED', 'PAID', 'PICKED_UP'],
                    },
                },
            },
        },
    });
    
    if (!gear) {
        throw new AppError(httpStatus.NOT_FOUND, 'Gear item not found!');
    }
    return gear;
};

export const validateProvider = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true, isSuspended: true },
    });
    
    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, 'Provider not found!');
    }
    
    if (user.isSuspended) {
        throw new AppError(httpStatus.FORBIDDEN, 'Provider account is suspended!');
    }
    
    if (user.role !== 'PROVIDER' && user.role !== 'ADMIN') {
        throw new AppError(httpStatus.FORBIDDEN, 'Only providers and admins can perform this action!');
    }
    return user;
};

export const validateRental = async (rentalId: string) => {
    const rental = await prisma.rentalOrder.findUnique({
        where: { id: rentalId },
        include: {
            gearItem: true,
        },
    });
    
    if (!rental) {
        throw new AppError(httpStatus.NOT_FOUND, 'Rental order not found!');
    }
    return rental;
};

export const validateCustomer = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, isSuspended: true },
    });
    
    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, 'Customer not found!');
    }
    
    if (user.isSuspended) {
        throw new AppError(httpStatus.FORBIDDEN, 'Your account has been suspended!');
    }
    return user;
};