import { z } from 'zod';

const addGearValidationSchema = z.object({
    body: z.object({
        name: z.string()
            .min(1, 'Name cannot be empty')
            .max(100, 'Name cannot exceed 100 characters')
            .refine((val) => val !== undefined && val !== null && val !== '', {
                message: 'Name is required'
            }),

        description: z.string()
            .min(1, 'Description cannot be empty')
            .max(1000, 'Description cannot exceed 1000 characters')
            .refine((val) => val !== undefined && val !== null && val !== '', {
                message: 'Description is required'
            }),

        pricePerDay: z.number()
            .positive('Price must be positive')
            .refine((val) => val !== undefined && val !== null, {
                message: 'Price per day is required'
            }),

        brand: z.string().optional(),

        stockQuantity: z.number()
            .int('Stock quantity must be an integer')
            .positive('Stock quantity must be at least 1')
            .default(1),

        images: z.array(z.string().url('Invalid image URL'))
            .min(1, 'At least one image is required'),

        specifications: z.any().optional(),
       
        categoryId: z.string()
            .min(1, 'Category ID is required')
            .refine((val) => val !== undefined && val !== null && val !== '', {
                message: 'Category ID is required'
            }),
    }),
});

const updateGearValidationSchema = z.object({
    body: z.object({
        name: z.string()
            .min(1, 'Name cannot be empty')
            .max(100, 'Name cannot exceed 100 characters')
            .optional(),

        description: z.string()
            .min(1, 'Description cannot be empty')
            .max(1000, 'Description cannot exceed 1000 characters')
            .optional(),

        pricePerDay: z.number()
            .positive('Price must be positive')
            .optional(),

        brand: z.string().optional(),

        availability: z.boolean().optional(),

        stockQuantity: z.number()
            .int('Stock quantity must be an integer')
            .positive('Stock quantity must be at least 1')
            .optional(),

        images: z.array(z.string().url('Invalid image URL'))
            .min(1, 'At least one image is required')
            .optional(),

        specifications: z.any().optional(),

        categoryId: z.string()
            .min(1, 'Category ID is required')
            .optional(),
    }),
});

const updateOrderStatusValidationSchema = z.object({
    body: z.object({
        status: z.enum(['CONFIRMED', 'PAID', 'PICKED_UP', 'RETURNED', 'CANCELLED'])
            .refine((val) => val !== undefined && val !== null, {
                message: 'Status is required'
            }),
    }),
});

export const providerValidation = {
    addGearValidationSchema,
    updateGearValidationSchema,
    updateOrderStatusValidationSchema,
};