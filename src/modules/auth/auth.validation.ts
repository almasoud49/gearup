import { z } from 'zod';

const loginValidationSchema = z.object({
    body: z.object({
        email: z.string()
            .email('Invalid email format')
            .toLowerCase()
            .refine((val) => val !== undefined && val !== null && val !== '', { 
                message: 'Email is required' 
            }),

        password: z.string()
            .min(1, 'Password is required')
            .refine((val) => val !== undefined && val !== null && val !== '', { 
                message: 'Password is required' 
            }),
    }),
});

const refreshTokenValidationSchema = z.object({
    body: z.object({
        refreshToken: z.string()
            .min(1, 'Refresh token is required')
            .refine((val) => val !== undefined && val !== null && val !== '', { 
                message: 'Refresh token is required' 
            }),
    }),
});

export const authValidation = {
    loginValidationSchema,
    refreshTokenValidationSchema,
};