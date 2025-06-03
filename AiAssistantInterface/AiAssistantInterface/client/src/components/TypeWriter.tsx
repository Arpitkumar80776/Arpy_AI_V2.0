
import { useState, useEffect } from 'react';

interface TypeWriterProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
}

export function TypeWriter({ text, speed = 50, onComplete }: TypeWriterProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // Reset when text changes
    setDisplayedText('');
    setCurrentIndex(0);
  }, [text]);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);

      return () => clearTimeout(timeout);
    } else if (currentIndex === text.length && onComplete) {
      // Animation complete, trigger callback
      onComplete();
    }
  }, [currentIndex, text, speed, onComplete]);

  return (
    <span className="text-sm leading-relaxed">
      {displayedText}
      {currentIndex < text.length && (
        <span className="animate-pulse">|</span>
      )}
    </span>
  );
}
