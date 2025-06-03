import { useState, useCallback } from 'react';
import { Mic, MicOff, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VoiceRecorderProps {
  onTranscript: (text: string) => void;
  isRecording: boolean;
  setIsRecording: (recording: boolean) => void;
  neonColor: string;
}

export function VoiceRecorder({ 
  onTranscript, 
  isRecording, 
  setIsRecording, 
  neonColor 
}: VoiceRecorderProps) {
  const [transcript, setTranscript] = useState('');

  const toggleRecording = useCallback(async () => {
    if (isRecording) {
      setIsRecording(false);
    } else {
      try {
        // Check if speech recognition is supported
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
          alert('Speech recognition not supported in this browser');
          return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            }
          }
          if (finalTranscript) {
            setTranscript(finalTranscript);
            onTranscript(finalTranscript);
          }
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setIsRecording(false);
        };

        recognition.start();
        setIsRecording(true);
      } catch (error) {
        console.error('Failed to start recording:', error);
        setIsRecording(false);
      }
    }
  }, [isRecording, setIsRecording, onTranscript]);

  // Check if speech recognition is supported
  const isSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;

  if (!isSupported) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="w-12 h-12 rounded-xl opacity-50 cursor-not-allowed"
        disabled
        title="Voice recognition not supported"
      >
        <MicOff className="w-5 h-5 text-gray-500" />
      </Button>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-2">
      <Button
        variant="ghost"
        size="icon"
        className={`w-12 h-12 rounded-xl transition-all hover:scale-110 ${
          isRecording ? 'animate-pulse' : ''
        }`}
        style={{
          background: isRecording
            ? `linear-gradient(135deg, ${neonColor}, rgba(255,0,0,0.3))`
            : `linear-gradient(135deg, ${neonColor}, rgba(255,255,255,0.1))`,
        }}
        onClick={toggleRecording}
        title={isRecording ? 'Stop recording' : 'Start voice input'}
      >
        {isRecording ? (
          <Square className="w-5 h-5 text-white" />
        ) : (
          <Mic className="w-5 h-5 text-white" />
        )}
      </Button>

      {transcript && (
        <div className="glass-morphism rounded-lg p-2 max-w-xs">
          <p className="text-xs text-white/80 text-center">{transcript}</p>
        </div>
      )}
    </div>
  );
}