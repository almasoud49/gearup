import AppError from "../errors/AppError";
import { prisma } from "../lib/prisma";


export type UserWithRole = {
    id: string;
    name: string;
    email: string;
    role: string;
    isSuspended: boolean;
    createdAt: Date;
    updatedAt: Date;
};

export type UserWithoutRole = {
    id: string;
    name: string;
    email: string;
    isSuspended: boolean;
    createdAt: Date;
    updatedAt: Date;
};


export const findUserById = async (userId: string): Promise<UserWithRole> => {
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
        }
    });
    
    if (!user) {
        throw new AppError(404, 'User not found!');
    }
    return user as UserWithRole;
};

export const findUserByIdWithoutRole = async (userId: string): Promise<UserWithoutRole> => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            name: true,
            email: true,
            isSuspended: true,
            createdAt: true,
            updatedAt: true,
        }
    });
    
    if (!user) {
        throw new AppError(404, 'User not found!');
    }
    return user as UserWithoutRole;
};

export const findUserByEmail = async (email: string) => {
    const user = await prisma.user.findUnique({ 
        where: { email },
        select: {
            id: true,
            name: true,
            email: true,
            password: true,
            role: true,
            isSuspended: true,
        }
    });
    
    if (!user) {
        throw new AppError(404, 'User not found!');
    }
    return user;
};

export const checkUserExists = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true }
    });
    return !!user;
};

export const isUserSuspended = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isSuspended: true }
    });
    
    if (!user) {
        throw new AppError(404, 'User not found!');
    }
    return user.isSuspended;
};