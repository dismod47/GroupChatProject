import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getUserName, setUserName } from '../../lib/cookies';
import AuthModal from '../../components/AuthModal';
import ProfileModal from '../../components/ProfileModal';
import { formatNameForPublic, getUserInitials } from '../../lib/nameFormat';
import { isNative, isIOS } from '../../lib/capacitor';

export default function GroupPage() {
  const router = useRouter();
  const { groupId } = router.query;
  const [group, setGroup] = useState(null);
  const [course, setCourse] = useState(null);
  const [userName, setUserNameState] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isMember, setIsMember] = useState(false);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingAction, setPendingAction] = useState(null);
  const [authError, setAuthError] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileUserName, setProfileUserName] = useState(null);
  const messagesEndRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);
  const [matchIndices, setMatchIndices] = useState([]);
  const messageRefs = useRef({});

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

  // Close reaction picker when clicking outside
  useEffect(() => {
    if (!showReactionPicker) return;

    function handleClickOutside(event) {
      if (!event.target.closest('[data-reaction-picker]')) {
        setShowReactionPicker(null);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showReactionPicker]);


  useEffect(() => {
    // Wait for router to be ready before accessing query params
    if (!router.isReady || !groupId) return;

    // Check user name
    const name = getUserName();
    setUserNameState(name);

    // Load group data
    loadGroupData(name);
  }, [router.isReady, groupId]);

  function loadGroupData(name) {
    if (!groupId) return;
    setLoading(true);
    setNotFound(false);

    fetch(`/api/groups/${groupId}`)
      .then(res => {
        if (res.status === 404) {
          setNotFound(true);
          setLoading(false);
          return null;
        }
        return res.json();
      })
      .then(data => {
        if (!data) return; // Handled by 404 above
        if (data.error) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        setGroup(data.group);
        setCourse(data.course);
        setMessages(data.messages || []);
        setLoading(false);

        // Check membership
        if (name) {
          setIsMember(data.group.members.includes(name));
        } else {
          setIsMember(false);
        }
      })
      .catch(err => {
        console.error('Failed to load group:', err);
        setNotFound(true);
        setLoading(false);
      });
  }

  useEffect(() => {
    if (!groupId || loading) return;

    // Start polling for messages
    const interval = setInterval(() => {
      fetch(`/api/chat/${groupId}`)
        .then(res => res.json())
        .then(data => {
          if (data.messages) {
            setMessages(data.messages);
          }
        })
        .catch(err => {
          console.error('Failed to poll messages:', err);
        });
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, [groupId, loading]);

  // Auto-scroll to bottom when messages change (only if not searching)
  useEffect(() => {
    if (messagesEndRef.current && !searchQuery) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, searchQuery]);

  // Find matches when search query changes
  const prevSearchQueryRef = useRef('');
  useEffect(() => {
    const query = searchQuery.trim();
    const queryChanged = prevSearchQueryRef.current !== query;
    prevSearchQueryRef.current = query;

    if (!query) {
      setMatchIndices([]);
      setCurrentMatchIndex(-1);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const matches = [];
    
    messages.forEach((msg) => {
      if (msg.text.toLowerCase().includes(lowerQuery)) {
        matches.push(msg.id); // Store message IDs instead of indices for more reliable matching
      }
    });

    setMatchIndices(matches);
    
    // Only reset to first match if the search query actually changed
    if (queryChanged) {
      if (matches.length > 0) {
        setCurrentMatchIndex(0);
        // Scroll to first match
        setTimeout(() => {
          if (messageRefs.current[matches[0]]) {
            messageRefs.current[matches[0]].scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      } else {
        setCurrentMatchIndex(-1);
      }
    } else {
      // If messages updated but query didn't change, preserve current match index if it's still valid
      setCurrentMatchIndex(prevIndex => {
        if (matches.length === 0) {
          return -1;
        } else if (prevIndex >= matches.length) {
          // If current match index is out of bounds, reset to last match
          return matches.length - 1;
        }
        // Otherwise keep the current match index
        return prevIndex;
      });
    }
  }, [searchQuery, messages]);

  async function handleAuthSubmit(name, password) {
    setAuthError('');
    try {
      // Authenticate user (creates if doesn't exist when trying to join)
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: name,
          password: password,
          createIfNotExists: pendingAction === 'join',
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
      if (pendingAction === 'join') {
        setTimeout(() => {
          handleJoinGroup(name);
        }, 100);
        setPendingAction(null);
      } else {
        loadGroupData(name);
      }
    } catch (err) {
      console.error('Auth error:', err);
      setAuthError('Failed to authenticate. Please try again.');
    }
  }

  function handleJoinGroup(nameArg) {
    const name = nameArg || getUserName();
    if (!name) {
      setShowAuthModal(true);
      setPendingAction('join');
      return;
    }

    if (!course || !group || !groupId) {
      setMessage({ type: 'error', text: 'Unable to join group. Please try again.' });
      return;
    }

    // Pre-check: group full or closed (friendly errors)
    if (group.size >= 5) {
      setMessage({ type: 'error', text: 'This group is full (5/5). Try another group or create one.' });
      return;
    }

    if (!group.isOpen) {
      setMessage({ type: 'error', text: 'This group is closed and not accepting new members.' });
      return;
    }

    // Ensure we have valid data before making the request
    const requestBody = {
      courseCode: course.code,
      userName: name,
    };

    console.log('Joining group:', { groupId, courseCode: course.code, userName: name });

    fetch(`/api/groups/${groupId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    })
      .then(res => {
        if (!res.ok) {
          if (res.status === 503) {
            return res.json().then(err => {
              setMessage({ type: 'error', text: err.message || 'Maintenance in progress—please try again soon' });
              throw new Error('Maintenance mode');
            });
          }
          return res.json().then(err => {
            throw new Error(err.error || 'Failed to join group');
          });
        }
        return res.json();
      })
      .then(data => {
        if (data.error) {
          if (data.error === 'ALREADY_IN_GROUP') {
            setMessage({ 
              type: 'error', 
              text: data.message || "You're already in a group for this course.",
              groupId: data.groupId,
            });
            loadGroupData(name); // Reload to refresh state
            return;
          } else if (data.error === 'GROUP_CLOSED') {
            setMessage({ type: 'error', text: 'This group is closed and not accepting new members.' });
          } else if (data.error === 'GROUP_FULL') {
            setMessage({ type: 'error', text: 'This group is full (5/5). Try another group or create one.' });
          } else {
            setMessage({ type: 'error', text: data.message || `Failed to join group: ${data.error}` });
          }
          loadGroupData(name); // Reload to refresh state
          return;
        }

        // Successfully joined - reload page to show full member access
        window.location.href = `/groups/${groupId}`;
      })
      .catch(err => {
        console.error('Failed to join group:', err);
        setMessage({ type: 'error', text: `Failed to join group: ${err.message || 'Please try again'}` });
      });
  }

  function handleChatSubmit(e) {
    e.preventDefault();
    const trimmedText = chatInput.trim();
    if (!trimmedText) return;

    const name = getUserName();
    if (!name) {
      setShowAuthModal(true);
      return;
    }

    if (!isMember) {
      setMessage({ type: 'error', text: 'Only group members can post messages.' });
      return;
    }

    fetch(`/api/chat/${groupId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        courseCode: course.code,
        userName: name,
        text: trimmedText,
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
            setMessage({ type: 'error', text: 'Failed to post message.' });
          }
          return;
        }

        setChatInput('');
        setMessages(data.messages || []);
      })
      .catch(err => {
        console.error('Failed to post message:', err);
        setMessage({ type: 'error', text: 'Failed to post message.' });
      });
  }

  function handleToggleStatus() {
    const name = getUserName();
    if (!name || !isMember || !course) return;

    fetch(`/api/groups/${groupId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        courseCode: course.code,
        userName: name,
        action: 'toggle',
      }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setMessage({ type: 'error', text: 'Failed to toggle group status.' });
          return;
        }

        setGroup(data.group);
      })
      .catch(err => {
        console.error('Failed to toggle status:', err);
        setMessage({ type: 'error', text: 'Failed to toggle group status.' });
      });
  }

  function handleLeaveGroup() {
    const name = getUserName();
    if (!name || !isMember || !course) {
      return;
    }

    if (!confirm('Are you sure you want to leave this group?')) {
      return;
    }

    fetch(`/api/groups/${groupId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        courseCode: course.code,
        userName: name,
        action: 'leave',
      }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setMessage({ type: 'error', text: 'Failed to leave group.' });
          return;
        }

        if (data.archived) {
          router.push(`/courses/${course.code}`);
        } else {
          setIsMember(false);
          loadGroupData(name);
        }
      })
      .catch(err => {
        console.error('Failed to leave group:', err);
        setMessage({ type: 'error', text: 'Failed to leave group.' });
      });
  }

  function handleReportMessage(messageId) {
    const name = getUserName();
    if (!name || !course || !group) return;

    fetch(`/api/messages/${messageId}/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        courseCode: course.code,
        groupId: groupId,
        userName: name,
      }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setMessage({ type: 'error', text: data.error === 'MESSAGE_DELETED' ? 'Message already deleted' : 'Failed to report message.' });
          return;
        }
        setMessage({ type: 'success', text: 'Message reported. Group owner will review.' });
        loadGroupData(name); // Reload to show reported status
      })
      .catch(err => {
        console.error('Failed to report message:', err);
        setMessage({ type: 'error', text: 'Failed to report message.' });
      });
  }

  function handleDeleteMessage(messageId) {
    const name = getUserName();
    if (!name || !course || !group || group.creatorName !== name) return;

    if (!confirm('Delete this reported message?')) return;

    fetch(`/api/messages/${messageId}/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        courseCode: course.code,
        groupId: groupId,
        userName: name,
      }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setMessage({ type: 'error', text: 'Failed to delete message.' });
          return;
        }
        setMessage({ type: 'success', text: 'Message deleted.' });
        loadGroupData(name); // Reload to remove deleted message
      })
      .catch(err => {
        console.error('Failed to delete message:', err);
        setMessage({ type: 'error', text: 'Failed to delete message.' });
      });
  }

  function handleToggleReaction(messageId, emoji) {
    const name = getUserName();
    if (!name) {
      setShowAuthModal(true);
      return;
    }

    fetch(`/api/messages/${messageId}/reaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userName: name,
        emoji: emoji,
      }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          console.error('Failed to toggle reaction:', data.error);
          return;
        }
        // Reload messages to update reactions
        loadGroupData(name);
      })
      .catch(err => {
        console.error('Failed to toggle reaction:', err);
      });
  }

  function handleAvatarClick(authorName) {
    // Don't show for own avatar
    if (authorName === userName) return;
    
    setProfileUserName(authorName);
    setShowProfileModal(true);
  }

  // Format day divider label (Today, Yesterday, or date)
  function formatDayLabel(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (messageDate.getTime() === today.getTime()) {
      return 'Today';
    } else if (messageDate.getTime() === yesterday.getTime()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  }
  
  // Check if two timestamps are on the same day
  function isSameDay(ts1, ts2) {
    const d1 = new Date(ts1);
    const d2 = new Date(ts2);
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  }
  
  // Check if message is part of a burst (same author, within 5 minutes)
  function isBurstMessage(msg, prevMsg, nextMsg) {
    if (!prevMsg) return false; // First message can't be part of a burst
    if (msg.author !== prevMsg.author) return false; // Different author
    
    const msgTime = new Date(msg.timestamp);
    const prevTime = new Date(prevMsg.timestamp);
    const diffMs = msgTime - prevTime;
    const diffMins = diffMs / 60000;
    
    return diffMins < 5; // Within 5 minutes
  }
  
  // Check if this is the last message in a burst
  function isLastInBurst(msg, nextMsg) {
    if (!nextMsg) return true; // Last message is always last in burst if it's part of one
    if (msg.author !== nextMsg.author) return true; // Different author means end of burst
    
    const msgTime = new Date(msg.timestamp);
    const nextTime = new Date(nextMsg.timestamp);
    const diffMs = nextTime - msgTime;
    const diffMins = diffMs / 60000;
    
    return diffMins >= 5; // More than 5 minutes gap
  }
  
  // Format compact time (hh:mm)
  function formatCompactTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  }

  // Highlight search matches in text
  function highlightText(text, query) {
    if (!query || !query.trim()) return text;
    
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => {
      if (part.toLowerCase() === query.toLowerCase()) {
        return (
          <mark key={index} className="bg-yellow-300 text-neutral-900 px-0.5 rounded">
            {part}
          </mark>
        );
      }
      return part;
    });
  }

  // Navigate to previous match
  function handlePrevMatch() {
    if (matchIndices.length === 0) return;
    const newIndex = currentMatchIndex > 0 ? currentMatchIndex - 1 : matchIndices.length - 1;
    setCurrentMatchIndex(newIndex);
    const messageId = matchIndices[newIndex];
    if (messageRefs.current[messageId]) {
      messageRefs.current[messageId].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  // Navigate to next match
  function handleNextMatch() {
    if (matchIndices.length === 0) return;
    const newIndex = currentMatchIndex < matchIndices.length - 1 ? currentMatchIndex + 1 : 0;
    setCurrentMatchIndex(newIndex);
    const messageId = matchIndices[newIndex];
    if (messageRefs.current[messageId]) {
      messageRefs.current[messageId].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  // Keyboard navigation for search (Enter = next, Shift+Enter = prev)
  useEffect(() => {
    if (!searchQuery || matchIndices.length === 0) return;

    function handleKeyDown(e) {
      // Only handle if search input is focused
      const activeElement = document.activeElement;
      if (activeElement?.id !== 'message-search-input') {
        return; // Only handle when search input is focused
      }
      
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const newIndex = currentMatchIndex < matchIndices.length - 1 ? currentMatchIndex + 1 : 0;
        setCurrentMatchIndex(newIndex);
        const messageId = matchIndices[newIndex];
        if (messageRefs.current[messageId]) {
          messageRefs.current[messageId].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } else if (e.key === 'Enter' && e.shiftKey) {
        e.preventDefault();
        const newIndex = currentMatchIndex > 0 ? currentMatchIndex - 1 : matchIndices.length - 1;
        setCurrentMatchIndex(newIndex);
        const messageId = matchIndices[newIndex];
        if (messageRefs.current[messageId]) {
          messageRefs.current[messageId].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchQuery, matchIndices, currentMatchIndex]);

  // Show 404 page if group not found
  if (notFound) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="max-w-screen-lg mx-auto pt-8 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="text-center py-16">
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 mb-4">
              Group Not Found
            </h1>
            <p className="text-sm text-neutral-600 mb-6">
              The group you're looking for doesn't exist or has been removed.
            </p>
            <Link
              href="/"
              className="btn-lift inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 active:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              ← Back to Courses
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Show loading if router isn't ready yet or if data is still loading
  if (!router.isReady || loading || !group || !course) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="max-w-screen-lg mx-auto pt-8 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="space-y-6">
            <div className="h-24 skeleton rounded-2xl" aria-label="Loading group data" />
            <div className="h-64 skeleton rounded-2xl" aria-label="Loading group details" />
            <div className="h-96 skeleton rounded-2xl" aria-label="Loading chat" />
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
            {group.name}
          </h1>
          <p className="text-sm text-neutral-600 mb-4">
            {course.code} - {course.title}
          </p>
          <Link 
            href={`/courses/${course.code}`} 
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded"
          >
            ← Back to Course
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
                {message.type === 'error' && message.groupId && (
                  <div className="mt-3">
                    <Link
                      href={`/groups/${message.groupId}`}
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

        <div className="card-hover bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 mb-2">
                Group Details
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-sm text-neutral-600">
                  Size: <span className="font-medium">{group.size}/5</span>
                </span>
                <span className={`chip-hover inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  group.isOpen
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {group.isOpen ? 'OPEN' : 'CLOSED'}
                </span>
              </div>
            </div>
            {isMember && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleToggleStatus}
                  disabled={isMaintenance}
                  className={`btn-lift px-3 py-1.5 text-sm font-medium bg-white border rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500 focus-visible:ring-offset-2 ${
                    isMaintenance
                      ? 'text-neutral-400 border-neutral-200 cursor-not-allowed'
                      : 'text-neutral-700 border-neutral-300 hover:bg-neutral-50 active:bg-neutral-100'
                  }`}
                  aria-label={group.isOpen ? 'Close group' : 'Open group'}
                  title={isMaintenance ? 'Maintenance in progress' : (group.isOpen ? 'Close group' : 'Open group')}
                >
                  {group.isOpen ? 'Close Group' : 'Open Group'}
                </button>
                <button
                  onClick={handleLeaveGroup}
                  disabled={isMaintenance}
                  className={`btn-lift px-3 py-1.5 text-sm font-medium bg-white border rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 ${
                    isMaintenance
                      ? 'text-red-300 border-red-200 cursor-not-allowed'
                      : 'text-red-700 border-red-300 hover:bg-red-50 active:bg-red-100'
                  }`}
                  aria-label="Leave group"
                  title={isMaintenance ? 'Maintenance in progress' : 'Leave group'}
                >
                  Leave Group
                </button>
              </div>
            )}
          </div>
          
          {/* Primary Join button for non-members */}
          {!isMember && (
            <div className="mb-6">
              {group.isOpen && group.size < 5 ? (
                <button
                  onClick={() => handleJoinGroup()}
                  disabled={isMaintenance}
                  className={`btn-lift w-full px-4 py-2 text-white font-medium rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                    isMaintenance
                      ? 'bg-neutral-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                  }`}
                  aria-label="Join this group"
                  title={isMaintenance ? 'Maintenance in progress' : 'Join this group'}
                >
                  Join Group
                </button>
              ) : (
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-sm">
                  {!group.isOpen && 'This group is closed and not accepting new members.'}
                  {group.size >= 5 && 'This group is full (5/5). Try another group or create one.'}
                </div>
              )}
            </div>
          )}

          <div>
            <h3 className="text-sm font-semibold text-neutral-900 mb-3">Members</h3>
            <ul className="space-y-2" role="list">
              {(() => {
                // Sort members: owner first, then others
                const owner = group.creatorName;
                const sortedMembers = [...group.members].sort((a, b) => {
                  if (a === owner) return -1;
                  if (b === owner) return 1;
                  return a.localeCompare(b);
                });
                
                return sortedMembers.map((member) => (
                  <li 
                    key={member} 
                    className="flex items-center justify-between py-2 px-3 rounded-lg bg-neutral-50"
                  >
                    <span className="text-sm text-neutral-900 flex items-center gap-2">
                      {formatNameForPublic(member)}
                      {member === owner && (
                        <span className="text-base" title="Group Owner" aria-label="Group owner">👑</span>
                      )}
                    </span>
                  </li>
                ));
              })()}
            </ul>
          </div>
        </div>

        <div className="card-hover bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold tracking-tight text-neutral-900">
              Chat
            </h2>
            {/* Native Share button */}
            {isNative && (
              <button
                onClick={async () => {
                  try {
                    let Share = null
                    try {
                      Share = require('@capacitor/share').Share
                    } catch (e) {
                      console.error('Share plugin not available')
                      return
                    }

                    const groupUrl = typeof window !== 'undefined' 
                      ? `${window.location.origin}/groups/${groupId}`
                      : `https://yourdomain.com/groups/${groupId}`;
                    await Share.share({
                      title: `${group.name} - ${course.code}`,
                      text: `Join my study group: ${group.name}`,
                      url: groupUrl,
                      dialogTitle: 'Share Group',
                    });
                  } catch (error) {
                    console.error('Error sharing:', error);
                  }
                }}
                className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                aria-label="Share group"
                title="Share group"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </button>
            )}
            {/* Search functionality */}
            <div className="flex items-center gap-2">
              <div className="relative flex items-center">
                <input
                  type="text"
                  id="message-search-input"
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-10 py-1.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-48"
                  aria-label="Search messages"
                />
                <svg 
                  className="absolute left-2 w-4 h-4 text-neutral-400" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 text-neutral-400 hover:text-neutral-600 focus:outline-none"
                    aria-label="Clear search"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              {searchQuery && matchIndices.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-600">
                    {currentMatchIndex + 1} / {matchIndices.length}
                  </span>
                  <button
                    onClick={handlePrevMatch}
                    className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Previous match"
                    title="Previous match"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={handleNextMatch}
                    className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Next match"
                    title="Next match"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
              {searchQuery && matchIndices.length === 0 && (
                <span className="text-xs text-neutral-500">No matches</span>
              )}
            </div>
          </div>

          {!isMember && (
            <div className="mb-4 p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-sm">
              You are viewing this group in read-only mode. Only members can post messages.
            </div>
          )}

          <div className={`max-h-[400px] overflow-y-auto border border-neutral-200 rounded-xl bg-neutral-50 mb-4 ${messages.length === 0 ? 'p-4' : 'px-4 pb-4 pt-0'}`}>
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-neutral-600">No messages yet. Be the first to say hello!</p>
              </div>
            ) : (
              (() => {
                // Group messages by day and add metadata
                const groupedMessages = [];
                let currentDay = null;
                
                messages.forEach((msg, index) => {
                  const msgDate = new Date(msg.timestamp);
                  const prevMsg = index > 0 ? messages[index - 1] : null;
                  const nextMsg = index < messages.length - 1 ? messages[index + 1] : null;
                  
                  // Check if we need a new day divider
                  if (!currentDay || !isSameDay(currentDay, msg.timestamp)) {
                    groupedMessages.push({
                      type: 'divider',
                      label: formatDayLabel(msg.timestamp),
                      timestamp: msg.timestamp
                    });
                    currentDay = msg.timestamp;
                  }
                  
                  // Determine if avatar should be shown (first message of burst or standalone)
                  const isInBurst = isBurstMessage(msg, prevMsg, nextMsg);
                  const showAvatar = !isInBurst || index === 0 || (prevMsg && (!isSameDay(prevMsg.timestamp, msg.timestamp) || prevMsg.author !== msg.author));
                  
                  // Add message with burst metadata
                  groupedMessages.push({
                    type: 'message',
                    data: msg,
                    isBurst: isInBurst,
                    isLastInBurst: isLastInBurst(msg, nextMsg),
                    showAvatar: showAvatar
                  });
                });
                
                const firstItemIsDivider = groupedMessages[0]?.type === 'divider';
                return (
                  <div className={firstItemIsDivider ? '[&>*:not(:first-child)]:mt-4' : 'space-y-4 pt-4'}>
                    {groupedMessages.map((item, idx) => {
                      if (item.type === 'divider') {
                        const isFirstDivider = idx === 0;
                        return (
                          <div
                            key={`divider-${item.timestamp}`}
                            className={`sticky top-0 z-10 flex items-center bg-neutral-50 -mx-4 px-4 ${isFirstDivider ? 'pb-2' : 'py-2'}`}
                            style={isFirstDivider ? { 
                              marginTop: '-8px',
                              paddingTop: '8px'
                            } : {}}
                          >
                            <div className="flex-1 border-t border-neutral-300"></div>
                            <span className="px-3 text-xs font-semibold text-neutral-600 uppercase tracking-wide">
                              {item.label}
                            </span>
                            <div className="flex-1 border-t border-neutral-300"></div>
                          </div>
                        );
                      }
                      
                      const msg = item.data;
                      const isOwnMessage = userName && msg.author === userName;
                      const initials = getUserInitials(msg.author);
                      const showAvatar = item.showAvatar;
                      const isCurrentMatch = searchQuery && matchIndices.length > 0 && currentMatchIndex >= 0 && matchIndices[currentMatchIndex] === msg.id;
                      
                      return (
                        <div
                          key={msg.id}
                          ref={(el) => {
                            if (el) messageRefs.current[msg.id] = el;
                          }}
                          className={`flex items-start gap-3 message-fade-in ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} ${isCurrentMatch ? 'ring-2 ring-yellow-400 ring-offset-2 rounded-lg -mx-1 px-1' : ''}`}
                        >
                          {/* Avatar - only show if not in burst */}
                          {showAvatar ? (
                            !isOwnMessage ? (
                              <button
                                onClick={() => handleAvatarClick(msg.author)}
                                className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold text-white hover:opacity-80 transition-opacity cursor-pointer bg-neutral-600"
                                aria-label={`View profile of ${formatNameForPublic(msg.author)}`}
                              >
                                {initials}
                              </button>
                            ) : (
                              <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold text-white bg-blue-600">
                                {initials}
                              </div>
                            )
                          ) : (
                            <div className="flex-shrink-0 w-10"></div>
                          )}
                          
                          {/* Message bubble */}
                          <div className={`flex-1 max-w-[75%] ${isOwnMessage ? 'flex flex-col items-end' : 'flex flex-col items-start'}`}>
                            <div className={`rounded-2xl px-4 py-2.5 ${
                              isOwnMessage 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-white border border-neutral-200 text-neutral-900'
                            }`}>
                              {!isOwnMessage && showAvatar && (
                                <div className="text-xs font-semibold mb-1 text-blue-600">
                                  {formatNameForPublic(msg.author)}
                                </div>
                              )}
                              <div className={`text-sm ${isOwnMessage ? 'text-white' : 'text-neutral-900'}`}>
                                {searchQuery ? highlightText(msg.text, searchQuery) : msg.text}
                              </div>
                            </div>
                            
                            {/* Reactions - smaller chips */}
                            {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                              <div className={`flex flex-wrap items-center gap-1 mt-2 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                                {Object.entries(msg.reactions).map(([emoji, users]) => {
                                  const hasReacted = userName && users.includes(userName);
                                  return (
                                    <button
                                      key={emoji}
                                      onClick={() => handleToggleReaction(msg.id, emoji)}
                                      className={`chip-hover inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                                        hasReacted
                                          ? 'bg-blue-100 text-blue-700 border border-blue-300'
                                          : 'bg-neutral-100 text-neutral-700 border border-neutral-200 hover:bg-neutral-200'
                                      } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1`}
                                      title={`${users.length} reaction${users.length > 1 ? 's' : ''}${hasReacted ? ' (you)' : ''}`}
                                      aria-label={`${emoji} ${users.length} reaction${users.length > 1 ? 's' : ''}`}
                                    >
                                      <span className="text-xs">{emoji}</span>
                                      <span>{users.length}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                            
                            {/* Reaction icon + picker - only show on last message in burst */}
                            {item.isLastInBurst && userName && (
                              <div className={`relative ${isOwnMessage ? 'flex justify-end' : 'flex justify-start'}`} data-reaction-picker>
                                <button
                                  onClick={() => setShowReactionPicker(showReactionPicker === msg.id ? null : msg.id)}
                                  className="p-1 rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
                                  title="Add reaction"
                                  aria-label="Add reaction"
                                  data-reaction-picker
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </button>
                                
                                {/* Reaction picker */}
                                {showReactionPicker === msg.id && (
                                  <div className={`absolute bottom-full mb-2 ${isOwnMessage ? 'right-0' : 'left-0'} bg-white border border-neutral-200 rounded-lg shadow-lg p-1.5 flex items-center gap-1 z-20`} data-reaction-picker>
                                    {['👍', '❤️', '💡'].map(emoji => {
                                      const hasReacted = msg.reactions && msg.reactions[emoji] && msg.reactions[emoji].includes(userName);
                                      return (
                                        <button
                                          key={emoji}
                                          onClick={() => {
                                            handleToggleReaction(msg.id, emoji);
                                            setShowReactionPicker(null);
                                          }}
                                          className={`chip-hover p-2 rounded-full text-base ${
                                            hasReacted
                                              ? 'bg-blue-100 text-blue-600'
                                              : 'hover:bg-neutral-100'
                                          } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1`}
                                          title={`React with ${emoji}`}
                                          aria-label={`React with ${emoji}`}
                                          data-reaction-picker
                                        >
                                          {emoji}
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {/* Timestamp and actions - only show on last message in burst */}
                            {item.isLastInBurst && (
                              <div className={`flex items-center gap-2 mt-1 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                                <span className="text-xs text-neutral-500">
                                  {formatCompactTime(msg.timestamp)}
                                </span>
                                
                                {userName && !isOwnMessage && (
                                  <button
                                    onClick={() => handleReportMessage(msg.id)}
                                    className="p-1 text-neutral-400 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-1 rounded transition-colors"
                                    title="Report message"
                                    aria-label="Report message"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                  </button>
                                )}
                                
                                {group.creatorName === userName && msg.reported && (
                                  <button
                                    onClick={() => handleDeleteMessage(msg.id)}
                                    className="text-xs text-red-600 hover:text-red-800 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-1 rounded"
                                    title="Delete reported message"
                                    aria-label="Delete reported message"
                                  >
                                    🗑️ Delete
                                  </button>
                                )}
                              </div>
                            )}
                            
                            {msg.reported && (
                              <div className={`text-xs text-orange-600 mt-1 italic ${isOwnMessage ? 'text-right' : 'text-left'}`}>
                                ⚠️ Reported
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                );
              })()
            )}
          </div>

          <AuthModal
            isOpen={showAuthModal}
            onClose={() => {
              setShowAuthModal(false);
              setIsSignUp(false);
              setPendingAction(null);
              setAuthError('');
            }}
            onSubmit={handleAuthSubmit}
            title={pendingAction === 'join' ? 'Create account to join' : 'Sign In'}
            description={pendingAction === 'join' 
              ? 'Enter your name and password to create an account and join this group'
              : 'Enter your name and password to sign in'}
            error={authError}
            isSignUp={pendingAction === 'join'}
          />

          {showProfileModal && profileUserName && (
            <ProfileModal
              userName={profileUserName}
              onClose={() => {
                setShowProfileModal(false);
                setProfileUserName(null);
              }}
            />
          )}

          {isMember && (
            <form onSubmit={handleChatSubmit} className="flex gap-2">
              <input
                type="text"
                className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="Type a message..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                maxLength={500}
                aria-label="Chat message input"
              />
              <button
                type="submit"
                className="btn-lift px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 active:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                aria-label="Send message"
              >
                Send
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
