import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { categoryService } from "./category.service";
import { pick } from "../../utils/pick";


const createCategory = catchAsync(async (req: Request, res: Response) => {
    const category = await categoryService.createCategoryIntoDB(req.body);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.CREATED,
        message: "Category created successfully!",
        data: category,
    });
});

const getAllCategories = catchAsync(async (req: Request, res: Response) => {
    const filters = pick(req.query, ['searchTerm']);
    const categories = await categoryService.getAllCategoriesFromDB(filters);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Categories retrieved successfully!",
        data: categories,
    });
});

const getCategoryById = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const category = await categoryService.getCategoryByIdFromDB(id as string);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Category retrieved successfully!",
        data: category,
    });
});

const updateCategory = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const category = await categoryService.updateCategoryIntoDB(id as string, req.body);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Category updated successfully!",
        data: category,
    });
});

const deleteCategory = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    await categoryService.deleteCategoryFromDB(id as string);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Category deleted successfully!",
        data: null,
    });
});

export const categoryController = {
    createCategory,
    getAllCategories,
    getCategoryById,
    updateCategory,
    deleteCategory,
};