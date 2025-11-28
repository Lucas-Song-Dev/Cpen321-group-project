import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { config } from "../config";
import { UserModel } from "../models/user.models";

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
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

// Export protect as an alias for authenticate
export const protect = authenticate;
