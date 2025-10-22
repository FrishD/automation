import React, { useState, useEffect } from 'react';

const Notification = ({ message, type, onClear }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        if (onClear) {
          onClear();
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message, onClear]);

  if (!visible) {
    return null;
  }

  const baseClasses = "fixed top-5 left-5 p-4 rounded-lg shadow-lg text-white";
  const typeClasses = {
    success: "bg-green-500",
    error: "bg-red-500",
  };

  return (
    <div className={`${baseClasses} ${typeClasses[type] || 'bg-gray-500'}`}>
      {message}
    </div>
  );
};

export default Notification;
