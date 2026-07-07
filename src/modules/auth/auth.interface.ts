export type TLoginUser = {
    email: string;
    password: string;
};

export type TAuthResponse = {
    id: string;
    name: string;
    email: string;
    role: string;
    isSuspended: boolean;
    createdAt: Date;
    updatedAt: Date;
};