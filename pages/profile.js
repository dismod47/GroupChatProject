import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getUserName, setUserName } from '../lib/cookies';
import { formatNameForPublic } from '../lib/nameFormat';

export default function ProfilePage() {
  const router = useRouter();
  const [userName, setUserNameState] = useState(null);
  const [newUserName, setNewUserName] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const name = getUserName();
    if (!name) {
      router.push('/');
      return;
    }

    setUserNameState(name);
    setNewUserName(name);
    setLoading(false);
  }, []);

  function handleSubmit(e) {
    e.preventDefault();
    const trimmedName = newUserName.trim();
    
    if (!trimmedName) {
      setMessage({ type: 'error', text: 'Name cannot be empty.' });
      return;
    }

    if (trimmedName === userName) {
      setMessage({ type: 'info', text: 'No changes to save.' });
      return;
    }

    if (!password) {
      setMessage({ type: 'error', text: 'Password is required to change your name.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    fetch('/api/user/update-name', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        oldUserName: userName,
        newUserName: trimmedName,
        password: password,
      }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setMessage({ type: 'error', text: data.message || 'Failed to update name.' });
          setLoading(false);
          return;
        }

        // Update cookie and state
        setUserName(trimmedName);
        setUserNameState(trimmedName);
        setPassword('');
        setMessage({ type: 'success', text: 'Name updated successfully! You may need to refresh the page to see changes everywhere.' });
        setLoading(false);
        
        // Refresh page after a short delay to show success message
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      })
      .catch(err => {
        console.error('Failed to update name:', err);
        setMessage({ type: 'error', text: 'Failed to update name. Please try again.' });
        setLoading(false);
      });
  }

  if (loading && !userName) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="max-w-screen-lg mx-auto pt-8 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="space-y-3">
            <div className="h-24 skeleton rounded-2xl" aria-label="Loading profile" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-screen-lg mx-auto pt-8 pb-16 px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 mb-2">
            Profile
          </h1>
          <p className="text-sm text-neutral-600 mb-4">
            Manage your account
          </p>
          <Link 
            href="/" 
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded"
          >
            ← Back to Courses
          </Link>
        </div>

        {message && (
          <div 
            className={`p-4 rounded-2xl border ${
              message.type === 'error' 
                ? 'bg-red-50 border-red-200 text-red-800' 
                : message.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-blue-50 border-blue-200 text-blue-800'
            }`}
            role="alert"
            aria-live={message.type === 'error' ? 'assertive' : 'polite'}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium flex-1">{message.text}</p>
              <button
                onClick={() => setMessage(null)}
                className="flex-shrink-0 text-current opacity-70 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-current rounded"
                aria-label="Close message"
              >
                ×
              </button>
            </div>
          </div>
        )}

        <div className="card-hover bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 max-w-2xl">
          <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 mb-2">
            Change Display Name
          </h2>
          <p className="text-sm text-neutral-600 mb-6">
            Your current display name is used throughout the app. Changing it will update your name in all groups, messages, and rosters.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="currentName" className="block text-sm font-medium text-neutral-900 mb-2">
                Current Name
              </label>
              <input
                type="text"
                id="currentName"
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg bg-neutral-100 text-neutral-600"
                value={formatNameForPublic(userName || '')}
                disabled
              />
            </div>

            <div className="mb-4">
              <label htmlFor="newName" className="block text-sm font-medium text-neutral-900 mb-2">
                New Name
              </label>
              <input
                type="text"
                id="newName"
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="Enter new display name"
                disabled={loading}
                autoFocus
                aria-required="true"
              />
            </div>

            <div className="mb-6">
              <label htmlFor="password" className="block text-sm font-medium text-neutral-900 mb-2">
                Password <span className="text-neutral-500">(required for verification)</span>
              </label>
              <input
                type="password"
                id="password"
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={loading}
                aria-required="true"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 active:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed btn-lift"
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update Name'}
              </button>
              <Link
                href="/"
                className="btn-lift px-4 py-2 text-neutral-700 bg-white border border-neutral-300 font-medium rounded-lg hover:bg-neutral-50 active:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500 focus-visible:ring-offset-2"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
