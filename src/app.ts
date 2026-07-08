import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application, Request, Response } from "express";
import config from "./config";
import { userRoutes } from "./modules/user/user.route";
import { authRoutes } from "./modules/auth/auth.route";
import { categoryRoutes } from "./modules/category/category.route";
import { gearRoutes } from "./modules/gear/gear.route";
import { rentalRoutes } from "./modules/rental/rental.route";
import { reviewRoutes } from "./modules/review/review.route";
import { paymentRoutes } from "./modules/payment/payment.route";
import { providerRoutes } from "./modules/provider/provider.route";
import { adminRoutes } from "./modules/admin/admin.route";
import { notFound } from "./middlewares/notFound";
import { globalErrorHandler } from "./middlewares/globalErrorHandler";

const app : Application = express();


app.use(cors({
    origin : config.app_url,
    credentials : true,
}));
const endpointSecret = config.stripe_webhook_secret;
app.use("/api/subscription/webhook", express.raw({ type: 'application/json' }))
app.use(express.json());
app.use(express.urlencoded({ extended : true }));
app.use(cookieParser());


app.get("/",(req : Request, res : Response) => {
    res.send("Welcome to my gearup web application.");
});
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/gear", gearRoutes); 
app.use("/api/rentals", rentalRoutes);
app.use("/api/reviews", reviewRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/provider', providerRoutes);
app.use('/api/admin', adminRoutes);




app.use(notFound);
app.use(globalErrorHandler)



export default app;


