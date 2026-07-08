import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { adminServices } from './admin.service';
import { pick } from '../../utils/pick';
import AppError from '../../errors/AppError';


const getAllUsers = catchAsync(async (req: Request, res: Response) => {
    // 1. Extract raw query parameters
    const rawFilters = pick(req.query, ['role', 'isSuspended', 'searchTerm']);
    
    // 2. Convert to proper types
    const filters = {
        role: rawFilters.role as 'CUSTOMER' | 'PROVIDER' | 'ADMIN' | undefined,
        isSuspended: rawFilters.isSuspended === 'true' ? true : 
                     rawFilters.isSuspended === 'false' ? false : undefined,
        searchTerm: rawFilters.searchTerm as string | undefined,
    };

    const users = await adminServices.getAllUsers(filters);

    sendResponse(res, {
        success: true,
        statusCode: 200,
        message: 'Users retrieved successfully!',
        data: users,
    });
});

// Get User by ID
const getUserById = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
        throw new AppError(400, 'User ID is required!');
    }

    const user = await adminServices.getUserById(id as string);

    sendResponse(res, {
        success: true,
        statusCode: 200,
        message: 'User retrieved successfully!',
        data: user,
    });
});

// Suspend/Activate User
const updateUserStatus = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { isSuspended } = req.body;

    if (!id) {
        throw new AppError(400, 'User ID is required!');
    }

    if (isSuspended === undefined) {
        throw new AppError(400, 'isSuspended field is required!');
    }

    const user = await adminServices.updateUserStatus(id as string, { isSuspended });

    sendResponse(res, {
        success: true,
        statusCode: 200,
        message: `User ${isSuspended ? 'suspended' : 'activated'} successfully!`,
        data: user,
    });
});

// Change User Role
const updateUserRole = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { role } = req.body;

    if (!id) {
        throw new AppError(400, 'User ID is required!');
    }

    if (!role) {
        throw new AppError(400, 'Role is required!');
    }

    const user = await adminServices.updateUserRole(id as string, { role });

    sendResponse(res, {
        success: true,
        statusCode: 200,
        message: `User role updated to ${role} successfully!`,
        data: user,
    });
});

// Delete User
const deleteUser = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
        throw new AppError(400, 'User ID is required!');
    }

    await adminServices.deleteUser(id as string);

    sendResponse(res, {
        success: true,
        statusCode: 200,
        message: 'User deleted successfully!',
        data: null,
    });
});

// ==================== GEAR MANAGEMENT ====================

// Get All Gear
const getAllGear = catchAsync(async (req: Request, res: Response) => {
    const rawFilters = pick(req.query, ['searchTerm', 'availability']);
    
    const filters = {
        searchTerm: rawFilters.searchTerm as string | undefined,
        availability: rawFilters.availability === 'true' ? true : 
                     rawFilters.availability === 'false' ? false : undefined,
    };

    const gearItems = await adminServices.getAllGear(filters);

    sendResponse(res, {
        success: true,
        statusCode: 200,
        message: 'All gear items retrieved successfully!',
        data: gearItems,
    });
});

// ==================== RENTAL MANAGEMENT ====================

// Get All Rentals
const getAllRentals = catchAsync(async (req: Request, res: Response) => {
    const rawFilters = pick(req.query, ['status', 'searchTerm']);

    const filters = {
        status: rawFilters.status as string | undefined,
        searchTerm: rawFilters.searchTerm as string | undefined,
    };

    const rentals = await adminServices.getAllRentals(filters);

    sendResponse(res, {
        success: true,
        statusCode: 200,
        message: 'All rentals retrieved successfully!',
        data: rentals,
    });
});

// ==================== STATISTICS ====================

// Get Admin Statistics
const getAdminStats = catchAsync(async (req: Request, res: Response) => {
    const stats = await adminServices.getAdminStats();

    sendResponse(res, {
        success: true,
        statusCode: 200,
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