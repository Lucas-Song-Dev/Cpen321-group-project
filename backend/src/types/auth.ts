import { z } from 'zod';

import { User } from '../models/User';

// Zod schemas
// ------------------------------------------------------------
export const authenticateUserSchema = z.object({
  idToken: z.string().min(1, 'Google token is required'),
});

// Request types
// ------------------------------------------------------------
export type AuthenticateUserRequest = z.infer<typeof authenticateUserSchema>;

export type AuthenticateUserResponse = {
  message: string;
  data?: AuthResult;
};

// Generic types
// ------------------------------------------------------------
export type AuthResult = {
  token: string;
  user: User;
};

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}