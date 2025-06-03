import { useState } from 'react';
import { ThumbsUp, ThumbsDown, Star, MessageSquare, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Message } from '@shared/schema';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface MessageFeedbackProps {
  message: Message;
  sessionId: string;
  neonColor: string;
}

export function MessageFeedback({ message, sessionId, neonColor }: MessageFeedbackProps) {
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [helpful, setHelpful] = useState<boolean | null>(null);
  const queryClient = useQueryClient();

  const feedbackMutation = useMutation({
    mutationFn: async (feedbackData: any) => {
      const response = await apiRequest('POST', '/api/feedback', feedbackData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversation', sessionId] });
      setShowRatingForm(false);
      setComment('');
    },
  });

  const handleQuickFeedback = (isHelpful: boolean) => {
    setHelpful(isHelpful);
    feedbackMutation.mutate({
      messageId: message.id,
      sessionId,
      helpful: isHelpful,
    });
  };

  const handleRatingSubmit = () => {
    if (selectedRating) {
      feedbackMutation.mutate({
        messageId: message.id,
        sessionId,
        rating: selectedRating,
        comment: comment.trim() || undefined,
        helpful,
      });
    }
  };

  const hasExistingFeedback = message.feedback && (
    message.feedback.rating || 
    message.feedback.helpful !== undefined || 
    message.feedback.comment
  );

  if (hasExistingFeedback) {
    return (
      <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
        {message.feedback?.rating && (
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 fill-current" style={{ color: neonColor }} />
            <span>{message.feedback.rating}/5</span>
          </div>
        )}
        {message.feedback?.helpful !== undefined && (
          <div className="flex items-center gap-1">
            {message.feedback.helpful ? (
              <ThumbsUp className="w-3 h-3" style={{ color: neonColor }} />
            ) : (
              <ThumbsDown className="w-3 h-3 text-red-400" />
            )}
            <span>{message.feedback.helpful ? 'Helpful' : 'Not helpful'}</span>
          </div>
        )}
        {message.feedback?.comment && (
          <div className="flex items-center gap-1">
            <MessageSquare className="w-3 h-3" />
            <span>Feedback provided</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-3">
      {/* Quick Feedback Buttons */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400">Was this helpful?</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 hover:bg-white/10"
          onClick={() => handleQuickFeedback(true)}
          disabled={feedbackMutation.isPending}
        >
          <ThumbsUp className="w-3 h-3 mr-1" />
          <span className="text-xs">Yes</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 hover:bg-white/10"
          onClick={() => handleQuickFeedback(false)}
          disabled={feedbackMutation.isPending}
        >
          <ThumbsDown className="w-3 h-3 mr-1" />
          <span className="text-xs">No</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 hover:bg-white/10"
          onClick={() => setShowRatingForm(!showRatingForm)}
        >
          <Star className="w-3 h-3 mr-1" />
          <span className="text-xs">Rate</span>
        </Button>
      </div>

      {/* Detailed Rating Form */}
      {showRatingForm && (
        <div className="glass-morphism p-3 rounded-lg space-y-3">
          <div>
            <label className="text-xs text-gray-300 block mb-2">Rate this response (1-5 stars)</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((rating) => (
                <Button
                  key={rating}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-white/10"
                  onClick={() => setSelectedRating(rating)}
                >
                  <Star
                    className={`w-4 h-4 ${
                      selectedRating && rating <= selectedRating
                        ? 'fill-current'
                        : ''
                    }`}
                    style={{
                      color: selectedRating && rating <= selectedRating ? neonColor : '#6B7280'
                    }}
                  />
                </Button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-300 block mb-2">
              Additional feedback (optional)
            </label>
            <Textarea
              placeholder="Tell us how we can improve..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder-gray-400 text-xs h-16 resize-none"
              maxLength={500}
            />
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              className="text-xs"
              style={{ background: `linear-gradient(135deg, ${neonColor}, rgba(255,255,255,0.1))` }}
              onClick={handleRatingSubmit}
              disabled={!selectedRating || feedbackMutation.isPending}
            >
              <Send className="w-3 h-3 mr-1" />
              Submit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs hover:bg-white/10"
              onClick={() => setShowRatingForm(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {feedbackMutation.isPending && (
        <div className="text-xs text-gray-400">Submitting feedback...</div>
      )}
    </div>
  );
}