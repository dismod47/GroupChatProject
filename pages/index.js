import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();
  const [courses, setCourses] = useState([]);
  const [recentGroups, setRecentGroups] = useState([]);
  const [popularCourses, setPopularCourses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [courseNotFound, setCourseNotFound] = useState(false);
  const [requestedCourseCode, setRequestedCourseCode] = useState(null);

  useEffect(() => {
    if (!router.isReady) return;

    // Load homepage data
    fetch('/api/homepage')
      .then(res => res.json())
      .then(data => {
        setCourses(data.courses || []);
        setRecentGroups(data.recentGroups || []);
        setPopularCourses(data.popularCourses || []);
        setLoading(false);

        // Check for ?course=CODE in URL
        const courseCode = router.query.course;
        if (courseCode) {
          setRequestedCourseCode(courseCode);
          const courseExists = (data.courses || []).some(c => c.code === courseCode);
          if (courseExists) {
            router.push(`/courses/${courseCode}`);
          } else {
            setCourseNotFound(true);
          }
        }
      })
      .catch(err => {
        console.error('Failed to load homepage data:', err);
        setLoading(false);
      });
  }, [router.isReady, router.query]);

  const filteredCourses = courses.filter(course =>
    course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCourseClick = (courseCode) => {
    router.push(`/courses/${courseCode}`);
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-screen-lg mx-auto pt-8 pb-16 px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Hero Section */}
        <div className="text-center py-12">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-neutral-900 mb-4">
            University of You
          </h1>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-6" style={{ color: '#C8102E' }}>
            Study Groups
          </h2>
          <p className="text-lg text-neutral-600 mb-8 max-w-2xl mx-auto">
            Connect with classmates, form study groups, and ace your courses together.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => document.getElementById('course-finder')?.scrollIntoView({ behavior: 'smooth' })}
              className="btn-lift px-6 py-3 bg-[#C8102E] text-white font-semibold rounded-2xl hover:bg-[#A00D26] active:bg-[#8B0B20] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8102E] focus-visible:ring-offset-2"
              aria-label="Browse courses"
            >
              Browse Courses
            </button>
            <Link
              href="/my-groups"
              className="btn-lift px-6 py-3 bg-white border-2 border-[#C8102E] text-[#C8102E] font-semibold rounded-2xl hover:bg-red-50 active:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8102E] focus-visible:ring-offset-2"
              aria-label="View my groups"
            >
              My Groups
            </Link>
          </div>
        </div>

        {courseNotFound && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800">
            <strong className="font-semibold">Course not found:</strong> "{requestedCourseCode}" does not exist. Please search for a course below.
          </div>
        )}

        {/* Quick Course Finder */}
        <div id="course-finder" className="card-hover bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
          <h2 className="text-xl font-semibold tracking-tight text-neutral-900 mb-4">
            Quick Course Finder
          </h2>
          <div className="relative mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by course code or title..."
              className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent"
              aria-label="Search courses"
            />
          </div>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 skeleton rounded-xl" aria-label="Loading course" />
              ))}
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-neutral-600">
                {searchQuery ? `No courses found matching "${searchQuery}"` : 'No courses available.'}
              </p>
            </div>
          ) : (
            <ul className="space-y-2" role="list">
              {filteredCourses.map((course) => (
                <li key={course.code}>
                  <button
                    onClick={() => handleCourseClick(course.code)}
                    className="btn-lift w-full text-left p-3 rounded-xl bg-neutral-50 border border-neutral-200 hover:bg-neutral-100 hover:border-neutral-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8102E] focus-visible:ring-offset-2"
                    aria-label={`View ${course.code} - ${course.title}`}
                  >
                    <span className="font-semibold" style={{ color: '#C8102E' }}>{course.code}</span>
                    <span className="text-neutral-900 ml-2">{course.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Popular This Week */}
        {popularCourses.length > 0 && (
          <div className="card-hover bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
            <h2 className="text-xl font-semibold tracking-tight text-neutral-900 mb-4">
              Popular This Week
            </h2>
            <div className="flex flex-wrap gap-2">
              {popularCourses.map((course) => (
                <button
                  key={course.code}
                  onClick={() => handleCourseClick(course.code)}
                  className="chip-hover px-4 py-2 bg-red-50 border border-red-200 rounded-full text-sm font-medium hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8102E] focus-visible:ring-offset-2"
                  style={{ color: '#C8102E' }}
                  aria-label={`View ${course.code} course`}
                >
                  {course.code} ({course.groupCount} {course.groupCount === 1 ? 'group' : 'groups'})
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Active Right Now */}
        <div className="card-hover bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
          <h2 className="text-xl font-semibold tracking-tight text-neutral-900 mb-4">
            Active Right Now
          </h2>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 skeleton rounded-xl" aria-label="Loading group" />
              ))}
            </div>
          ) : recentGroups.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-neutral-600 mb-2">No groups active in the last 24 hours.</p>
              <p className="text-xs text-neutral-500">Be the first to create one!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {recentGroups.map((group) => (
                <Link
                  key={group.id}
                  href={`/groups/${group.id}`}
                  className="card-hover p-4 rounded-xl bg-neutral-50 border border-neutral-200 hover:bg-neutral-100 hover:border-neutral-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8102E] focus-visible:ring-offset-2"
                  aria-label={`View ${group.name} group`}
                >
                  <div className="font-semibold text-neutral-900 text-sm mb-1 truncate">{group.name}</div>
                  <div className="text-xs text-neutral-600 mb-2">{group.courseCode}</div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-neutral-500">
                      {group.memberCount}/{group.maxSize} members
                    </span>
                    <span className={`chip-hover inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                      group.isOpen
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {group.isOpen ? 'OPEN' : 'CLOSED'}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
