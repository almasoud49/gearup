import bcrypt from "bcryptjs";
import httpStatus from "http-status";
import config from "../../config";
import AppError from "../../errors/AppError";
import { jwtUtils } from "../../utils/jwt";
import type { 
    TLoginUser, 
    TJwtPayload, 
    TAuthResponse, 
    TRefreshTokenResponse 
} from "./auth.interface";
import type { JwtPayload } from "jsonwebtoken";
import {prisma} from "../../lib/prisma";

const loginUser = async (payload: TLoginUser): Promise<TAuthResponse> => {
    const { email, password } = payload;
    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, 'User not found!');
    }

    if (user.isSuspended) {
        throw new AppError(httpStatus.FORBIDDEN, 'Your account has been suspended!');
    }
   
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        throw new AppError(httpStatus.UNAUTHORIZED, 'Invalid credentials!');
    }

    const jwtPayload: TJwtPayload = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
    };

    const accessToken = jwtUtils.createToken(
        jwtPayload,
        config.jwt_access_secret as string,
        config.jwt_access_expires_in as string
    );

    const refreshToken = jwtUtils.createToken(
        jwtPayload,
        config.jwt_refresh_secret as string,
        config.jwt_refresh_expires_in as string
    );
  
    return {
        accessToken,
        refreshToken,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            isSuspended: user.isSuspended,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        },
    };
};

const refreshToken = async (refreshToken: string): Promise<TRefreshTokenResponse> => {
    const verifiedRefreshToken = jwtUtils.verifyToken(
        refreshToken,
        config.jwt_refresh_secret as string
    );

    if (!verifiedRefreshToken.success) {
        throw new AppError(httpStatus.UNAUTHORIZED, verifiedRefreshToken.error || 'Invalid or expired refresh token!');
    }

    const { id } = verifiedRefreshToken.data as JwtPayload;
  
    const user = await prisma.user.findUnique({
        where: { id },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isSuspended: true,            
        },
    });

    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, 'User not found!');
    }

    if (user.isSuspended) {
        throw new AppError(httpStatus.FORBIDDEN, 'Your account has been suspended!');
    }

    const jwtPayload: TJwtPayload = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
    };

    const newAccessToken = jwtUtils.createToken(
        jwtPayload,
        config.jwt_access_secret as string,
        config.jwt_access_expires_in as string
    );

    return {
        accessToken: newAccessToken,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            isSuspended: user.isSuspended,
        },
    };
};

export const authService = {
    loginUser,
    refreshToken,
};