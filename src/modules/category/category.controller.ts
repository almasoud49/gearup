import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { categoryService } from "./category.service";

const createCategory = catchAsync(async (req: Request, res: Response) => {
    const category = await categoryService.createCategory(req.body);

    sendResponse(res, {
        success: true,
        statusCode: 201,
        message: 'Category created successfully!',
        data: category,
    });
});

export const categoryController = {
    createCategory
};