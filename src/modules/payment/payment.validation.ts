import { z } from 'zod';

const createPaymentValidationSchema = z.object({
    body: z.object({        
        rentalOrderId: z.string()
            .min(1, 'Rental order ID is required')
            .refine((val) => val !== undefined && val !== null && val !== '', {
                message: 'Rental order ID is required'
            }),
    }),
});

const confirmPaymentValidationSchema = z.object({
    body: z.object({
        paymentIntentId: z.string()
            .min(1, 'Payment intent ID is required')
            .refine((val) => val !== undefined && val !== null && val !== '', {
                message: 'Payment intent ID is required'
            }),
    }),
});

export const paymentValidation = {
    createPaymentValidationSchema,
    confirmPaymentValidationSchema,
};