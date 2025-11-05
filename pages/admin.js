import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { getUserName } from '../lib/cookies';
import { formatNameForPublic } from '../lib/nameFormat';

export default function AdminPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [checkingAuth, setCheckingAuth] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [reportedMessages, setReportedMessages] = useState([]);
  const [loadingReported, setLoadingReported] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState({});
  const [groupMessages, setGroupMessages] = useState({});

  useEffect(() => {
    // Check if already authenticated as admin
    const adminAuth = getAdminAuth();
    if (adminAuth) {
      setIsAuthenticated(true);
      setLoading(false);
      loadDashboard();
      loadReportedMessages();
      loadAuditLogs();
      // Poll audit logs every 5 seconds
      const interval = setInterval(loadAuditLogs, 5000);
      return () => clearInterval(interval);
    } else {
      setLoading(false);
    }
  }, []);

  // Poll messages for expanded groups every 3 seconds
  useEffect(() => {
    if (!isAuthenticated || Object.keys(expandedGroups).length === 0) return;
    
    const expandedGroupIds = Object.keys(expandedGroups).filter(id => expandedGroups[id]);
    const interval = setInterval(() => {
      expandedGroupIds.forEach(groupId => {
        loadGroupMessages(groupId);
      });
    }, 3000);
    
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expandedGroups, isAuthenticated]);

  function loadDashboard() {
    setLoadingDashboard(true);
    fetch('/api/admin/dashboard')
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError('Failed to load dashboard data.');
        } else {
          setDashboardData(data);
        }
        setLoadingDashboard(false);
      })
      .catch(err => {
        console.error('Failed to load dashboard:', err);
        setError('Failed to load dashboard data.');
        setLoadingDashboard(false);
      });
  }

  function loadReportedMessages() {
    setLoadingReported(true);
    fetch('/api/admin/reported-messages')
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError('Failed to load reported messages.');
        } else {
          setReportedMessages(data.messages || []);
        }
        setLoadingReported(false);
      })
      .catch(err => {
        console.error('Failed to load reported messages:', err);
        setError('Failed to load reported messages.');
        setLoadingReported(false);
      });
  }

  function loadAuditLogs() {
    setLoadingAudit(true);
    fetch('/api/admin/audit-logs')
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          console.error('Failed to load audit logs:', data.error);
        } else {
          setAuditLogs(data.logs || []);
        }
        setLoadingAudit(false);
      })
      .catch(err => {
        console.error('Failed to load audit logs:', err);
        setLoadingAudit(false);
      });
  }

  function getAdminAuth() {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('admin_authenticated') === 'true';
  }

  function setAdminAuth(value) {
    if (typeof window === 'undefined') return;
    localStorage.setItem('admin_authenticated', value ? 'true' : 'false');
  }

  function handleLogin(e) {
    e.preventDefault();
    setError('');
    setCheckingAuth(true);

    // Simple credential check (admin / 123)
    if (username === 'admin' && password === '123') {
      setAdminAuth(true);
      setIsAuthenticated(true);
      setError('');
      setCheckingAuth(false);
      loadDashboard();
      loadReportedMessages();
      loadAuditLogs();
    } else {
      setError('Invalid credentials. Access denied.');
      setCheckingAuth(false);
    }
  }

  function handleLogout() {
    setAdminAuth(false);
    setIsAuthenticated(false);
    setUsername('');
    setPassword('');
    setDashboardData(null);
  }

  function formatDate(timestamp) {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    return date.toLocaleString();
  }

  function toggleGroupExpand(groupId) {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
    
    // Load messages if expanding and not already loaded
    if (!expandedGroups[groupId] && !groupMessages[groupId]) {
      loadGroupMessages(groupId);
    }
  }

  function loadGroupMessages(groupId) {
    // Find the group to get course code
    const group = dashboardData?.groups.find(g => g.id === groupId);
    if (!group) return;

    fetch(`/api/chat/${groupId}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          console.error('Failed to load messages:', data.error);
        } else {
          setGroupMessages(prev => ({
            ...prev,
            [groupId]: data.messages || []
          }));
        }
      })
      .catch(err => {
        console.error('Failed to load group messages:', err);
      });
  }

  function handleDeleteMessage(messageId) {
    if (!confirm('Delete this message? It will be hidden from chat.')) return;

    fetch(`/api/messages/${messageId}/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // Admin can delete any message
        courseCode: '',
        groupId: '',
        userName: 'admin',
      }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError('Failed to delete message.');
        } else {
          loadReportedMessages(); // Reload the list
        }
      })
      .catch(err => {
        console.error('Failed to delete message:', err);
        setError('Failed to delete message.');
      });
  }

  function handleResolveMessage(messageId) {
    fetch(`/api/admin/messages/${messageId}/resolve`, {
      method: 'POST',
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError('Failed to resolve message.');
        } else {
          loadReportedMessages(); // Reload the list
        }
      })
      .catch(err => {
        console.error('Failed to resolve message:', err);
        setError('Failed to resolve message.');
      });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="max-w-screen-lg mx-auto pt-8 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="space-y-3">
            <div className="h-24 skeleton rounded-2xl" aria-label="Loading admin panel" />
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="max-w-screen-lg mx-auto pt-8 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 mb-2">
              Admin Panel
            </h1>
            <p className="text-sm text-neutral-600">
              Administrative access required
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 max-w-md mx-auto">
            <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 mb-6">
              Admin Login
            </h2>
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm" role="alert">
                {error}
              </div>
            )}
            <form onSubmit={handleLogin}>
              <div className="mb-4">
                <label htmlFor="username" className="block text-sm font-medium text-neutral-900 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter admin username"
                  disabled={checkingAuth}
                  autoFocus
                  aria-required="true"
                />
              </div>
              <div className="mb-6">
                <label htmlFor="password" className="block text-sm font-medium text-neutral-900 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  disabled={checkingAuth}
                  aria-required="true"
                />
              </div>
              <button
                type="submit"
                className="btn-lift w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 active:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={checkingAuth}
              >
                {checkingAuth ? 'Authenticating...' : 'Login'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-screen-lg mx-auto pt-8 pb-16 px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 mb-2">
              Admin Control Center
            </h1>
            <p className="text-sm text-neutral-600">
              Administrative dashboard and management panel
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="btn-lift px-4 py-2 text-red-700 bg-white border border-red-300 font-medium rounded-lg hover:bg-red-50 active:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
          >
            Logout
          </button>
        </div>

        {loadingDashboard ? (
          <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 skeleton rounded-xl" aria-label="Loading dashboard data" />
              ))}
            </div>
          </div>
        ) : dashboardData ? (
          <>
            {/* Analytics Cards */}
            <div className="card-hover bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
              <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 mb-6">
                Analytics
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-neutral-50 rounded-xl">
                  <div className="text-2xl font-bold text-blue-600 mb-1">{dashboardData.stats.totalUsers}</div>
                  <div className="text-sm text-neutral-600">Total Users</div>
                </div>
                <div className="p-4 bg-neutral-50 rounded-xl">
                  <div className="text-2xl font-bold text-green-600 mb-1">{dashboardData.stats.totalGroups}</div>
                  <div className="text-sm text-neutral-600">Total Groups</div>
                </div>
                <div className="p-4 bg-neutral-50 rounded-xl">
                  <div className="text-2xl font-bold text-red-600 mb-1">{dashboardData.stats.avgGroupSize}</div>
                  <div className="text-sm text-neutral-600">Avg Group Size</div>
                </div>
                <div className="p-4 bg-neutral-50 rounded-xl">
                  <div className="text-2xl font-bold text-purple-600 mb-1">{dashboardData.stats.messagesPerDay}</div>
                  <div className="text-sm text-neutral-600">Messages/Day (7d)</div>
                </div>
              </div>
            </div>

            {/* Courses List */}
            <div className="card-hover bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
              <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 mb-6">
                Courses ({dashboardData.courses.length})
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b-2 border-neutral-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-900">Code</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-900">Title</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.courses.map(course => (
                      <tr key={course.code} className="border-b border-neutral-100 hover:bg-neutral-50">
                        <td className="py-3 px-4 font-medium text-neutral-900">{course.code}</td>
                        <td className="py-3 px-4 text-neutral-700">{course.title}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Groups List */}
            <div className="card-hover bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
              <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 mb-6">
                Groups ({dashboardData.groups.length})
              </h2>
              {dashboardData.groups.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-sm text-neutral-600">No groups found.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="border-b-2 border-neutral-200">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-900"></th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-900">Group Name</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-900">Course</th>
                        <th className="text-center py-3 px-4 text-sm font-semibold text-neutral-900">Members</th>
                        <th className="text-center py-3 px-4 text-sm font-semibold text-neutral-900">Messages</th>
                        <th className="text-center py-3 px-4 text-sm font-semibold text-neutral-900">Status</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-900">Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardData.groups.map(group => (
                        <>
                        <tr key={group.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => toggleGroupExpand(group.id)}
                              className="btn-lift w-8 h-8 flex items-center justify-center text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg"
                              aria-label={expandedGroups[group.id] ? 'Collapse messages' : 'Expand messages'}
                            >
                              <svg
                                className={`w-5 h-5 transition-transform ${expandedGroups[group.id] ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          </td>
                          <td className="py-3 px-4 font-medium text-neutral-900">{group.name}</td>
                          <td className="py-3 px-4 text-neutral-700">{group.courseCode}</td>
                          <td className="py-3 px-4 text-center text-neutral-700">{group.memberCount}/{group.maxSize}</td>
                          <td className="py-3 px-4 text-center text-neutral-700">{group.messageCount}</td>
                          <td className="py-3 px-4 text-center">
                            <span className={`chip-hover inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              group.isOpen
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {group.isOpen ? 'OPEN' : 'CLOSED'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-xs text-neutral-600">{formatDate(group.createdAt)}</td>
                        </tr>
                        {expandedGroups[group.id] && (
                          <tr key={`${group.id}-expanded`} className="border-b border-neutral-100 bg-neutral-50">
                            <td colSpan="7" className="py-4 px-4">
                              <div className="bg-white rounded-xl border border-neutral-200 p-4">
                                <h3 className="text-sm font-semibold text-neutral-900 mb-3">Recent Messages</h3>
                                {!groupMessages[group.id] ? (
                                  <div className="text-center py-8">
                                    <div className="inline-block w-8 h-8 border-4 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
                                  </div>
                                ) : groupMessages[group.id].length === 0 ? (
                                  <p className="text-sm text-neutral-600 text-center py-8">No messages yet in this group.</p>
                                ) : (
                                  <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {groupMessages[group.id].slice(0, 10).map(msg => (
                                      <div key={msg.id} className="p-3 rounded-lg bg-neutral-50 border border-neutral-200">
                                        <div className="flex items-start justify-between mb-1">
                                          <span className="text-xs font-semibold text-neutral-900">
                                            {formatNameForPublic(msg.author)}
                                          </span>
                                          <span className="text-xs text-neutral-500">
                                            {formatDate(msg.timestamp)}
                                          </span>
                                        </div>
                                        <p className="text-sm text-neutral-900 break-words">{msg.text}</p>
                                      </div>
                                    ))}
                                    {groupMessages[group.id].length > 10 && (
                                      <p className="text-xs text-neutral-600 text-center py-2">
                                        Showing 10 most recent messages (of {groupMessages[group.id].length} total)
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                        </>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Reported Messages */}
            <div className="card-hover bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold tracking-tight text-neutral-900">
                  Reported Messages (Last 7 Days)
                </h2>
                <button
                  onClick={loadReportedMessages}
                  className="btn-lift px-3 py-1.5 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 active:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500 focus-visible:ring-offset-2"
                  disabled={loadingReported}
                >
                  {loadingReported ? 'Loading...' : 'Refresh'}
                </button>
              </div>
              {loadingReported ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-20 skeleton rounded-xl" aria-label="Loading reported messages" />
                  ))}
                </div>
              ) : reportedMessages.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-sm text-neutral-600">No reported messages in the last 7 days.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reportedMessages.map((msg) => (
                    <div key={msg.id} className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-semibold text-neutral-900">{msg.author}</span>
                            <span className="text-xs text-neutral-500">•</span>
                            <span className="text-xs text-neutral-600">{msg.courseCode} - {msg.courseTitle}</span>
                            <span className="text-xs text-neutral-500">•</span>
                            <span className="text-xs text-neutral-600">{msg.groupName}</span>
                          </div>
                          <div className="text-sm text-neutral-900 mb-2 bg-white p-3 rounded-lg border border-neutral-200">
                            {msg.text}
                          </div>
                          <div className="text-xs text-neutral-500">
                            {formatDate(msg.timestamp)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={() => handleResolveMessage(msg.id)}
                            className="btn-lift px-3 py-1.5 text-sm font-medium text-green-700 bg-white border border-green-300 rounded-lg hover:bg-green-50 active:bg-green-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
                            title="Mark as resolved - message stays but report flag removed"
                          >
                            Mark Resolved
                          </button>
                          <button
                            onClick={() => handleDeleteMessage(msg.id)}
                            className="btn-lift px-3 py-1.5 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-lg hover:bg-red-50 active:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                            title="Delete message - hides from chat"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Activity Log */}
            <div className="card-hover bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold tracking-tight text-neutral-900">
                  Activity Log
                </h2>
                <button
                  onClick={loadAuditLogs}
                  className="btn-lift px-3 py-1.5 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 active:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500 focus-visible:ring-offset-2"
                  disabled={loadingAudit}
                >
                  {loadingAudit ? 'Loading...' : 'Refresh'}
                </button>
              </div>
              {loadingAudit && auditLogs.length === 0 ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 skeleton rounded-lg" />
                  ))}
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-sm text-neutral-600">No activity recorded yet.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {auditLogs.map(log => (
                    <div
                      key={log.id}
                      className="p-3 rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-neutral-500">
                              {new Date(log.timestamp).toLocaleString()}
                            </span>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                              {log.actor}
                            </span>
                            <span className="text-xs font-medium text-neutral-700">
                              {log.action.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <div className="text-xs text-neutral-600 break-words mt-1">
                            {log.detail && (
                              <p className="mb-0.5">{log.detail}</p>
                            )}
                            {log.entityId && (
                              <p className="text-xs text-neutral-500 italic">
                                Entity ID: {log.entityId.slice(0, 8)}...
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
            <p className="text-sm text-neutral-600">No data available.</p>
          </div>
        )}
      </div>
    </div>
  );
}

