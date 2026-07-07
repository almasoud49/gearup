import AppError from "../../errors/AppError";
import { prisma } from "../../lib/prisma";
import { TCategory } from "./category.interface";

const createCategory = async (payload: TCategory) => {
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


export const categoryService = {
    createCategory
 
};