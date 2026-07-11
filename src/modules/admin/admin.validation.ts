import { z } from 'zod';

const suspendUserValidationSchema = z.object({
    body: z.object({
        isSuspended: z.boolean()
            .refine((val) => val !== undefined && val !== null, {
                message: 'isSuspended field is required',
            }),
    }),
});

const changeRoleValidationSchema = z.object({
    body: z.object({
        role: z.enum(['CUSTOMER', 'PROVIDER'])
            .refine((val) => val !== undefined && val !== null, {
                message: 'Role is required',
            }),
    }),
});

const userIdParamValidationSchema = z.object({
    params: z.object({
        id: z.string()
            .min(1, 'User ID is required')
            .refine((val) => /^c[a-z0-9]{24}$/.test(val), {
                message: 'Invalid user ID format (must be a valid cuid)',
            }),
    }),
});

const getUsersQueryValidationSchema = z.object({
    query: z.object({
        role: z.enum(['CUSTOMER', 'PROVIDER', 'ADMIN']).optional(),
        isSuspended: z.string().transform(val => val === 'true').optional(),
        searchTerm: z.string().optional(),
        page: z.string().transform(Number).optional(),
        limit: z.string().transform(Number).optional(),
        sortBy: z.string().optional(),
        sortOrder: z.enum(['asc', 'desc']).optional(),
    }),
});

const getGearQueryValidationSchema = z.object({
    query: z.object({
        searchTerm: z.string().optional(),
        availability: z.string().transform(val => val === 'true').optional(),
        page: z.string().transform(Number).optional(),
        limit: z.string().transform(Number).optional(),
        sortBy: z.string().optional(),
        sortOrder: z.enum(['asc', 'desc']).optional(),
    }),
});

const getRentalsQueryValidationSchema = z.object({
    query: z.object({
        status: z.enum(['PLACED', 'CONFIRMED', 'PAID', 'PICKED_UP', 'RETURNED', 'CANCELLED']).optional(),
        searchTerm: z.string().optional(),
        page: z.string().transform(Number).optional(),
        limit: z.string().transform(Number).optional(),
        sortBy: z.string().optional(),
        sortOrder: z.enum(['asc', 'desc']).optional(),
    }),
});

export const adminValidation = {
    suspendUserValidationSchema,
    changeRoleValidationSchema,
    userIdParamValidationSchema,
    getUsersQueryValidationSchema,
    getGearQueryValidationSchema,
    getRentalsQueryValidationSchema,
};