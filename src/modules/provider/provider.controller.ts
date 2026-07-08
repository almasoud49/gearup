import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { providerServices } from './provider.service';
import AppError from '../../errors/AppError';


const addGear = catchAsync(async (req: Request, res: Response) => {
    if (!req.user) {
        throw new AppError(401, 'You are not authorized! Please login.');
    }

    const gear = await providerServices.addGear(req.body, req.user.id);

    sendResponse(res, {
        success: true,
        statusCode: 201,
        message: 'Gear added successfully!',
        data: gear,
    });
});

// Update Gear
const updateGear = catchAsync(async (req: Request, res: Response) => {
    if (!req.user) {
        throw new AppError(401, 'You are not authorized! Please login.');
    }

    const { id } = req.params;

    if (!id) {
        throw new AppError(400, 'Gear ID is required!');
    }

    const gear = await providerServices.updateGear(id as string, req.body, req.user.id);

    sendResponse(res, {
        success: true,
        statusCode: 200,
        message: 'Gear updated successfully!',
        data: gear,
    });
});

// Delete Gear
const deleteGear = catchAsync(async (req: Request, res: Response) => {
    if (!req.user) {
        throw new AppError(401, 'You are not authorized! Please login.');
    }

    const { id } = req.params;

    if (!id) {
        throw new AppError(400, 'Gear ID is required!');
    }

    await providerServices.deleteGear(id as string, req.user.id);

    sendResponse(res, {
        success: true,
        statusCode: 200,
        message: 'Gear deleted successfully!',
        data: null,
    });
});


const getProviderOrders = catchAsync(async (req: Request, res: Response) => {
    if (!req.user) {
        throw new AppError(401, 'You are not authorized! Please login.');
    }

    const orders = await providerServices.getProviderOrders(req.user.id);

    sendResponse(res, {
        success: true,
        statusCode: 200,
        message: 'Provider orders retrieved successfully!',
        data: orders,
    });
});

const updateOrderStatus = catchAsync(async (req: Request, res: Response) => {
    if (!req.user) {
        throw new AppError(401, 'You are not authorized! Please login.');
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!id) {
        throw new AppError(400, 'Order ID is required!');
    }

    if (!status) {
        throw new AppError(400, 'Status is required!');
    }

    const order = await providerServices.updateOrderStatus(id as string, req.user.id, status);

    sendResponse(res, {
        success: true,
        statusCode: 200,
        message: `Order status updated to ${status} successfully!`,
        data: order,
    });
});

// ==================== STATISTICS ====================

// Get Provider Statistics
const getProviderStats = catchAsync(async (req: Request, res: Response) => {
    if (!req.user) {
        throw new AppError(401, 'You are not authorized! Please login.');
    }

    const stats = await providerServices.getProviderStats(req.user.id);

    sendResponse(res, {
        success: true,
        statusCode: 200,
        message: 'Provider statistics retrieved successfully!',
        data: stats,
    });
});

export const providerController = {
    addGear,
    updateGear,
    deleteGear,
    getProviderOrders,
    updateOrderStatus,
    getProviderStats,
};