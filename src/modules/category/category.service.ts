import AppError from "../../errors/AppError";
import { prisma } from "../../lib/prisma";
import { TCategory, TCategoryFilters } from "./category.interface";


const createCategoryIntoDB = async (payload: TCategory) => {    
    const existingCategory = await prisma.category.findUnique({
        where: { name: payload.name },
    });

    if (existingCategory) {
        throw new AppError(409, 'Category already exists!');
    }
    const category = await prisma.category.create({
        data: payload,
    });

    return category;
};


const getAllCategoriesFromDB = async (filters: TCategoryFilters = {}) => {
    const { searchTerm } = filters;

    const whereConditions: any = {};

    if (searchTerm) {
        whereConditions.OR = [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
        ];
    }

    const categories = await prisma.category.findMany({
        where: whereConditions,
        select: {
            id: true,
            name: true,
            description: true,
            createdAt: true,
            updatedAt: true,
            _count: {
                select: {
                    gearItems: true,
                },
            },
        },
        orderBy: {
            name: 'asc',
        },
    });

    return categories;
};

const getCategoryByIdFromDB = async (id: string) => {
    const category = await prisma.category.findUnique({
        where: { id },
        select: {
            id: true,
            name: true,
            description: true,
            createdAt: true,
            updatedAt: true,
            gearItems: {
                select: {
                    id: true,
                    name: true,
                    pricePerDay: true,
                    availability: true,
                    stockQuantity: true,
                    images: true,
                },
                take: 10,
            },
            _count: {
                select: {
                    gearItems: true,
                },
            },
        },
    });

    if (!category) {
        throw new AppError(404, 'Category not found!');
    }

    return category;
};

const updateCategoryIntoDB = async (id: string, payload: Partial<TCategory>) => { 
    const category = await prisma.category.findUnique({
        where: { id },
    });

    if (!category) {
        throw new AppError(404, 'Category not found!');
    }

    if (payload.name) {
        const existingCategory = await prisma.category.findUnique({
            where: { name: payload.name },
        });

        if (existingCategory && existingCategory.id !== id) {
            throw new AppError(409, 'Category name already exists!');
        }
    }

    const updatedCategory = await prisma.category.update({
        where: { id },
        data: payload,
    });

    return updatedCategory;
};

const deleteCategoryFromDB = async (id: string) => {   
    const category = await prisma.category.findUnique({
        where: { id },
        include: {
            gearItems: {
                select: {
                    id: true,
                },
            },
        },
    });

    if (!category) {
        throw new AppError(404, 'Category not found!');
    }

    if (category.gearItems.length > 0) {
        throw new AppError(400, 'Cannot delete category with existing gear items!');
    }

    await prisma.category.delete({
        where: { id },
    });

    return null;
};

export const categoryService = {
    createCategoryIntoDB,
    getAllCategoriesFromDB,
    getCategoryByIdFromDB,
    updateCategoryIntoDB,
    deleteCategoryFromDB,
};