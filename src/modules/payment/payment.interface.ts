
export type TCreatePayment = {
    rentalOrderId: string;
    paymentMethod?: string; 
};

export type TConfirmPayment = {
    paymentIntentId: string;
};


export type TPaymentResponse = {
    clientSecret?: string;
    paymentLink?: string;
    transactionId: string;
    amount: number;
    status: string;
};

export type TPaymentResult = {
    clientSecret: string | null;
    transactionId: string;
    amount: number;
    status: string;
};

export type TConfirmPaymentResult = {
    success: boolean;
    message: string;
    status: string;
};


export type TPaymentHistoryItem = {
    id: string;
    transactionId: string;
    amount: number;
    method: string;
    status: string;
    paidAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    rentalOrder: {
        id: string;
        startDate: Date;
        endDate: Date;
        totalPrice: number;
        status: string;
        gearItem: {
            id: string;
            name: string;
            pricePerDay: number;
            provider: {
                id: string;
                name: string;
                email: string;
            };
        };
        customer: {
            id: string;
            name: string;
            email: string;
        };
    };
};

export type TPaymentHistoryResponse = TPaymentHistoryItem[];


export type TWebhookPayload = {
    payload: Buffer;
    signature: string;
};

