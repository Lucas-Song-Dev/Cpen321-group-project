import mongoose from 'mongoose';
import { config } from '../config';
import Group from '../models/Group';
import { UserModel } from '../models/User';

/**
 * Script to update group members' join dates and add test users
 * This is for testing the rating system with 1-month minimum requirement
 */

async function updateGroupMembersForRatingTest() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(config.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find Lucas Song's user
    const lucasUser = await UserModel.findOne({ email: 'lucas02.song@gmail.com' });
    if (!lucasUser) {
      console.log('Lucas Song not found!');
      return;
    }
    console.log(`Found Lucas Song: ${lucasUser._id}`);

    // Find the group "glorp squad"
    const group = await Group.findOne({ name: 'glorp squad' });
    if (!group) {
      console.log('Group "glorp squad" not found!');
      return;
    }
    console.log(`Found group: ${group._id}`);

    // Date from more than 1 month ago (35 days to be safe)
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 35);
    console.log(`Setting join dates to: ${oldDate.toISOString()}`);

    // Update Lucas's join date in the group
    const lucasMemberIndex = group.members.findIndex(
      m => m.userId.toString() === lucasUser._id?.toString()
    );
    
    if (lucasMemberIndex !== -1) {
      group.members[lucasMemberIndex].joinDate = oldDate;
      console.log(`Updated Lucas Song's join date to ${oldDate.toISOString()}`);
    }

    // Create 2 new test users with old join dates
    console.log('\nCreating 2 new test users...');
    
    // Test User 1
    let testUser1 = await UserModel.findOne({ email: 'testuser1@test.com' });
    if (!testUser1) {
      testUser1 = await UserModel.create({
        email: 'testuser1@test.com',
        name: 'Test User One',
        googleId: 'test-google-id-1-' + Date.now(),
        profileComplete: true,
        dob: new Date('1995-01-01'),
        gender: 'Male'
      });
      console.log(`Created Test User 1: ${testUser1._id}`);
    } else {
      console.log(`Test User 1 already exists: ${testUser1._id}`);
    }

    // Test User 2
    let testUser2 = await UserModel.findOne({ email: 'testuser2@test.com' });
    if (!testUser2) {
      testUser2 = await UserModel.create({
        email: 'testuser2@test.com',
        name: 'Test User Two',
        googleId: 'test-google-id-2-' + Date.now(),
        profileComplete: true,
        dob: new Date('1996-02-02'),
        gender: 'Female'
      });
      console.log(`Created Test User 2: ${testUser2._id}`);
    } else {
      console.log(`Test User 2 already exists: ${testUser2._id}`);
    }

    // Add test users to group with old join dates if not already members
    const testUser1InGroup = group.members.some(
      m => m.userId.toString() === testUser1._id?.toString()
    );
    const testUser2InGroup = group.members.some(
      m => m.userId.toString() === testUser2._id?.toString()
    );

    if (!testUser1InGroup) {
      group.members.push({
        userId: testUser1._id as unknown,
        joinDate: oldDate
      });
      console.log(`Added Test User 1 to group with join date: ${oldDate.toISOString()}`);
    }

    if (!testUser2InGroup) {
      group.members.push({
        userId: testUser2._id as unknown,
        joinDate: oldDate
      });
      console.log(`Added Test User 2 to group with join date: ${oldDate.toISOString()}`);
    }

    // Update existing members to also have old join dates
    console.log('\nUpdating existing members join dates...');
    group.members.forEach((member: unknown) => {
      member.joinDate = oldDate;
    });

    // Save the group
    await group.save();
    console.log('\n✅ Group updated successfully!');

    // Display final member list
    console.log('\nFinal group members:');
    const updatedGroup = await Group.findById(group._id)
      .populate('members.userId', 'name email');
    
    updatedGroup?.members.forEach((member: unknown) => {
      const joinDate = new Date(member.joinDate);
      const daysAgo = Math.floor((Date.now() - joinDate.getTime()) / (1000 * 60 * 60 * 24));
      console.log(`  - ${member.userId.name} (${member.userId.email}): ${daysAgo} days ago`);
    });

    console.log('\n✅ Script completed successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
void updateGroupMembersForRatingTest();

