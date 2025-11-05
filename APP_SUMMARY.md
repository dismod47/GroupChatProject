# Campus Study Groups - Complete App Summary

## Overview
A web-based study group management system where students can browse courses, create or join study groups (max 5 members), and communicate through simple chat. Users authenticate with name + password, and all data persists in SQLite database.

---

## Core User Flows

### Flow 1: QR Code Entry → Course Selection
1. User scans QR code with `?course=CODE` parameter (e.g., `?course=CS101`)
2. App automatically navigates to that course page
3. OR user manually selects course from homepage

### Flow 2: Browse Course → View Groups
1. User clicks on a course from homepage
2. Sees **Active Groups** section showing:
   - Group name
   - Current size (e.g., 3/5)
   - Status chip (OPEN or CLOSED)
   - "View" button (always visible)
   - "Join" button (if group is open, not full, user not in another group)
3. Sees **Course Roster** showing all registered students with status (OPEN or IN_GROUP)

### Flow 3: Join a Group (Not Signed In)
1. User clicks "Join" on any group card
2. **Modal popup appears** asking for:
   - Name
   - Password
3. If user exists: validates password → signs in
4. If user doesn't exist: creates account with provided password
5. Automatically attempts join after authentication
6. User becomes member → can access group features

### Flow 4: Create a Group
1. User clicks "Create Group" button
2. If not signed in: modal appears for name/password
3. After auth: prompt for group name
4. Group created with creator as first member
5. User redirected to new group page

### Flow 5: View Group Details
1. User clicks "View" on any group (works without sign-in for browsing)
2. Sees group page showing:
   - Group name and course info
   - Member list
   - Group status (OPEN/CLOSED) and size
   - Chat history (last 50 messages)
   - If member: can toggle status, leave, and post messages
   - If not member: can join (requires sign-in)

### Flow 6: Group Chat
1. **Only members can post** messages
2. Messages automatically poll every 3 seconds for updates
3. Input capped at 500 characters (plain text only)
4. Shows message author, text, and timestamp
5. Keeps only last 50 messages per group

### Flow 7: Sign In/Out via Profile Indicator
1. User clicks profile icon in top-right corner
2. Dropdown menu appears:
   - **If signed in**: Shows name, "My Groups" option, "Sign Out"
   - **If not signed in**: Shows "Sign In" option
3. Clicking "Sign In" opens authentication modal
4. Clicking "Sign Out" clears session immediately

### Flow 8: View My Groups
1. User clicks "📚 My Groups" from profile dropdown
2. Page shows all groups user is a member of across all courses
3. Each group shows:
   - Group name and course info
   - Status and size
   - "View Group" button → goes to group page
   - "View Course" button → goes to course page

---

## Features & Functionality

### Authentication & User Management
- **Password-based authentication** (bcrypt hashing)
- **Automatic account creation** if user doesn't exist during join/create actions
- **Cookie-based session** (stores user name, 30-day expiration)
- **Sign in/out** from profile dropdown
- **Session cleared on page load** (fresh start each time)

### Course Management
- **4 Seeded Courses**: CS101, MATH201, PHYS301, ENG101
- **Public browsing**: Anyone can view courses, groups, and rosters
- **Course page shows**:
  - All active groups with status and size
  - Complete roster of registered students
  - Status indicators (OPEN, IN_GROUP)

### Group Management
- **Max 5 members per group** (enforced at join)
- **One group per course per user** (can't join multiple groups in same course)
- **Group status**:
  - OPEN: Accepting new members
  - CLOSED: Not accepting new members
  - Members can toggle status
- **Group creation**: Anyone can create (requires sign-in)
- **Group joining**: Can join any open group (requires sign-in)
- **Auto-archive**: Empty groups automatically deleted
- **CS101 seeded with 4 groups** (one member each)

### Group Members
- **Members can**:
  - Post messages in chat
  - Toggle group OPEN/CLOSED status
  - Leave the group
  - View full member list
- **Non-members can**:
  - View group details (read-only)
  - View chat history (read-only)
  - Join if group is open and has space

### Chat System
- **Text-only messages** (max 500 characters)
- **Polling-based updates** (checks for new messages every 3 seconds)
- **Member-only posting** (only group members can send messages)
- **Message history**: Last 50 messages per group
- **Message display**: Author name, text, timestamp
- **Automatic cleanup**: Old messages trimmed beyond 50

### Roster Tracking
- **Automatic registration**: Users added to course roster when they:
  - Create a group
  - Join a group
- **Status indicators**:
  - OPEN: User not in any group for that course
  - IN_GROUP: User is a member of a group for that course
- **Public visibility**: Anyone can view roster

### Profile & Navigation
- **Top-right indicator**: Shows sign-in status at all times
- **Dropdown menu** (when signed in):
  - Display current user name
  - "My Groups" link
  - "Sign Out" button
- **My Groups page**: Centralized view of all user's memberships

---

## Technical Architecture

### Frontend (React/Next.js Pages Router)
- **Pages**:
  - `/` - Homepage with course list
  - `/courses/[courseCode]` - Course detail page
  - `/groups/[groupId]` - Group detail page with chat
  - `/my-groups` - User's groups listing

- **Components**:
  - `UserIndicator` - Profile dropdown in top-right
  - `AuthModal` - Reusable authentication modal

- **State Management**: React hooks (useState, useEffect)
- **Routing**: Next.js Pages Router with dynamic routes
- **Cookie Management**: js-cookie library

### Backend API Routes
- `GET /api/courses` - List all courses
- `GET /api/courses/[courseCode]` - Get course details, groups, roster
- `POST /api/groups/create` - Create new group
- `GET /api/groups/[groupId]` - Get group details and messages
- `POST /api/groups/[groupId]` - Join group
- `PUT /api/groups/[groupId]` - Update group (toggle status, leave)
- `GET /api/chat/[groupId]` - Get chat messages
- `POST /api/chat/[groupId]` - Post new message
- `GET /api/user/[courseCode]` - Check if user is in group for course
- `GET /api/user/groups` - Get all groups for user
- `POST /api/auth/login` - Authenticate user (login or create)

### Database (Prisma + SQLite)
- **Models**:
  - `Course` - Course codes and titles
  - `Group` - Study groups with status
  - `GroupMember` - Many-to-many relationship (user ↔ group)
  - `Message` - Chat messages per group
  - `RosterEntry` - Student registrations per course
  - `User` - User accounts with passwords

- **Database File**: `prisma/dev.db` (SQLite)
- **Migrations**: Prisma migrations for schema changes
- **Seeding**: Automatic seed on setup (courses + CS101 groups)

### Data Access Layer (`lib/data.js`)
All database operations handled through async functions:
- `getAllCourses()` - Get all courses
- `getCourse(code)` - Get specific course
- `getGroups(code)` - Get groups for course
- `getGroup(code, id)` - Get specific group
- `getRosterWithStatus(code)` - Get roster with IN_GROUP/OPEN status
- `createGroup(code, name, creator)` - Create group
- `joinGroup(code, id, user)` - Join group
- `leaveGroup(code, id, user)` - Leave group
- `toggleGroupStatus(code, id, user)` - Toggle open/closed
- `addMessage(code, id, user, text)` - Post message
- `getMessages(code, id)` - Get chat messages
- `isUserInGroup(code, user)` - Check membership
- `getUserGroups(user)` - Get all user's groups
- `authenticateUser(name, password, create)` - Auth/login

---

## Business Rules & Constraints

### Group Limits
- **Maximum 5 members per group** - Enforced at join time
- **One group per course per user** - Users cannot be in multiple groups for same course
- **Groups must have at least 1 member** - Empty groups auto-deleted

### Group Status
- **OPEN**: Accepting new members (if under 5)
- **CLOSED**: Not accepting members (only members can change this)
- **Status toggle**: Only group members can open/close

### Authentication
- **Password required** for all account creation
- **Auto-login**: Account created if user doesn't exist (during join/create)
- **Session**: Stored in cookie (cleared on page load by default)
- **No password recovery** - MVP simplicity

### Permissions
- **Public access**: Anyone can browse courses, groups, rosters, and read-only group pages
- **Member-only actions**: Post messages, toggle status, leave group
- **Action requires auth**: Create group, join group, post messages

### Message Limits
- **500 character limit** per message
- **50 message limit** per group (older messages trimmed)
- **Plain text only** (no formatting, links, etc.)

### Roster Management
- **Auto-registration**: Users added when they join/create a group
- **Status updates**: Automatically reflects IN_GROUP when user joins
- **Public view**: All students visible to everyone

---

## UI/UX Features

### Visual Indicators
- **Status chips**: Color-coded badges (OPEN=green, CLOSED=red, IN_GROUP=blue)
- **Size display**: Shows current/max (e.g., "3/5")
- **Profile indicator**: Always visible in top-right showing sign-in status
- **Message alerts**: Inline error/success messages with dismiss button

### Modals & Popups
- **Auth Modal**: Appears when action requires sign-in
  - Clean overlay design
  - Name + Password fields
  - Error display
  - Cancel option

### Navigation
- **Breadcrumbs**: "Back to Courses" buttons on course/group pages
- **Quick links**: "View Group", "View Course" buttons
- **My Groups**: Central hub for user's groups

### Responsive Design
- **Fixed width container**: Max 800px centered
- **Card-based layout**: White cards on gray background
- **Button styling**: Consistent primary/secondary/danger variants
- **Hover effects**: Interactive elements have visual feedback

---

## Data Flow Examples

### Example 1: User Joins Group
```
User clicks "Join" → Not signed in → Modal appears
User enters name + password → POST /api/auth/login
  → authenticateUser() checks/creates user
  → Returns success → Cookie saved
  → POST /api/groups/[id] → joinGroup()
  → Checks: already in group? closed? full?
  → Creates GroupMember record
  → Adds to RosterEntry
  → Returns updated group
  → Page redirects to group page
```

### Example 2: Chat Message Flow
```
Member types message → POST /api/chat/[id]
  → addMessage() verifies membership
  → Creates Message record in DB
  → Trims old messages (keep 50)
  → Returns message + updated list
  → UI updates immediately
  → Other users see update on next poll (3s)
```

### Example 3: My Groups Display
```
User clicks "My Groups" → GET /api/user/groups
  → getUserGroups() queries GroupMember table
  → Joins with Group and Course data
  → Returns formatted list
  → Page displays with course info and links
```

---

## Current Limitations (MVP)

- **No password recovery** - Accounts can't be recovered if password forgotten
- **Session clears on page load** - Users must re-authenticate each visit (by design)
- **No real-time chat** - Uses polling (3-second intervals)
- **No file uploads** - Text-only messages
- **No notifications** - No alerts for new messages or group changes
- **No group search/filter** - Must browse all groups
- **No user profiles** - Only name stored
- **No admin features** - No moderation or admin controls
- **SQLite database** - Single-file, not multi-server compatible
- **No message editing/deleting** - Messages are permanent once posted

---

## File Structure Summary

```
GroupChatProject/
├── components/
│   ├── AuthModal.js          # Authentication modal popup
│   └── UserIndicator.js      # Top-right profile indicator
├── lib/
│   ├── cookies.js            # Cookie utilities (name storage)
│   ├── data.js               # All database operations (Prisma)
│   └── prisma.js             # Prisma client singleton
├── pages/
│   ├── index.js              # Homepage (course list)
│   ├── _app.js               # App wrapper (clears cookie on load)
│   ├── my-groups.js          # User's groups page
│   ├── courses/
│   │   └── [courseCode].js   # Course detail page
│   ├── groups/
│   │   └── [groupId].js      # Group detail + chat page
│   └── api/
│       ├── auth/
│       │   └── login.js      # Authentication endpoint
│       ├── courses.js        # List courses
│       ├── courses/[code].js # Course details
│       ├── groups/
│       │   ├── create.js    # Create group
│       │   └── [id].js      # Group operations
│       ├── chat/[id].js     # Chat messages
│       └── user/
│           ├── [code].js     # Check user group
│           └── groups.js    # User's all groups
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── seed.js              # Initial data seeding
├── styles/
│   └── globals.css           # All styling
└── UPDATE_LOG.md            # Change tracking
```

---

## Key Technologies Used

- **Frontend**: Next.js 14 (Pages Router), React 18, JavaScript
- **Backend**: Next.js API Routes
- **Database**: Prisma ORM + SQLite
- **Authentication**: bcryptjs for password hashing
- **Session**: js-cookie for cookie management
- **Styling**: Custom CSS (no framework)

---

## Security Considerations

- **Password hashing**: bcrypt with salt rounds
- **SQL injection protection**: Prisma ORM handles queries
- **XSS protection**: React escapes by default
- **Session management**: Cookie-based (client-side storage)
- **No authentication tokens**: Simple cookie-based approach

---

## Known Behavior

1. **Cookie cleared on page load** - By design, ensures fresh start
2. **No persistent sessions** - Users must sign in each visit
3. **Polling interval**: 3 seconds for chat updates (not real-time)
4. **Message limit enforcement**: Frontend shows 500 char limit, backend truncates
5. **Group size validation**: Frontend and backend both enforce max 5

---

## Initial Data (Seeded)

### Courses (4 total)
- CS101 - Introduction to Computer Science
- MATH201 - Calculus I
- PHYS301 - Physics for Engineers
- ENG101 - English Composition

### CS101 Groups (4 groups, 1 member each)
1. Algorithm Masters - Alice Chen
2. Data Structures Team - Bob Smith
3. Code Review Squad - Charlie Brown
4. Study Buddies - Diana Prince

All groups are OPEN and have 4 available spots (1/5 each).

---

This is the complete functionality summary of the Campus Study Groups application as it currently exists.

