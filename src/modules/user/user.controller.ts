import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { userService } from "./user.service";
import AppError from "../../errors/AppError";

const registerUser = catchAsync(async (req: Request, res: Response) => {
    const payload = req.body;

    const user = await userService.registerUserIntoDB(payload);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.CREATED,
        message: "User registered successfully",
        data: { user },
    });
});

const getMyProfile = catchAsync(async (req: Request, res: Response) => {
    if (!req.user) {
        throw new AppError(401, 'You are not authorized!');
    }

    const profile = await userService.getMyProfileFromDB(req.user.id);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "User profile fetched successfully",
        data: { profile },
    });
});

const updateMyProfile = catchAsync(async (req: Request, res: Response) => {
    if (!req.user) {
        throw new AppError(401, 'You are not authorized!');
    }

    const payload = req.body;
    const updatedProfile = await userService.updateMyProfileInDB(req.user.id, payload);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "User profile updated successfully",
        data: { updatedProfile },
    });
});

export const userController = {
    registerUser,
    getMyProfile,
    updateMyProfile,
};