import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { rentalService } from "./rental.service";
import { pick } from "../../utils/pick";
import AppError from "../../errors/AppError";

// ==================== CREATE RENTAL ====================
const createRental = catchAsync(async (req: Request, res: Response) => {
    if (!req.user) {
        throw new AppError(401, 'You are not authorized!');
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

// ==================== GET ALL RENTALS ====================
const getAllRentals = catchAsync(async (req: Request, res: Response) => {
    if (!req.user) {
        throw new AppError(401, 'You are not authorized!');
    }

    const rawFilters = pick(req.query, ['status', 'customerId', 'providerId', 'searchTerm']);
    
    const filters: any = {
        status: rawFilters.status as string | undefined,
        customerId: rawFilters.customerId as string | undefined,
        providerId: rawFilters.providerId as string | undefined,
        searchTerm: rawFilters.searchTerm as string | undefined,
    };

    // If user is customer, only show their rentals
    if (req.user.role === 'CUSTOMER') {
        filters.customerId = req.user.id;
    }
    
    // If user is provider, only show their rentals
    if (req.user.role === 'PROVIDER') {
        filters.providerId = req.user.id;
    }

    const rentals = await rentalService.getAllRentalsFromDB(filters);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Rentals retrieved successfully!",
        data: rentals,
    });
});

// ==================== GET RENTAL BY ID ====================
const getRentalById = catchAsync(async (req: Request, res: Response) => {
    if (!req.user) {
        throw new AppError(401, 'You are not authorized!');
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

// ==================== GET USER RENTALS ====================
const getUserRentals = catchAsync(async (req: Request, res: Response) => {
    if (!req.user) {
        throw new AppError(401, 'You are not authorized!');
    }

    const rentals = await rentalService.getUserRentalsFromDB(req.user.id);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Your rentals retrieved successfully!",
        data: rentals,
    });
});

// ==================== CANCEL RENTAL ====================
const cancelRental = catchAsync(async (req: Request, res: Response) => {
    if (!req.user) {
        throw new AppError(401, 'You are not authorized!');
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

// ==================== RENTAL STATS ====================
const getRentalStats = catchAsync(async (req: Request, res: Response) => {
    if (!req.user) {
        throw new AppError(401, 'You are not authorized!');
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