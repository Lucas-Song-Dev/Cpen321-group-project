import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { User  } from '../models';
import { IUser } from '../types';
import { asyncHandler, AppError } from '../middleware/errorHandler';

// Initialize Google OAuth client
// Use Web Client ID for token verification (audience field)
const client = new OAuth2Client('445076519627-97j67dhhi8pqvkqsts8luanr6pttltbv.apps.googleusercontent.com');

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
      audience: '445076519627-97j67dhhi8pqvkqsts8luanr6pttltbv.apps.googleusercontent.com',
    });

    const payload = ticket.getPayload();
    if (!payload) {
      console.log('No payload received from Google token verification');
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
    console.error('Google token verification failed:', error);
    throw new AppError('Invalid Google token', 401);
  }
};

// Generate JWT tokens
export const generateTokens = (user: IUser): AuthTokens => {
  const payload = {
    userId: user._id.toString(),
    email: user.email,
    name: user.name,
  };

  // const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, {
  //   expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  // });

  const secret = process.env.JWT_SECRET ?? 'fallback-secret-key';
  const accessToken = jwt.sign(payload, secret, { expiresIn: '1h' });

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
      console.log('Returning existing user by Google ID');
      return user as IUser;
    }

    // Try to find existing user by email
    user = await User.findOne({ email: payload.email });
  
    if (user) {
      // Link Google account to existing user
      user.googleId = payload.sub;
      await user.save();
      console.log('Linked Google account to existing user');
      return user as IUser;
    }

    // Create new user
    console.log('Creating new user...');
    const newUser = new User({
      googleId: payload.sub,
      email: payload.email,
      name: `${payload.given_name} ${payload.family_name}`.trim(),
      profileComplete: false,
      // Note: We'll require additional fields during profile completion
      dob: new Date('1900-01-01'), // Placeholder - will be required later
      gender: 'Prefer-not-to-say', // Placeholder - will be required later
    });

    await newUser.save();
    console.log('New user created successfully');
    return newUser as IUser;
  } catch (error) {
    console.error('Error in findOrCreateUser:', error);
    throw new AppError('Failed to create or find user', 500);
  }
};

// Verify JWT token
export const verifyJWT = (token: string): unknown => {
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
    return user as IUser | null;
  } catch (error) {
    return null;
  }
};
