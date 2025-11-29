import express from "express";
import { UserReporter } from '../controller/report.controller';
import { UserController } from '../controller/user.controller';
import { authenticate } from '../middleware/auth.middleware';

export const userRouter = express.Router();

userRouter.get("/", (req, res) => {
  res.json({ message: "User endpoint working" });
});

// @desc    Add mandatory profile fields
// @route   POST /users/profile
userRouter.put('/users/profile', UserController.setProfile);

// @desc    Add optional profile fields
// @route   POST /users/optionalProfile
userRouter.put('/users/optionalProfile', UserController.updateProfile);

// @desc    Delete a user
// @route   POST /users/me
userRouter.delete('/users/me', authenticate, UserController.deleteUser);

// @desc    Report another user
// @route   POST /users/report
userRouter.put('/users/report', authenticate, UserReporter.report);