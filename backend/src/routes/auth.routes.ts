import express from "express";
import { AuthController } from "../controller/auth.controller";

export const authRouter = express.Router();

authRouter.post("/signup", AuthController.signup);
authRouter.post("/login", AuthController.login);