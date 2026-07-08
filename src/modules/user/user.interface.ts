export type TRegisterUser = {
    name: string;
    email: string;
    password: string;
    role: 'CUSTOMER' | 'PROVIDER';
};

export type TUpdateUser = {
    name?: string;
    email?: string;
    profilePhoto?: string;
    bio?: string;
};