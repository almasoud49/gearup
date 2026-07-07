import { Router } from "express";
import { rentalController } from "./rental.controller";

const router = Router();

router.post(
    '/',
    rentalController.createRental
);


export const rentalRoutes = router;