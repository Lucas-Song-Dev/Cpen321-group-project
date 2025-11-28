import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        _id: string;
        email: string;
        name: string;
        groupName?: string;
      };
    }
  }
}