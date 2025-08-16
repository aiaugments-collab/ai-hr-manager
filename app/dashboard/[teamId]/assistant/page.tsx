'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ChatMessage, DocumentSource } from '@/lib/types/chat';
import { logger } from '@/lib/utils/logger';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  Bot, 
  User, 
  FileText,
  Loader2, 
  AlertCircle,
  Sparkles
} from 'lucide-react';

export default function AssistantPage() {
  const params = useParams<{ teamId: string }>();
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on load
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Send message to AI assistant
  const sendMessage = async () => {
    if (!inputMessage.trim() || !params.teamId || isLoading) return;
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      teamId: params.teamId,
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Add user message to chat
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setError(null);
    
    try {
      logger.info('Sending message to AI assistant', { 
        message: inputMessage,
        teamId: params.teamId 
      }, 'AssistantPage');
      
      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: inputMessage.trim(),
          teamId: params.teamId,
          sessionId
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }
      
      const data = await response.json();
      
      // Update session ID if provided
      if (data.sessionId && !sessionId) {
        setSessionId(data.sessionId);
      }
      
      // Add assistant response to chat
      if (data.message) {
        setMessages(prev => [...prev, data.message]);
      }
      
      logger.info('AI assistant response received', { 
        responseLength: data.message?.content.length,
        sourceCount: data.sources?.length
      }, 'AssistantPage');
      
    } catch (err) {
      logger.error('Failed to send message to AI assistant', err, 'AssistantPage');
      setError('Failed to send message. Please try again.');
      
      // Add error message to chat
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        teamId: params.teamId,
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your message. Please try again.',
        timestamp: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Clear chat
  const clearChat = () => {
    setMessages([]);
    setSessionId(null);
    setError(null);
    inputRef.current?.focus();
  };

  // Format timestamp
  const formatTime = (date: Date | string): string => {
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Render document sources
  const renderSources = (sources?: DocumentSource[]) => {
    if (!sources || sources.length === 0) return null;
    
    return (
      <div className="mt-3 pt-3 border-t border-muted">
        <div className="text-xs text-muted-foreground mb-2">Sources:</div>
        <div className="flex flex-wrap gap-2">
          {sources.map((source, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              <FileText className="h-3 w-3 mr-1" />
              {source.documentName}
            </Badge>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <Sparkles className="h-8 w-8 mr-3 text-primary" />
            AI Assistant
          </h1>
          <p className="text-muted-foreground">
            Ask questions about your company documents and HR policies
          </p>
        </div>
        <Button variant="outline" onClick={clearChat} disabled={messages.length === 0}>
          Clear Chat
        </Button>
      </div>

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Chat</CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto mb-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-center">
                <div>
                  <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Welcome to your AI Assistant!</h3>
                  <p className="text-muted-foreground mb-4">
                    I can help you with questions about company policies, procedures, and documents.
                  </p>
                  <div className="text-sm text-muted-foreground">
                    Try asking: "What's our vacation policy?" or "How do I submit expenses?"
                  </div>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-4 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      {message.role === 'assistant' && (
                        <Bot className="h-5 w-5 mt-0.5 text-muted-foreground" />
                      )}
                      {message.role === 'user' && (
                        <User className="h-5 w-5 mt-0.5 text-primary-foreground/80" />
                      )}
                      <div className="flex-1">
                        <div className="whitespace-pre-wrap">{message.content}</div>
                        <div className={`text-xs mt-2 ${
                          message.role === 'user' 
                            ? 'text-primary-foreground/70' 
                            : 'text-muted-foreground'
                        }`}>
                          {formatTime(message.timestamp)}
                        </div>
                        {message.role === 'assistant' && renderSources(message.sources)}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
            
            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <Bot className="h-5 w-5 text-muted-foreground" />
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">Thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2 text-red-700">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="flex space-x-2">
            <Input
              ref={inputRef}
              placeholder="Ask me anything about your company..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              className="flex-1"
            />
            <Button 
              onClick={sendMessage} 
              disabled={!inputMessage.trim() || isLoading}
              size="icon"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
