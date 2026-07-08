import express, { Router } from 'express';
import { paymentController } from './payment.controller';


const router = Router();

router.post(
    '/webhook',
  paymentController.handleWebhook
);


router.post(
    '/create',
    paymentController.createPayment
);


router.post(
    '/confirm',
    paymentController.confirmPayment
);

router.get(
    '/',
    paymentController.getPaymentHistory
);


router.get(
    '/:id',
   paymentController.getPaymentDetails
);

export const paymentRoutes = router;