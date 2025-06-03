import { useState, useCallback, useRef } from 'react';
import { speechRecognitionService } from '@/lib/speechRecognition';

export function useVoiceRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const startListening = useCallback(() => {
    if (!speechRecognitionService.isSupported()) {
      setError('Speech recognition is not supported in this browser');
      return false;
    }

    setError(null);
    setTranscript('');

    const success = speechRecognitionService.start(
      (newTranscript, isFinal) => {
        setTranscript(newTranscript);
        
        // Clear existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        // Set timeout to stop listening after 3 seconds of silence
        if (!isFinal) {
          timeoutRef.current = setTimeout(() => {
            stopListening();
          }, 3000);
        }
      },
      (errorMessage) => {
        setError(errorMessage);
        setIsListening(false);
      },
      () => {
        setIsListening(false);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      }
    );

    if (success) {
      setIsListening(true);
    }

    return success;
  }, []);

  const stopListening = useCallback(() => {
    speechRecognitionService.stop();
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  return {
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    isSupported: speechRecognitionService.isSupported(),
  };
}
