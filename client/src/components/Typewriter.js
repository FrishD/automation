import React, { useState, useEffect } from 'react';

const Typewriter = ({ text, duration, defaultSpeed = 50 }) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    setDisplayedText('');
    let i = 0;

    // Calculate speed based on duration if provided
    const speed = duration && text.length > 0
      ? (duration * 1000) / text.length
      : defaultSpeed;

    const intervalId = setInterval(() => {
      if (i < text.length) {
        setDisplayedText((prev) => prev + text.charAt(i));
        i++;
      } else {
        clearInterval(intervalId);
      }
    }, speed);

    return () => clearInterval(intervalId);
  }, [text, duration, defaultSpeed]);

  return <span>{displayedText}</span>;
};

export default Typewriter;
