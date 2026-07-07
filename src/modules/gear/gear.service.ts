import AppError from "../../errors/AppError";
import { prisma } from "../../lib/prisma";
import { TGearItem } from "./gear.interface";

const createGear = async (payload: TGearItem) => {
    const { categoryId, providerId, name, stockQuantity, ...rest } = payload;

    // 1. Check if providerId exists
    if (!providerId) {
        throw new AppError(400, 'Provider ID is required!');
    }

    // 2. Check if category exists
    const category = await prisma.category.findUnique({
        where: { id: categoryId },
    });

    if (!category) {
        throw new AppError(404, 'Category not found!');
    }

    // 3. Check if provider exists
    const provider = await prisma.user.findUnique({
        where: { id: providerId },
        select: { 
            id: true, 
            role: true, 
            isSuspended: true 
        },
    });

    if (!provider) {
        throw new AppError(404, 'Provider not found!');
    }

    // 4. Check if user is suspended
    if (provider.isSuspended) {
        throw new AppError(403, 'Provider account is suspended! You cannot create gear.');
    }

    // 5. Check if user has permission (PROVIDER or ADMIN)
    // if (provider.role !== 'PROVIDER' && provider.role !== 'ADMIN') {
    //     throw new AppError(403, 'Only providers and admins can create gear items!');
    // }

    // 6. Check if gear with same name already exists for this provider
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
        throw new AppError(409, 'You already have a gear item with this name!');
    }

    // 7. Validate stock quantity
    const finalStockQuantity = stockQuantity || 1;
    if (finalStockQuantity < 1) {
        throw new AppError(400, 'Stock quantity must be at least 1!');
    }

    // 8. Create gear item
    const gear = await prisma.gearItem.create({
        data: {
            name,
            stockQuantity: finalStockQuantity,
            availability: finalStockQuantity > 0,
            ...rest,
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

    return gear;
};

export const gearService = {
    createGear
}