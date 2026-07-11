import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { reviewService } from "./review.service";
import { pick } from "../../utils/pick";
import AppError from "../../errors/AppError";

const createReview = catchAsync(async (req: Request, res: Response) => {
    if (!req.user) {
        throw new AppError(httpStatus.UNAUTHORIZED, 'You are not authorized!');
    }

    const payload = {
        ...req.body,
        customerId: req.user.id,
    };

    const review = await reviewService.createReviewIntoDB(payload);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.CREATED,
        message: "Review created successfully!",
        data: review,
    });
});

const getAllReviews = catchAsync(async (req: Request, res: Response) => {
    const query = pick(req.query, [
        'rating',
        'gearItemId',
        'customerId',
        'searchTerm',
        'page',
        'limit',
        'sortBy',
        'sortOrder',
    ]);

    const result = await reviewService.getAllReviewsFromDB(query);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Reviews retrieved successfully!",
        data: result.data,
        meta: result.meta,
    });
});

const getReviewById = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const review = await reviewService.getReviewByIdFromDB(id as string);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Review retrieved successfully!",
        data: review,
    });
});

const getGearReviews = catchAsync(async (req: Request, res: Response) => {
    const { gearId } = req.params;
    const result = await reviewService.getGearReviewsFromDB(gearId as string);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Gear reviews retrieved successfully!",
        data: result,
    });
});

const updateReview = catchAsync(async (req: Request, res: Response) => {
    if (!req.user) {
        throw new AppError(httpStatus.UNAUTHORIZED, 'You are not authorized!');
    }

    const { id } = req.params;
    const review = await reviewService.updateReviewIntoDB(id as string, req.body, req.user.id, req.user.role);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Review updated successfully!",
        data: review,
    });
});

const deleteReview = catchAsync(async (req: Request, res: Response) => {
    if (!req.user) {
        throw new AppError(httpStatus.UNAUTHORIZED, 'You are not authorized!');
    }

    const { id } = req.params;
    await reviewService.deleteReviewFromDB(id as string, req.user.id, req.user.role);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Review deleted successfully!",
        data: null,
    });
});

export const reviewController = {
    createReview,
    getAllReviews,
    getReviewById,
    getGearReviews,
    updateReview,
    deleteReview,
};