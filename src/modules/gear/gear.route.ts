import { Router } from "express";
import { gearController } from "./gear.controller";

const router = Router();




router.post(
    '/',    
   gearController.createGear
);


export const gearRoutes = router;