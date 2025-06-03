import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Message } from '@shared/schema';
import { AudioUtils } from '@/lib/audioUtils';

export function useChat(initialSessionId?: string) {
  const [sessionId, setSessionId] = useState(() => initialSessionId || crypto.randomUUID());
  const [soundEnabled, setSoundEnabled] = useState(true);
  const queryClient = useQueryClient();

  // Load conversation history
  const { data: conversationData } = useQuery({
    queryKey: ['/api/conversation', sessionId],
    queryFn: async () => {
      const response = await fetch(`/api/conversation/${sessionId}`);
      if (!response.ok) throw new Error('Failed to load conversation');
      return response.json();
    },
  });

  const messages: Message[] = conversationData?.messages || [];

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ message, isVoice = false }: { message: string; isVoice?: boolean }) => {
      console.log('Sending message:', { message, sessionId, isVoice });
      const response = await apiRequest('POST', '/api/chat', {
        message,
        sessionId,
        isVoice,
      });
      const result = await response.json();
      console.log('Chat response:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('Message sent successfully:', data);
      // Invalidate and refetch conversation
      queryClient.invalidateQueries({ queryKey: ['/api/conversation', sessionId] });
      
      // Play sound effect
      if (soundEnabled) {
        AudioUtils.playMessageReceivedSound();
      }
    },
    onError: (error) => {
      console.error('Failed to send message:', error);
      // You could add a toast notification here to show the user there was an error
    },
  });

  // Clear conversation mutation
  const clearConversationMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', `/api/conversation/${sessionId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversation', sessionId] });
    },
  });

  const sendMessage = (message: string, isVoice = false) => {
    if (soundEnabled) {
      AudioUtils.playMessageSentSound();
    }
    sendMessageMutation.mutate({ message, isVoice });
  };

  const clearConversation = () => {
    clearConversationMutation.mutate();
  };

  const switchToConversation = (newSessionId: string) => {
    setSessionId(newSessionId);
  };

  const createNewConversation = () => {
    const newSessionId = crypto.randomUUID();
    setSessionId(newSessionId);
    // Invalidate conversations list to refresh history
    queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
  };

  // Generate title after 2 messages
  useEffect(() => {
    const messages = conversationData?.messages || [];
    if (messages.length === 2 && !conversationData?.title) {
      // Auto-generate title after first exchange
      fetch(`/api/conversation/${sessionId}/generate-title`, { method: 'POST' })
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
        })
        .catch(console.error);
    }
  }, [conversationData, sessionId, queryClient]);

  const downloadTranscript = () => {
    if (messages.length === 0) return;

    const transcript = messages
      .map(msg => {
        const timestamp = new Date(msg.timestamp).toLocaleString();
        const role = msg.role === 'user' ? 'You' : 'Arpy AI';
        const voiceIndicator = msg.isVoice ? ' 🎤' : '';
        return `[${timestamp}] ${role}${voiceIndicator}: ${msg.content}`;
      })
      .join('\n\n');

    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `arpy-ai-conversation-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return {
    messages,
    isLoading: sendMessageMutation.isPending,
    sendMessage,
    clearConversation,
    downloadTranscript,
    soundEnabled,
    setSoundEnabled,
    sessionId,
    switchToConversation,
    createNewConversation,
  };
}
