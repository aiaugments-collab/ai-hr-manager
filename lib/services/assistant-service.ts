import { ChatMessage, ChatRequest, ChatResponse, DocumentSource } from '@/lib/types/chat';
import { DocumentService } from './document-service';
import { logger } from '@/lib/utils/logger';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export class AssistantService {
  private static model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  /**
   * Process a chat message and generate AI response with document context
   */
  static async processMessage(request: ChatRequest): Promise<ChatResponse> {
    const timer = logger.time(`AI Assistant Message: ${request.message.substring(0, 50)}`, 'AssistantService');
    
    try {
      logger.info('Processing assistant message', { 
        teamId: request.teamId, 
        messageLength: request.message.length 
      }, 'AssistantService');

      // Search for relevant documents
      const searchResults = await this.searchRelevantDocuments(request.teamId, request.message);
      
      // Build context from documents
      const documentContext = this.buildDocumentContext(searchResults);
      
      // Generate AI response
      const aiResponse = await this.generateAIResponse(request.message, documentContext);
      
      // Create response message
      const responseMessage: Omit<ChatMessage, 'id'> = {
        teamId: request.teamId,
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
        sources: searchResults.slice(0, 3), // Include top 3 sources
        createdAt: new Date(),
        updatedAt: new Date()
      };

      logger.info('Assistant message processed successfully', { 
        teamId: request.teamId,
        responseLength: aiResponse.length,
        sourceCount: searchResults.length
      }, 'AssistantService');

      timer();

      return {
        success: true,
        message: responseMessage as ChatMessage,
        sources: searchResults
      };

    } catch (error) {
      timer();
      logger.error('Failed to process assistant message', error, 'AssistantService');

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process message'
      };
    }
  }

  /**
   * Search for documents relevant to the user's question
   */
  private static async searchRelevantDocuments(teamId: string, query: string): Promise<DocumentSource[]> {
    try {
      logger.info('Searching for relevant documents', { teamId, query }, 'AssistantService');

      const searchResults = await DocumentService.searchDocuments(teamId, query);
      
      const documentSources: DocumentSource[] = searchResults.map(result => ({
        documentId: result.document.id,
        documentName: result.document.name,
        snippet: result.snippet,
        relevanceScore: result.relevanceScore
      }));

      logger.info('Document search completed', { 
        teamId, 
        query, 
        resultCount: documentSources.length 
      }, 'AssistantService');

      return documentSources;

    } catch (error) {
      logger.error('Failed to search documents', error, 'AssistantService');
      return [];
    }
  }

  /**
   * Build context string from document search results
   */
  private static buildDocumentContext(sources: DocumentSource[]): string {
    if (sources.length === 0) {
      return '';
    }

    const contextParts = sources.map(source => 
      `Document: ${source.documentName}\nContent: ${source.snippet}\n`
    );

    return `COMPANY KNOWLEDGE BASE CONTEXT:\n${contextParts.join('\n')}\n---\n`;
  }

  /**
   * Generate AI response using Gemini with document context
   */
  private static async generateAIResponse(userMessage: string, documentContext: string): Promise<string> {
    try {
      logger.info('Generating AI response', { 
        userMessageLength: userMessage.length,
        hasContext: documentContext.length > 0 
      }, 'AssistantService');

      const prompt = this.buildPrompt(userMessage, documentContext);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      logger.info('AI response generated', { responseLength: text.length }, 'AssistantService');

      return text;

    } catch (error) {
      logger.error('Failed to generate AI response', error, 'AssistantService');
      throw new Error(`AI response generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Build the prompt for the AI assistant
   */
  private static buildPrompt(userMessage: string, documentContext: string): string {
    const basePrompt = `
You are an intelligent HR assistant helping employees and HR professionals with company-related questions.

INSTRUCTIONS:
1. Answer questions based on the company knowledge base provided below
2. If the knowledge base contains relevant information, use it to provide accurate answers
3. If no relevant information is found, provide general HR guidance
4. Be helpful, professional, and concise
5. Always cite specific documents when you reference company information
6. If you don't know something specific to the company, say so clearly

${documentContext}

USER QUESTION: ${userMessage}

ASSISTANT RESPONSE:`;

    return basePrompt;
  }

  /**
   * Validate user message
   */
  static validateMessage(message: string): { valid: boolean; error?: string } {
    if (!message || message.trim().length === 0) {
      return { valid: false, error: 'Message cannot be empty' };
    }

    if (message.length > 2000) {
      return { valid: false, error: 'Message must be less than 2000 characters' };
    }

    return { valid: true };
  }
}
