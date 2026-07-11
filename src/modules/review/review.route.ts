import express, { Router } from 'express';
import { reviewController } from './review.controller';
import { auth, Role } from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { reviewValidation } from './review.validation';

const router = Router();

router.get('/',validateRequest(reviewValidation.reviewFiltersValidationSchema),reviewController.getAllReviews);

router.get('/gear/:gearId',reviewController.getGearReviews);

router.get('/:id',reviewController.getReviewById);


router.post('/',auth(Role.CUSTOMER),validateRequest(reviewValidation.createReviewValidationSchema),
reviewController.createReview);

router.put('/:id',auth(Role.CUSTOMER, Role.ADMIN),validateRequest(reviewValidation.updateReviewValidationSchema),reviewController.updateReview);

router.delete('/:id',auth(Role.CUSTOMER, Role.ADMIN),reviewController.deleteReview);

export const reviewRoutes = router;