import express from 'express';
import { gearController } from './gear.controller';
import { auth, Role } from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { gearValidation } from './gear.validation';

const router = express.Router();


router.get(
    '/',
    validateRequest(gearValidation.gearFiltersValidationSchema),
    gearController.getAllGear
);

router.get(
    '/:id',
    gearController.getGearById
);

router.post(
    '/',
    auth(Role.PROVIDER, Role.ADMIN),
    validateRequest(gearValidation.createGearValidationSchema),
    gearController.createGear
);

router.put(
    '/:id',
    auth(Role.PROVIDER, Role.ADMIN),
    validateRequest(gearValidation.updateGearValidationSchema),
    gearController.updateGear
);

router.delete(
    '/:id',
    auth(Role.PROVIDER, Role.ADMIN),
    gearController.deleteGear
);

router.get(
    '/provider/gear',
    auth(Role.PROVIDER),
    gearController.getProviderGear
);

export const gearRoutes = router;