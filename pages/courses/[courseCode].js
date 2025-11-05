import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getUserName, setUserName } from '../../lib/cookies';
import AuthModal from '../../components/AuthModal';
import { formatNameForPublic } from '../../lib/nameFormat';

export default function CoursePage() {
  const router = useRouter();
  const { courseCode } = router.query;
  const [course, setCourse] = useState(null);
  const [groups, setGroups] = useState([]);
  const [roster, setRoster] = useState([]);
  const [userName, setUserNameState] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [message, setMessage] = useState(null);
  const [userGroupId, setUserGroupId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  const [isMaintenance, setIsMaintenance] = useState(false);

  useEffect(() => {
    // Check maintenance status
    fetch('/api/maintenance-status')
      .then(res => res.json())
      .then(data => {
        setIsMaintenance(data.maintenance === true);
      })
      .catch(err => {
        console.error('Error checking maintenance status:', err);
      });
  }, []);

  useEffect(() => {
    // Wait for router to be ready before accessing query params
    if (!router.isReady || !courseCode) return;

    // Check user name
    const name = getUserName();
    setUserNameState(name);

    // Load course data
    loadCourseData(name);
  }, [router.isReady, courseCode]);

  function loadCourseData(name) {
    if (!courseCode || !router.isReady) return;
    setLoading(true);

    // Load course, groups, and roster
    fetch(`/api/courses/${courseCode}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          // Only redirect if we have a valid courseCode (means it's a real error, not just not ready)
          if (courseCode && router.isReady) {
            router.push('/');
          }
          setLoading(false);
          return;
        }
        setCourse(data.course);
        setGroups(data.groups || []);
        setRoster(data.roster || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load course:', err);
        setLoading(false);
      });

    // Check if user is in a group
    if (name && courseCode) {
      fetch(`/api/user/${courseCode}?userName=${encodeURIComponent(name)}`)
        .then(res => res.json())
        .then(data => {
          setUserGroupId(data.groupId);
        })
        .catch(err => {
          console.error('Failed to check user group:', err);
        });
    }
  }

  async function handleAuthSubmit(name, password) {
    setAuthError('');
    try {
      // Authenticate user (creates if doesn't exist)
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: name,
          password: password,
          createIfNotExists: pendingAction !== null, // Create if trying to do an action
        }),
      });

      // Check if response is ok before parsing JSON
      if (!response.ok && response.status !== 429) {
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

      // Check for throttling (HTTP 429)
      if (response.status === 429) {
        const data = await response.json();
        setAuthError(data.message || 'Too many attempts—try again soon.');
        return;
      }

      const data = await response.json();

      if (data.error) {
        if (data.error === 'USER_NOT_FOUND' && pendingAction === null) {
          // If user not found and no pending action, just show error
          setAuthError('User not found. Please create an account or sign in with correct credentials.');
          return;
        }
        setAuthError(data.message || 'Authentication failed');
        return;
      }

      // Save to cookie and state
      setUserName(name);
      setUserNameState(name);
      setShowAuthModal(false);
      setIsSignUp(false);
      setAuthError('');

      // Retry pending action
      if (pendingAction) {
        if (pendingAction === 'create') {
          setTimeout(() => {
            handleCreateGroup(name);
          }, 100);
        } else if (pendingAction.type === 'join') {
          setTimeout(() => {
            handleJoinGroup(pendingAction.groupId, name);
          }, 100);
        }
        setPendingAction(null);
      } else {
        loadCourseData(name);
      }
    } catch (err) {
      console.error('Auth error:', err);
      setAuthError('Failed to authenticate. Please try again.');
    }
  }

  function handleCreateGroup(nameArg) {
    const name = nameArg || getUserName();
    if (!name) {
      setShowAuthModal(true);
      setPendingAction('create');
      return;
    }

    // Check if already in group
    if (userGroupId) {
      setMessage({ type: 'error', text: "You're already in a group for this course." });
      return;
    }

    // Show prompt for group name
    const groupName = prompt('Enter a name for your group:');
    if (!groupName || !groupName.trim()) return;

    fetch('/api/groups/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        courseCode,
        groupName: groupName.trim(),
        userName: name,
      }),
    })
      .then(res => {
        if (res.status === 503) {
          return res.json().then(err => {
            setMessage({ type: 'error', text: err.message || 'Maintenance in progress—please try again soon' });
            return { error: true };
          });
        }
        return res.json();
      })
      .then(data => {
        if (data.error) {
          if (!data.message || !data.message.includes('Maintenance')) {
            if (data.error === 'ALREADY_IN_GROUP') {
              setMessage({ type: 'error', text: data.message || "You're already in a group for this course." });
              setUserGroupId(data.groupId);
              loadCourseData(name);
            } else {
              setMessage({ type: 'error', text: data.message || 'Failed to create group.' });
            }
          }
          return;
        }

        loadCourseData(name);
        router.push(`/groups/${data.group.id}`);
      })
      .catch(err => {
        console.error('Failed to create group:', err);
        setMessage({ type: 'error', text: 'Failed to create group.' });
      });
  }

  function handleJoinGroup(groupId, nameArg) {
    const name = nameArg || getUserName();
    if (!name) {
      setShowAuthModal(true);
      setPendingAction({ type: 'join', groupId });
      return;
    }

    // Check if already in group
    if (userGroupId) {
      setMessage({ type: 'error', text: "You're already in a group for this course." });
      return;
    }

    fetch(`/api/groups/${groupId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        courseCode,
        userName: name,
      }),
    })
      .then(res => {
        if (res.status === 503) {
          return res.json().then(err => {
            setMessage({ type: 'error', text: err.message || 'Maintenance in progress—please try again soon' });
            return { error: true };
          });
        }
        return res.json();
      })
      .then(data => {
        if (data.error) {
          if (!data.message || !data.message.includes('Maintenance')) {
            if (data.error === 'ALREADY_IN_GROUP') {
              setMessage({ type: 'error', text: data.message || "You're already in a group for this course." });
              setUserGroupId(data.groupId);
              loadCourseData(name);
            } else if (data.error === 'GROUP_CLOSED') {
              setMessage({ type: 'error', text: 'This group is closed and not accepting new members.' });
            } else if (data.error === 'GROUP_FULL') {
              setMessage({ type: 'error', text: 'This group is full (5/5). Try another or create one.' });
            } else {
              setMessage({ type: 'error', text: 'Failed to join group.' });
            }
          }
          return;
        }

        loadCourseData(name);
        router.push(`/groups/${groupId}`);
      })
      .catch(err => {
        console.error('Failed to join group:', err);
        setMessage({ type: 'error', text: 'Failed to join group.' });
      });
  }

  // Show loading if router isn't ready yet or if data is still loading
  if (!router.isReady || loading || !course) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="max-w-screen-lg mx-auto pt-8 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 skeleton rounded-2xl" aria-label="Loading course data" />
            ))}
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
            {course.code}
          </h1>
          <p className="text-sm text-neutral-600 mb-4">
            {course.title}
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
              <div className="flex-1">
                <p className="text-sm font-medium">{message.text}</p>
                {message.type === 'error' && userGroupId && (
                  <div className="mt-3">
                    <Link
                      href={`/groups/${userGroupId}`}
                      className="btn-lift inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-800 bg-white rounded-lg hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                    >
                      Go to your group
                    </Link>
                  </div>
                )}
              </div>
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

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => {
          setShowAuthModal(false);
          setIsSignUp(false);
          setPendingAction(null);
          setAuthError('');
        }}
        onSubmit={handleAuthSubmit}
        title={pendingAction === 'create' || pendingAction?.type === 'join' ? 'Create account to continue' : 'Sign In'}
        description={pendingAction === 'create' || pendingAction?.type === 'join'
          ? 'Enter your name and password to create an account'
          : 'Enter your name and password to sign in'}
        error={authError}
        isSignUp={pendingAction !== null}
      />

        <div className="card-hover bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
          <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 mb-6">
            Active Groups
          </h2>
          {groups.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-neutral-600 mb-4">No groups yet. Be the first to create one!</p>
              <button
                onClick={() => handleCreateGroup()}
                disabled={isMaintenance}
                className={`px-4 py-2 text-white font-medium rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                  isMaintenance
                    ? 'bg-neutral-400 cursor-not-allowed'
                    : 'btn-lift bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                }`}
                aria-label="Create a new study group"
                title={isMaintenance ? 'Maintenance in progress' : 'Create a new study group'}
              >
                Create Group
              </button>
            </div>
          ) : (
            <>
              <ul className="space-y-3" role="list">
                {groups.map((group) => (
                  <li 
                    key={group.id} 
                    className="p-4 rounded-xl bg-neutral-50 border border-neutral-200"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-neutral-900">{group.name}</span>
                        <span className={`chip-hover inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          group.isOpen
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {group.isOpen ? 'OPEN' : 'CLOSED'}
                        </span>
                      </div>
                      <span className="text-sm text-neutral-600 font-medium">
                        {group.size}/{group.maxSize}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/groups/${group.id}`}
                        className="btn-lift px-3 py-1.5 text-sm font-medium text-blue-600 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 active:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                        aria-label={`View ${group.name} group`}
                      >
                        View
                      </Link>
                      {!userGroupId && group.isOpen && group.size < 5 && (
                        <button
                          onClick={() => handleJoinGroup(group.id)}
                          disabled={isMaintenance}
                          className={`px-3 py-1.5 text-sm font-medium bg-white border rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500 focus-visible:ring-offset-2 ${
                            isMaintenance
                              ? 'text-neutral-400 border-neutral-200 cursor-not-allowed'
                              : 'btn-lift text-neutral-700 border-neutral-300 hover:bg-neutral-50 active:bg-neutral-100'
                          }`}
                          aria-label={`Join ${group.name} group`}
                          title={isMaintenance ? 'Maintenance in progress' : `Join ${group.name} group`}
                        >
                          Join
                        </button>
                      )}
                      {!group.isOpen && (
                        <span className="text-xs text-neutral-500">Not accepting members</span>
                      )}
                      {group.size >= 5 && (
                        <span className="text-xs text-neutral-500">Full</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                <button
                  onClick={() => handleCreateGroup()}
                  disabled={isMaintenance}
                  className={`px-4 py-2 text-white font-medium rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                    isMaintenance
                      ? 'bg-neutral-400 cursor-not-allowed'
                      : 'btn-lift bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                  }`}
                  aria-label="Create a new study group"
                  title={isMaintenance ? 'Maintenance in progress' : 'Create a new study group'}
                >
                  Create New Group
                </button>
              </div>
            </>
          )}
        </div>

        <div className="card-hover bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
          <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 mb-6">
            Course Roster
          </h2>
          {roster.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-neutral-600">No students registered yet.</p>
            </div>
          ) : (
            <ul className="space-y-2" role="list">
              {roster.map((item) => (
                <li 
                  key={item.name} 
                  className="flex items-center justify-between py-2 px-3 rounded-lg bg-neutral-50"
                >
                  <span className="text-sm text-neutral-900">{formatNameForPublic(item.name)}</span>
                  <span className={`chip-hover inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    item.status === 'IN_GROUP'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-neutral-200 text-neutral-700'
                  }`}>
                    {item.status === 'IN_GROUP' ? 'IN GROUP' : 'OPEN'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
