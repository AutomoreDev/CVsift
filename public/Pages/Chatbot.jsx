import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Send, ArrowLeft, Sparkles, X, Check, Bot, User as UserIcon } from 'lucide-react';
import { canAccessChatbot } from '../config/planConfig';

export default function Chatbot() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const userData = currentUser?.userData;
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Check if user has access (Professional or Enterprise plans only)
    if (userData && !canAccessChatbot(userData.plan)) {
      setShowUpgradePrompt(true);
    } else if (userData) {
      // Add welcome message for users with access
      setMessages([{
        role: 'assistant',
        content: "👋 Hi! I'm CVSift Assistant. I'm here to help you with anything related to CVSift - from uploading CVs to understanding match scores. How can I assist you today?",
        timestamp: new Date()
      }]);
    }
  }, [userData]);

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!inputMessage.trim() || isLoading) return;

    // Check plan access
    if (!userData || !canAccessChatbot(userData.plan)) {
      setShowUpgradePrompt(true);
      return;
    }

    const userMessage = inputMessage.trim();
    setInputMessage('');

    // Add user message to chat
    const newUserMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      const functions = getFunctions();
      const chatWithAssistant = httpsCallable(functions, 'chatWithAssistant');

      // Build conversation history (last 10 messages for context)
      const conversationHistory = messages.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const result = await chatWithAssistant({
        message: userMessage,
        conversationHistory
      });

      // Add assistant response to chat
      const assistantMessage = {
        role: 'assistant',
        content: result.data.message,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);

      let errorMessage = 'Sorry, I encountered an error. Please try again.';

      if (error.code === 'permission-denied') {
        setShowUpgradePrompt(true);
        errorMessage = 'Chatbot is only available for Pro and Enterprise users.';
      }

      const errorMsg = {
        role: 'assistant',
        content: errorMessage,
        timestamp: new Date(),
        isError: true
      };

      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const suggestedQuestions = [
    "How do I upload CVs?",
    "How do I create custom fields?",
    "How does CV matching work?",
    "How do I use custom field templates?",
    "What are the different subscription plans?",
    "How do I filter CVs by custom fields?"
  ];

  const handleSuggestedQuestion = (question) => {
    setInputMessage(question);
    inputRef.current?.focus();
  };

  // Typing indicator component
  const TypingIndicator = () => (
    <div className="flex justify-start animate-fade-in">
      <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-2xl px-5 py-3.5 shadow-sm">
        <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
          <Bot className="text-white" size={18} />
        </div>
        <div className="flex gap-1.5">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );

  if (showUpgradePrompt) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-scale-in">
          <div className="flex justify-between items-start mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
              <MessageCircle className="text-white" size={32} />
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            AI Assistant
          </h2>
          <p className="text-gray-600 mb-6 text-lg">
            Get instant help with CVSift features, best practices, and troubleshooting with our AI-powered assistant.
          </p>

          <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-5 mb-6">
            <p className="text-sm text-orange-900 font-semibold mb-4 flex items-center gap-2">
              <Sparkles size={16} className="text-orange-600" />
              Premium Feature - Upgrade to access:
            </p>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm text-gray-700">
                <Check className="text-green-500 flex-shrink-0 mt-0.5" size={18} />
                <span>24/7 AI-powered assistance</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-gray-700">
                <Check className="text-green-500 flex-shrink-0 mt-0.5" size={18} />
                <span>Instant answers to CVSift questions</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-gray-700">
                <Check className="text-green-500 flex-shrink-0 mt-0.5" size={18} />
                <span>Best practices and tips</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-gray-700">
                <Check className="text-green-500 flex-shrink-0 mt-0.5" size={18} />
                <span>Troubleshooting support</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => navigate('/settings')}
            className="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all font-semibold shadow-lg shadow-orange-500/30 hover:shadow-xl hover:scale-[1.02]"
          >
            Upgrade to Pro
          </button>

          <button
            onClick={() => navigate('/dashboard')}
            className="w-full mt-3 py-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-orange-50 flex flex-col overflow-hidden">
      {/* Header - Fixed */}
      <div className="flex-shrink-0 bg-white/80 backdrop-blur-sm border-b border-gray-200 shadow-sm z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Bot className="text-white" size={24} />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">CVSift Assistant</h1>
                  <p className="text-sm text-gray-600">AI-powered help • Always here to assist</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700 rounded-full text-sm shadow-sm">
              <Sparkles size={14} />
              <span className="font-semibold">Pro Feature</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Messages - Scrollable */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent min-h-0">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="space-y-6">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mr-3 shadow-md">
                    <Bot className="text-white" size={18} />
                  </div>
                )}

                <div
                  className={`max-w-[75%] rounded-2xl px-5 py-3.5 shadow-md ${
                    message.role === 'user'
                      ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white'
                      : message.isError
                      ? 'bg-red-50 text-red-800 border-2 border-red-200'
                      : 'bg-white border border-gray-200 text-gray-900'
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  <p className={`text-xs mt-2 ${
                    message.role === 'user' ? 'text-orange-100' : 'text-gray-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                {message.role === 'user' && (
                  <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center flex-shrink-0 ml-3 shadow-md">
                    <UserIcon className="text-white" size={18} />
                  </div>
                )}
              </div>
            ))}

            {isLoading && <TypingIndicator />}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Questions */}
          {messages.length === 1 && !isLoading && (
            <div className="mt-12 animate-fade-in">
              <p className="text-sm text-gray-700 mb-4 font-semibold flex items-center gap-2">
                <Sparkles size={16} className="text-orange-500" />
                Try asking me:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {suggestedQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestedQuestion(question)}
                    className="px-5 py-3.5 bg-white border-2 border-gray-200 rounded-xl hover:border-orange-300 hover:bg-orange-50 text-sm text-gray-700 transition-all text-left hover:shadow-md hover:-translate-y-0.5"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input Area - Fixed */}
      <div className="flex-shrink-0 bg-white/80 backdrop-blur-sm border-t border-gray-200 shadow-lg z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask me anything about CVSift..."
              className="flex-1 px-5 py-4 border-2 border-gray-300 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all placeholder-gray-400 hover:border-gray-400"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="px-6 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl hover:from-orange-600 hover:to-orange-700 transition-all disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed flex items-center gap-2 font-medium shadow-lg shadow-orange-500/30 hover:shadow-xl hover:scale-105 disabled:shadow-none disabled:scale-100"
            >
              <Send size={20} />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
          <p className="text-xs text-gray-500 mt-3 text-center">
            CVSift Assistant can make mistakes. Please verify important information.
          </p>
        </div>
      </div>

      {/* Add custom animations */}
      <style jsx>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-slide-up {
          animation: slide-up 0.3s ease-out forwards;
        }

        .animate-fade-in {
          animation: fade-in 0.4s ease-out forwards;
        }

        .animate-scale-in {
          animation: scale-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
