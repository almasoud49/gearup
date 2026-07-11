import express, { Router } from 'express';
import { adminController } from './admin.controller';
import { auth, Role } from '../../middlewares/auth';
import { categoryController } from '../category/category.controller';
import { adminValidation } from './admin.validation';
import validateRequest from '../../middlewares/validateRequest';
import { userValidation } from '../user/user.validation';


const router = Router();

router.get('/users', auth(Role.ADMIN), validateRequest(adminValidation.getUsersQueryValidationSchema), adminController.getAllUsers);

router.get('/users/:id', auth(Role.ADMIN), validateRequest(adminValidation.userIdParamValidationSchema), adminController.getUserById);

router.patch('/users/:id/suspend', auth(Role.ADMIN), validateRequest(adminValidation.userIdParamValidationSchema), validateRequest(adminValidation.suspendUserValidationSchema), adminController.updateUserStatus);

router.patch('/users/:id/role', auth(Role.ADMIN), validateRequest(adminValidation.userIdParamValidationSchema), validateRequest(adminValidation.changeRoleValidationSchema), adminController.updateUserRole);

router.delete('/users/:id', auth(Role.ADMIN), validateRequest(adminValidation.userIdParamValidationSchema), adminController.deleteUser);

router.get('/rentals', auth(Role.ADMIN), validateRequest(adminValidation.getRentalsQueryValidationSchema), adminController.getAllRentals);

router.get('/gear', auth(Role.ADMIN), validateRequest(adminValidation.getGearQueryValidationSchema), adminController.getAllGear);

router.post('/categories', auth(Role.ADMIN), validateRequest(userValidation.createCategoryValidationSchema), categoryController.createCategory);

router.put('/categories/:id', auth(Role.ADMIN), validateRequest(userValidation.updateCategoryValidationSchema), categoryController.updateCategory);

router.delete('/categories/:id', auth(Role.ADMIN), categoryController.deleteCategory);

router.get('/stats', auth(Role.ADMIN), adminController.getAdminStats);


export const adminRoutes = router;