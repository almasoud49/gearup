import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { rentalService } from "./rental.service";
import { pick } from "../../utils/pick";
import AppError from "../../errors/AppError";

const createRental = catchAsync(async (req: Request, res: Response) => {
    if (!req.user) {
        throw new AppError(httpStatus.UNAUTHORIZED, 'You are not authorized!');
    }

    const payload = {
        ...req.body,
        customerId: req.user.id,
    };

    const rental = await rentalService.createRentalIntoDB(payload);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.CREATED,
        message: "Rental order created successfully!",
        data: rental,
    });
});

const getAllRentals = catchAsync(async (req: Request, res: Response) => {
    if (!req.user) {
        throw new AppError(httpStatus.UNAUTHORIZED, 'You are not authorized!');
    }

    const query = pick(req.query, [
        'status',
        'searchTerm',
        'startDate',
        'endDate',
        'page',
        'limit',
        'sortBy',
        'sortOrder',
    ]);

    const rentals = await rentalService.getAllRentalsFromDB(
        query,
        req.user.id,
        req.user.role
    );

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Rentals retrieved successfully!",
        data: rentals.data,
        meta: rentals.meta,
    });
});

const getRentalById = catchAsync(async (req: Request, res: Response) => {
    if (!req.user) {
        throw new AppError(httpStatus.UNAUTHORIZED, 'You are not authorized!');
    }

    const { id } = req.params;
    const rental = await rentalService.getRentalByIdFromDB(id as string, req.user.id, req.user.role);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Rental order retrieved successfully!",
        data: rental,
    });
});

const getUserRentals = catchAsync(async (req: Request, res: Response) => {
    if (!req.user) {
        throw new AppError(httpStatus.UNAUTHORIZED, 'You are not authorized!');
    }

    const rentals = await rentalService.getUserRentalsFromDB(req.user.id);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Your rentals retrieved successfully!",
        data: rentals,
    });
});

const cancelRental = catchAsync(async (req: Request, res: Response) => {
    if (!req.user) {
        throw new AppError(httpStatus.UNAUTHORIZED, 'You are not authorized!');
    }

    const { id } = req.params;
    const rental = await rentalService.cancelRentalFromDB(id as string, req.user.id);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Rental order cancelled successfully!",
        data: rental,
    });
});

const getRentalStats = catchAsync(async (req: Request, res: Response) => {
    if (!req.user) {
        throw new AppError(httpStatus.UNAUTHORIZED, 'You are not authorized!');
    }

    const stats = await rentalService.getRentalStatsFromDB(req.user.id, req.user.role);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Rental statistics retrieved successfully!",
        data: stats,
    });
});

export const rentalController = {
    createRental,
    getAllRentals,
    getRentalById,
    getUserRentals,
    cancelRental,
    getRentalStats,
};