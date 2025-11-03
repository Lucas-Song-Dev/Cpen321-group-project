import { IUser } from './index';

// Request types
// ------------------------------------------------------------

export type AuthenticateUserResponse = {
  message: string;
  data?: AuthResult;
};

// Generic types
// ------------------------------------------------------------
export type AuthResult = {
  token: string;
  user: IUser;
};

// Remove duplicate declaration - already defined in express.d.ts