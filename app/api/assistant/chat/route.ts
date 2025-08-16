import { NextRequest, NextResponse } from 'next/server';
import { AssistantService } from '@/lib/services/assistant-service';
import { logger } from '@/lib/utils/logger';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  const apiTimer = logger.time('Assistant Chat API Request', 'AssistantChatAPI');
  
  try {
    logger.info('Assistant chat API request received', {}, 'AssistantChatAPI');
    
    const body = await request.json();
    const { message, teamId, sessionId } = body;
    
    // Validate required fields
    if (!message || typeof message !== 'string') {
      logger.warn('No message provided in chat request', {}, 'AssistantChatAPI');
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }
    
    if (!teamId || typeof teamId !== 'string') {
      logger.warn('No team ID provided in chat request', {}, 'AssistantChatAPI');
      return NextResponse.json(
        { error: 'Team ID is required' },
        { status: 400 }
      );
    }
    
    // Validate message
    const validation = AssistantService.validateMessage(message);
    if (!validation.valid) {
      logger.warn('Invalid message', { error: validation.error }, 'AssistantChatAPI');
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }
    
    logger.info('Processing assistant chat request', {
      teamId,
      messageLength: message.length,
      sessionId
    }, 'AssistantChatAPI');
    
    // Process the message with AI
    const response = await AssistantService.processMessage({
      message,
      teamId,
      sessionId
    });
    
    if (!response.success) {
      logger.error('Assistant processing failed', { error: response.error }, 'AssistantChatAPI');
      return NextResponse.json(
        { error: response.error || 'Failed to process message' },
        { status: 500 }
      );
    }
    
    // Add message ID
    if (response.message) {
      response.message.id = uuidv4();
    }
    
    logger.info('Assistant chat request completed successfully', {
      teamId,
      responseLength: response.message?.content.length,
      sourceCount: response.sources?.length
    }, 'AssistantChatAPI');
    
    apiTimer();
    
    return NextResponse.json({
      success: true,
      message: response.message,
      sources: response.sources,
      sessionId: sessionId || uuidv4()
    });
    
  } catch (error) {
    apiTimer();
    
    logger.error('Assistant chat API error', error, 'AssistantChatAPI');
    
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
