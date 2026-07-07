import AppError from "../../errors/AppError";
import { prisma } from "../../lib/prisma";
import { TRentalOrder } from "./rental.interface";

const createRental = async (payload: any) => {
    // ✅ Debug: Log the payload
    console.log('📝 Creating public rental with payload:', payload);

    // ✅ Check if payload exists
    if (!payload) {
        throw new AppError(400, 'Request payload is missing!');
    }

    const { startDate, endDate, gearItemId, customerId } = payload;

    // ✅ Check if required fields are present
    if (!startDate) {
        throw new AppError(400, 'Start date is required!');
    }
    if (!endDate) {
        throw new AppError(400, 'End date is required!');
    }
    if (!gearItemId) {
        throw new AppError(400, 'Gear item ID is required!');
    }

    // 1. Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    if (isNaN(start.getTime())) {
        throw new AppError(400, 'Invalid start date format!');
    }
    if (isNaN(end.getTime())) {
        throw new AppError(400, 'Invalid end date format!');
    }

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

    // 3. Get or create default customer
    let defaultCustomerId = customerId;

    if (!defaultCustomerId) {
        // Find first customer
        const defaultCustomer = await prisma.user.findFirst({
            where: { 
                role: 'CUSTOMER',
                isSuspended: false,
            },
            select: { id: true },
        });

        if (!defaultCustomer) {
            // Create a default customer if none exists
            const newCustomer = await prisma.user.create({
                data: {
                    name: 'Default Customer',
                    email: 'default@customer.com',
                    password: '$2b$10$defaultPasswordHash',
                    role: 'CUSTOMER',
                },
                select: { id: true },
            });
            defaultCustomerId = newCustomer.id;
            console.log('🔓 Created default customer:', defaultCustomerId);
        } else {
            defaultCustomerId = defaultCustomer.id;
        }
    }

    // 4. Check if gear belongs to the same customer
    if (gear.providerId === defaultCustomerId) {
        throw new AppError(400, 'Cannot rent gear to its owner!');
    }

    // 5. Check for overlapping rentals
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

    // 6. Calculate total price
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const totalPrice = gear.pricePerDay * days;

    // 7. Create rental order
    const rental = await prisma.rentalOrder.create({
        data: {
            startDate: start,
            endDate: end,
            totalPrice,
            customerId: defaultCustomerId,
            gearItemId: gearItemId!,
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

    // 8. Update gear stock
    await prisma.gearItem.update({
        where: { id: gearItemId },
        data: {
            stockQuantity: { decrement: 1 },
            availability: gear.stockQuantity - 1 <= 0 ? false : true,
        },
    });

    return rental;
};


export const rentalService = {
    createRental
}