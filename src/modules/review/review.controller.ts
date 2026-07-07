import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import AppError from "../../errors/AppError";
import { reviewService } from "./review.service";
import { sendResponse } from "../../utils/sendResponse";

const createReview = catchAsync(async (req: Request, res: Response) => {
    console.log('📝 Public Request Body:', req.body);

    if (!req.body || Object.keys(req.body).length === 0) {
        throw new AppError(400, 'Request body is empty! Please send data in JSON format.');
    }

    if (!req.body.rating) {
        throw new AppError(400, 'Rating is required!');
    }
    if (!req.body.gearItemId) {
        throw new AppError(400, 'Gear item ID is required!');
    }

    const review = await reviewService.createReview(req.body);

    sendResponse(res, {
        success: true,
        statusCode: 201,
        message: 'Review created successfully! (Public - Testing Only)',
        data: review,
    });
});



export const reviewController = {
    createReview
}