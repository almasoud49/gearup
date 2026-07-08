import Stripe from "stripe";
import { prisma } from "../../lib/prisma";

export const handleCheckoutCompleted = async (session: Stripe.Checkout.Session) => {
    console.log('✅ Checkout Session Completed:', session.id);

    const rentalOrderId = session.metadata?.rentalOrderId;
    const userId = session.metadata?.userId;
    const gearItemId = session.metadata?.gearItemId;

    if (!rentalOrderId || !userId || !gearItemId) {
        console.log(" Missing metadata values");
        return;
    }

    try {      
        const payment = await prisma.payment.update({
            where: { transactionId: session.id },
            data: {
                status: 'COMPLETED',
                paidAt: new Date(),
                amount: session.amount_total ? session.amount_total / 100 : 0,
                method: 'STRIPE',
            },
        });

        console.log('Payment updated:', payment.id);

        // 2. Update rental order status to PAID
        await prisma.rentalOrder.update({
            where: { id: rentalOrderId },
            data: { status: 'PAID' },
        });

        console.log('Rental order updated to PAID:', rentalOrderId);

        return { success: true, payment };

    } catch (error) {
        console.error('Error processing checkout completion:', error);
        throw error;
    }
};

export const handlePaymentIntentSucceeded = async (paymentIntent: Stripe.PaymentIntent) => {
    console.log('Payment Intent Succeeded:', paymentIntent.id);

    const rentalOrderId = paymentIntent.metadata?.rentalOrderId;

    if (!rentalOrderId) {
        console.log(" Missing rental order ID");
        return;
    }

    try {
        const payment = await prisma.payment.update({
            where: { transactionId: paymentIntent.id },
            data: {
                status: 'COMPLETED',
                paidAt: new Date(),
                amount: paymentIntent.amount / 100,
                method: 'STRIPE',
            },
        });

        await prisma.rentalOrder.update({
            where: { id: rentalOrderId },
            data: { status: 'PAID' },
        });

        console.log('Payment and rental updated');
        return { success: true, payment };

    } catch (error) {
        console.error(' Error:', error);
        throw error;
    }
};

export const handlePaymentIntentFailed = async (paymentIntent: Stripe.PaymentIntent) => {
    console.log(' Payment Intent Failed:', paymentIntent.id);

    const rentalOrderId = paymentIntent.metadata?.rentalOrderId;

    if (!rentalOrderId) {
        console.log(" Missing rental order ID");
        return;
    }

    try {
        await prisma.payment.update({
            where: { transactionId: paymentIntent.id },
            data: { status: 'FAILED' },
        });

        console.log(' Payment marked as FAILED');

    } catch (error) {
        console.error(' Error:', error);
        throw error;
    }
};