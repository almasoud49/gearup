import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { paymentServices } from './payment.service';
import AppError from '../../errors/AppError';

// ==================== CREATE PAYMENT ====================
const createPayment = catchAsync(async (req: Request, res: Response) => {
    const { rentalOrderId } = req.body;

    if (!rentalOrderId) {
        throw new AppError(400, 'Rental order ID is required!');
    }

    const result = await paymentServices.createPayment(rentalOrderId);

    sendResponse(res, {
        success: true,
        statusCode: 200,
        message: 'Payment created successfully!',
        data: result,
    });
});

// ==================== CONFIRM PAYMENT ====================
const confirmPayment = catchAsync(async (req: Request, res: Response) => {
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
        throw new AppError(400, 'Payment intent ID is required!');
    }

    const result = await paymentServices.confirmPayment(paymentIntentId);

    sendResponse(res, {
        success: true,
        statusCode: 200,
        message: result.message,
        data: result,
    });
});

// ==================== GET PAYMENT HISTORY ====================
const getPaymentHistory = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
        throw new AppError(401, 'You are not authorized! Please login.');
    }

    const payments = await paymentServices.getPaymentHistory(userId);

    sendResponse(res, {
        success: true,
        statusCode: 200,
        message: 'Payment history retrieved successfully!',
        data: payments,
    });
});

// ==================== GET PAYMENT DETAILS ====================
const getPaymentDetails = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
        throw new AppError(400, 'Payment ID is required!');
    }

    const payment = await paymentServices.getPaymentDetails(id as string);

    sendResponse(res, {
        success: true,
        statusCode: 200,
        message: 'Payment details retrieved successfully!',
        data: payment,
    });
});

// ==================== HANDLE WEBHOOK ====================
const handleWebhook = catchAsync(async (req: Request, res: Response) => {
    const signature = req.headers['stripe-signature'] as string;
    const payload = req.body;

    if (!signature) {
        throw new AppError(400, 'Stripe signature is required!');
    }

    await paymentServices.handleWebhook(payload, signature);

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