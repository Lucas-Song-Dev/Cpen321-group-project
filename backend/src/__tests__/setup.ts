import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongoServer: MongoMemoryServer;

// Setup before all tests
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri: string = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

// Cleanup after each test
afterEach(async () => {
  const collections = mongoose.connection.collections;
  const collectionNames = Object.keys(collections);
  for (const key of collectionNames) {
    const collection = collections[key];
    if (collection) {
      await collection.deleteMany({});
    }
  }
});

// Teardown after all tests
afterAll(async () => {
  try {
    // Only drop database if connection is ready
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.dropDatabase();
    }
    // Close connection if it's open
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  } catch (error) {
    // Ignore errors during teardown to prevent test failures
    console.warn('Error during test teardown:', error);
  }
  
  try {
    await mongoServer.stop();
  } catch (error) {
    // Ignore errors stopping mongo server
    console.warn('Error stopping mongo server:', error);
  }
});

