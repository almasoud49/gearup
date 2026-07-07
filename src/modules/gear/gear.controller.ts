import { Response } from 'express';
import { Request } from 'express';
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from '../../utils/sendResponse';
import { gearService } from './gear.service';
import AppError from '../../errors/AppError';
import { prisma } from '../../lib/prisma';

const createGear = catchAsync(async (req: Request, res: Response) => {    
    const defaultProvider = await prisma.user.findFirst({
        where: { role: 'PROVIDER' },
        select: { id: true },
    });

    if (!defaultProvider) {
        throw new AppError(404, 'No provider found! Please create a provider first.');
    }

    const payload = {
        ...req.body,
        providerId: defaultProvider.id,
    };

    const gear = await gearService.createGear(payload);

    sendResponse(res, {
        success: true,
        statusCode: 201,
        message: 'Gear item created successfully! ',
        data: gear,
    });
});


export const gearController = {
    createGear
}