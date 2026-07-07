import { NextFunction } from 'express';
import { Request, Response } from 'express';
import { authService } from './auth.service';

const loginUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
       const user = await authService.loginUser(req.body)
          
       res.status(201).json({
         success: true,
         statusCode: 201,
         message: `${req.body.role} login successfully!`,
         data: user,
       });
     } catch (error) {
       next(error);
     }
   }

export const authController = {
    loginUser,
}