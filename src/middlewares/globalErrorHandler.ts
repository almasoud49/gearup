import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { Prisma } from "../../generated/prisma/client";
import { ZodError } from "zod";

export const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    console.log("Error : ", err);

    let statusCode: number = httpStatus.INTERNAL_SERVER_ERROR;
    let message = err.message || "Internal Server Error";
    let errorDetails: any = {};
   
    if (err instanceof ZodError) {
        statusCode = httpStatus.BAD_REQUEST;
        message = "Validation Error";
        errorDetails = {
            issues: err.issues.map((issue) => ({
                field: issue.path.join('.'),
                message: issue.message,
            })),
        };
    }   
    else if (err instanceof Prisma.PrismaClientValidationError) {
        statusCode = httpStatus.BAD_REQUEST;
        message = "You have provided incorrect field type or missing fields";
        errorDetails = {
            message: err.message,
        };
    } 
    else if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === "P2002") {
            statusCode = httpStatus.CONFLICT;
            message = "Duplicate Key Error";
            errorDetails = {
                field: err.meta?.target || 'unknown field',
                message: "A record with this value already exists",
            };
        } else if (err.code === "P2003") {
            statusCode = httpStatus.BAD_REQUEST;
            message = "Foreign key constraint failed";
            errorDetails = {
                message: "Related record not found",
            };
        } else if (err.code === "P2025") {
            statusCode = httpStatus.NOT_FOUND;
            message = "Record not found";
            errorDetails = {
                message: "The requested record does not exist",
            };
        } else {
            errorDetails = {
                code: err.code,
                message: err.message,
            };
        }
    } 
    else if (err instanceof Prisma.PrismaClientInitializationError) {
        if (err.errorCode === "P1000") {
            statusCode = httpStatus.UNAUTHORIZED;
            message = "Authentication failed against database server. Please check your credentials";
        } else if (err.errorCode === "P1001") {
            statusCode = httpStatus.BAD_REQUEST;
            message = "Can't reach database server";
        } else {
            message = "Database connection error";
        }
        errorDetails = {
            errorCode: err.errorCode,
            message: err.message,
        };
    } 
    else if (err instanceof Prisma.PrismaClientUnknownRequestError) {
        statusCode = httpStatus.INTERNAL_SERVER_ERROR;
        message = "Error occurred during query execution";
        errorDetails = {
            message: err.message,
        };
    }    
    else if (err.statusCode) {
        statusCode = err.statusCode;
        message = err.message;
        errorDetails = {
            message: err.message,
        };
    }
    else {
        errorDetails = {
            message: err.message || "Something went wrong!",
        };
    }
    res.status(statusCode).json({
        success: false,
        message: message,
        errorDetails: {
            statusCode: statusCode,
            message: message,
            ...errorDetails,
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
        },
    });
};