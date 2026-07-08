export type TLoginUser = {
    email: string;
    password: string;
};

export type TRefreshToken = {
    refreshToken: string;
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
    accessToken: string;
    refreshToken: string;
    user: TLoginResponse;
};

export type TRefreshTokenResponse = {
    accessToken: string;
    user: {
        id: string;
        name: string;
        email: string;
        role: string;
        isSuspended: boolean;
    };
};

export type TJwtPayload = {
    id: string;
    name: string;
    email: string;
    role: string;
};