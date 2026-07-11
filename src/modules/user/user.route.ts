import express, { Router } from 'express';
import { userController } from './user.controller';
import validateRequest from '../../middlewares/validateRequest';
import { userValidation } from './user.validation';
import { auth, Role } from '../../middlewares/auth';


const router = Router();

router.post('/register',validateRequest(userValidation.registerValidationSchema),
userController.registerUser);

router.get('/me',auth(Role.CUSTOMER, Role.PROVIDER, Role.ADMIN),userController.getMyProfile);

router.patch('/me',auth(Role.CUSTOMER, Role.PROVIDER, Role.ADMIN),validateRequest(userValidation.updateProfileValidationSchema),userController.updateMyProfile);

export const userRoutes = router;