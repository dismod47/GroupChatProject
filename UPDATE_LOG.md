# Update Log

This file tracks all updates, features, and changes made to the Campus Study Groups application.

---

## 2024 - Initial Setup & Features

### Database Migration to Prisma + SQLite
- **Date**: Initial setup
- **Changes**:
  - Replaced in-memory data store with Prisma ORM + SQLite database
  - Created Prisma schema with models: Course, Group, GroupMember, Message, RosterEntry, User
  - Added database migrations and seed script
  - All API routes updated to use async/await for database operations
- **Files Modified**: 
  - `lib/data.js` - Complete rewrite using Prisma queries
  - `prisma/schema.prisma` - Database schema definition
  - `prisma/seed.js` - Initial data seeding
  - All API route files in `pages/api/` - Converted to async functions

### User Authentication System
- **Date**: Added after initial setup
- **Changes**:
  - Added password-based authentication for users
  - Created User model in Prisma schema with password hashing (bcrypt)
  - Added authentication API endpoint (`/api/auth/login`)
  - Implements login or account creation if user doesn't exist
- **Functions Added**:
  - `authenticateUser()` in `lib/data.js` - Handles login and user creation with password verification
- **Files Created**:
  - `pages/api/auth/login.js` - Authentication API endpoint
- **Dependencies Added**: `bcryptjs` for password hashing

### Authentication Modal Component
- **Date**: Added for better UX
- **Changes**:
  - Created reusable modal component for sign-in/account creation
  - Modal appears as overlay popup instead of inline forms
  - Requests both Name and Password fields
  - Shows error messages inline
- **Files Created**:
  - `components/AuthModal.js` - Modal component for authentication
- **Files Modified**:
  - `pages/groups/[groupId].js` - Replaced inline form with modal
  - `pages/courses/[courseCode].js` - Replaced inline form with modal
  - `styles/globals.css` - Added modal styling classes

### User Indicator Component with Sign In/Out
- **Date**: Added for profile management
- **Changes**:
  - Created interactive user indicator in top-right corner
  - Shows current sign-in status (name or "Not signed in")
  - Clickable dropdown menu for user actions
  - Added sign-in functionality from dropdown
  - Added sign-out functionality
  - Auto-updates every 500ms to reflect authentication changes
- **Files Created**:
  - `components/UserIndicator.js` - User status indicator component
- **Files Modified**:
  - `pages/_app.js` - Added UserIndicator to app layout
  - `styles/globals.css` - Added user indicator and dropdown styling

### My Groups Feature
- **Date**: Added for user convenience
- **Changes**:
  - Added "My Groups" option to user dropdown menu
  - Created dedicated page to view all groups user is a member of
  - Shows group details including course info, status, and size
  - Quick links to view group or course pages
- **Functions Added**:
  - `getUserGroups()` in `lib/data.js` - Retrieves all groups for a user across all courses
- **Files Created**:
  - `pages/my-groups.js` - My Groups page component
  - `pages/api/user/groups.js` - API endpoint for fetching user's groups
- **Files Modified**:
  - `components/UserIndicator.js` - Added "My Groups" menu item

### CS101 Seeded Groups
- **Date**: Initial data setup
- **Changes**:
  - Hard-coded 4 study groups for CS101 course
  - Each group has one creator member
  - Groups: Algorithm Masters (Alice Chen), Data Structures Team (Bob Smith), Code Review Squad (Charlie Brown), Study Buddies (Diana Prince)
- **Implementation**: Seeded in `prisma/seed.js` and automatically created on database initialization

### Database-Level One Group Per Course Enforcement
- **Date**: Transactional enforcement added
- **Changes**:
  - Wrapped `joinGroup()` and `createGroup()` in Prisma transactions for atomicity
  - Enforced "one group per course per user" constraint at database level within transactions
  - All checks and operations happen within single transaction to prevent race conditions
  - Member count checks also performed within transaction using `count()` query
  - Roster updates included in transaction
- **Functions Modified**:
  - `joinGroup()` in `lib/data.js` - Now uses `prisma.$transaction()` wrapper
  - `createGroup()` in `lib/data.js` - Now uses `prisma.$transaction()` wrapper
- **Error Messages**:
  - Consistent friendly error message: "You're already in a group for this course."
  - Error responses include `message` field for UI display
- **Files Modified**:
  - `lib/data.js` - Transactional enforcement in join/create operations
  - `pages/groups/[groupId].js` - Updated to use `data.message` from API responses
  - `pages/courses/[courseCode].js` - Updated to use `data.message` from API responses

### Invite Links Feature
- **Date**: Public group viewing and join flow
- **Changes**:
  - `/groups/:id` is now publicly viewable in read-only mode (no authentication required)
  - Shows group name, course, members, size, and OPEN/CLOSED status for everyone
  - Chat composer and member controls hidden for non-members
  - Added prominent "Join Group" button for non-members
  - Join flow preserves intent: if user not signed in, shows auth modal, then resumes join after authentication
  - Friendly error messages for edge cases:
    - Group full (5/5) → "This group is full (5/5). Try another group or create one."
    - Group closed → "This group is closed and not accepting new members."
    - Already in group → Shows error with "Go to your group" button linking to their current group
  - 404 page for groups that don't exist
  - After successful join, page reloads to show full member/chat access
- **Files Modified**:
  - `pages/groups/[groupId].js` - Added 404 handling, improved join flow, moved Join button to prominent position, hidden member controls for non-members

### Name Formatting & Owner Badge
- **Date**: Privacy and owner identification
- **Changes**:
  - Added `creatorName` field to Group model in database schema
  - Created name formatting utility (`lib/nameFormat.js`) to display names as "First L." format publicly
  - Full names stored privately, only "First L." format displayed on public pages
  - Added owner badge (👑) for group creator/owner
  - Owner always shown first in member lists, sorted alphabetically after owner
  - Applied name formatting to: member lists, chat messages, course roster
- **Files Created**:
  - `lib/nameFormat.js` - Name formatting utility functions
- **Files Modified**:
  - `prisma/schema.prisma` - Added `creatorName` field to Group model
  - `lib/data.js` - Store and retrieve creatorName in all group operations
  - `pages/groups/[groupId].js` - Format names, show owner badge, sort members (owner first)
  - `pages/courses/[courseCode].js` - Format names in roster display
  - `pages/api/groups/[groupId].js` - Include creatorName in API response
  - `prisma/seed.js` - Include creatorName when seeding groups
  - `styles/globals.css` - Added owner-badge styling

### Auto-Delete Empty Groups
- **Date**: Cleanup and tidiness
- **Changes**:
  - Updated `leaveGroup()` to use transaction for atomicity
  - When last member leaves, group is automatically deleted
  - Messages cascade delete automatically (via Prisma schema onDelete: Cascade)
  - Returns `archived: true` when group is deleted
  - Frontend redirects to course page when group is archived
- **Files Modified**:
  - `lib/data.js` - Wrapped `leaveGroup()` in transaction and ensures empty groups are deleted
  - `prisma/schema.prisma` - Already has cascade delete configured for messages (no changes needed)

### Message Sanitization & Reporting System
- **Date**: Content safety and moderation
- **Changes**:
  - Added message sanitization: trim, strip HTML, cap at 500 chars, collapse whitespace
  - Added `reported` and `deleted` (soft-delete) fields to Message model
  - Created message sanitization utility (`lib/messageSanitize.js`)
  - Report button on all messages (available to any user)
  - Soft-delete functionality for group owners on reported messages
  - Deleted messages filtered out from chat display
  - Reported messages show warning indicator and delete option for owners
- **Functions Added**:
  - `sanitizeMessage()` in `lib/messageSanitize.js` - Sanitizes message text
  - `reportMessage()` in `lib/data.js` - Flags a message as reported
  - `deleteMessage()` in `lib/data.js` - Soft-deletes a message (owners only)
- **Files Created**:
  - `lib/messageSanitize.js` - Message sanitization utility
  - `pages/api/messages/[messageId]/report.js` - Report message API endpoint
  - `pages/api/messages/[messageId]/delete.js` - Delete message API endpoint
- **Files Modified**:
  - `prisma/schema.prisma` - Added `reported` and `deleted` fields to Message model
  - `lib/data.js` - Updated `addMessage()` to use sanitization, updated `getMessages()` to exclude deleted, added report/delete functions
  - `pages/groups/[groupId].js` - Added report and delete buttons in chat UI
  - `styles/globals.css` - Added styling for message actions

### Course Query Parameter Support
- **Date**: QR code and direct course linking
- **Changes**:
  - Landing page now supports `?course=CODE` query parameter
  - Validates course code exists before navigating
  - Shows clear "Course not found" error message if code is invalid
  - Displays fallback course list even when course not found
  - Auto-navigates to course page if code is valid
- **Files Modified**:
  - `pages/index.js` - Added course code validation, error handling, and conditional navigation

### Profile Page & Name Change
- **Date**: User profile management
- **Changes**:
  - Added Profile page where users can update their display name
  - Requires password verification to change name
  - Updates userName across all related tables (User, GroupMember, RosterEntry, Message, Group)
  - Uses transaction to ensure atomicity of updates
  - Validates new name is not already taken
  - Added "Profile" link in user dropdown menu
- **Functions Added**:
  - `updateUserName()` in `lib/data.js` - Updates user name across all tables with transaction
- **Files Created**:
  - `pages/profile.js` - Profile page for name changes
  - `pages/api/user/update-name.js` - API endpoint for updating user name
- **Files Modified**:
  - `components/UserIndicator.js` - Added "Profile" menu item
  - `lib/data.js` - Added `updateUserName()` function with cascading updates

### Admin Panel Page
- **Date**: Administrative access
- **Changes**:
  - Created admin-only page at `/admin`
  - Admin authentication with credentials (username: admin, password: 123)
  - Uses localStorage for admin session management
  - Login form for admin access
  - Protected route - shows login if not authenticated
  - Placeholder control center page structure (functionality to be added later)
- **Files Created**:
  - `pages/admin.js` - Admin panel page with authentication

### Admin Dashboard
- **Date**: Admin overview and statistics
- **Changes**:
  - Added bare-bones dashboard showing courses, groups, member counts, and last activity
  - Overview stats cards: total courses, groups, members, and last activity timestamp
  - Courses table listing all courses with codes and titles
  - Groups table showing: name, course, member count, message count, status, and creation date
  - Dashboard data fetched from API endpoint on admin login
- **Files Created**:
  - `pages/api/admin/dashboard.js` - API endpoint for admin dashboard data
- **Files Modified**:
  - `pages/admin.js` - Added dashboard display with stats, courses table, and groups table

### Admin Analytics Cards
- **Date**: Analytics and metrics
- **Changes**:
  - Added analytics cards showing: total users, total groups, average group size, and messages per day (last 7 days)
  - Average group size calculated as total members / total groups
  - Messages per day calculated from last 7 days of non-deleted messages
  - Replaced "Overview" section with "Analytics" section
- **Files Modified**:
  - `pages/api/admin/dashboard.js` - Added totalUsers count, avgGroupSize calculation, and messagesPerDay calculation (last 7 days)
  - `pages/admin.js` - Updated analytics cards to show new metrics

### UI Revamp with Tailwind CSS
- **Date**: Complete styling overhaul
- **Changes**:
  - Replaced all custom CSS with Tailwind CSS utility classes
  - Implemented modern, minimal design with:
    - Clean layout: max-w-screen-lg center, generous spacing (pt-8 pb-16 gap-6)
    - Elegant cards: rounded-2xl, soft shadows, subtle borders
    - Fresh color palette: neutral backgrounds, tinted card backgrounds, high-contrast text, blue accent color
    - Typography hierarchy: text-2xl/semibold for titles, text-sm for meta, tracking-tight
    - Chip/badge styles for OPEN/CLOSED status and member counts
    - Clear primary/secondary button styles with hover/active/focus-visible rings
    - Skeleton loaders for lists during data fetching
    - Empty state cards with friendly copy
    - Accessible focus states, aria-labels, color contrast AA, reduced-motion safe transitions
  - All logic and routes remain unchanged (styling-only pass)
- **Files Created**:
  - `tailwind.config.js` - Tailwind configuration
  - `postcss.config.js` - PostCSS configuration
  - `components/Toast.js` - Toast notification component (created but not yet used)
- **Files Modified**:
  - `styles/globals.css` - Replaced with Tailwind directives and minimal custom CSS
  - `package.json` - Added tailwindcss, postcss, autoprefixer as dev dependencies
  - `pages/index.js` - Updated with Tailwind classes
  - `pages/courses/[courseCode].js` - Updated with Tailwind classes
  - `pages/groups/[groupId].js` - Updated with Tailwind classes
  - `pages/my-groups.js` - Updated with Tailwind classes
  - `pages/profile.js` - Updated with Tailwind classes
  - `pages/admin.js` - Updated with Tailwind classes
  - `components/AuthModal.js` - Updated with Tailwind classes
  - `components/UserIndicator.js` - Updated with Tailwind classes

### Homepage Redesign - UH Local Feel
- **Date**: University of You-themed homepage redesign
- **Changes**:
  - Added hero section with "University of You Study Groups" branding and CTA buttons
  - Implemented Quick Course Finder with real-time search functionality
  - Added "Popular This Week" section showing courses with most groups created in last 7 days (as chips)
  - Added "Active Right Now" section displaying groups with activity in last 24 hours (recent messages or new groups)
  - Applied UH-inspired theme: red #C8102E accents, rounded-2xl cards, soft borders, AA contrast
  - All components kept tiny and reusable, using existing data structures
  - Friendly empty states shown when sections have no data
  - No backend changes - uses existing API structure with new lightweight endpoint
- **Files Created**:
  - `pages/api/homepage.js` - Lightweight API endpoint for homepage data (recent groups, popular courses)
- **Files Modified**:
  - `pages/index.js` - Complete redesign with hero, search, popular chips, and active groups
  - `tailwind.config.js` - Added UH color palette (#C8102E) to theme

---

## Update: 2025-11-01 - Fixed Group Not Found Error and Authentication Issues

### Issues Fixed

1. **Group Not Found Error**
   - **Problem**: Clicking "View" on group cards from the homepage or course pages resulted in "Group Not Found" error
   - **Root Cause**: The `getGroup()` function in `lib/data.js` was missing the `courseCode` property in its return value, which caused the API to fail when trying to find the associated course
   - **Fix**:
     - Updated `lib/data.js` line 127 to include `courseCode: group.courseCode` in the returned object
     - Optimized `pages/api/groups/[groupId].js` to call `getGroup()` once instead of looping through all courses
     - Added better error logging to help debug future issues

2. **Authentication Error Message**
   - **Problem**: Generic "Failed to authenticate. Please try again." error message was shown for all authentication failures
   - **Root Cause**: Error handling didn't properly check response status before parsing JSON
   - **Fix**:
     - Fixed `lib/throttle.js` to use only CommonJS exports (removed conflicting ES6 exports)
     - Updated `components/UserIndicator.js` to check `response.ok` before parsing JSON
     - Added error handling for account creation flow
     - Improved error messages in `pages/api/auth/login.js` with better logging

3. **Maintenance Status API Errors**
   - **Problem**: API routes were returning 500 errors with HTML instead of JSON
   - **Root Cause**: `lib/maintenance.js` had conflicting ES6 and CommonJS exports causing module resolution issues in Next.js API routes
   - **Fix**:
     - Removed ES6 `export` statements from `lib/maintenance.js` and kept only CommonJS exports
     - Module now consistent with other lib files like `throttle.js` and `cache.js`

### Files Modified

- `lib/data.js` - Added `courseCode` to `getGroup()` return value
- `pages/api/groups/[groupId].js` - Optimized group fetching logic and added error logging
- `lib/throttle.js` - Removed ES6 exports to fix module conflicts
- `lib/maintenance.js` - Removed ES6 exports to fix module conflicts
- `components/UserIndicator.js` - Improved error handling for authentication responses
- `pages/api/auth/login.js` - Added error stack logging for debugging
- `pages/courses/[courseCode].js` - Improved error handling for authentication responses
- `pages/groups/[groupId].js` - Improved error handling for authentication responses

---

---

## Update: 2025-11-01 - Added Activity Log to Admin Page

### Feature Added

**Activity Log Panel**
- **Purpose**: Real-time monitoring of all system activity for administrators
- **Location**: New panel at the bottom of the admin page
- **Behavior**: Auto-refreshes every 5 seconds to show latest activity

### Audit Trail Coverage

The system now logs all significant events:
- **User Actions**:
  - `USER_REGISTERED` - New account creation
  - `USER_LOGIN` - User sign-in
  - `USER_NAME_CHANGED` - Profile name updates
- **Group Actions**:
  - `GROUP_CREATED` - Group creation with course info
  - `GROUP_JOINED` - User joining a group
  - `GROUP_LEFT` - User leaving a group
  - `GROUP_TOGGLED` - Open/Closed status changes
  - `GROUP_AUTO_DELETED` - System cleanup when group becomes empty
- **Message Actions**:
  - `MESSAGE_POSTED` - New chat message
  - `MESSAGE_REPORTED` - User flagging a message
  - `MESSAGE_DELETED` - Message soft-deletion by owner or admin

### Technical Implementation

- **Database**: New `AuditLog` table with indexed fields (timestamp, actor, action)
- **API**: `/api/admin/audit-logs` endpoint returns recent logs (default 100)
- **UI**: Clean, scrollable log display with timestamps, actor badges, and action details
- **Polling**: Automatic refresh every 5 seconds for real-time updates
- **Logging**: Non-blocking audit writes that don't affect main operations

### Files Created

- `lib/audit.js` - Audit logging utility functions
- `pages/api/admin/audit-logs.js` - API endpoint for fetching logs

### Files Modified

- `prisma/schema.prisma` - Added `AuditLog` model
- `lib/data.js` - Added audit logging to all data operations:
  - `createGroup`, `joinGroup`, `leaveGroup`
  - `toggleGroupStatus`, `addMessage`
  - `reportMessage`, `deleteMessage`
  - `authenticateUser`, `updateUserName`
- `pages/admin.js` - Added Activity Log panel with polling

### Note

**IMPORTANT**: After adding this feature, you must restart your development server for the audit logging to work. The Prisma client needs to be regenerated to include the new `AuditLog` model.

---

### Chat UI Improvements - Bubbles, Avatars, Day Dividers
- **Date**: Recent
- **Changes**:
  - **Chat Bubbles**: Implemented left/right aligned chat bubbles (others on left, current user on right) with rounded-2xl styling
  - **Avatars**: Added circular avatars with user initials (no images) - blue for own messages, gray for others
  - **Day Dividers**: Grouped messages by day with sticky headers showing "Today", "Yesterday", or date format (e.g., "Oct 31")
  - **Compact Timestamps**: Show hh:mm time format (24-hour) only on the last message of each burst
  - **Burst Detection**: Detects consecutive messages from same author within 5 minutes; avatars shown only on first message of burst
  - **Visual Polish**: Improved spacing, alignment, and overall chat appearance
- **Files Modified**:
  - `pages/groups/[groupId].js` - Complete chat UI overhaul with bubble layout, avatars, day dividers, and burst detection
  - `lib/nameFormat.js` - Added `getUserInitials()` function to extract initials from names
- **Features**:
  - Messages are grouped by day with sticky dividers
  - Timestamps shown only on last message of burst (consecutive messages from same user)
  - Avatar and author name shown only on first message of burst
  - Compact time format (hh:mm) for better readability

---

### Message Reactions Feature
- **Date**: Recent
- **Changes**:
  - **Reactions**: Added lightweight reaction system with three emojis (👍❤️💡) per message
  - **Toggle Functionality**: Users can click to add reactions; clicking again removes the reaction (toggle on/off)
  - **Reaction Picker**: Small smiley icon appears under messages; clicking opens popup with three reaction options
  - **Reaction Chips**: Compact reaction chips displayed under message bubbles showing emoji and count
  - **Visual Feedback**: User's own reactions are highlighted with blue background; others show neutral gray
  - **Click Outside**: Reaction picker closes when clicking outside or after selecting a reaction
  - **Database**: Added `Reaction` model to Prisma schema with unique constraint (messageId, userName, emoji)
  - **API Endpoint**: Created `/api/messages/[messageId]/reaction` for toggling reactions
  - **Audit Logging**: All reaction add/remove actions are logged in admin activity log
- **Files Modified**:
  - `prisma/schema.prisma` - Added `Reaction` model with relations to `Message`
  - `lib/data.js` - Added `toggleReaction()` function; updated `getMessages()` to include reactions grouped by emoji
  - `pages/groups/[groupId].js` - Added reaction picker icon, popup menu, and reaction chip display in chat UI
  - `pages/api/messages/[messageId]/reaction.js` - New API endpoint for reaction toggling
- **Features**:
  - Three reaction options: 👍 (thumbs up), ❤️ (heart), 💡 (lightbulb)
  - Small smiley icon button appears under last message in burst
  - Clicking icon opens popup menu with three reaction buttons
  - Reactions shown as small chips (text-[10px]) with emoji and count
  - User's reactions highlighted in blue
  - Click to toggle (add if not exists, remove if exists)
  - Reactions shown only on last message in burst for cleaner UI

---

### Profile Modal & User Information
- **Date**: Recent
- **Changes**:
  - **Profile Modal**: Clicking on a user's avatar opens a full profile modal showing comprehensive user information
  - **Last Active Tracking**: Displays relative time since user's most recent message (e.g., "5 mins ago", "2 hours ago")
  - **Last Group Active In**: Shows the group where the user was last active (based on most recent message)
  - **Current Groups**: Lists all groups the user is currently a member of with status badges
- **Features**:
  - Avatars are clickable (hover effect on non-own avatars)
  - Modal displays user name, avatar, last active time, last group active in, and all current groups
  - Each group in the list is clickable to navigate directly to that group
  - Group list shows course info, open/closed status, and member count
  - Clean, centered modal design with click-outside-to-close behavior
- **Files Created**:
  - `components/ProfileModal.js` - Full profile modal component
  - `pages/api/users/[userName]/profile.js` - API endpoint for fetching complete user profile data
- **Files Modified**:
  - `pages/groups/[groupId].js` - Added avatar click handling and modal display

---

## Future Updates

_New updates will be logged here as they are added..._

