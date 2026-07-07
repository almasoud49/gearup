import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma";
import { TUserRegistration } from "./user.interface";
import config from "../../config";


const registerUserIntoDB = async(payload: TUserRegistration)=>{
  const { name, email, password, role } = payload;
    
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

const hashedPassword = await bcrypt.hash(password, Number(config.bcrypt_salt_rounds))

const user = await prisma.user.create({
    data: {
      name,
      email,
      password:hashedPassword, 
      role,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isSuspended: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return user;
};






export const userService = {
    registerUserIntoDB

}