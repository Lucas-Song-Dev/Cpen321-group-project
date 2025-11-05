import { IUser } from './index';

// Request types
// ------------------------------------------------------------

export interface AuthenticateUserResponse {
  message: string;
  data?: AuthResult;
}

// Generic types
// ------------------------------------------------------------
export interface AuthResult {
  token: string;
  user: IUser;
}

// Remove duplicate declaration - already defined in express.d.ts