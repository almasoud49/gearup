import { NextFunction, Request, RequestHandler, Response } from "express";
import httpStatus from "http-status";

export const catchAsync = (fn: RequestHandler) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            await fn(req, res, next);
        } catch (error: any) {
            console.log(error);

            const statusCode = error.statusCode || httpStatus.INTERNAL_SERVER_ERROR;
            const message = error.message || "Something went wrong";

            res.status(statusCode).json({
                success: false,
                statusCode: statusCode,
                message: message,
                error: (error as Error).message
            });
        }
    }
}