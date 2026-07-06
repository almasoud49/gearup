import { Role } from "../../../generated/prisma/enums";

// User registration payload
export type TUserRegistration = {
  name: string;
  email: string;
  password: string;
  role: 'CUSTOMER' | 'PROVIDER';
};

// User filters for admin
export type TUserFilters = {
  role?: Role;
  isSuspended?: boolean;
  searchTerm?: string;
};