import type { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { adminServices } from './admin.service';
import { pick } from '../../utils/pick';
import AppError from '../../errors/AppError';
import httpStatus from "http-status";

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
    const query = pick(req.query, [
        'role',
        'isSuspended',
        'searchTerm',
        'page',
        'limit',
        'sortBy',
        'sortOrder',
    ]);

    const result = await adminServices.getAllUsers(query);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Users retrieved successfully!",
        data: result.data,
        meta: result.meta,
    });
});

const getUserById = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
        throw new AppError(httpStatus.BAD_REQUEST, 'User ID is required!');
    }

    const user = await adminServices.getUserById(id as string);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: 'User retrieved successfully!',
        data: user,
    });
});

const updateUserStatus = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { isSuspended } = req.body;

    if (!id) {
        throw new AppError(httpStatus.BAD_REQUEST, 'User ID is required!');
    }

    if (isSuspended === undefined) {
        throw new AppError(httpStatus.BAD_REQUEST, 'isSuspended field is required!');
    }

    const user = await adminServices.updateUserStatus(id as string, { isSuspended });

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: `User ${isSuspended ? 'suspended' : 'activated'} successfully!`,
        data: user,
    });
});

const updateUserRole = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { role } = req.body;

    if (!id) {
        throw new AppError(httpStatus.BAD_REQUEST, 'User ID is required!');
    }

    if (!role) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Role is required!');
    }

    const user = await adminServices.updateUserRole(id as string, { role });

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: `User role updated to ${role} successfully!`,
        data: user,
    });
});

const deleteUser = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
        throw new AppError(httpStatus.BAD_REQUEST, 'User ID is required!');
    }

    await adminServices.deleteUser(id as string);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: 'User deleted successfully!',
        data: null,
    });
});

const getAllGear = catchAsync(async (req: Request, res: Response) => {
    const query = pick(req.query, ['searchTerm', 'availability', 'page', 'limit', 'sortBy', 'sortOrder']);

    const result = await adminServices.getAllGear(query);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "All gear items retrieved successfully!",
        data: result.data,
        meta: result.meta,
    });
});

const getAllRentals = catchAsync(async (req: Request, res: Response) => {
    const query = pick(req.query, ['status', 'searchTerm', 'page', 'limit', 'sortBy', 'sortOrder']);

    const result = await adminServices.getAllRentals(query);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "All rentals retrieved successfully!",
        data: result.data,
        meta: result.meta,
    });
});

const getAdminStats = catchAsync(async (req: Request, res: Response) => {
    const stats = await adminServices.getAdminStats();

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: 'Admin statistics retrieved successfully!',
        data: stats,
    });
});

export const adminController = {
    getAllUsers,
    getUserById,
    updateUserStatus,
    updateUserRole,
    deleteUser,
    getAllGear,
    getAllRentals,
    getAdminStats,
};