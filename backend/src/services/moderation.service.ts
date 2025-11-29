import OpenAI, { type ClientOptions } from 'openai';

interface ModerationResult {
  isOffensive: boolean;
  reason?: string;
}

class ModerationService {
  private openai: OpenAI | null = null;
  private isEnabled: boolean = false;

  constructor() {
    // Initialize OpenAI client if API key is available
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    const openAiKey = process.env.OPENAI_API_KEY;

    // Prefer OpenAI key, fall back to OpenRouter if provided
    const apiKey = openAiKey ?? openRouterKey ?? null;
    const useOpenRouter = !openAiKey && !!openRouterKey;

    if (apiKey) {
      try {
        const config: ClientOptions = {
          apiKey
        };
        
        // Only set baseURL if explicitly using OpenRouter
        if (useOpenRouter) {
          Object.assign(config, {
            baseURL: 'https://openrouter.ai/api/v1',
            defaultHeaders: {
              'HTTP-Referer': process.env.YOUR_SITE_URL ?? 'http://localhost:3000',
              'X-Title': process.env.YOUR_SITE_NAME ?? 'Roommate Chat App'
            }
          });
        }
        
        this.openai = new OpenAI(config);
        this.isEnabled = true;
        console.log('GPT Moderation Service: Enabled and initialized successfully');
      } catch (error) {
        console.error('GPT Moderation Service: Failed to initialize', error);
        this.isEnabled = false;
      }
    } else {
      this.isEnabled = false;
    }
  }

  /**
   * Check if moderation service is enabled
   */
  public isModerationEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Moderate a single message or batch of messages
   * @param content - Single message content or array of messages
   * @param context - Optional context (e.g., "reported user", "new message")
   * @returns Moderation result
   */
  public async moderateContent(
    content: string | string[],
    context?: string
  ): Promise<ModerationResult> {
    // If moderation is disabled, return non-offensive
    if (!this.isEnabled || !this.openai) {
      // Allow testing via environment variable
      const testOffensive = process.env.TEST_REPORT_OFFENSIVE === 'true';
      return {
        isOffensive: testOffensive || false,
        reason: testOffensive ? 'Test mode: flagged as offensive' : undefined
      };
    }

    try {
      // Prepare content for analysis
      const messageTexts = Array.isArray(content) 
        ? content.join('\n') 
        : content;

      // Truncate if too long
      const maxLength = 8000;
      const truncatedContent = messageTexts.length > maxLength
        ? messageTexts.substring(0, maxLength) + '... [truncated]'
        : messageTexts;
      
      const systemPrompt = `You are a strict content moderation assistant for a roommate group chat application. Your job is to flag inappropriate content including profanity and swear words.

Flag messages as offensive if they contain ANY of the following:
- Profanity, swear words, or vulgar language (including common curse words, slurs, and offensive terms)
- Harassment or bullying
- Hate speech or discrimination
- Threats or violence
- Sexual harassment or explicit sexual content
- Spam or malicious content
- Any language that would be inappropriate in a professional or family-friendly setting

IMPORTANT: Flag ALL messages containing profanity or swear words, regardless of context. This is a roommate chat app where users may not know each other well, so maintain a professional standard.

Respond with a JSON object containing only:
{
  "isOffensive": boolean,
  "reason": "brief explanation if offensive, otherwise omit this field"
}

Be strict about profanity - even casual use of swear words should be flagged. Only allow messages that are completely clean and appropriate.`;

      const userPrompt = context
        ? `${context}\n\nMessages to analyze:\n${truncatedContent}`
        : `Messages to analyze:\n${truncatedContent}`;

      const completion = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL ?? 'gpt-3.5-turbo',
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: userPrompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 200
      });

      const analysisContent = completion.choices[0]?.message?.content;
      if (!analysisContent) {
        throw new Error('No analysis content received from OpenAI');
      }

      const analysis = JSON.parse(analysisContent) as ModerationResult;
      return analysis;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error in GPT moderation:', error);
      // On error, default to non-offensive to avoid blocking legitimate messages
      return {
        isOffensive: false,
        reason: `Moderation error: ${errorMessage}`
      };
    }
  }

  /**
   * Moderate a single chat message (for real-time moderation)
   */
  public async moderateMessage(messageContent: string): Promise<ModerationResult> {
    return this.moderateContent(messageContent, 'New chat message to be sent:');
  }

  /**
   * Moderate multiple messages from a user (for report moderation)
   */
  public async moderateUserMessages(
    messages: string[],
    reporterReason?: string
  ): Promise<ModerationResult> {
    const context = reporterReason
      ? `User reported for: ${reporterReason}\n\nAnalyzing recent messages from this user:`
      : 'Analyzing recent messages from a reported user:';
    
    return this.moderateContent(messages, context);
  }
}

// Export singleton instance
export const moderationService = new ModerationService();
export default moderationService;