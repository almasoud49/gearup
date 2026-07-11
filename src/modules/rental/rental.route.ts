import express, { Router } from 'express';
import { rentalController } from './rental.controller';
import { auth, Role } from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { rentalValidation } from './rental.validation';

const router = Router();

router.post('/',auth(Role.CUSTOMER, Role.ADMIN),validateRequest(rentalValidation.createRentalValidationSchema),rentalController.createRental);

router.get('/',auth(Role.PROVIDER, Role.ADMIN),rentalController.getAllRentals);

router.get('/stats/overview',auth(Role.CUSTOMER, Role.PROVIDER, Role.ADMIN),rentalController.getRentalStats);

router.get('/my-rentals',auth(Role.CUSTOMER),rentalController.getUserRentals);

router.get( '/:id',auth(Role.CUSTOMER, Role.PROVIDER, Role.ADMIN),rentalController.getRentalById);

router.patch('/:id/cancel',auth(Role.CUSTOMER),rentalController.cancelRental);

export const rentalRoutes = router;