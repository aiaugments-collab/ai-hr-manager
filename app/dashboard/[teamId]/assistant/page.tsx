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
      <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-600/60">
        <div className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-2">Sources:</div>
        <div className="flex flex-wrap gap-2">
          {sources.map((source, index) => (
            <Badge key={index} className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60 shadow-sm text-xs">
              <FileText className="h-3 w-3 mr-1" />
              {source.documentName}
            </Badge>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-col min-h-screen">
      <div className="flex-1 space-y-6 p-6 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gradient-primary flex items-center">
              <div className="h-10 w-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              AI Assistant
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Ask questions about your company documents and HR policies
            </p>
          </div>
          <Button 
            onClick={clearChat} 
            disabled={messages.length === 0}
            className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60 hover:shadow-md transition-all duration-200 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 h-10 px-4"
          >
            Clear Chat
          </Button>
        </div>

        {/* Chat Area */}
        <Card className="flex-1 flex flex-col bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60 shadow-xl min-h-[600px]">
          <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-b border-slate-200/60 dark:border-slate-700/60">
            <CardTitle className="text-lg font-semibold text-slate-800 dark:text-slate-200 flex items-center">
              <div className="h-6 w-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3 shadow-sm">
                <Bot className="h-4 w-4 text-white" />
              </div>
              Chat
            </CardTitle>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col p-6">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto mb-6 space-y-4 min-h-[400px]">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-center">
                  <div className="max-w-md">
                    <div className="h-16 w-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                      <Bot className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3 text-slate-800 dark:text-slate-200">Welcome to your AI Assistant!</h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-6">
                      I can help you with questions about company policies, procedures, and documents.
                    </p>
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Try asking:</div>
                      <div className="space-y-2">
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 text-slate-700 dark:text-slate-300 px-3 py-2 rounded-lg border border-blue-200/60 dark:border-blue-800/60 text-sm">
                          &quot;What&apos;s our vacation policy?&quot;
                        </div>
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 text-slate-700 dark:text-slate-300 px-3 py-2 rounded-lg border border-green-200/60 dark:border-green-800/60 text-sm">
                          &quot;How do I submit expenses?&quot;
                        </div>
                      </div>
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
                      className={`max-w-[80%] rounded-2xl p-4 shadow-lg backdrop-blur-sm transition-all duration-200 hover:shadow-xl ${
                        message.role === 'user'
                          ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white border border-blue-400/20'
                          : 'bg-white/70 dark:bg-slate-700/70 border border-slate-200/60 dark:border-slate-600/60 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        {message.role === 'assistant' && (
                          <div className="h-6 w-6 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center mt-0.5 shadow-sm">
                            <Bot className="h-4 w-4 text-white" />
                          </div>
                        )}
                        {message.role === 'user' && (
                          <div className="h-6 w-6 bg-white/20 rounded-lg flex items-center justify-center mt-0.5">
                            <User className="h-4 w-4 text-white" />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="whitespace-pre-wrap leading-relaxed">{message.content}</div>
                          <div className={`text-xs mt-3 font-medium ${
                            message.role === 'user' 
                              ? 'text-white/70' 
                              : 'text-slate-500 dark:text-slate-400'
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
                  <div className="bg-white/70 dark:bg-slate-700/70 backdrop-blur-sm border border-slate-200/60 dark:border-slate-600/60 rounded-2xl p-4 shadow-lg">
                    <div className="flex items-center space-x-3">
                      <div className="h-6 w-6 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center shadow-sm">
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin text-purple-500" />
                        <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">Thinking...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            
            <div ref={messagesEndRef} />
          </div>

            {/* Error Display */}
            {error && (
              <div className="mb-4 p-4 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border border-red-200/60 dark:border-red-800/60 rounded-xl shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="h-6 w-6 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center shadow-sm">
                    <AlertCircle className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm text-red-700 dark:text-red-300 font-medium">{error}</span>
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="flex space-x-3 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800/50 dark:to-blue-900/20 p-4 rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm">
              <Input
                ref={inputRef}
                placeholder="Ask me anything about your company..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                className="flex-1 h-12 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60 rounded-xl focus:ring-2 focus:ring-purple-500/20 transition-all duration-200 shadow-sm text-slate-800 dark:text-slate-200"
              />
              <Button 
                onClick={sendMessage} 
                disabled={!inputMessage.trim() || isLoading}
                className="h-12 w-12 bg-gradient-to-br from-purple-500 to-pink-600 text-white hover:from-purple-600 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 rounded-xl p-0"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
