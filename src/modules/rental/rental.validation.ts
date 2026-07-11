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
            .min(1, 'Gear item ID is required')
            .refine((val) => val !== undefined && val !== null && val !== '', {
                message: 'Gear item ID is required'
            }),
    }),
});

const updateRentalStatusValidationSchema = z.object({
    body: z.object({
        status: z.enum(['CONFIRMED', 'PAID', 'PICKED_UP', 'RETURNED', 'CANCELLED'])
            .refine((val) => val !== undefined && val !== null, {
                message: 'Status is required'
            }),
    }),
});

const rentalFiltersValidationSchema = z.object({
    query: z.object({
        status: z.enum(['PLACED', 'CONFIRMED', 'PAID', 'PICKED_UP', 'RETURNED', 'CANCELLED']).optional(),
        customerId: z.string().optional(),
        providerId: z.string().optional(),
        searchTerm: z.string().optional(),
        page: z.string().transform(Number).optional(),
        limit: z.string().transform(Number).optional(),
        sortBy: z.string().optional(),
        sortOrder: z.enum(['asc', 'desc']).optional(),
    }),
});

export const rentalValidation = {
    createRentalValidationSchema,
    updateRentalStatusValidationSchema,
    rentalFiltersValidationSchema,
};