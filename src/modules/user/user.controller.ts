import  httpStatus  from 'http-status';
import { NextFunction, Request, Response } from "express";
import { userService } from "./user.service";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";


const registerUser = catchAsync(async(req: Request, res:Response, next: NextFunction)=>{    
    const user = await userService.registerUserIntoDB(req.body);
    
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: `${req.body.role} registered successfully!`,
      data: user,
    })    
  } 
)



export const userController = {
    registerUser

}