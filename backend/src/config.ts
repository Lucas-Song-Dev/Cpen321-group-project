// Hardcoded default configuration
const defaultConfig = {
  PORT: 4000,
  MONGODB_URI: 'mongodb+srv://roomsync-user:roommate@roomsync.bijkxqe.mongodb.net/?retryWrites=true&w=majority&appName=RoomSync',
  GOOGLE_CLIENT_ID: '445076519627-97j67dhhi8pqvkqsts8luanr6pttltbv.apps.googleusercontent.com',
  JWT_SECRET: 'roomsync-super-secret-jwt-key-2024-make-it-very-long-and-secure'
};

//create configuration by merging defaults with environment variables
export const config = {
  PORT: parseInt(process.env.PORT ?? defaultConfig.PORT.toString(), 10),
  MONGODB_URI: process.env.MONGODB_URI ?? defaultConfig.MONGODB_URI,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ?? defaultConfig.GOOGLE_CLIENT_ID,
  JWT_SECRET: process.env.JWT_SECRET ?? defaultConfig.JWT_SECRET
};

// Validate required environment variables in production
if (process.env.NODE_ENV === 'production') {
  const requiredVars = ['MONGODB_URI', 'GOOGLE_CLIENT_ID', 'JWT_SECRET'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('Missing required environment variables:', missingVars);
    process.exit(1);
  }
}
