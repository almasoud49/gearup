import { z } from 'zod';

const createReviewValidationSchema = z.object({
    body: z.object({
        rating: z.number()
            .int('Rating must be an integer')
            .min(1, 'Rating must be at least 1')
            .max(5, 'Rating cannot exceed 5')
            .refine((val) => val !== undefined && val !== null, {
                message: 'Rating is required'
            }),

        comment: z.string()
            .max(500, 'Comment cannot exceed 500 characters')
            .optional(),

        gearItemId: z.string()
            .uuid('Invalid gear item ID format')
            .refine((val) => val !== undefined && val !== null && val !== '', {
                message: 'Gear item ID is required'
            }),
    }),
});

const updateReviewValidationSchema = z.object({
    body: z.object({
        rating: z.number()
            .int('Rating must be an integer')
            .min(1, 'Rating must be at least 1')
            .max(5, 'Rating cannot exceed 5')
            .optional(),

        comment: z.string()
            .max(500, 'Comment cannot exceed 500 characters')
            .optional(),
    }),
});

const reviewFiltersValidationSchema = z.object({
    query: z.object({
        rating: z.string().transform(Number).optional(),
        gearItemId: z.string().uuid('Invalid gear item ID format').optional(),
        customerId: z.string().uuid('Invalid customer ID format').optional(),
        searchTerm: z.string().optional(),
    }),
});

export const reviewValidation = {
    createReviewValidationSchema,
    updateReviewValidationSchema,
    reviewFiltersValidationSchema,
};