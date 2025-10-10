import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { User, IUser } from '../models';
import { asyncHandler, AppError } from '../middleware/errorHandler';

// Initialize Google OAuth client
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export interface GoogleTokenPayload {
  sub: string;
  email: string;
  name: string;
  given_name: string;
  family_name: string;
  picture?: string;
  email_verified: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

// Verify Google ID token
export const verifyGoogleToken = async (idToken: string): Promise<GoogleTokenPayload> => {
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      throw new Error('Invalid token payload');
    }

    return {
      sub: payload.sub,
      email: payload.email!,
      name: payload.name!,
      given_name: payload.given_name!,
      family_name: payload.family_name!,
      picture: payload.picture,
      email_verified: payload.email_verified || false,
    };
  } catch (error) {
    throw new AppError('Invalid Google token', 401);
  }
};

// Generate JWT tokens
export const generateTokens = (user: IUser): AuthTokens => {
  const payload = {
    userId: user._id,
    email: user.email,
    name: user.fullName,
  };

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

  return { accessToken };
};

// Find or create user from Google payload
export const findOrCreateUser = async (payload: GoogleTokenPayload): Promise<IUser> => {
  try {
    // Try to find existing user by Google ID
    let user = await User.findOne({ googleId: payload.sub });

    if (user) {
      // Update user info if needed
      if (user.email !== payload.email) {
        user.email = payload.email;
        await user.save();
      }
      return user;
    }

    // Try to find existing user by email
    user = await User.findOne({ email: payload.email });

    if (user) {
      // Link Google account to existing user
      user.googleId = payload.sub;
      await user.save();
      return user;
    }

    // Create new user
    const newUser = new User({
      googleId: payload.sub,
      email: payload.email,
      name: {
        firstName: payload.given_name,
        lastName: payload.family_name,
      },
      // Note: We'll require additional fields during profile completion
      dateOfBirth: new Date('1900-01-01'), // Placeholder - will be required later
      gender: 'prefer-not-to-say', // Placeholder - will be required later
    });

    await newUser.save();
    return newUser;
  } catch (error) {
    throw new AppError('Failed to create or find user', 500);
  }
};

// Verify JWT token
export const verifyJWT = (token: string): any => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!);
  } catch (error) {
    throw new AppError('Invalid or expired token', 401);
  }
};

// Get user from JWT token
export const getUserFromToken = async (token: string): Promise<IUser | null> => {
  try {
    const decoded = verifyJWT(token);
    const user = await User.findById(decoded.userId);
    return user;
  } catch (error) {
    return null;
  }
};
