import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { providerService } from "./provider.service";
import AppError from "../../errors/AppError";
import { string } from "zod";

const addGear = catchAsync(async (req: Request, res: Response) => {
    if (!req.user) {
        throw new AppError(httpStatus.UNAUTHORIZED, 'You are not authorized!');
    }

    const gear = await providerService.addGearIntoDB(req.body, req.user.id);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.CREATED,
        message: "Gear added successfully!",
        data: gear,
    });
});

const updateGear = catchAsync(async (req: Request, res: Response) => {
    if (!req.user) {
        throw new AppError(httpStatus.UNAUTHORIZED, 'You are not authorized!');
    }

    const { id } = req.params;

    if (!id) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Gear ID is required!');
    }

    const gear = await providerService.updateGearIntoDB(id as string, req.body, req.user.id);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Gear updated successfully!",
        data: gear,
    });
});

const deleteGear = catchAsync(async (req: Request, res: Response) => {
    if (!req.user) {
        throw new AppError(httpStatus.UNAUTHORIZED, 'You are not authorized!');
    }

    const { id } = req.params;

    if (!id) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Gear ID is required!');
    }

    await providerService.deleteGearFromDB(id as string, req.user.id);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Gear deleted successfully!",
        data: null,
    });
});

const getProviderOrders = catchAsync(async (req: Request, res: Response) => {
    if (!req.user) {
        throw new AppError(httpStatus.UNAUTHORIZED, 'You are not authorized!');
    }

    const orders = await providerService.getProviderOrdersFromDB(req.user.id);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Provider orders retrieved successfully!",
        data: orders,
    });
});

const updateOrderStatus = catchAsync(async (req: Request, res: Response) => {
    if (!req.user) {
        throw new AppError(httpStatus.UNAUTHORIZED, 'You are not authorized!');
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!id) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Order ID is required!');
    }

    if (!status) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Status is required!');
    }

    const order = await providerService.updateOrderStatusIntoDB(id as string, req.user.id, status);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: `Order status updated to ${status} successfully!`,
        data: order,
    });
});

const getProviderStats = catchAsync(async (req: Request, res: Response) => {
    if (!req.user) {
        throw new AppError(httpStatus.UNAUTHORIZED, 'You are not authorized!');
    }

    const stats = await providerService.getProviderStatsFromDB(req.user.id);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Provider statistics retrieved successfully!",
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