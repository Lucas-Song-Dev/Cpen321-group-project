import { Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import { AuthService } from "../services/auth";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

async function verifyGoogleToken(idToken: string) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] GOOGLE_TOKEN: Starting token verification`);
  console.log(`[${timestamp}] GOOGLE_TOKEN: Token:`, idToken ? `${idToken.substring(0, 10)}...` : "None");
  
  // Bypass for testing - if token is "bypass-token", return test user
  if (idToken === "bypass-token") {
    console.log(`[${timestamp}] GOOGLE_TOKEN: Using bypass token for testing`);
    return { email: "test@example.com", name: "Test User", googleId: "bypass-google-id-1" };
  }
  
  if (idToken === "bypass-token-2") {
    console.log(`[${timestamp}] GOOGLE_TOKEN: Using bypass token 2 for testing`);
    return { email: "test2@example.com", name: "Test User 2", googleId: "bypass-google-id-2" };
  }
  
  console.log(`[${timestamp}] GOOGLE_TOKEN: Verifying with Google OAuth2Client`);
  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  if (!payload) {
    console.log(`[${timestamp}] GOOGLE_TOKEN: Invalid token - no payload`);
    throw new Error("Invalid token");
  }
  console.log(`[${timestamp}] GOOGLE_TOKEN: Token verified successfully:`, { email: payload.email, name: payload.name });
  return { email: payload.email!, name: payload.name || "Unknown", googleId: payload.sub! };
}

export const AuthController = {
  signup: async (req: Request, res: Response) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] AUTH SIGNUP: Starting signup process`);
    console.log(`[${timestamp}] AUTH SIGNUP: Request body:`, req.body);
    
    try {
      const { token } = req.body;
      if (!token) {
        console.log(`[${timestamp}] AUTH SIGNUP: Missing ID token`);
        return res.status(400).json({ success: false, message: "Missing ID token" });
      }

      console.log(`[${timestamp}] AUTH SIGNUP: Verifying Google token`);
      const { email, name, googleId } = await verifyGoogleToken(token);
      console.log(`[${timestamp}] AUTH SIGNUP: Token verified, calling AuthService.signup`);
      
      const result = await AuthService.signup(email, name, googleId);
      console.log(`[${timestamp}] AUTH SIGNUP: Signup completed successfully`);
      return res.json(result);
    } catch (err) {
      console.log(`[${timestamp}] AUTH SIGNUP: Signup failed:`, err);
      res.status(401).json({ success: false, message: "Signup failed: Invalid Google token" });
    }
  },

  login: async (req: Request, res: Response) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] AUTH LOGIN: Starting login process`);
    console.log(`[${timestamp}] AUTH LOGIN: Request body:`, req.body);
    
    try {
      const { token } = req.body;
      if (!token) {
        console.log(`[${timestamp}] AUTH LOGIN: Missing ID token`);
        return res.status(400).json({ success: false, message: "Missing ID token" });
      }

      console.log(`[${timestamp}] AUTH LOGIN: Verifying Google token`);
      const { email } = await verifyGoogleToken(token);
      console.log(`[${timestamp}] AUTH LOGIN: Token verified, calling AuthService.login`);
      
      const result = await AuthService.login(email);
      console.log(`[${timestamp}] AUTH LOGIN: Login completed successfully`);
      return res.json(result);
    } catch (err) {
      console.log(`[${timestamp}] AUTH LOGIN: Login failed:`, err);
      res.status(401).json({ success: false, message: "Login failed: Invalid Google token" });
    }
  },
};
