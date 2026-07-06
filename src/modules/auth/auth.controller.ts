import { NextFunction, Request, Response } from "express";
import { authService } from "./auth.service";

const registerUser = async(req: Request, res:Response, next: NextFunction)=>{
    try {
    const user = await authService.registerUserIntoDB(req.body);

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



export const authController = {
    registerUser

}