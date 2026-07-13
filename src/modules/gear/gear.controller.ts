import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { gearService } from "./gear.service";
import { pick } from "../../utils/pick";
import AppError from "../../errors/AppError";

const createGear = catchAsync(async (req: Request, res: Response) => {
    if (!req.user) {
        throw new AppError(httpStatus.UNAUTHORIZED, 'You are not authorized!');
    }

    const payload = {
        ...req.body,
        providerId: req.user.id,
    };

    const gear = await gearService.createGearIntoDB(payload);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.CREATED,
        message: "Gear item created successfully!",
        data: gear,
    });
});

const getAllGear = catchAsync(async (req: Request, res: Response) => {
    const query = pick(req.query, [
        'category',
        'brand',
        'minPrice',
        'maxPrice',
        'availability',
        'searchTerm',
        'page',
        'limit',
        'sortBy',
        'sortOrder',
    ]);

    const result = await gearService.getAllGearFromDB(query);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Gear items retrieved successfully!",
        data: result.data,
        meta: result.meta,
    });
});

const getGearById = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const gear = await gearService.getGearByIdFromDB(id as string);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Gear item retrieved successfully!",
        data: gear,
    });
});

const updateGear = catchAsync(async (req: Request, res: Response) => {
    if (!req.user) {
        throw new AppError(httpStatus.UNAUTHORIZED, 'You are not authorized!');
    }

    const { id } = req.params;
    const gear = await gearService.updateGearIntoDB(id as string, req.body, req.user.id);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Gear item updated successfully!",
        data: gear,
    });
});

const deleteGear = catchAsync(async (req: Request, res: Response) => {
    if (!req.user) {
        throw new AppError(httpStatus.UNAUTHORIZED, 'You are not authorized!');
    }

    const { id } = req.params;
    await gearService.deleteGearFromDB(id as string, req.user.id);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Gear item deleted successfully!",
        data: null,
    });
});

const getProviderGear = catchAsync(async (req: Request, res: Response) => {
    if (!req.user) {
        throw new AppError(httpStatus.UNAUTHORIZED, 'You are not authorized!');
    }

    const gearItems = await gearService.getProviderGearFromDB(req.user.id);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Provider gear items retrieved successfully!",
        data: gearItems,
    });
});

export const gearController = {
    createGear,
    getAllGear,
    getGearById,
    updateGear,
    deleteGear,
    getProviderGear,
};