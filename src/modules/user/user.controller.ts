import { NextFunction, Request, Response } from "express";
import { userService } from "./user.service";



const registerUser = async(req: Request, res:Response, next: NextFunction)=>{
    try {
    const user = await userService.registerUserIntoDB(req.body);

    res.status(201).json({
      success: true,
      statusCode: 201,
      message: `${req.body.role} registered successfully!`,
      data: user,
    });
  } catch (error) {
    next(error);
  }
}



export const userController = {
    registerUser

}