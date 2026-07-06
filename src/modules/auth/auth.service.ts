import { prisma } from "../../lib/prisma";
import { TUserRegistration } from "./auth.interface"

const registerUserIntoDB = async(payload: TUserRegistration)=>{
    const { name, email, password, role } = payload;
    
    // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error('User already exists with this email!');
  }

  // Create the user with plain password (no hashing)
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password, 
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






export const authService = {
    registerUserIntoDB

}