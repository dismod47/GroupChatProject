import { useEffect } from 'react';

export default function Toast({ message, onClose }) {
  useEffect(() => {
    if (!message) return;
    
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  const bgColor = message.type === 'error' 
    ? 'bg-red-50 border-red-200 text-red-800' 
    : message.type === 'success'
    ? 'bg-green-50 border-green-200 text-green-800'
    : 'bg-blue-50 border-blue-200 text-blue-800';

  return (
    <div
      className={`fixed top-4 right-4 z-50 max-w-md p-4 rounded-xl shadow-lg border ${bgColor} animate-toast-slide-in`}
      role="alert"
      aria-live={message.type === 'error' ? 'assertive' : 'polite'}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium flex-1">{message.text}</p>
        <button
          onClick={onClose}
          className="flex-shrink-0 text-current opacity-70 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-current rounded"
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
      {message.action}
    </div>
  );
}

