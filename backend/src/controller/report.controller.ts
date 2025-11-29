import { Request, Response } from 'express';
import Message from '../models/chat.models';
import { UserModel } from '../models/user.models';
import { moderationService } from '../services/moderation.service';

export const UserReporter = {
  report: async (req: Request, res: Response) => {
    const timestamp = new Date().toISOString();
    try {
      console.log(`[${timestamp}] USER REPORT: Starting report process`);
      const { reportedUserId, reporterId, groupId, reason } = req.body;

      console.log(`[${timestamp}] USER REPORT: Request data - reportedUserId: ${reportedUserId}, reporterId: ${reporterId}, groupId: ${groupId}, reason: ${reason || 'none'}`);

      // Validate input
      if (!reportedUserId || !reporterId || !groupId) {
        console.log(`[${timestamp}] USER REPORT: Missing required fields`);
        return res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
      }

      // Check if users exist
      console.log(`[${timestamp}] USER REPORT: Looking up users...`);
      const reportedUser = await UserModel.findById(reportedUserId);
      const reporter = await UserModel.findById(reporterId);

      if (!reportedUser || !reporter) {
        console.log(`[${timestamp}] USER REPORT: User not found - reportedUser: ${!!reportedUser}, reporter: ${!!reporter}`);
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      console.log(`[${timestamp}] USER REPORT: Users found - reportedUser: ${reportedUser.name}, reporter: ${reporter.name}`);

      // Fetch all messages from the reported user in this group
      console.log(`[${timestamp}] USER REPORT: Fetching messages from user ${reportedUserId} in group ${groupId}`);
      const messages = await Message.find({
        groupId: groupId,
        senderId: reportedUserId,
        type: 'text'
      })
        .sort({ createdAt: -1 })
        .limit(100)
        .lean();

      console.log(`[${timestamp}] USER REPORT: Found ${messages.length} messages from user ${reportedUserId}`);

      if (messages.length === 0) {
        console.log(`[${timestamp}] USER REPORT: No messages found for user`);
        return res.status(400).json({
          success: false,
          message: 'No messages found for this user'
        });
      }

      // Use moderation service to analyze messages
      console.log(`[${timestamp}] USER REPORT: Starting moderation analysis...`);
      const messageContents = messages.map((msg: any) => msg.content);
      const analysis = await moderationService.moderateUserMessages(messageContents, reason);
      
      console.log(`[${timestamp}] USER REPORT: Moderation result - isOffensive: ${analysis.isOffensive}, reason: ${analysis.reason || 'none'}`);

      // If the message is offensive, mark the user as offensive
      let actionTaken: string | null = null;
      if (analysis.isOffensive) {
        reportedUser.isOffensive = true;
        await reportedUser.save();
        actionTaken = 'User has been marked as offensive';
        
        console.log(`[${timestamp}] USER REPORT: User ${reportedUserId} marked as offensive - Reason: ${analysis.reason || 'N/A'}`);
      } else {
        console.log(`[${timestamp}] USER REPORT: User ${reportedUserId} not marked as offensive - messages deemed acceptable`);
      }

      console.log(`[${timestamp}] USER REPORT: Report processed successfully`);
      return res.status(200).json({
        success: true,
        message: 'Report submitted successfully',
        data: {
          isOffensive: analysis.isOffensive,
          actionTaken: actionTaken,
          reason: analysis.reason
        }
      });

    } catch (error: any) {
      const timestamp = new Date().toISOString();
      console.error(`[${timestamp}] USER REPORT: Error processing report:`, error);
      console.error(`[${timestamp}] USER REPORT: Error stack:`, error.stack);
      return res.status(500).json({
        success: false,
        message: 'Failed to process report',
        error: error.message
      });
    }
  }
};