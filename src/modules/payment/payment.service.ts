import config from "../../config";
import { stripe } from "../../lib/stripe";
import AppError from "../../errors/AppError";
import { handleCheckoutCompleted, handlePaymentIntentSucceeded } from "./payment.utils";
import { TPaymentResult, TConfirmPaymentResult, TPaymentHistoryItem } from "./payment.interface";
import { prisma } from "../../lib/prisma";


const createPaymentIntoDB = async (rentalOrderId: string): Promise<TPaymentResult> => {
    const transactionResult = await prisma.$transaction(async (tx) => {
        const rental = await tx.rentalOrder.findUnique({
            where: { id: rentalOrderId },
            include: {
                customer: true,
                gearItem: true,
            },
        });

        if (!rental) {
            throw new AppError(404, 'Rental order not found!');
        }

        if (rental.status === 'PAID') {
            throw new AppError(409, 'Payment already completed for this rental!');
        }

        if (rental.status !== 'PLACED' && rental.status !== 'CONFIRMED') {
            throw new AppError(400, `Cannot process payment for rental with status: ${rental.status}`);
        }
       
        const existingPayment = await tx.payment.findUnique({
            where: { rentalOrderId: rental.id },
        });

        if (existingPayment && existingPayment.status === 'COMPLETED') {
            throw new AppError(409, 'Payment already completed for this rental!');
        }
       
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(rental.totalPrice * 100),
            currency: 'usd',
            metadata: {
                rentalOrderId: rental.id,
                gearItemId: rental.gearItemId,
                userId: rental.customerId,
            },
            description: `Rental payment for ${rental.gearItem.name}`,
            payment_method_types: ['card'],
            capture_method: 'automatic',
        });
        
        if (existingPayment) {
            await tx.payment.update({
                where: { id: existingPayment.id },
                data: {
                    transactionId: paymentIntent.id,
                    amount: rental.totalPrice,
                    status: 'PENDING',
                },
            });
        } else {
            await tx.payment.create({
                data: {
                    transactionId: paymentIntent.id,
                    amount: rental.totalPrice,
                    method: 'STRIPE',
                    rentalOrderId: rental.id,
                    status: 'PENDING',
                },
            });
        }

        return {
            clientSecret: paymentIntent.client_secret,
            transactionId: paymentIntent.id,
            amount: rental.totalPrice,
            status: paymentIntent.status || 'pending',
        };
    });

    return transactionResult;
};

const confirmPaymentIntoDB = async (paymentIntentId: string): Promise<TConfirmPaymentResult> => {
    try {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        if (paymentIntent.status === 'requires_payment_method') {
            await stripe.paymentIntents.update(paymentIntentId, {
                payment_method: 'pm_card_visa',
            });

            const confirmedPaymentIntent = await stripe.paymentIntents.confirm(paymentIntentId);
            
            if (confirmedPaymentIntent.status === 'succeeded') {
                const payment = await prisma.payment.findUnique({
                    where: { transactionId: paymentIntentId },
                });

                if (payment) {
                    await prisma.payment.update({
                        where: { id: payment.id },
                        data: {
                            status: 'COMPLETED',
                            paidAt: new Date(),
                        },
                    });

                    await prisma.rentalOrder.update({
                        where: { id: payment.rentalOrderId },
                        data: { status: 'PAID' },
                    });
                }

                return {
                    success: true,
                    message: 'Payment confirmed successfully!',
                    status: 'succeeded',
                };
            }
        }

        if (paymentIntent.status === 'succeeded') {
            const payment = await prisma.payment.findUnique({
                where: { transactionId: paymentIntentId },
            });

            if (payment) {
                await prisma.payment.update({
                    where: { id: payment.id },
                    data: {
                        status: 'COMPLETED',
                        paidAt: new Date(),
                    },
                });

                await prisma.rentalOrder.update({
                    where: { id: payment.rentalOrderId },
                    data: { status: 'PAID' },
                });
            }

            return {
                success: true,
                message: 'Payment confirmed successfully!',
                status: 'succeeded',
            };
        } else {
            return {
                success: false,
                message: `Payment failed with status: ${paymentIntent.status}`,
                status: paymentIntent.status || 'failed',
            };
        }
    } catch (error: any) {
        console.error(' Confirm Payment Error:', error);
        throw new AppError(400, error.message || 'Payment confirmation failed!');
    }
};

const getPaymentHistoryFromDB = async (userId: string): Promise<TPaymentHistoryItem[]> => {
    const payments = await prisma.payment.findMany({
        where: {
            rentalOrder: {
                customerId: userId,
            },
        },
        include: {
            rentalOrder: {
                include: {
                    gearItem: {
                        include: {
                            provider: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                },
                            },
                        },
                    },
                    customer: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    return payments as TPaymentHistoryItem[];
};

const getPaymentDetailsFromDB = async (paymentId: string): Promise<TPaymentHistoryItem> => {
    const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
            rentalOrder: {
                include: {
                    customer: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                    gearItem: {
                        include: {
                            provider: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    });

    if (!payment) {
        throw new AppError(404, 'Payment not found!');
    }

    return payment as TPaymentHistoryItem;
};

const handleWebhook = async (payload: Buffer, signature: string): Promise<void> => {
    const endpointSecret = config.stripe_webhook_secret;
    
    if (!endpointSecret) {
        throw new AppError(500, 'Stripe webhook secret is not configured!');
    }

    const event = stripe.webhooks.constructEvent(payload, signature, endpointSecret);

    switch (event.type) {
        case 'checkout.session.completed':
            await handleCheckoutCompleted(event.data.object);
            break;
        case 'payment_intent.succeeded':
            await handlePaymentIntentSucceeded(event.data.object);
            break;
        default:
            console.log(`Unhandled event type ${event.type}.`);
            break;
    }
};

export const paymentService = {
    createPaymentIntoDB,
    confirmPaymentIntoDB,
    getPaymentHistoryFromDB,
    getPaymentDetailsFromDB,
    handleWebhook,
};