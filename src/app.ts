import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application, Request, Response } from "express";
import config from "./config";
import { authRoutes } from "./modules/auth/auth.route";

const app : Application = express();


app.use(cors({
    origin : config.app_url,
    credentials : true,
}))

app.use(express.json());
app.use(express.urlencoded({ extended : true }));
app.use(cookieParser());


app.use("/api/auth", authRoutes);

app.get("/",(req : Request, res : Response) => {
    res.send("Welcome to my gearup web application.");
});



export default app;


