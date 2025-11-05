import { useState, useEffect } from 'react';

export default function AuthModal({ isOpen, onClose, onSubmit, title, description, error: externalError, isSignUp, onToggleMode }) {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setName('');
      setPassword('');
      setError('');
    }
  }, [isOpen]);

  // Update error when external error changes
  useEffect(() => {
    if (externalError) {
      setError(externalError);
    }
  }, [externalError]);

  if (!isOpen) return null;

  function handleSubmit(e) {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedPassword = password.trim();

    if (!trimmedName) {
      setError('Name is required');
      return;
    }

    if (!trimmedPassword) {
      setError('Password is required');
      return;
    }

    setError('');
    onSubmit(trimmedName, trimmedPassword);
  }

  function handleClose() {
    setName('');
    setPassword('');
    setError('');
    onClose();
  }

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" 
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div 
        className="bg-white rounded-2xl shadow-lg max-w-md w-full p-6 relative" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 id="modal-title" className="text-2xl font-semibold tracking-tight text-neutral-900">
            {title || 'Sign In'}
          </h2>
          <button 
            className="flex items-center justify-center w-8 h-8 rounded-lg text-neutral-600 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500 focus-visible:ring-offset-2" 
            onClick={handleClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>
        {description && (
          <p className="text-sm text-neutral-600 mb-6">
            {description}
          </p>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="auth-name" className="block text-sm font-medium text-neutral-900 mb-2">
              Name
            </label>
            <input
              id="auth-name"
              type="text"
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              autoFocus
              aria-required="true"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="auth-password" className="block text-sm font-medium text-neutral-900 mb-2">
              Password
            </label>
            <input
              id="auth-password"
              type="password"
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              aria-required="true"
            />
          </div>
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm" role="alert">
              {error}
            </div>
          )}
          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              className="btn-lift flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 active:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              {isSignUp ? 'Create Account' : 'Sign In'}
            </button>
            <button
              type="button"
              className="btn-lift px-4 py-2 text-neutral-700 bg-white border border-neutral-300 font-medium rounded-lg hover:bg-neutral-50 active:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500 focus-visible:ring-offset-2"
              onClick={handleClose}
            >
              Cancel
            </button>
          </div>
          {onToggleMode && (
            <div className="mt-4 text-center">
              <p className="text-sm text-neutral-600">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                <button
                  type="button"
                  onClick={onToggleMode}
                  className="ml-1 text-blue-600 font-medium hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded"
                >
                  {isSignUp ? 'Sign In' : 'Create Account'}
                </button>
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

