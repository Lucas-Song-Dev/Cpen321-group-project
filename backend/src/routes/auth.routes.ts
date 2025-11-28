import express from "express";
import { AuthController } from "../controller/auth.controller";

export const authRouter = express.Router();

// @desc    Signup a new user
// @route   POST /signup
authRouter.post("/signup", AuthController.signup);

// @desc    Login existing user
// @route   POST /login
authRouter.post("/login", AuthController.login);