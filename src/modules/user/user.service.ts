import bcrypt from "bcryptjs";
import config from "../../config";
import AppError from "../../errors/AppError";
import { TRegisterUser, TUpdateUser } from "./user.interface";
import { prisma } from "../../lib/prisma";


const registerUserIntoDB = async (payload: TRegisterUser) => {
    const { name, email, password, role } = payload;

    const isUserExist = await prisma.user.findUnique({
        where: { email }
    });

    if (isUserExist) {
        throw new AppError(409, 'User with this email already exists');
    }
   
    const hashedPassword = await bcrypt.hash(password, Number(config.bcrypt_salt_rounds));
   
    const createdUser = await prisma.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
            role,
        },
    });
   
    const user = await prisma.user.findUnique({
        where: {
            id: createdUser.id,
        },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isSuspended: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    return user;
};

const getMyProfileFromDB = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isSuspended: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    if (!user) {
        throw new AppError(404, 'User not found');
    }

    return user;
};

const updateMyProfileInDB = async (userId: string, payload: TUpdateUser) => {
    const { name, email } = payload;

    const user = await prisma.user.findUnique({
        where: { id: userId },
    });

    if (!user) {
        throw new AppError(404, 'User not found');
    }  
    if (email) {
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser && existingUser.id !== userId) {
            throw new AppError(409, 'Email already in use');
        }
    }
   
    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
            name,
            email,
        },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isSuspended: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    return updatedUser;
};
const getUserByEmailFromDB = async (email: string) => {
    const user = await prisma.user.findUnique({
        where: { email },
    });

    return user;
};

export const userService = {
    registerUserIntoDB,
    getMyProfileFromDB,
    updateMyProfileInDB,
    getUserByEmailFromDB,
};