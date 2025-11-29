import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongoServer: MongoMemoryServer;
const shouldSkip = () => process.env.SKIP_MONGO_MEMORY_SERVER === 'true';

beforeAll(async () => {
  if (shouldSkip()) {
    return;
  }
  mongoServer = await MongoMemoryServer.create();
  const mongoUri: string = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterEach(async () => {
  if (shouldSkip()) {
    return;
  }
  const collections = mongoose.connection.collections;
  const collectionNames = Object.keys(collections);
  for (const key of collectionNames) {
    const collection = collections[key];
    if (collection) {
      await collection.deleteMany({});
    }
  }
});

afterAll(async () => {
  if (shouldSkip()) {
    return;
  }
  try {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.dropDatabase();
    }
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  } catch (error) {
    console.warn('Error during test teardown:', error);
  }
  
  try {
    await mongoServer.stop();
  } catch (error) {
    console.warn('Error stopping mongo server:', error);
  }
});

