import { NextFunction } from 'express';
import { Request, Response } from 'express';
import { authService } from './auth.service';
import  HttpStatus  from 'http-status';

const loginUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
    const payload = req.body;

    const {accessToken, refreshToken} = await authService.loginUser(payload);

    res.cookie("accessToken", accessToken, {
        httpOnly : true,
        secure : false,
        sameSite : "none",
        maxAge : 1000 * 60 * 60 * 24 
    })

    res.cookie("refreshToken", refreshToken, {
        httpOnly : true,
        secure : false,
        sameSite : "none",
        maxAge : 1000 * 60 * 60 * 24 * 7 
    })
          
       res.status(201).json({
         success: true,
         statusCode: 201,
         message: `${req.body.role} login successfully!`,
         data: {accessToken, refreshToken},
       });
     } catch (error) {
       next(error);
     }
   }

   const refreshToken = async (req : Request, res : Response, next: NextFunction) => {
    try {
    const refreshToken = req.cookies.refreshToken;
    const {accessToken} = await authService.refreshToken(refreshToken);
    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: false,
        sameSite: "none",
        maxAge: 1000 * 60 * 60 * 24 // 24 hour or 1 day
    })

   res.status(201).json({
        success : true,
        statusCode : 201,
        message : "Token Refreshed Successfully",
        data : {
            accessToken
        }
    })
        
    } catch (error) {
       next(error);
     }
    
}

export const authController = {
    loginUser,
    refreshToken
    
}