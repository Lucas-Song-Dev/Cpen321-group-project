import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { config } from "../config";
import { UserModel } from "../models/user.models";

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] AUTHENTICATE: Starting authentication for ${req.method} ${req.path}`);
  
  const authHeader = req.headers.authorization;
  console.log(`[${timestamp}] AUTHENTICATE: Authorization header:`, authHeader ? "Present" : "Missing");
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log(`[${timestamp}] AUTHENTICATE: No valid token provided`);
    return res.status(401).json({ success: false, message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];
  console.log(`[${timestamp}] AUTHENTICATE: Token extracted:`, token ? `${token.substring(0, 10)}...` : "None");
  
  try {
    // Handle bypass tokens for testing
    if (token === "bypass-token") {
      console.log(`[${timestamp}] AUTHENTICATE: Using bypass token for test user 1`);
      const user = await UserModel.findOne({ email: "test@example.com" });
      if (!user) {
        console.log(`[${timestamp}] AUTHENTICATE: Test user 1 not found in database`);
        return res.status(401).json({ success: false, message: "Test user not found" });
      }
      
      req.user = {
        _id: (user._id as any).toString(),
        email: user.email,
        name: user.name,
        groupName: user.groupName
      };
      
      console.log(`[${timestamp}] AUTHENTICATE: Bypass authentication successful for user 1`);
      next();
      return;
    }
    
    if (token === "bypass-token-2") {
      console.log(`[${timestamp}] AUTHENTICATE: Using bypass token for test user 2`);
      const user = await UserModel.findOne({ email: "test2@example.com" });
      if (!user) {
        console.log(`[${timestamp}] AUTHENTICATE: Test user 2 not found in database`);
        return res.status(401).json({ success: false, message: "Test user not found" });
      }
      
      req.user = {
        _id: (user._id as any).toString(),
        email: user.email,
        name: user.name,
        groupName: user.groupName
      };
      
      console.log(`[${timestamp}] AUTHENTICATE: Bypass authentication successful for user 2`);
      next();
      return;
    }
    
    // Handle real JWT tokens
    console.log(`[${timestamp}] AUTHENTICATE: Verifying JWT token`);
    const decoded = jwt.verify(token, config.JWT_SECRET) as any;
    console.log(`[${timestamp}] AUTHENTICATE: Token decoded successfully:`, { id: decoded.id, email: decoded.email });
    
    // Fetch user from database to get complete user information
    console.log(`[${timestamp}] AUTHENTICATE: Fetching user from database with ID:`, decoded.id);
    const user = await UserModel.findById(decoded.id);
    
    if (!user) {
      console.log(`[${timestamp}] AUTHENTICATE: User not found in database for ID:`, decoded.id);
      return res.status(401).json({ success: false, message: "User not found" });
    }
    
    console.log(`[${timestamp}] AUTHENTICATE: User found:`, { 
      id: user._id, 
      email: user.email, 
      name: user.name,
      groupName: user.groupName 
    });
    
    req.user = {
      _id: (user._id as any).toString(),
      email: user.email,
      name: user.name,
      groupName: user.groupName
    };
    
    console.log(`[${timestamp}] AUTHENTICATE: Authentication successful, proceeding to next middleware`);
    next();
  } catch (err) {
    console.log(`[${timestamp}] AUTHENTICATE: Token verification failed:`, err);
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

// Export protect as an alias for authenticate
export const protect = authenticate;
