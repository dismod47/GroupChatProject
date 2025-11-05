import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { isNative } from '../lib/capacitor';

export default function SettingsPage() {
  const router = useRouter();
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    // Load saved theme preference
    const savedTheme = typeof window !== 'undefined' 
      ? localStorage.getItem('theme') || 'light'
      : 'light';
    setTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  const applyTheme = (newTheme) => {
    if (typeof window === 'undefined') return;
    
    const root = document.documentElement;
    if (newTheme === 'dark') {
      root.classList.add('dark');
      document.body.classList.add('dark:bg-neutral-900', 'dark:text-neutral-50');
    } else {
      root.classList.remove('dark');
      document.body.classList.remove('dark:bg-neutral-900', 'dark:text-neutral-50');
    }
    localStorage.setItem('theme', newTheme);
  };

  const handleThemeToggle = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    applyTheme(newTheme);
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <div className="max-w-screen-lg mx-auto pt-8 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link 
            href="/"
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded"
          >
            ← Back to Home
          </Link>
        </div>

        <div className="card-hover bg-white dark:bg-neutral-800 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-700 p-6">
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50 mb-6">
            Settings
          </h1>

          <div className="space-y-6">
            {/* Theme Toggle */}
            <div className="flex items-center justify-between py-4 border-b border-neutral-200 dark:border-neutral-700">
              <div>
                <h2 className="text-lg font-medium text-neutral-900 dark:text-neutral-50 mb-1">
                  Theme
                </h2>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Choose between light and dark mode
                </p>
              </div>
              <button
                onClick={handleThemeToggle}
                className="relative inline-flex h-6 w-11 items-center rounded-full bg-neutral-200 dark:bg-neutral-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="Toggle theme"
                role="switch"
                aria-checked={theme === 'dark'}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* App Info (only on native) */}
            {isNative && (
              <div className="py-4 border-b border-neutral-200 dark:border-neutral-700">
                <h2 className="text-lg font-medium text-neutral-900 dark:text-neutral-50 mb-2">
                  App Information
                </h2>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Campus Study Groups iOS App
                </p>
              </div>
            )}

            {/* Links */}
            <div className="space-y-3">
              <Link
                href="/privacy"
                className="block py-3 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="block py-3 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
              >
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



