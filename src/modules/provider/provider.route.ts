import express, { Router } from 'express';
import { providerController } from './provider.controller';


const router = Router();

router.post(
    '/gear', providerController.addGear
);

router.put(
    '/gear/:id',
    providerController.updateGear
);

router.delete(
    '/gear/:id',
    providerController.deleteGear
);

router.get(
    '/orders',
    providerController.getProviderOrders
);

router.patch(
    '/orders/:id/status',
    providerController.updateOrderStatus
);


router.get(
    '/stats',
    providerController.getProviderStats
);

export const providerRoutes = router;