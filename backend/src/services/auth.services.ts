import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { User } from '../models/index.models';
import { IUser } from '../types/index.types';

// Initialize Google OAuth client
// Use Web Client ID for token verification (audience field)
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
    throw new Error('Invalid Google token');
  }
};

// Generate JWT tokens
export const generateTokens = (user: IUser): AuthTokens => {
  const payload = {
    userId: user._id.toString(),
    email: user.email,
    name: user.name,
  };

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
      name: payload.name || 'Unknown',
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
    throw new Error('Failed to create or find user');
  }
};

// Verify JWT token
export const verifyJWT = (token: string): { userId: string; email: string; name: string } => {
  try {
    const secret = process.env.JWT_SECRET ?? 'fallback-secret-key';
    return jwt.verify(token, secret) as { userId: string; email: string; name: string };
  } catch (error) {
    throw new Error('Invalid or expired token');
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

export const AuthService = {
  signup: async (email: string, name: string, googleId: string) => {
    try {
      let user = await User.findOne({ email });
      if (user) {
        return { success: false, message: "User already exists. Please log in instead." };
      }

      user = new User({email, name: name || 'Unknown', googleId, profileComplete: false});
      await user.save();

      const token = jwt.sign({ email: user.email, id: user._id }, process.env.JWT_SECRET ?? 'fallback-secret-key', { expiresIn: "1h" });
      return {
        success: true,
        message: "Signup successful!",
        user: {
          _id: String(user._id),
          email: user.email,
          name: user.name,
          dob: user.dob ?? null,
          gender: user.gender ?? null,
          profileComplete: user.profileComplete,
          bio: user.bio ?? null,
          profilePicture: user.profilePicture ?? null,
          livingPreferences: user.livingPreferences ?? null,
          groupName: user.groupName ?? null
        },
        token,
      };
    } catch (err) {
      console.error(err);
      return { success: false, message: "Signup failed due to server error" };
    }
  },

  login: async (email: string) => {
    try {
      console.log('Logging in user with email:', email);
      const user = await User.findOne({ email });
      if (!user) {
        return { success: false, message: "User does not exist. Please sign up first." };
      }

      const token = jwt.sign({ email: user.email, id: user._id }, process.env.JWT_SECRET ?? 'fallback-secret-key', { expiresIn: "1h" });
      return {
        success: true,
        message: "Login successful!",
        user: {
          _id: String(user._id),
          email: user.email,
          name: user.name,
          dob: user.dob ?? null,
          gender: user.gender ?? null,
          profileComplete: user.profileComplete,
          bio: user.bio ?? null,
          profilePicture: user.profilePicture ?? null,
          livingPreferences: user.livingPreferences ?? null,
          groupName: user.groupName ?? null
        },
        token,
      };
    } catch (err) {
      console.error(err);
      return { success: false, message: "Login failed due to server error" };
    }
  },
};