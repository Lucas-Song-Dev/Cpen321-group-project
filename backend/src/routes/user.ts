import express from "express";
import { UserController } from '../controller/user';
import { authenticate } from '../middleware/auth';

export const userRouter = express.Router();

userRouter.get("/", (req, res) => {
  res.json({ message: "User endpoint working" });
});

userRouter.put('/users/profile', UserController.setProfile);
userRouter.put('/users/optionalProfile', UserController.updateProfile);

userRouter.delete('/users/me', authenticate, UserController.deleteUser);
