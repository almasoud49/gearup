import AppError from "../../errors/AppError";
import { prisma } from "../../lib/prisma";
import { TProviderGear, TUpdateGear } from "./provider.interface";


const addGearIntoDB = async (payload: TProviderGear, providerId: string) => {
    const { categoryId, ...rest } = payload;

    const category = await prisma.category.findUnique({
        where: { id: categoryId },
    });

    if (!category) {
        throw new AppError(404, 'Category not found!');
    }
  
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

const updateGearIntoDB = async (gearId: string, payload: TUpdateGear, providerId: string) => {
    const gear = await prisma.gearItem.findUnique({
        where: { id: gearId },
    });

    if (!gear) {
        throw new AppError(404, 'Gear item not found!');
    }

    if (gear.providerId !== providerId) {
        throw new AppError(403, 'You are not authorized to update this gear!');
    }
 
    if (payload.categoryId) {
        const category = await prisma.category.findUnique({
            where: { id: payload.categoryId },
        });

        if (!category) {
            throw new AppError(404, 'Category not found!');
        }
    }

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

const deleteGearFromDB = async (gearId: string, providerId: string) => {
    // 1. Check if gear exists
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

    if (gear.rentalOrders.length > 0) {
        throw new AppError(400, 'Cannot delete gear with active rentals!');
    }

    await prisma.gearItem.delete({
        where: { id: gearId },
    });

    return null;
};

const getProviderOrdersFromDB = async (providerId: string) => {
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

const updateOrderStatusIntoDB = async (orderId: string, providerId: string, status: string) => {
    // 1. Check if order exists
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
   
    const validTransitions: Record<string, string[]> = {
        PLACED: ['CONFIRMED', 'CANCELLED'],
        CONFIRMED: ['PAID', 'CANCELLED'],
        PAID: ['PICKED_UP', 'CANCELLED'],
        PICKED_UP: ['RETURNED'],
        RETURNED: [],
        CANCELLED: [],
    };
   
    if (!validTransitions[order.status]?.includes(status)) {
        throw new AppError(400, `Invalid status transition from ${order.status} to ${status}!`);
    }
 
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

const getProviderStatsFromDB = async (providerId: string) => {
    const stats = await prisma.$transaction([     
        prisma.gearItem.count({
            where: { providerId },
        }),    
        prisma.gearItem.count({
            where: { providerId, availability: true },
        }),        
        prisma.gearItem.count({
            where: { providerId, availability: false },
        }),       
        prisma.rentalOrder.count({
            where: {
                gearItem: {
                    providerId,
                },
            },
        }),      
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

export const providerService = {
    addGearIntoDB,
    updateGearIntoDB,
    deleteGearFromDB,
    getProviderOrdersFromDB,
    updateOrderStatusIntoDB,
    getProviderStatsFromDB,
};