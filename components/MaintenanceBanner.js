import { useState, useEffect } from 'react';

export default function MaintenanceBanner() {
  const [isMaintenance, setIsMaintenance] = useState(false);

  useEffect(() => {
    // Check maintenance status on mount
    fetch('/api/maintenance-status')
      .then(res => res.json())
      .then(data => {
        setIsMaintenance(data.maintenance === true);
      })
      .catch(err => {
        console.error('Error checking maintenance status:', err);
      });
  }, []);

  if (!isMaintenance) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-yellow-900 px-4 py-3 shadow-lg animate-fade-slide-in" style={{ marginTop: 0 }}>
      <div className="max-w-screen-lg mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <span className="font-semibold text-sm sm:text-base">
            Maintenance in progress - Some features are temporarily unavailable. Please try again soon.
          </span>
        </div>
      </div>
    </div>
  );
}

