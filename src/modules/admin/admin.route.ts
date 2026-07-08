import express from 'express';
import { adminController } from './admin.controller';



const router = express.Router();


router.get(
    '/users',
  adminController.getAllUsers
);

router.get(
    '/users/:id',
    adminController.getUserById
);


router.patch(
    '/users/:id/suspend',
    adminController.updateUserStatus
);

router.patch(
    '/users/:id/role',
    adminController.updateUserRole
);

router.delete(
    '/users/:id',
   adminController.deleteUser
);

router.get(
    '/gear',
    adminController.getAllGear
);

router.get(
    '/rentals',
    adminController.getAllRentals
);

router.get(
    '/stats',
    adminController.getAdminStats
);

export const adminRoutes = router;