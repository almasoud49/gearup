import httpStatus from "http-status";
import { gearService } from "../gear/gear.service";
import { TProviderGear, TUpdateGear } from "./provider.interface";
import { validateRental, validateProvider } from "../../utils/common";
import {prisma} from "../../lib/prisma";
import AppError from "../../errors/AppError";

const addGearIntoDB = async (payload: TProviderGear, providerId: string) => {
    return await gearService.createGearIntoDB({ ...payload, providerId });
};

const updateGearIntoDB = async (gearId: string, payload: TUpdateGear, providerId: string) => {
    return await gearService.updateGearIntoDB(gearId, payload, providerId);
};

const deleteGearFromDB = async (gearId: string, providerId: string) => {
    return await gearService.deleteGearFromDB(gearId, providerId);
};

const getProviderOrdersFromDB = async (providerId: string) => {
    return await prisma.rentalOrder.findMany({
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
};

const updateOrderStatusIntoDB = async (orderId: string, providerId: string, status: string) => {
    const order = await validateRental(orderId);

    if (order.gearItem.providerId !== providerId) {
        throw new AppError(httpStatus.FORBIDDEN, 'You are not authorized to update this order!');
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
        throw new AppError(httpStatus.BAD_REQUEST, `Invalid status transition from ${order.status} to ${status}!`);
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
    await validateProvider(providerId);

    const stats = await prisma.$transaction([
        prisma.gearItem.count({ where: { providerId } }),
        prisma.gearItem.count({ where: { providerId, availability: true } }),
        prisma.gearItem.count({ where: { providerId, availability: false } }),
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