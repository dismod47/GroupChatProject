import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatNameForPublic, getUserInitials } from '../lib/nameFormat';

export default function ProfileModal({ userName, onClose }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userName) return;

    // Fetch user profile data
    fetch(`/api/users/${userName}/profile`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          console.error('Failed to load profile:', data.error);
          setProfile(null);
        } else {
          setProfile(data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch profile:', err);
        setProfile(null);
        setLoading(false);
      });
  }, [userName]);

  // Format relative time
  function formatRelativeTime(timestamp) {
    if (!timestamp) return 'Never';
    
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now - time;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return time.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  if (!userName) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div 
        className="bg-white rounded-2xl shadow-lg max-w-md w-full p-6 relative" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 id="modal-title" className="text-2xl font-semibold tracking-tight text-neutral-900">
            Profile
          </h2>
          <button 
            className="flex items-center justify-center w-8 h-8 rounded-lg text-neutral-600 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500 focus-visible:ring-offset-2" 
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        {loading ? (
          <div className="space-y-4">
            <div className="h-20 skeleton rounded-xl" />
            <div className="h-32 skeleton rounded-xl" />
            <div className="h-40 skeleton rounded-xl" />
          </div>
        ) : profile ? (
          <div className="space-y-6">
            {/* User info header */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-2xl font-semibold text-white flex-shrink-0">
                {getUserInitials(profile.userName)}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-neutral-900">
                  {formatNameForPublic(profile.userName)}
                </h3>
              </div>
            </div>

            {/* Last active */}
            <div>
              <p className="text-sm font-medium text-neutral-700 mb-1">Last Active</p>
              <p className="text-sm text-neutral-600">
                {formatRelativeTime(profile.lastActive)}
              </p>
            </div>

            {/* Last group active in */}
            {profile.lastGroup && (
              <div>
                <p className="text-sm font-medium text-neutral-700 mb-1">Last Active In</p>
                <Link
                  href={`/groups/${profile.lastGroup.groupId}`}
                  className="inline-block text-sm text-blue-600 hover:text-blue-700 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded"
                  onClick={onClose}
                >
                  {profile.lastGroup.groupName} ({profile.lastGroup.courseCode})
                </Link>
              </div>
            )}

            {/* Current groups */}
            <div>
              <p className="text-sm font-medium text-neutral-700 mb-2">Current Groups ({profile.currentGroups.length})</p>
              {profile.currentGroups.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {profile.currentGroups.map(group => (
                    <Link
                      key={group.groupId}
                      href={`/groups/${group.groupId}`}
                      className="block p-3 rounded-lg border border-neutral-200 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                      onClick={onClose}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-neutral-900 truncate">
                            {group.groupName}
                          </p>
                          <p className="text-xs text-neutral-600">
                            {group.courseCode} - {group.courseTitle}
                          </p>
                        </div>
                        <div className="ml-2 flex-shrink-0">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            group.isOpen 
                              ? 'bg-green-100 text-green-800 border border-green-200' 
                              : 'bg-red-100 text-red-800 border border-red-200'
                          }`}>
                            {group.isOpen ? 'OPEN' : 'CLOSED'}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-neutral-500 mt-1">
                        {group.size}/5 members
                      </p>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-neutral-600">No active groups</p>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-neutral-600">Failed to load profile information.</p>
          </div>
        )}
      </div>
    </div>
  );
}




