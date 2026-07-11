import { Prisma } from "../../../generated/prisma/client";
import httpStatus from "http-status";
import AppError from "../../errors/AppError";
import {prisma} from "../../lib/prisma";
import { TUserStatusUpdate, TUserRoleUpdate, TAdminStats } from "./admin.interface";
import { getPagination, createMeta } from "../../utils/pagination";
import { findUserById } from "../../utils/user";

const getAllUsers = async (query: any) => {
    const { limit, page, skip, sortBy, sortOrder } = getPagination(query);

    const andConditions: Prisma.UserWhereInput[] = [];

    if (query.role) {
        andConditions.push({ role: query.role });
    }

    if (query.isSuspended !== undefined) {
        andConditions.push({
            isSuspended: query.isSuspended === "true",
        });
    }

    if (query.searchTerm) {
        andConditions.push({
            OR: [
                { name: { contains: query.searchTerm, mode: "insensitive" } },
                { email: { contains: query.searchTerm, mode: "insensitive" } },
            ],
        });
    }

    const users = await prisma.user.findMany({
        where: { AND: andConditions },
        take: limit,
        skip: skip,
        orderBy: { [sortBy]: sortOrder },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isSuspended: true,
            createdAt: true,
            updatedAt: true,
            _count: {
                select: {
                    gearItems: true,
                    rentalOrders: true,
                    reviews: true,
                },
            },
        },
    });

    const totalUserCount = await prisma.user.count({
        where: { AND: andConditions },
    });

    return {
        data: users,
        meta: createMeta(page, limit, totalUserCount),
    };
};

const getUserById = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isSuspended: true,
            createdAt: true,
            updatedAt: true,
            gearItems: {
                include: { category: true },
            },
            rentalOrders: {
                include: {
                    gearItem: true,
                    payment: true,
                },
                orderBy: { createdAt: 'desc' },
            },
            reviews: {
                include: { gearItem: true },
                orderBy: { createdAt: 'desc' },
            },
            _count: {
                select: {
                    gearItems: true,
                    rentalOrders: true,
                    reviews: true,
                },
            },
        },
    });

    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, 'User not found!');
    }

    return user;
};

const updateUserStatus = async (userId: string, payload: TUserStatusUpdate) => {
    const { isSuspended } = payload;

    const user = await findUserById(userId);

    if (user.role === 'ADMIN') {
        throw new AppError(httpStatus.FORBIDDEN, 'Cannot suspend an admin user!');
    }

    return await prisma.user.update({
        where: { id: userId },
        data: { isSuspended },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isSuspended: true,
            updatedAt: true,
        },
    });
};

const updateUserRole = async (userId: string, payload: TUserRoleUpdate) => {
    const { role } = payload;

    const user = await findUserById(userId);

    if (user.role === 'ADMIN') {
        throw new AppError(httpStatus.FORBIDDEN, 'Cannot change admin role!');
    }

    return await prisma.user.update({
        where: { id: userId },
        data: { role },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isSuspended: true,
            updatedAt: true,
        },
    });
};

const deleteUser = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            gearItems: {
                select: { id: true },
            },
            rentalOrders: {
                select: { id: true },
            },
            reviews: {
                select: { id: true },
            },
        },
    });

    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, 'User not found!');
    }

    if (user.role === 'ADMIN') {
        throw new AppError(httpStatus.FORBIDDEN, 'Cannot delete an admin user!');
    }

    const activeRentals = await prisma.rentalOrder.findMany({
        where: {
            customerId: userId,
            status: {
                notIn: ['RETURNED', 'CANCELLED'],
            },
        },
    });

    if (activeRentals.length > 0) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Cannot delete user with active rentals!');
    }

    await prisma.review.deleteMany({
        where: { customerId: userId },
    });

    await prisma.rentalOrder.deleteMany({
        where: { customerId: userId },
    });

    await prisma.gearItem.deleteMany({
        where: { providerId: userId },
    });

    await prisma.user.delete({
        where: { id: userId },
    });

    return null;
};

const getAllGear = async (query: any) => {
    const { limit, page, skip, sortBy, sortOrder } = getPagination(query);

    const andConditions: Prisma.GearItemWhereInput[] = [];

    if (query.searchTerm) {
        andConditions.push({
            OR: [
                { name: { contains: query.searchTerm, mode: "insensitive" } },
                { description: { contains: query.searchTerm, mode: "insensitive" } },
                { brand: { contains: query.searchTerm, mode: "insensitive" } },
            ],
        });
    }

    if (query.availability !== undefined) {
        andConditions.push({
            availability: query.availability === "true",
        });
    }

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
            _count: {
                select: {
                    rentalOrders: true,
                    reviews: true,
                },
            },
        },
    });

    const totalGearCount = await prisma.gearItem.count({
        where: { AND: andConditions },
    });

    return {
        data: gearItems,
        meta: createMeta(page, limit, totalGearCount),
    };
};

const getAllRentals = async (query: any) => {
    const { limit, page, skip, sortBy, sortOrder } = getPagination(query);

    const andConditions: Prisma.RentalOrderWhereInput[] = [];

    if (query.status) {
        andConditions.push({ status: query.status });
    }

    if (query.searchTerm) {
        andConditions.push({
            OR: [
                {
                    customer: {
                        name: {
                            contains: query.searchTerm,
                            mode: "insensitive",
                        },
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
            ],
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

const getAdminStats = async (): Promise<TAdminStats> => {
    const stats = await prisma.$transaction([
        prisma.user.count(),
        prisma.user.count({ where: { role: 'PROVIDER' } }),
        prisma.user.count({ where: { role: 'CUSTOMER' } }),
        prisma.gearItem.count(),
        prisma.rentalOrder.count(),
        prisma.payment.aggregate({
            where: { status: 'COMPLETED' },
            _sum: { amount: true },
        }),
        prisma.rentalOrder.count({
            where: {
                status: {
                    in: ['PLACED', 'CONFIRMED'],
                },
            },
        }),
        prisma.rentalOrder.count({
            where: {
                status: {
                    in: ['PAID', 'PICKED_UP'],
                },
            },
        }),
        prisma.rentalOrder.count({
            where: {
                status: 'RETURNED',
            },
        }),
    ]);

    return {
        totalUsers: stats[0],
        totalProviders: stats[1],
        totalCustomers: stats[2],
        totalGear: stats[3],
        totalRentals: stats[4],
        totalRevenue: stats[5]._sum.amount || 0,
        pendingRentals: stats[6],
        activeRentals: stats[7],
        completedRentals: stats[8],
    };
};

export const adminServices = {
    getAllUsers,
    getUserById,
    updateUserStatus,
    updateUserRole,
    deleteUser,
    getAllGear,
    getAllRentals,
    getAdminStats,
};