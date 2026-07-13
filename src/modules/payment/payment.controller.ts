import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { paymentService } from "./payment.service";
import AppError from "../../errors/AppError";

const createPayment = catchAsync(async (req: Request, res: Response) => {
    if (!req.user) {
        throw new AppError(httpStatus.UNAUTHORIZED, 'You are not authorized!');
    }

    const { rentalOrderId } = req.body;

    if (!rentalOrderId) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Rental order ID is required!');
    }

    const result = await paymentService.createPaymentIntoDB(rentalOrderId);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Payment created successfully!",
        data: result,
    });
});

const confirmPayment = catchAsync(async (req: Request, res: Response) => {
    if (!req.user) {
        throw new AppError(httpStatus.UNAUTHORIZED, 'You are not authorized!');
    }

    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Payment intent ID is required!');
    }

    const result = await paymentService.confirmPaymentIntoDB(paymentIntentId);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: result.message,
        data: result,
    });
});

const getPaymentHistory = catchAsync(async (req: Request, res: Response) => {
    if (!req.user) {
        throw new AppError(httpStatus.UNAUTHORIZED, 'You are not authorized!');
    }

    const payments = await paymentService.getPaymentHistoryFromDB(req.user.id);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Payment history retrieved successfully!",
        data: payments,
    });
});

const getPaymentDetails = catchAsync(async (req: Request, res: Response) => {
    if (!req.user) {
        throw new AppError(httpStatus.UNAUTHORIZED, 'You are not authorized!');
    }

    const { id } = req.params;

    if (!id) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Payment ID is required!');
    }

    const payment = await paymentService.getPaymentDetailsFromDB(id as string);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Payment details retrieved successfully!",
        data: payment,
    });
});

const getPaymentStatus = catchAsync(async (req: Request, res: Response) => {
    if (!req.user) {
        throw new AppError(httpStatus.UNAUTHORIZED, 'You are not authorized!');
    }

    const { rentalOrderId } = req.params;

    if (!rentalOrderId) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Rental order ID is required!');
    }

    const payment = await paymentService.getPaymentStatusFromDB(rentalOrderId as string);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Payment status retrieved successfully!",
        data: payment,
    });
});

const handleWebhook = catchAsync(async (req: Request, res: Response) => {
    const signature = req.headers['stripe-signature'] as string;
    const payload = req.body;

    if (!signature) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Stripe signature is required!');
    }

    await paymentService.handleWebhook(payload, signature);

    res.status(httpStatus.OK).json({
        success: true,
        message: 'Webhook processed successfully!',
    });
});

export const paymentController = {
    createPayment,
    confirmPayment,
    getPaymentHistory,
    getPaymentDetails,
    getPaymentStatus,
    handleWebhook,
};