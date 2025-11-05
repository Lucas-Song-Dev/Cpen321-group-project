import { Request, Response } from 'express';
// import OpenAI from 'openai';
import { UserModel } from '../models/User';
import Message from '../models/Message';

export const UserReporter = {
  report: async (req: Request, res: Response): Promise<void> => {
    try {
      const { reportedUserId, reporterId, groupId, reason } = req.body;

      // Validate input
      if (!reportedUserId || !reporterId || !groupId) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
      }

      // Check if users exist
      const reportedUser = await UserModel.findById(reportedUserId);
      const reporter = await UserModel.findById(reporterId);

      if (!reportedUser || !reporter) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Fetch all messages from the reported user in this group
      const messages = await Message.find({
        groupId,
        senderId: reportedUserId,
        type: 'text'
      })
        .sort({ createdAt: -1 })
        .limit(100)
        .lean();

    
      if (messages.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No messages found for this user'
        });
      }

      // const openai = new OpenAI({
      //   baseURL: "https://openrouter.ai/api/v1",
      //   apiKey: process.env.OPENROUTER_API_KEY,
      // });

      // Prepare messages for OpenAI analysis
      const messageTexts = messages.map((msg: unknown) => msg.content).join('\n');

      // Call OpenAI to analyze messages (disabled for now)
      // const completion = await openai.chat.completions.create({
      //   model: "gpt-3.5-turbo",
      //   messages: [
      //     {
      //       role: "system",
      //       content: `You are a content moderation assistant. Analyze the following messages from a user in a roommate group chat app. 
      //           
      //       Determine if the messages contain:
      //       - Harassment or bullying
      //       - Hate speech or discrimination
      //       - Threats or violence
      //       - Sexual harassment
      //       - Persistent offensive language
      //       - Spam or malicious content

      //       Respond with a JSON object containing only:
      //       {
      //       "isOffensive": boolean
      //       }

      //       Be fair and consider context. Casual banter between friends should not be flagged. Focus on genuinely harmful, offensive, or inappropriate content.`
      //      },
      //     {
      //       role: "user",
      //       content: `Reporter's reason: ${reason || 'No reason provided'}\n\nMessages to analyze:\n${messageTexts}`
      //     }
      //   ],
      //   response_format: { type: "json_object" },
      //   temperature: 0.3
      // });

      // const analysisContent = completion.choices[0].message.content;
      // if (!analysisContent) {
      //   throw new Error('No analysis content received from OpenAI');
      // }

      // const analysis = JSON.parse(analysisContent);
      // console.log('OpenAI Analysis:', analysis);

      const analysis = {
          isOffensive: false  // Temporary: always return non-offensive to avoid breaking the feature
      };

      // If the message is offensive, mark the user as offensive
      let actionTaken: string | null = null;
      if (analysis.isOffensive) {
        reportedUser.isOffensive = true;
        await reportedUser.save();
        actionTaken = 'User has been marked as offensive';
        
            } else {
            }

      return res.status(200).json({
        success: true,
        message: 'Report submitted successfully',
        data: {
          isOffensive: analysis.isOffensive,
          actionTaken
        }
      });

    } catch (error: unknown) {
      console.error('Error processing report:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to process report',
        error: error.message
      });
    }
  }
};