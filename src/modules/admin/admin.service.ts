import AppError from '../../errors/AppError';
import { prisma } from '../../lib/prisma';
import { TUserStatusUpdate, TUserRoleUpdate, TAdminStats, TUserFilter } from './admin.interface';


const getAllUsers = async (filters: TUserFilter = {}) => {
    const { role, isSuspended, searchTerm } = filters;

    const whereConditions: any = {};

    if (role) {
        whereConditions.role = role;
    }

    if (isSuspended !== undefined) {
        whereConditions.isSuspended = isSuspended;
    }

    if (searchTerm) {
        whereConditions.OR = [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { email: { contains: searchTerm, mode: 'insensitive' } },
        ];
    }

    const users = await prisma.user.findMany({
        where: whereConditions,
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
        orderBy: {
            createdAt: 'desc',
        },
    });

    return users;
};

// Get User by ID
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
                include: {
                    category: true,
                },
            },
            rentalOrders: {
                include: {
                    gearItem: true,
                    payment: true,
                },
                orderBy: {
                    createdAt: 'desc',
                },
            },
            reviews: {
                include: {
                    gearItem: true,
                },
                orderBy: {
                    createdAt: 'desc',
                },
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
        throw new AppError(404, 'User not found!');
    }

    return user;
};

const updateUserStatus = async (userId: string, payload: TUserStatusUpdate) => {
    const { isSuspended } = payload;

    // 1. Check if user exists
    const user = await prisma.user.findUnique({
        where: { id: userId },
    });

    if (!user) {
        throw new AppError(404, 'User not found!');
    }

    // 2. Prevent suspending admin
    if (user.role === 'ADMIN') {
        throw new AppError(403, 'Cannot suspend an admin user!');
    }

    // 3. Update user status
    const updatedUser = await prisma.user.update({
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

    return updatedUser;
};

// Change User Role
const updateUserRole = async (userId: string, payload: TUserRoleUpdate) => {
    const { role } = payload;

    // 1. Check if user exists
    const user = await prisma.user.findUnique({
        where: { id: userId },
    });

    if (!user) {
        throw new AppError(404, 'User not found!');
    }
    
    if (user.role === 'ADMIN') {
        throw new AppError(403, 'Cannot change admin role!');
    }
   
    const updatedUser = await prisma.user.update({
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

    return updatedUser;
};

const deleteUser = async (userId: string) => {
    // 1. Check if user exists
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            rentalOrders: {
                where: {
                    status: {
                        in: ['PLACED', 'CONFIRMED', 'PAID', 'PICKED_UP'],
                    },
                },
            },
        },
    });

    if (!user) {
        throw new AppError(404, 'User not found!');
    }

    // 2. Prevent deleting admin
    if (user.role === 'ADMIN') {
        throw new AppError(403, 'Cannot delete an admin user!');
    }

    // 3. Check if user has active rentals
    if (user.rentalOrders.length > 0) {
        throw new AppError(400, 'Cannot delete user with active rentals!');
    }

    // 4. Delete user
    await prisma.user.delete({
        where: { id: userId },
    });

    return null;
};


const getAllGear = async (filters: { searchTerm?: string; availability?: boolean } = {}) => {
    const { searchTerm, availability } = filters;

    const whereConditions: any = {};

    if (availability !== undefined) {
        whereConditions.availability = availability;
    }

    if (searchTerm) {
        whereConditions.OR = [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
            { brand: { contains: searchTerm, mode: 'insensitive' } },
        ];
    }

    const gearItems = await prisma.gearItem.findMany({
        where: whereConditions,
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
        orderBy: {
            createdAt: 'desc',
        },
    });

    return gearItems;
};


const getAllRentals = async (filters: { status?: string; searchTerm?: string } = {}) => {
    const { status, searchTerm } = filters;

    const whereConditions: any = {};

    if (status) {
        whereConditions.status = status;
    }

    if (searchTerm) {
        whereConditions.OR = [
            {
                customer: {
                    name: {
                        contains: searchTerm,
                        mode: 'insensitive',
                    },
                },
            },
            {
                gearItem: {
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


const getAdminStats = async (): Promise<TAdminStats> => {
    const stats = await prisma.$transaction([
        // Total users
        prisma.user.count(),
        // Total providers
        prisma.user.count({ where: { role: 'PROVIDER' } }),
        // Total customers
        prisma.user.count({ where: { role: 'CUSTOMER' } }),
        // Total gear
        prisma.gearItem.count(),
        // Total rentals
        prisma.rentalOrder.count(),
        // Total revenue (from completed payments)
        prisma.payment.aggregate({
            where: { status: 'COMPLETED' },
            _sum: {
                amount: true,
            },
        }),
        // Pending rentals (PLACED, CONFIRMED)
        prisma.rentalOrder.count({
            where: {
                status: {
                    in: ['PLACED', 'CONFIRMED'],
                },
            },
        }),
        // Active rentals (PAID, PICKED_UP)
        prisma.rentalOrder.count({
            where: {
                status: {
                    in: ['PAID', 'PICKED_UP'],
                },
            },
        }),
        // Completed rentals (RETURNED)
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