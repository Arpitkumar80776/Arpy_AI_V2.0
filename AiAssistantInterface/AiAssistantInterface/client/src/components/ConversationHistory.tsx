import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Menu, X, MessageSquare, Trash2, Plus, History, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { apiRequest } from '@/lib/queryClient';

interface ConversationHistoryProps {
  currentSessionId: string;
  onSelectConversation: (sessionId: string) => void;
  onNewConversation: () => void;
  neonColor: string;
}

interface ConversationSummary {
  sessionId: string;
  title: string;
  lastMessage: string;
  timestamp: number;
  messageCount: number;
}

export function ConversationHistory({ 
  currentSessionId, 
  onSelectConversation, 
  onNewConversation, 
  neonColor 
}: ConversationHistoryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch conversation history
  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['/api/conversations'],
    queryFn: async () => {
      const response = await fetch('/api/conversations');
      if (!response.ok) throw new Error('Failed to fetch conversations');
      return response.json();
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Delete conversation mutation
  const deleteConversationMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await apiRequest('DELETE', `/api/conversation/${sessionId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
    },
  });

  const handleDeleteConversation = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this conversation?')) {
      deleteConversationMutation.mutate(sessionId);
      if (sessionId === currentSessionId) {
        onNewConversation();
      }
    }
  };

  const handleSelectConversation = (sessionId: string) => {
    onSelectConversation(sessionId);
    setIsOpen(false);
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <>
      {/* Menu Toggle Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="fixed top-6 left-6 z-50 holographic-glow hover:bg-white/10"
        style={{ 
          background: `linear-gradient(135deg, ${neonColor}20, rgba(255,255,255,0.1))`,
          border: `1px solid ${neonColor}40`
        }}
      >
        <Menu className="w-5 h-5 mr-2" />
        <span className="hidden sm:inline">History</span>
      </Button>

      {/* Sidebar Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full w-80 z-50 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        ar-panel holographic-glow
      `}>
        {/* AR Grid Background */}
        <div className="absolute inset-0 ar-grid opacity-20" />
        
        {/* Header */}
        <div className="relative p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold holographic-text flex items-center">
                <History className="w-5 h-5 mr-2" />
                Chat History
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* New Chat Button */}
          <Button
            onClick={() => {
              onNewConversation();
              setIsOpen(false);
            }}
            className="w-full mt-4 holographic"
            style={{ 
              background: `linear-gradient(135deg, ${neonColor}, rgba(255,255,255,0.1))`,
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Chat
          </Button>
        </div>

        {/* Conversations List */}
        <ScrollArea className="flex-1 p-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="ar-panel p-3 animate-pulse">
                  <div className="h-4 bg-white/20 rounded mb-2"></div>
                  <div className="h-3 bg-white/10 rounded"></div>
                </div>
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-400 text-sm">No conversations yet</p>
              <p className="text-gray-500 text-xs mt-1">Start chatting to see your history</p>
            </div>
          ) : (
            <div className="space-y-2">
              {conversations.map((conv: ConversationSummary) => (
                <div
                  key={conv.sessionId}
                  onClick={() => handleSelectConversation(conv.sessionId)}
                  className={`
                    group cursor-pointer ar-panel p-3 hover:bg-white/10 transition-all duration-200
                    ${conv.sessionId === currentSessionId ? 'holographic' : ''}
                  `}
                  style={{
                    border: conv.sessionId === currentSessionId 
                      ? `1px solid ${neonColor}60` 
                      : '1px solid rgba(255,255,255,0.1)'
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-medium text-sm mb-1 truncate ${
                        conv.sessionId === currentSessionId ? 'holographic-text' : 'text-white'
                      }`}>
                        {conv.title || 'Untitled Chat'}
                      </h3>
                      <p className="text-xs text-gray-400 mb-2 line-clamp-2">
                        {conv.lastMessage}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{formatTimestamp(conv.timestamp)}</span>
                        <span>{conv.messageCount} message{conv.messageCount !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center ml-2">
                      {conv.sessionId === currentSessionId && (
                        <ChevronRight className="w-3 h-3 mr-1" style={{ color: neonColor }} />
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleDeleteConversation(conv.sessionId, e)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 hover:bg-red-500/20"
                      >
                        <Trash2 className="w-3 h-3 text-red-400" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="relative p-4 border-t border-white/10">
          <div className="text-xs text-gray-500 text-center">
            Arpy AI V2.0 • {new Date().getFullYear()}
          </div>
        </div>
      </div>
    </>
  );
}