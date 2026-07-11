import express, { Router } from 'express';
import { providerController } from './provider.controller';
import { auth, Role } from '../../middlewares/auth';
import { gearController } from '../gear/gear.controller';
import { providerValidation } from './provider.validation';
import validateRequest from '../../middlewares/validateRequest';

const router = Router();

router.post('/gear',auth(Role.PROVIDER, Role.ADMIN),validateRequest(providerValidation.addGearValidationSchema),providerController.addGear);

router.put('/gear/:id',auth(Role.PROVIDER, Role.ADMIN),validateRequest(providerValidation.updateGearValidationSchema),providerController.updateGear);

router.delete('/gear/:id',auth(Role.PROVIDER, Role.ADMIN),providerController.deleteGear);

router.get('/orders',auth(Role.PROVIDER),providerController.getProviderOrders);

router.patch('/orders/:id/status',auth(Role.PROVIDER),validateRequest(providerValidation.updateOrderStatusValidationSchema),providerController.updateOrderStatus);

router.get('/stats',auth(Role.PROVIDER),providerController.getProviderStats);

export const providerRoutes = router;