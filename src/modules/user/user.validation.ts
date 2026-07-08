import { z } from 'zod';

const registerValidationSchema = z.object({
    body: z.object({
        name: z.string()
            .min(1, 'Name cannot be empty')
            .max(50, 'Name cannot exceed 50 characters')
            .refine((val) => val !== undefined && val !== null && val !== '', { 
                message: 'Name is required' 
            }),

        email: z.string()
            .email('Invalid email format')
            .toLowerCase()
            .refine((val) => val !== undefined && val !== null && val !== '', { 
                message: 'Email is required' 
            }),

        password: z.string()
            .min(6, 'Password must be at least 6 characters')
            .max(20, 'Password cannot exceed 20 characters')
            .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
            .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
            .regex(/[0-9]/, 'Password must contain at least one number')
            .refine((val) => val !== undefined && val !== null && val !== '', { 
                message: 'Password is required' 
            }),

        role: z.enum(['CUSTOMER', 'PROVIDER'])
            .refine((val) => val !== undefined && val !== null, { 
                message: 'Role is required' 
            }),
    }),
});

const updateProfileValidationSchema = z.object({
    body: z.object({
        name: z.string()
            .min(1, 'Name cannot be empty')
            .max(50, 'Name cannot exceed 50 characters')
            .optional(),

        email: z.string()
            .email('Invalid email format')
            .toLowerCase()
            .optional(),

        profilePhoto: z.string()
            .url('Invalid URL format')
            .optional(),
            
        bio: z.string()
            .max(500, 'Bio cannot exceed 500 characters')
            .optional(),
    }),
});

export const userValidation = {
    registerValidationSchema,
    updateProfileValidationSchema,
};