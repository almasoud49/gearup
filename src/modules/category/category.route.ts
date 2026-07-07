import { Router } from 'express';
import { categoryController } from './category.controller';


const router = Router();


router.post(
    '/',    
    categoryController.createCategory
);


export const categoryRoutes = router;