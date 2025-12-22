// Component for collecting user feedback

'use client';

import { useState } from 'react';
import { ThumbsUp, ThumbsDown, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { apiClient } from '@/lib/api';

interface FeedbackWidgetProps {
  queryId: string;
  onSubmit?: () => void;
}

export function FeedbackWidget({ queryId, onSubmit }: FeedbackWidgetProps) {
  const [feedback, setFeedback] = useState<'accept' | 'reject' | 'edit' | null>(null);
  const [comment, setComment] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmitFeedback = async () => {
    setIsLoading(true);
    try {
      if (feedback) {
        await apiClient.submitFeedback(queryId, feedback, comment);
        setIsSubmitted(true);
        onSubmit?.();
        setTimeout(() => {
          setFeedback(null);
          setComment('');
          setIsSubmitted(false);
        }, 2000);
      }
    } catch (error) {
      console.error('Feedback submission error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <Card className="p-3 bg-primary/10 border-primary/50 text-center">
        <p className="text-sm font-semibold text-primary">Thank you for your feedback!</p>
      </Card>
    );
  }

  return (
    <Card className="space-y-3 p-3">
      <p className="text-xs font-semibold text-muted-foreground">WAS THIS QUERY HELPFUL?</p>
      <div className="flex gap-2">
        <Button
          onClick={() => setFeedback('accept')}
          variant={feedback === 'accept' ? 'default' : 'outline'}
          size="sm"
          className="flex items-center gap-1"
        >
          <ThumbsUp className="w-3 h-3" />
          Accept
        </Button>
        <Button
          onClick={() => setFeedback('edit')}
          variant={feedback === 'edit' ? 'default' : 'outline'}
          size="sm"
          className="flex items-center gap-1"
        >
          <Edit2 className="w-3 h-3" />
          Edit & Accept
        </Button>
        <Button
          onClick={() => setFeedback('reject')}
          variant={feedback === 'reject' ? 'default' : 'outline'}
          size="sm"
          className="flex items-center gap-1"
        >
          <ThumbsDown className="w-3 h-3" />
          Reject
        </Button>
      </div>
      {feedback && (
        <div className="space-y-2">
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Optional: Tell us why..."
            className="text-xs min-h-20 resize-none"
          />
          <Button
            onClick={handleSubmitFeedback}
            disabled={isLoading}
            className="w-full text-xs"
            size="sm"
          >
            {isLoading ? 'Submitting...' : 'Submit Feedback'}
          </Button>
        </div>
      )}
    </Card>
  );
}
