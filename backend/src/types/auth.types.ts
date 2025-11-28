import { IUser } from './index.types';

// Request types
export type AuthenticateUserResponse = {
  message: string;
  data?: AuthResult;
};

// Generic types
export type AuthResult = {
  token: string;
  user: IUser;
};
