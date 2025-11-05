import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getUserName } from '../lib/cookies';
import { formatNameForPublic } from '../lib/nameFormat';

export default function MyGroupsPage() {
  const router = useRouter();
  const [userName, setUserName] = useState(null);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const name = getUserName();
    if (!name) {
      router.push('/');
      return;
    }

    setUserName(name);
    loadUserGroups(name);
  }, []);

  function loadUserGroups(name) {
    setLoading(true);
    fetch(`/api/user/groups?userName=${encodeURIComponent(name)}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          console.error('Failed to load groups:', data.error);
          setGroups([]);
        } else {
          setGroups(data.groups || []);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load groups:', err);
        setGroups([]);
        setLoading(false);
      });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="max-w-screen-lg mx-auto pt-8 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 skeleton rounded-2xl" aria-label="Loading groups" />
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
            My Groups
          </h1>
          <p className="text-sm text-neutral-600 mb-4">
            Groups you're a member of
          </p>
          <Link 
            href="/" 
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded"
          >
            ← Back to Courses
          </Link>
        </div>

        {groups.length === 0 ? (
          <div className="card-hover bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
            <div className="text-center py-12">
              <p className="text-sm text-neutral-600 mb-4">You're not a member of any groups yet.</p>
              <Link
                href="/"
                className="btn-lift inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 active:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                Browse Courses
              </Link>
            </div>
          </div>
        ) : (
          <div className="card-hover bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
            <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 mb-6">
              Your Groups ({groups.length})
            </h2>
            <ul className="space-y-3" role="list">
              {groups.map((group) => (
                <li 
                  key={group.groupId} 
                  className="p-4 rounded-xl bg-neutral-50 border border-neutral-200"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-neutral-900">{group.groupName}</span>
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
                  <div className="text-sm text-neutral-600 mb-3">
                    {group.courseCode} - {group.courseTitle}
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/groups/${group.groupId}`}
                      className="btn-lift px-3 py-1.5 text-sm font-medium text-blue-600 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 active:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    >
                      View Group
                    </Link>
                    <Link
                      href={`/courses/${group.courseCode}`}
                      className="btn-lift px-3 py-1.5 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 active:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500 focus-visible:ring-offset-2"
                    >
                      View Course
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
