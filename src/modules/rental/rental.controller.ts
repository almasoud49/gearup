import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { rentalService } from "./rental.service";
import { sendResponse } from "../../utils/sendResponse";
import AppError from "../../errors/AppError";

const createRental = catchAsync(async (req: Request, res: Response) => {
    // ✅ Debug: Log the request body
    console.log('📝 Public Request Body:', req.body);

    // ✅ Check if request body exists
    if (!req.body) {
        throw new AppError(400, 'Request body is missing!');
    }

    const rental = await rentalService.createRental(req.body);

    sendResponse(res, {
        success: true,
        statusCode: 201,
        message: 'Rental order created successfully!',
        data: rental,
    });
});


export const rentalController = {
    createRental
}