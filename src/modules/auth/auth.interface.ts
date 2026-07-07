export type TLoginUser = {
    email: string;
    password: string;
};

export type TLoginResponse = {
    id: string;
    name: string;
    email: string;
    role: string;
    isSuspended: boolean;
    createdAt: Date;
    updatedAt: Date;
};

export type TAuthResponse = {
    token: string;
    user: TLoginResponse;
};