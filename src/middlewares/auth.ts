import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { Role } from "../../generated/prisma/enums";
import { catchAsync } from "../utils/catchAsync";
import { jwtUtils } from "../utils/jwt";
import config from "../config";
import { JwtPayload } from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import AppError from "../errors/AppError";

declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email: string;
                name: string;
                role: Role;
            }
        }
    }
}

export const auth = (...requiredRoles: Role[]) => {
    return catchAsync(async (req: Request, res: Response, next: NextFunction) => {      
        const token = req.cookies?.accessToken ?
            req.cookies.accessToken :
            req.headers.authorization?.startsWith("Bearer ") ?
                req.headers.authorization?.split(" ")[1] :
                req.headers.authorization;

        if (!token) {
            throw new AppError(httpStatus.UNAUTHORIZED, "You are not logged in. Please log in first to access this resource.");
        }
 
        const verifiedToken = jwtUtils.verifyToken(token, config.jwt_access_secret as string);

        if (!verifiedToken.success) {
            throw new AppError(httpStatus.UNAUTHORIZED, verifiedToken.error || "Invalid or expired token. Please login again.");
        }
        const { id, email, name, role } = verifiedToken.data as JwtPayload;
   
        if (requiredRoles.length && !requiredRoles.includes(role)) {
            throw new AppError(httpStatus.FORBIDDEN, `Forbidden. Only ${requiredRoles.join(', ')} can access this resource.`);
        }

        const user = await prisma.user.findUnique({
            where: {
                id,
                email,
                name,
                role
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                isSuspended: true,
            }
        });

        if (!user) {
            throw new AppError(httpStatus.NOT_FOUND, "User not found. Please log in again.");
        }

        if (user.isSuspended) {
            throw new AppError(httpStatus.FORBIDDEN, "Your account has been suspended. Please contact our support.");
        }

        req.user = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role as Role,
        };

        next();
    });
};

export { Role };