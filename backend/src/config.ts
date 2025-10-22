import * as dotenv from "dotenv";
import path from 'path';

// Hardcoded default configuration
const defaultConfig = {
  PORT: 5000,
  MONGODB_URI: 'mongodb://localhost:27017/roomsync',
  GOOGLE_CLIENT_ID: '',
  JWT_SECRET: ''
};

// Try to load environment variables
try {
  const envPath = path.resolve(process.cwd(), '.env');
  console.log('Loading .env file from:', envPath);
  dotenv.config({ path: envPath });
} catch (error) {
  console.warn('Error loading .env file:', error);
}

// Create configuration by merging defaults with environment variables
export const config = {
  PORT: parseInt(process.env.PORT || defaultConfig.PORT.toString(), 10),
  MONGODB_URI: process.env.MONGODB_URI || defaultConfig.MONGODB_URI,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || defaultConfig.GOOGLE_CLIENT_ID,
  JWT_SECRET: process.env.JWT_SECRET || defaultConfig.JWT_SECRET
};

// // Log the final configuration (excluding sensitive values)
// console.log('Final configuration:', {
//   PORT: config.PORT,
//   MONGODB_URI: config.MONGODB_URI,
//   GOOGLE_CLIENT_ID: config.GOOGLE_CLIENT_ID ? '[SET]' : '[NOT SET]',
//   JWT_SECRET: config.JWT_SECRET ? '[SET]' : '[NOT SET]'
// });
