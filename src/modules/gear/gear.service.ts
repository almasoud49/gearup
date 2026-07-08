import AppError from "../../errors/AppError";
import { prisma } from "../../lib/prisma";
import { TGearItem, TGearFilters } from "./gear.interface";

const createGearIntoDB = async (payload: TGearItem) => {
    const { categoryId, providerId, name, stockQuantity, ...rest } = payload;
    const category = await prisma.category.findUnique({
        where: { id: categoryId },
    });

    if (!category) {
        throw new AppError(404, 'Category not found!');
    }
 
    const provider = await prisma.user.findUnique({
        where: { id: providerId },
        select: {
            id: true,
            role: true,
            isSuspended: true,
        },
    });

    if (!provider) {
        throw new AppError(404, 'Provider not found!');
    }

    if (provider.isSuspended) {
        throw new AppError(403, 'Provider account is suspended!');
    }

    if (provider.role !== 'PROVIDER' && provider.role !== 'ADMIN') {
        throw new AppError(403, 'Only providers and admins can create gear!');
    }
   
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
    
    const finalStockQuantity = stockQuantity || 1;
   
    const gear = await prisma.gearItem.create({
        data: {
            name,
            description: rest.description,
            pricePerDay: rest.pricePerDay,
            brand: rest.brand,
            stockQuantity: finalStockQuantity,
            availability: finalStockQuantity > 0,
            images: rest.images,
            specifications: rest.specifications,
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


const getAllGearFromDB = async (filters: TGearFilters = {}) => {
    const { category, brand, minPrice, maxPrice, availability, searchTerm } = filters;

    const whereConditions: any = {
        availability: availability !== undefined ? availability : true,
        stockQuantity: {
            gt: 0,
        },
    };

    if (category) {
        whereConditions.category = {
            name: {
                equals: category,
                mode: 'insensitive',
            },
        };
    }

    if (brand) {
        whereConditions.brand = {
            equals: brand,
            mode: 'insensitive',
        };
    }

    if (minPrice !== undefined) {
        whereConditions.pricePerDay = {
            gte: minPrice,
        };
    }

    if (maxPrice !== undefined) {
        whereConditions.pricePerDay = {
            ...whereConditions.pricePerDay,
            lte: maxPrice,
        };
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
            reviews: {
                select: {
                    rating: true,
                    comment: true,
                    createdAt: true,
                    customer: {
                        select: {
                            name: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
            },
            _count: {
                select: {
                    reviews: true,
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
    });
   
    const gearWithRating = gearItems.map((gear) => {
        const totalRating = gear.reviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = gear.reviews.length > 0 ? totalRating / gear.reviews.length : 0;

        return {
            ...gear,
            averageRating: Number(averageRating.toFixed(1)),
            totalReviews: gear._count.reviews,
        };
    });

    return gearWithRating;
};

const getGearByIdFromDB = async (id: string) => {
    const gear = await prisma.gearItem.findUnique({
        where: { id },
        include: {
            provider: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
            category: true,
            reviews: {
                select: {
                    id: true,
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
            _count: {
                select: {
                    reviews: true,
                },
            },
        },
    });

    if (!gear) {
        throw new AppError(404, 'Gear item not found!');
    }

    const totalRating = gear.reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = gear.reviews.length > 0 ? totalRating / gear.reviews.length : 0;

    return {
        ...gear,
        averageRating: Number(averageRating.toFixed(1)),
        totalReviews: gear._count.reviews,
    };
};

const updateGearIntoDB = async (id: string, payload: Partial<TGearItem>, providerId: string) => {   
    const gear = await prisma.gearItem.findUnique({
        where: { id },
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
        where: { id },
        data: payload,
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
    });

    return updatedGear;
};

const deleteGearFromDB = async (id: string, providerId: string) => { 
    const gear = await prisma.gearItem.findUnique({
        where: { id },
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
        where: { id },
    });

    return null;
};

const getProviderGearFromDB = async (providerId: string) => {
    const gearItems = await prisma.gearItem.findMany({
        where: { providerId },
        include: {
            category: true,
            rentalOrders: {
                select: {
                    id: true,
                    status: true,
                    startDate: true,
                    endDate: true,
                    customer: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
            },
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

export const gearService = {
    createGearIntoDB,
    getAllGearFromDB,
    getGearByIdFromDB,
    updateGearIntoDB,
    deleteGearFromDB,
    getProviderGearFromDB,
};