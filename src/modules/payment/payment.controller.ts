import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { paymentService } from "./payment.service";
import AppError from "../../errors/AppError";

const createPayment = catchAsync(async (req: Request, res: Response) => {
    if (!req.user) {
        throw new AppError(401, 'You are not authorized!');
    }

    const { rentalOrderId } = req.body;

    if (!rentalOrderId) {
        throw new AppError(400, 'Rental order ID is required!');
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
        throw new AppError(401, 'You are not authorized!');
    }

    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
        throw new AppError(400, 'Payment intent ID is required!');
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
        throw new AppError(401, 'You are not authorized!');
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
        throw new AppError(401, 'You are not authorized!');
    }

    const { id } = req.params;

    if (!id) {
        throw new AppError(400, 'Payment ID is required!');
    }

    const payment = await paymentService.getPaymentDetailsFromDB(id as string);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Payment details retrieved successfully!",
        data: payment,
    });
});

const handleWebhook = catchAsync(async (req: Request, res: Response) => {
    const signature = req.headers['stripe-signature'] as string;
    const payload = req.body;

    if (!signature) {
        throw new AppError(400, 'Stripe signature is required!');
    }

    await paymentService.handleWebhook(payload, signature);

    res.status(200).json({
        success: true,
        message: 'Webhook processed successfully!',
    });
});

export const paymentController = {
    createPayment,
    confirmPayment,
    getPaymentHistory,
    getPaymentDetails,
    handleWebhook,
};