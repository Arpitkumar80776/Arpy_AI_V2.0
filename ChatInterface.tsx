import { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Volume2, VolumeX, Settings, Download, Trash2, ThumbsUp, ThumbsDown, Star, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { VoiceRecorder } from './VoiceRecorder';
import { TypeWriter } from './TypeWriter';
import { MessageFeedback } from './MessageFeedback';
import { Switch } from '@/components/ui/switch';
import { Message } from '@shared/schema';

interface ChatInterfaceProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (message: string, isVoice?: boolean) => void;
  onClearConversation: () => void;
  onDownloadTranscript: () => void;
  neonColor: string;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  autoVoice: boolean;
  setAutoVoice: (enabled: boolean) => void;
  sessionId: string;
  onNewConversation: () => void;
}

export function ChatInterface({
  messages,
  isLoading,
  onSendMessage,
  onClearConversation,
  onDownloadTranscript,
  neonColor,
  soundEnabled,
  setSoundEnabled,
  autoVoice,
  setAutoVoice,
  sessionId,
  onNewConversation
}: ChatInterfaceProps) {
  const [inputMessage, setInputMessage] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (force = false) => {
    if (messagesEndRef.current) {
      if (force) {
        // Force immediate scroll
        messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 50);
      } else {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  // Scroll to bottom when messages change or loading completes
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToBottom(true);
    }, 100);

    return () => clearTimeout(timer);
  }, [messages.length, isLoading]);

  // Additional scroll when new assistant message appears
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant') {
        const timer = setTimeout(() => {
          scrollToBottom(true);
        }, 500);

        return () => clearTimeout(timer);
      }
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (inputMessage.trim()) {
      onSendMessage(inputMessage);
      setInputMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleVoiceTranscript = (transcript: string) => {
    onSendMessage(transcript, true);
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Chat Messages Container */}
      <div className="glass-morphism rounded-2xl p-6 mb-6 flex-1 overflow-hidden flex flex-col">
        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
          style={{ 
            scrollBehavior: 'smooth',
            height: '100%',
            minHeight: 0
          }}
        >
          {messages.length === 0 && (
            <div className="flex items-start space-x-3">
              <div 
                className="w-8 h-8 bg-gradient-to-r rounded-full flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${neonColor}, rgba(255,255,255,0.2))` }}
              >
                <i className="fas fa-robot text-sm text-white"></i>
              </div>
              <div className="glass-morphism p-4 rounded-2xl rounded-tl-sm max-w-md">
                <p className="text-sm leading-relaxed">
                  Hello! I'm Arpy, your AI assistant. I can help you with various tasks, answer questions, and have meaningful conversations. Try speaking to me using the voice button below!
                </p>
                <span className="text-xs text-gray-400 mt-2 block">Just now</span>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div 
              key={message.id} 
              className={`flex ${message.role === 'user' ? 'justify-end' : 'items-start space-x-3'}`}
            >
              {message.role === 'assistant' && (
                <div 
                  className="w-8 h-8 bg-gradient-to-r rounded-full flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${neonColor}, rgba(255,255,255,0.2))` }}
                >
                  <i className="fas fa-robot text-sm text-white"></i>
                </div>
              )}

              <div className={message.role === 'user' ? 'flex items-start space-x-3' : 'flex-1'}>
                <div className={`glass-morphism p-4 rounded-2xl max-w-md ${
                  message.role === 'user' 
                    ? 'rounded-tr-sm bg-white/5' 
                    : 'rounded-tl-sm'
                }`}>
                  {message.role === 'assistant' ? (
                    <TypeWriter 
                      text={message.content} 
                      speed={30}
                      onComplete={() => {
                        setTimeout(() => scrollToBottom(), 150);
                      }}
                    />
                  ) : (
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <span className={`text-xs text-gray-400 ${message.role === 'user' ? 'text-right' : ''}`}>
                      {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {message.isVoice && (
                      <i className="fas fa-microphone text-xs" style={{ color: neonColor }}></i>
                    )}
                  </div>
                </div>

                {/* Feedback Component for Assistant Messages */}
                {message.role === 'assistant' && (
                  <MessageFeedback
                    message={message}
                    sessionId={sessionId}
                    neonColor={neonColor}
                  />
                )}

                {message.role === 'user' && (
                  <div className="w-8 h-8 bg-gradient-to-r from-gray-600 to-gray-500 rounded-full flex items-center justify-center">
                    <i className="fas fa-user text-sm text-white"></i>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isLoading && (
            <div className="flex items-start space-x-3">
              <div 
                className="w-8 h-8 bg-gradient-to-r rounded-full flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${neonColor}, rgba(255,255,255,0.2))` }}
              >
                <i className="fas fa-robot text-sm text-white"></i>
              </div>
              <div className="glass-morphism p-4 rounded-2xl rounded-tl-sm">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Controls */}
      <div className="glass-morphism rounded-2xl p-4">
        <div className="flex items-center space-x-4">
          {/* Voice Input Button */}
          <VoiceRecorder
            onTranscript={handleVoiceTranscript}
            neonColor={neonColor}
            soundEnabled={soundEnabled}
          />

          {/* Text Input */}
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Type your message or use voice input..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="bg-white/10 border-white/20 text-white placeholder-gray-400 focus:ring-2 focus:border-transparent"
              style={{ '--tw-ring-color': neonColor } as React.CSSProperties}
              disabled={isLoading}
            />
          </div>

          {/* Send Button */}
          <Button
            variant="ghost"
            size="icon"
            className="w-12 h-12 rounded-xl transition-all hover:scale-110"
            style={{ background: `linear-gradient(135deg, ${neonColor}, rgba(255,255,255,0.1))` }}
            onClick={handleSendMessage}
            disabled={isLoading || !inputMessage.trim()}
          >
            <Send className="w-5 h-5 text-white" />
          </Button>

          {/* Settings Menu */}
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onNewConversation}
              className="glass-morphism rounded-xl hover:bg-white/20"
              title="Start New Chat"
            >
              <Plus className="w-5 h-5 text-white" />
            </Button>
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="w-12 h-12 glass-morphism rounded-xl hover:bg-white/20"
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              >
                <Settings className="w-5 h-5 text-white" />
              </Button>

              {/* Settings Dropdown */}
              {isSettingsOpen && (
                <div className="absolute bottom-full right-0 mb-2 glass-morphism rounded-xl p-4 w-64 z-50">
                  <h3 className="font-semibold mb-3">Settings</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Sound Effects</span>
                      <Switch
                        checked={soundEnabled}
                        onCheckedChange={setSoundEnabled}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Auto-Voice</span>
                      <Switch
                        checked={autoVoice}
                        onCheckedChange={setAutoVoice}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-sm py-2 px-3 glass-morphism rounded-lg hover:bg-white/20"
                      onClick={() => {
                        onDownloadTranscript();
                        setIsSettingsOpen(false);
                      }}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Chat
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-sm py-2 px-3 glass-morphism rounded-lg hover:bg-white/20"
                      onClick={() => {
                        onClearConversation();
                        setIsSettingsOpen(false);
                      }}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Clear History
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center justify-between mt-3 text-xs text-gray-400">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
              <span>AI Online</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 rounded-full bg-blue-400"></div>
              <span>Voice Ready</span>
            </div>
          </div>
          <span>{messages.length} messages</span>
        </div>
      </div>
    </div>
  );
}