import bcrypt from "bcryptjs";
import httpStatus from "http-status";
import config from "../../config";
import AppError from "../../errors/AppError";
import type { TRegisterUser, TUpdateUser } from "./user.interface";
import {prisma} from "../../lib/prisma";
import { findUserById } from "../../utils/user";

const registerUserIntoDB = async (payload: TRegisterUser) => {
    const { name, email, password, role } = payload;

    const isUserExist = await prisma.user.findUnique({
        where: { email }
    });

    if (isUserExist) {
        throw new AppError(httpStatus.CONFLICT, 'User with this email already exists');
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

    return await prisma.user.findUnique({
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
};

const getMyProfileFromDB = async (userId: string) => {
    const user = await findUserById(userId);

    return await prisma.user.findUnique({
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
};

const updateMyProfileInDB = async (userId: string, payload: TUpdateUser) => {
    const { name, email } = payload;

    await findUserById(userId);

    if (email) {
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser && existingUser.id !== userId) {
            throw new AppError(httpStatus.CONFLICT, 'Email already in use');
        }
    }

    const updateData: { name?: string; email?: string } = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;

    return await prisma.user.update({
        where: { id: userId },
        data: updateData,
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
};

const getUserByEmailFromDB = async (email: string) => {
    return await prisma.user.findUnique({
        where: { email },
    });
};

export const userService = {
    registerUserIntoDB,
    getMyProfileFromDB,
    updateMyProfileInDB,
    getUserByEmailFromDB,
};