import { NextFunction } from 'express';
import { Request, Response } from 'express';
import { authService } from './auth.service';
import  httpStatus  from 'http-status';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';

const loginUser = catchAsync(async(req: Request, res: Response, next: NextFunction) => {    
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
          
      sendResponse(res,{
        success: true,
        statusCode: httpStatus.CREATED,
        message: `${req.body.role} login successfully!`,
        data: {accessToken, refreshToken},
      })    
     }
   )

   const refreshToken = catchAsync(async (req : Request, res : Response, next: NextFunction) => {    
    const refreshToken = req.cookies.refreshToken;
    const {accessToken} = await authService.refreshToken(refreshToken);

    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: false,
        sameSite: "none",
        maxAge: 1000 * 60 * 60 * 24 
    })

    sendResponse(res,{
      success : true,
        statusCode : 201,
        message : "Token Refreshed Successfully",
        data : {
            accessToken
        }
    })      
    
})

export const authController = {
    loginUser,
    refreshToken
    
}