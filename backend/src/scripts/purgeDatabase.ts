import mongoose from 'mongoose';
import { config } from '../config';
import Message from '../models/chat.models';
import Group from '../models/group.models';
import Rating from '../models/rating.models';
import Task from '../models/task.models';
import { UserModel } from '../models/user.models';

/**
 * Script to purge all data from the database
 * WARNING: This will delete ALL data in all collections
 */

async function purgeDatabase() {
  try {
    console.log('⚠️  WARNING: This will delete ALL data from the database!');
    console.log('Connecting to MongoDB...');
    await mongoose.connect(config.MONGODB_URI);
    console.log('Connected to MongoDB');
    console.log('');

    // Delete all documents from each collection
    console.log('Deleting all users...');
    const userResult = await UserModel.deleteMany({});
    console.log(`✅ Deleted ${userResult.deletedCount} users`);

    console.log('Deleting all groups...');
    const groupResult = await Group.deleteMany({});
    console.log(`✅ Deleted ${groupResult.deletedCount} groups`);

    console.log('Deleting all tasks...');
    const taskResult = await Task.deleteMany({});
    console.log(`✅ Deleted ${taskResult.deletedCount} tasks`);

    console.log('Deleting all messages...');
    const messageResult = await Message.deleteMany({});
    console.log(`✅ Deleted ${messageResult.deletedCount} messages`);

    console.log('Deleting all ratings...');
    const ratingResult = await Rating.deleteMany({});
    console.log(`✅ Deleted ${ratingResult.deletedCount} ratings`);

    console.log('');
    console.log('✅ Database purge completed successfully!');
    console.log('Summary:');
    console.log(`  - Users: ${userResult.deletedCount}`);
    console.log(`  - Groups: ${groupResult.deletedCount}`);
    console.log(`  - Tasks: ${taskResult.deletedCount}`);
    console.log(`  - Messages: ${messageResult.deletedCount}`);
    console.log(`  - Ratings: ${ratingResult.deletedCount}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
purgeDatabase();

