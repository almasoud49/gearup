import express, { Router } from 'express';
import { categoryController } from './category.controller';
import { auth, Role } from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { categoryValidation } from './category.validation';

const router = Router();

router.get(
    '/',
    validateRequest(categoryValidation.categoryFiltersValidationSchema),
    categoryController.getAllCategories
);

router.get(
    '/:id',
    categoryController.getCategoryById
);

router.post(
    '/',
    auth(Role.ADMIN),
    validateRequest(categoryValidation.createCategoryValidationSchema),
    categoryController.createCategory
);

router.put(
    '/:id',
    auth(Role.ADMIN),
    validateRequest(categoryValidation.updateCategoryValidationSchema),
    categoryController.updateCategory
);

router.delete(
    '/:id',
    auth(Role.ADMIN),
    categoryController.deleteCategory
);

export const categoryRoutes = router;