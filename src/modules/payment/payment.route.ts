import express, { Router } from 'express';
import { paymentController } from './payment.controller';
import { auth, Role } from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { paymentValidation } from './payment.validation';

const router = Router();


router.post( '/webhook',paymentController.handleWebhook);

router.post( '/create',auth(Role.CUSTOMER, Role.ADMIN),validateRequest(paymentValidation.createPaymentValidationSchema),paymentController.createPayment);

router.post('/confirm', auth(Role.CUSTOMER, Role.ADMIN),validateRequest(paymentValidation.confirmPaymentValidationSchema),paymentController.confirmPayment);

router.get('/',auth(Role.CUSTOMER, Role.ADMIN),paymentController.getPaymentHistory);

router.get('/:id',auth(Role.CUSTOMER, Role.ADMIN),paymentController.getPaymentDetails);


router.get('/status/:rentalOrderId',auth(Role.CUSTOMER, Role.ADMIN),
paymentController.getPaymentStatus);

export const paymentRoutes = router;