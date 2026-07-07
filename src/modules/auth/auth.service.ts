import bcrypt from "bcryptjs";
import { TLoginUser } from "./auth.interface";
import AppError from "../../errors/AppError";
import { prisma } from "../../lib/prisma";

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

    
    return user;
};

export const authService = {
    loginUser,
};