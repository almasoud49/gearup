import bcrypt from "bcryptjs";
import { TLoginUser } from "./auth.interface";
import AppError from "../../errors/AppError";
import { prisma } from "../../lib/prisma";
import { jwtUtils } from "../../utils/jwt";
import config from "../../config";
import { JwtPayload, SignOptions } from "jsonwebtoken";

const loginUser = async (payload: TLoginUser) => {
    const { email, password } = payload;

    // Find user by email
    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user) {
        throw new AppError(404, 'User not found!');
    }

    // Check if user is suspended
    if (user.isSuspended) {
        throw new AppError(403, 'Your account has been suspended! Please contact admin.');
    }

    // Compare password with hashed password
    const isPasswordMatched = await bcrypt.compare(password, user.password);

    if (!isPasswordMatched) {
        throw new AppError(401, 'Invalid credentials!');
    }

    const jwtPayload = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
    }

    const accessToken = jwtUtils.createToken(
        jwtPayload,
        config.jwt_access_secret,
        config.jwt_access_expires_in as string
    );

     const refreshToken = jwtUtils.createToken(
        jwtPayload,
        config.jwt_refresh_secret,
        config.jwt_refresh_expires_in as string
    );

    return {
        accessToken,
        refreshToken
    };
};

const refreshToken = async (refreshToken : string) => {
    const verifiedRefreshToken = jwtUtils.verifyToken(refreshToken, config.jwt_refresh_secret);

    if(!verifiedRefreshToken.success){
        throw new Error(verifiedRefreshToken.error)
    }

    const {id} = verifiedRefreshToken.data as JwtPayload;

    const user = await prisma.user.findUnique({
        where : {
            id
        }
    })

    const jwtPayload = {
        id,
        name : user?.name,
        email : user?.email,
        role : user?.role
    }


    const accessToken = jwtUtils.createToken(
        jwtPayload,
        config.jwt_access_secret,
        config.jwt_access_expires_in as string
    );

    return {accessToken}
}


export const authService = {
    loginUser,
    refreshToken
}

