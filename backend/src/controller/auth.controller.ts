import { Request, Response } from "express";
import { AuthService, verifyGoogleToken } from "../services/auth.services";

export const AuthController = {
  signup: async (req: Request, res: Response): Promise<void> => {
    try {
      //for debugging
      // console.log('Signup request body:', req.body);
      
      const { token } = req.body;
      if (!token) {
        res.status(400).json({ success: false, message: "Missing ID token" });
        return;
      }

      const { email, name, sub: googleId } = await verifyGoogleToken(token);
      const result = await AuthService.signup(email, name, googleId);  //added await for async service
      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(401).json({ success: false, message: "Signup failed: Invalid Google token" });
    }
  },

  login: async (req: Request, res: Response): Promise<void> => {
    try {
      const { token } = req.body;
      if (!token) {
        res.status(400).json({ success: false, message: "Missing ID token" });
        return;
      }

      const { email } = await verifyGoogleToken(token);
      const result = await AuthService.login(email);  //added await for async service
      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(401).json({ success: false, message: "Login failed: Invalid Google token" });
    }
  },
};
