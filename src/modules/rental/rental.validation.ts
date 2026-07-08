import { z } from 'zod';

const createRentalValidationSchema = z.object({
    body: z.object({
        startDate: z.string()
            .datetime('Invalid date format')
            .refine((val) => val !== undefined && val !== null && val !== '', {
                message: 'Start date is required'
            }),

        endDate: z.string()
            .datetime('Invalid date format')
            .refine((val) => val !== undefined && val !== null && val !== '', {
                message: 'End date is required'
            }),

        gearItemId: z.string()
            .uuid('Invalid gear item ID format')
            .refine((val) => val !== undefined && val !== null && val !== '', {
                message: 'Gear item ID is required'
            }),
    }),
});

const updateRentalStatusValidationSchema = z.object({
    body: z.object({
        // ✅ Fixed: Use .refine() for enum validation
        status: z.enum(['CONFIRMED', 'PAID', 'PICKED_UP', 'RETURNED', 'CANCELLED'])
            .refine((val) => val !== undefined && val !== null, {
                message: 'Status is required'
            }),
    }),
});

const rentalFiltersValidationSchema = z.object({
    query: z.object({
        status: z.enum(['PLACED', 'CONFIRMED', 'PAID', 'PICKED_UP', 'RETURNED', 'CANCELLED']).optional(),
        customerId: z.string().uuid('Invalid customer ID format').optional(),
        providerId: z.string().uuid('Invalid provider ID format').optional(),
        searchTerm: z.string().optional(),
    }),
});

export const rentalValidation = {
    createRentalValidationSchema,
    updateRentalStatusValidationSchema,
    rentalFiltersValidationSchema,
};