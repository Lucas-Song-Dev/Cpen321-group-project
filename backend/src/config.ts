import * as dotenv from "dotenv";
import path from 'path';

// Hardcoded default configuration
const defaultConfig = {
  PORT: 3000,
  MONGODB_URI: 'mongodb+srv://roomsync-user:roommate@roomsync.bijkxqe.mongodb.net/?retryWrites=true&w=majority&appName=RoomSync',
  GOOGLE_CLIENT_ID: '445076519627-97j67dhhi8pqvkqsts8luanr6pttltbv.apps.googleusercontent.com', // Web Client ID (for backend token verification)
  JWT_SECRET: 'roomsync-super-secret-jwt-key-2024-make-it-very-long-and-secure'
};

// //try to load environment variables
// try {
//   const envPath = path.resolve(process.cwd(), '.env');
//   console.log('Loading .env file from:', envPath);
//   dotenv.config({ path: envPath });
// } catch (error) {
//   console.warn('Error loading .env file:', error);
// }

//create configuration by merging defaults with environment variables
export const config = {
  PORT: parseInt(process.env.PORT || defaultConfig.PORT.toString(), 10),
  MONGODB_URI: process.env.MONGODB_URI || defaultConfig.MONGODB_URI,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || defaultConfig.GOOGLE_CLIENT_ID,
  JWT_SECRET: process.env.JWT_SECRET || defaultConfig.JWT_SECRET
};

// Log the final configuration (excluding sensitive values)
console.log('Final configuration:', {
  PORT: config.PORT,
  GOOGLE_CLIENT_ID: config.GOOGLE_CLIENT_ID ? '[SET]' : '[NOT SET]',
  JWT_SECRET: config.JWT_SECRET ? '[SET]' : '[NOT SET]'
});

// dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// const config = {
//   PORT: process.env.PORT || 5000,
//   MONGODB_URI: process.env.MONGODB_URI,
//   GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
//   JWT_SECRET: process.env.JWT_SECRET
// };


// export default config;