
import AppError from '../../errors/AppError';
import { prisma } from '../../lib/prisma';
import { TProviderGear, TUpdateGear, TOrderStatusUpdate, TProviderStats } from './provider.interface';

// ==================== GEAR MANAGEMENT ====================

// Add Gear
const addGear = async (payload: TProviderGear, providerId: string) => {
    const { categoryId, ...rest } = payload;

    // 1. Check if category exists
    const category = await prisma.category.findUnique({
        where: { id: categoryId },
    });

    if (!category) {
        throw new AppError(404, 'Category not found!');
    }

    // 2. Check if gear with same name exists for this provider
    const existingGear = await prisma.gearItem.findFirst({
        where: {
            name: {
                equals: rest.name,
                mode: 'insensitive',
            },
            providerId: providerId,
        },
    });

    if (existingGear) {
        throw new AppError(409, 'You already have a gear item with this name!');
    }

    // 3. Create gear
    const gear = await prisma.gearItem.create({
        data: {
            ...rest,
            categoryId,
            providerId,
            availability: true,
        },
        include: {
            category: true,
            provider: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
    });

    return gear;
};

// Update Gear
const updateGear = async (gearId: string, payload: TUpdateGear, providerId: string) => {
    // 1. Check if gear exists and belongs to provider
    const gear = await prisma.gearItem.findUnique({
        where: { id: gearId },
    });

    if (!gear) {
        throw new AppError(404, 'Gear item not found!');
    }

    if (gear.providerId !== providerId) {
        throw new AppError(403, 'You are not authorized to update this gear!');
    }

    // 2. Check if category exists if provided
    if (payload.categoryId) {
        const category = await prisma.category.findUnique({
            where: { id: payload.categoryId },
        });

        if (!category) {
            throw new AppError(404, 'Category not found!');
        }
    }

    // 3. Update gear
    const updatedGear = await prisma.gearItem.update({
        where: { id: gearId },
        data: payload,
        include: {
            category: true,
            provider: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
    });

    return updatedGear;
};

// Delete Gear
const deleteGear = async (gearId: string, providerId: string) => {
    // 1. Check if gear exists and belongs to provider
    const gear = await prisma.gearItem.findUnique({
        where: { id: gearId },
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

    if (!gear) {
        throw new AppError(404, 'Gear item not found!');
    }

    if (gear.providerId !== providerId) {
        throw new AppError(403, 'You are not authorized to delete this gear!');
    }

    // 2. Check if gear has active rentals
    if (gear.rentalOrders.length > 0) {
        throw new AppError(400, 'Cannot delete gear with active rentals!');
    }

    // 3. Delete gear
    await prisma.gearItem.delete({
        where: { id: gearId },
    });

    return null;
};

// ==================== ORDER MANAGEMENT ====================

// Get Provider's Orders
const getProviderOrders = async (providerId: string) => {
    const orders = await prisma.rentalOrder.findMany({
        where: {
            gearItem: {
                providerId: providerId,
            },
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

    return orders;
};

// Update Order Status
const updateOrderStatus = async (orderId: string, providerId: string, status: string) => {
    // 1. Check if order exists and belongs to provider
    const order = await prisma.rentalOrder.findUnique({
        where: { id: orderId },
        include: {
            gearItem: true,
        },
    });

    if (!order) {
        throw new AppError(404, 'Rental order not found!');
    }

    if (order.gearItem.providerId !== providerId) {
        throw new AppError(403, 'You are not authorized to update this order!');
    }

    // 2. Define valid status transitions
    const validTransitions: Record<string, string[]> = {
        PLACED: ['CONFIRMED', 'CANCELLED'],
        CONFIRMED: ['PAID', 'CANCELLED'],
        PAID: ['PICKED_UP', 'CANCELLED'],
        PICKED_UP: ['RETURNED'],
        RETURNED: [],
        CANCELLED: [],
    };

    // 3. Validate status transition
    if (!validTransitions[order.status]?.includes(status)) {
        throw new AppError(
            400,
            `Invalid status transition from ${order.status} to ${status}!`
        );
    }

    // 4. Update order status
    const updatedOrder = await prisma.rentalOrder.update({
        where: { id: orderId },
        data: { status: status as any },
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
                    category: true,
                },
            },
            payment: true,
            review: true,
        },
    });

    // 5. Handle stock restoration on RETURNED status
    if (status === 'RETURNED') {
        await prisma.gearItem.update({
            where: { id: order.gearItemId },
            data: {
                stockQuantity: { increment: 1 },
                availability: true,
            },
        });
    }

    return updatedOrder;
};

// ==================== STATISTICS ====================

// Get Provider Statistics
const getProviderStats = async (providerId: string): Promise<TProviderStats> => {
    const stats = await prisma.$transaction([
        // Total gear
        prisma.gearItem.count({
            where: { providerId },
        }),
        // Available gear
        prisma.gearItem.count({
            where: { providerId, availability: true },
        }),
        // Unavailable gear
        prisma.gearItem.count({
            where: { providerId, availability: false },
        }),
        // Total orders
        prisma.rentalOrder.count({
            where: {
                gearItem: {
                    providerId,
                },
            },
        }),
        // Pending orders (PLACED, CONFIRMED)
        prisma.rentalOrder.count({
            where: {
                gearItem: {
                    providerId,
                },
                status: {
                    in: ['PLACED', 'CONFIRMED'],
                },
            },
        }),
        // Completed orders (RETURNED)
        prisma.rentalOrder.count({
            where: {
                gearItem: {
                    providerId,
                },
                status: 'RETURNED',
            },
        }),
    ]);

    return {
        totalGear: stats[0],
        availableGear: stats[1],
        unavailableGear: stats[2],
        totalOrders: stats[3],
        pendingOrders: stats[4],
        completedOrders: stats[5],
    };
};


export const providerServices = {
    addGear,
    updateGear,
    deleteGear,
    getProviderOrders,
    updateOrderStatus,
    getProviderStats,
};