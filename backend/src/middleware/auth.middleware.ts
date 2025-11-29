import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { UserModel } from "../models/user.models";

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  
  // Log all incoming requests to user endpoints (especially reports)
  if (req.path.includes('report') || req.path.includes('users')) {
    console.log(`[${timestamp}] AUTH MIDDLEWARE: ${req.method} ${req.path}`);
    console.log(`[${timestamp}] AUTH MIDDLEWARE: Has auth header: ${!!req.headers.authorization}`);
  }
  
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    if (req.path.includes('report')) {
      console.log(`[${timestamp}] AUTH MIDDLEWARE: No token provided for report endpoint`);
    }
    return res.status(401).json({ success: false, message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];
  
  try {
    // Handle bypass tokens for testing
    if (token === "bypass-token") {
      const user = await UserModel.findOne({ email: "test@example.com" });
      if (!user) {
        return res.status(401).json({ success: false, message: "Test user not found" });
      }
      
      req.user = {
        _id: (user._id as any).toString(),
        email: user.email,
        name: user.name,
        groupName: user.groupName
      };
      
      next();
      return;
    }
    
    if (token === "bypass-token-2") {
      const user = await UserModel.findOne({ email: "test2@example.com" });
      if (!user) {
        return res.status(401).json({ success: false, message: "Test user not found" });
      }
      
      req.user = {
        _id: (user._id as any).toString(),
        email: user.email,
        name: user.name,
        groupName: user.groupName
      };
      
      next();
      return;
    }
    
    // Handle real JWT tokens
    const decoded = jwt.verify(token, config.JWT_SECRET) as any;
    
    // Fetch user from database to get complete user information
    const user = await UserModel.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    req.user = {
      _id: (user._id as any).toString(),
      email: user.email,
      name: user.name,
      groupName: user.groupName
    };
    
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

export const protect = authenticate;
