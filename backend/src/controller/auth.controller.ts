import { Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import { AuthService } from "../services/auth.services";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

async function verifyGoogleToken(idToken: string) {
  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  if (!payload) throw new Error("Invalid token");
  return { email: payload.email!, name: payload.name || "Unknown" , googleId: payload.sub};
}

export const AuthController = {
  signup: async (req: Request, res: Response) => {
    try {
      //for debugging
      // console.log('Signup request body:', req.body);
      
      const { token } = req.body;
      if (!token) return res.status(400).json({ success: false, message: "Missing ID token" });

      const { email, name, googleId } = await verifyGoogleToken(token);
      const result = await AuthService.signup(email, name, googleId);  //added await for async service
      return res.json(result);
    } catch (err) {
      console.error(err);
      res.status(401).json({ success: false, message: "Signup failed: Invalid Google token" });
    }
  },

  login: async (req: Request, res: Response) => {
    try {
      const { token } = req.body;
      if (!token) return res.status(400).json({ success: false, message: "Missing ID token" });

      const { email } = await verifyGoogleToken(token);
      const result = await AuthService.login(email);  //added await for async service
      return res.json(result);
    } catch (err) {
      console.error(err);
      res.status(401).json({ success: false, message: "Login failed: Invalid Google token" });
    }
  },
};
