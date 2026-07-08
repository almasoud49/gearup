import { z } from 'zod';

const createCategoryValidationSchema = z.object({
    body: z.object({
        name: z.string()
            .min(1, 'Category name cannot be empty')
            .max(50, 'Category name cannot exceed 50 characters')
            .refine((val) => val !== undefined && val !== null && val !== '', {
                message: 'Category name is required'
            }),

        description: z.string()
            .max(500, 'Description cannot exceed 500 characters')
            .optional(),
    }),
});

const updateCategoryValidationSchema = z.object({
    body: z.object({
        name: z.string()
            .min(1, 'Category name cannot be empty')
            .max(50, 'Category name cannot exceed 50 characters')
            .optional(),

        description: z.string()
            .max(500, 'Description cannot exceed 500 characters')
            .optional(),
    }),
});

const categoryFiltersValidationSchema = z.object({
    query: z.object({
        searchTerm: z.string().optional(),
    }),
});

export const categoryValidation = {
    createCategoryValidationSchema,
    updateCategoryValidationSchema,
    categoryFiltersValidationSchema,
};