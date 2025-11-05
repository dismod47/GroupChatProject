import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getUserName, setUserName as setUserNameCookie, clearUserName } from '../lib/cookies';
import AuthModal from './AuthModal';

export default function UserIndicator() {
  const router = useRouter();
  const [userName, setUserName] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    // Check user name on mount and set up listener for updates
    const checkUserName = () => {
      setUserName(getUserName());
    };

    checkUserName();

    // Check periodically for changes (e.g., after login)
    const interval = setInterval(checkUserName, 500);

    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!showDropdown) return;

    function handleClickOutside(event) {
      if (!event.target.closest('.user-indicator')) {
        setShowDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  async function handleAuthSubmit(name, password) {
    setAuthError('');
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: name,
          password: password,
          createIfNotExists: isSignUp, // Use the mode to determine if we should create
        }),
      });

      // Check for throttling (HTTP 429)
      if (response.status === 429) {
        const data = await response.json();
        setAuthError(data.message || 'Too many attempts—try again soon.');
        return;
      }

      // Check if response is ok before parsing JSON
      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: 'Unknown error', message: errorText || 'Failed to authenticate' };
        }
        setAuthError(errorData.message || 'Authentication failed');
        return;
      }

      const data = await response.json();

      if (data.error) {
        if (data.error === 'USER_NOT_FOUND' && !isSignUp) {
          // If user not found and we're in sign-in mode, switch to sign-up mode
          setIsSignUp(true);
          setAuthError('User not found. Switch to "Create Account" to register.');
          return;
        } else if (data.error === 'INVALID_PASSWORD') {
          setAuthError(data.message || 'Incorrect password');
          return;
        } else {
          setAuthError(data.message || 'Authentication failed');
          return;
        }
      }

      // Success - login or registration
      if (data.userName) {
        setUserNameCookie(data.userName);
        setUserName(data.userName);
        setShowAuthModal(false);
        setIsSignUp(false);
        setShowDropdown(false);
        setAuthError('');
      }
    } catch (err) {
      console.error('Auth error:', err);
      setAuthError('Failed to authenticate. Please try again.');
    }
  }

  function handleSignOut() {
    clearUserName();
    setUserName(null);
    setShowDropdown(false);
  }

  function handleSignInClick() {
    setShowAuthModal(true);
    setShowDropdown(false);
  }

  return (
    <>
      <div className="fixed top-4 right-4 z-40 user-indicator">
        <div className="relative">
          {userName ? (
            <>
              {/* Signed in - show dropdown button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDropdown(!showDropdown);
                }}
                className="flex items-center gap-2.5 px-4 py-2.5 bg-white rounded-xl shadow-sm border border-neutral-200 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8102E] focus-visible:ring-offset-2 transition-all"
                aria-label={`User menu for ${userName}`}
                aria-expanded={showDropdown}
              >
                <svg 
                  className="w-5 h-5 text-neutral-600" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
                  />
                </svg>
                <span className="text-sm font-medium text-neutral-900">
                  {userName}
                </span>
                <svg 
                  className={`w-3 h-3 transition-transform text-neutral-500 ${showDropdown ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showDropdown && (
                <div 
                  className="absolute top-full right-0 mt-2 w-56 bg-white rounded-2xl shadow-lg border border-neutral-200 overflow-hidden z-50"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-4 py-3 bg-neutral-50 border-b border-neutral-200">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#C8102E] flex items-center justify-center">
                        <span className="text-white text-xs font-semibold">
                          {userName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-neutral-900">{userName}</span>
                    </div>
                  </div>
                  <button 
                    className="w-full px-4 py-3 text-left text-sm text-neutral-700 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8102E] focus-visible:ring-inset transition-colors flex items-center gap-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDropdown(false);
                      router.push('/profile');
                    }}
                  >
                    <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Profile
                  </button>
                  <div className="h-px bg-neutral-200"></div>
                  <button 
                    className="w-full px-4 py-3 text-left text-sm text-neutral-700 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8102E] focus-visible:ring-inset transition-colors flex items-center gap-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDropdown(false);
                      router.push('/my-groups');
                    }}
                  >
                    <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    My Groups
                  </button>
                  <div className="h-px bg-neutral-200"></div>
                  <button 
                    className="w-full px-4 py-3 text-left text-sm text-neutral-700 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8102E] focus-visible:ring-inset transition-colors flex items-center gap-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDropdown(false);
                      router.push('/settings');
                    }}
                  >
                    <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Settings
                  </button>
                  <div className="h-px bg-neutral-200"></div>
                  <button 
                    className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-inset transition-colors flex items-center gap-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSignOut();
                    }}
                  >
                    <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              )}
            </>
          ) : (
            /* Not signed in - direct button to open modal */
            <button
              onClick={handleSignInClick}
              className="flex items-center gap-2.5 px-4 py-2.5 bg-[#C8102E] border border-[#C8102E] rounded-xl shadow-sm text-white hover:bg-[#A00D26] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8102E] focus-visible:ring-offset-2 transition-all"
              aria-label="Sign in"
            >
              <svg 
                className="w-5 h-5 text-white" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
                />
              </svg>
              <span className="text-sm font-medium text-white">
                Sign In
              </span>
            </button>
          )}
        </div>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => {
          setShowAuthModal(false);
          setIsSignUp(false);
          setAuthError('');
        }}
        onSubmit={handleAuthSubmit}
        title={isSignUp ? 'Create Account' : 'Sign In'}
        description={isSignUp ? 'Create a new account to join study groups and chat with classmates.' : 'Enter your name and password to sign in.'}
        error={authError}
        isSignUp={isSignUp}
        onToggleMode={() => {
          setIsSignUp(!isSignUp);
          setAuthError('');
        }}
      />
    </>
  );
}

