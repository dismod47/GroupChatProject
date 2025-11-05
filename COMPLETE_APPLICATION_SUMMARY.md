# Campus Study Groups - Complete Application Summary

## 📋 Overview

A modern, web-based study group management system for the University of You. Students can browse courses, create or join study groups (max 5 members per group), and communicate through real-time chat. The application features password-based authentication, persistent SQLite database storage, admin dashboard, and a beautiful Tailwind CSS UI with UH-themed design.

---

## 🎯 Core Features

### **1. Authentication & User Management**
- **Password-based authentication** using bcrypt hashing
- **Automatic account creation** when users join/create groups (if account doesn't exist)
- **Cookie-based session management** (30-day expiration)
- **Sign in/out functionality** via profile dropdown in top-right corner
- **Profile management**: Users can update display name (requires password verification)
- **Session auto-clear on page load** (fresh start each visit)

### **2. Course Management**
- **4 Seeded Courses**:
  - CS101 - Introduction to Computer Science
  - MATH201 - Calculus I
  - PHYS301 - Physics for Engineers
  - ENG101 - English Composition
- **Public browsing**: Anyone can view courses, groups, and rosters without authentication
- **Course detail page** shows:
  - All active groups with status (OPEN/CLOSED) and size (X/5)
  - Complete roster of registered students with status indicators
  - "Create Group" button (requires sign-in)
- **QR Code support**: `?course=CODE` parameter auto-navigates to course page
- **Course search**: Quick finder on homepage with real-time filtering

### **3. Group Management**
- **Maximum 5 members per group** (strictly enforced)
- **One group per course per user** (database-level constraint)
- **Group status**:
  - **OPEN**: Accepting new members (if under 5)
  - **CLOSED**: Not accepting new members
  - Only members can toggle status
- **Group creation**: Any signed-in user can create groups
- **Group joining**: Can join any open group that isn't full
- **Group owner badge**: Creator shown first in member list with crown badge 👑
- **Auto-delete empty groups**: When last member leaves, group and messages are deleted
- **Invite links**: Public `/groups/:id` URLs work for read-only viewing and joining

### **4. Chat System**
- **Real-time chat** using polling (updates every 3 seconds)
- **Member-only posting**: Only group members can send messages
- **Message limits**:
  - 500 characters maximum per message
  - Last 50 messages kept per group (older messages trimmed)
  - Plain text only (no HTML, links, formatting)
- **Message sanitization**: 
  - Trims whitespace
  - Strips HTML tags
  - Collapses repeated whitespace
  - Caps at 500 characters
- **Message moderation**:
  - **Report icon**: Tiny warning icon (⚠️) next to each message (registered users only)
  - **Report functionality**: Flags message but does NOT remove it
  - **Soft-delete**: Group owners and admins can delete reported messages
  - **Admin review**: Admins can review all reported messages from last 7 days
  - Deleted messages filtered from chat display

### **5. Privacy & Display**
- **Name formatting**: Public pages show "First L." format (e.g., "John D.")
- **Full names stored privately**: Database stores complete names
- **Owner identification**: Group creator always shown first with badge

### **6. User Dashboard Features**
- **My Groups page**: View all groups user is member of across all courses
- **Profile page**: Update display name (requires password verification)
- **User indicator**: Always visible in top-right showing sign-in status

### **7. Admin Panel**
- **Admin authentication**: Credentials (username: `admin`, password: `123`)
- **LocalStorage session**: Admin session persists in browser
- **Dashboard analytics**:
  - Total users count
  - Total groups count
  - Average group size calculation
  - Messages per day (last 7 days)
- **Courses table**: Lists all courses with codes and titles
- **Groups table**: Shows name, course, member count, message count, status, creation date
- **Overview stats**: Total courses, groups, members, last activity timestamp
- **Reported Messages Management**:
  - Lists all reported messages from last 7 days
  - Shows message author, course, group, full text, and timestamp
  - Two actions per message:
    - **Mark Resolved**: Removes report flag, message stays visible (reviewed and approved)
    - **Delete**: Soft-deletes message, hides from chat
  - Refresh button to reload reported messages list

### **8. Homepage Features**
- **Hero section**: UH branding with "University of You Study Groups" title
- **Quick Course Finder**: Real-time search by course code or title
- **Popular This Week**: Chips showing courses with most groups created in last 7 days
- **Active Right Now**: Groups with activity in last 24 hours (recent messages or new groups)
- **UH-themed design**: Red accents (#C8102E), rounded cards, modern UI

### **9. Security & Reliability Features**
- **Login Throttling**: Max 5 attempts per 10 minutes per IP/username combination
  - Prevents brute force attacks
  - Returns HTTP 429 with friendly message: "Too many attempts—try again soon."
  - Automatically resets on successful login
  - Tracks by IP address and username together
- **Maintenance Mode**: Environment-based service control
  - Enable/disable via `MAINTENANCE_MODE=1` environment variable
  - Top yellow banner appears when enabled
  - All write operations disabled (join, create, chat, toggle, leave)
  - Returns HTTP 503 for write operations
  - Read-only browsing remains available
- **Health Check Endpoint**: `/api/health`
  - Returns HTTP 200 with `{ ok: true, time: Date.now() }`
  - No database access, pure status check
  - Useful for monitoring and load balancers

### **10. Legal & Privacy Pages**
- **Terms of Service** (`/terms`): Plain English terms covering:
  - Acceptance of terms
  - Use of service guidelines
  - User responsibilities
  - Content moderation policy
  - Back to Home navigation
- **Privacy Policy** (`/privacy`): Comprehensive privacy information:
  - **No data sales** explicitly stated
  - **FERPA compliance** mentioned for educational privacy
  - **Email hidden**: States no email collection
  - Display name privacy explanation
  - Data security practices
  - User rights section
- **Footer Component**: Appears on all pages with:
  - Links to Terms and Privacy
  - Copyright notice
  - Responsive design

---

## 🛠 Technical Stack

### **Frontend**
- **Next.js 14** (Pages Router) with JavaScript
- **React 18** with Hooks (useState, useEffect, useRouter)
- **Tailwind CSS 3.4.0** for styling
- **PostCSS & Autoprefixer** for CSS processing
- **js-cookie** for cookie management

### **Backend**
- **Next.js API Routes** for REST API
- **Prisma ORM 5.0.0** for database access
- **SQLite** for data persistence
- **bcryptjs** for password hashing

### **Database Schema**
- **Course**: code (PK), title
- **Group**: id (UUID), name, courseCode, creatorName, isOpen, createdAt
- **GroupMember**: id (UUID), groupId, userName (unique constraint per group)
- **Message**: id (UUID), groupId, author, text, timestamp, reported, deleted
- **RosterEntry**: id (UUID), courseCode, userName (unique constraint per course)
- **User**: id (UUID), userName (unique), password (hashed), createdAt

---

## 📡 API Endpoints

### **Authentication**
- `POST /api/auth/login` - Sign in or create account (requires name + password)
  - Protected by login throttling (5 attempts per 10 min per IP/username)

### **Courses**
- `GET /api/courses` - Get all courses
- `GET /api/courses/[courseCode]` - Get course details with groups and roster
- `GET /api/homepage` - Get homepage data (courses, popular courses, recent groups)

### **Groups**
- `POST /api/groups/create` - Create new group (requires name, courseCode)
- `GET /api/groups/[groupId]` - Get group details with members and messages
- `POST /api/groups/[groupId]` - Join group or toggle status (body: `{ action: 'join' | 'toggle' }`)
- `DELETE /api/groups/[groupId]` - Leave group (query: `?action=leave`)

### **Chat**
- `GET /api/chat/[groupId]` - Get chat messages for group (latest 50)
- `POST /api/chat/[groupId]` - Post new message (requires membership)

### **User Management**
- `GET /api/user/[courseCode]` - Check if user is in a group for course
- `GET /api/user/groups` - Get all groups user is member of
- `POST /api/user/update-name` - Update user display name (requires password)

### **Message Moderation**
- `POST /api/messages/[messageId]/report` - Report a message
- `POST /api/messages/[messageId]/delete` - Soft-delete a message (owners only)

### **Admin**
- `GET /api/admin/dashboard` - Get admin dashboard data (courses, groups, analytics)
- `GET /api/admin/reported-messages` - Get reported messages from last 7 days
- `POST /api/admin/messages/[messageId]/resolve` - Mark message as resolved (removes report flag)

### **System**
- `GET /api/health` - Health check endpoint (returns `{ ok: true, time: Date.now() }`)
- `GET /api/maintenance-status` - Check if maintenance mode is enabled

---

## 🔄 User Flows

### **Flow 1: Join Group (Not Signed In)**
1. User browses course → clicks "Join" on group card
2. **Auth modal appears** asking for Name + Password
3. If user exists: validates password → signs in
4. If user doesn't exist: creates account with provided password
5. Automatically attempts join after authentication
6. User becomes member → can access group features

### **Flow 2: Create Group**
1. User clicks "Create Group" on course page
2. If not signed in: auth modal appears
3. After auth: prompt for group name
4. Group created with creator as first member (auto-added to roster)
5. User redirected to new group page

### **Flow 3: Public Group Viewing**
1. User clicks "View" on any group (no auth required)
2. Sees read-only group page:
   - Group name, course, members (formatted names), size, status
   - Chat history (read-only)
   - Prominent "Join Group" button (if not member)
3. If clicks "Join": auth modal appears → after sign-in, joins group

### **Flow 4: Group Chat**
1. Member types message (max 500 chars)
2. Message sanitized (trim, strip HTML, collapse whitespace)
3. POST to `/api/chat/[groupId]`
4. Message saved to database
5. UI updates immediately
6. Other members see update on next poll (3-second intervals)

### **Flow 5: Leave Group**
1. Member clicks "Leave Group"
2. Confirmation prompt
3. User removed from group
4. If group becomes empty → auto-deleted (messages cascade delete)
5. User redirected to course page

### **Flow 6: Name Update**
1. User clicks "Profile" from dropdown
2. Enters current password + new name
3. System validates password
4. Updates userName across all tables (User, GroupMember, RosterEntry, Message, Group)
5. Success message shown

---

## 🎨 UI Components

### **Components**
- **UserIndicator** (`components/UserIndicator.js`):
  - Top-right fixed position
  - Shows sign-in status with user avatar
  - Dropdown menu: Profile, My Groups, Sign Out
  - UH-themed red button when not signed in

- **AuthModal** (`components/AuthModal.js`):
  - Overlay modal for authentication
  - Name + Password input fields
  - Error message display
  - Cancel/Close functionality

- **Toast** (`components/Toast.js`):
  - Toast notification component (created but not yet integrated)

- **MaintenanceBanner** (`components/MaintenanceBanner.js`):
  - Top yellow banner that appears when maintenance mode is enabled
  - Fetches maintenance status from API
  - Fixed position, responsive design

- **Footer** (`components/Footer.js`):
  - Footer component with Terms and Privacy links
  - Copyright notice
  - Appears on all pages

### **Pages**
- **Homepage** (`pages/index.js`):
  - Hero section with UH branding
  - Quick Course Finder search
  - Popular This Week chips
  - Active Right Now groups row
  - Supports `?course=CODE` parameter

- **Course Page** (`pages/courses/[courseCode].js`):
  - Active Groups section with cards
  - Course Roster with status chips
  - Create Group button
  - Skeleton loaders during fetch

- **Group Page** (`pages/groups/[groupId].js`):
  - Public read-only mode for non-members
  - Member controls for members (toggle status, leave, chat)
  - Chat interface with message list
  - Report/Delete buttons for messages
  - 404 page for not found groups

- **My Groups** (`pages/my-groups.js`):
  - Lists all user's groups across courses
  - Quick links to view group or course
  - Redirects to homepage if not signed in

- **Profile** (`pages/profile.js`):
  - Name update form
  - Password verification required
  - Success/error messages

- **Admin** (`pages/admin.js`):
  - Login form for admin access
  - Analytics cards (users, groups, avg size, messages/day)
  - Courses and Groups tables
  - Reported Messages section (last 7 days)
  - Protected route (requires auth)

- **Terms** (`pages/terms.js`):
  - Terms of Service page
  - Plain English, concise sections
  - Back to Home navigation

- **Privacy** (`pages/privacy.js`):
  - Privacy Policy page
  - FERPA compliance, no data sales, email hidden
  - User rights and data security information

---

## 📊 Database Constraints & Business Rules

### **Group Limits**
- Maximum 5 members per group (enforced at join time)
- One group per course per user (database unique constraint)
- Groups must have at least 1 member (empty groups auto-deleted)

### **Group Status**
- OPEN: Accepting new members (if under 5)
- CLOSED: Not accepting members
- Only group members can toggle status

### **Authentication**
- Password required for all account creation
- Auto-login: Account created if user doesn't exist during join/create
- Session stored in cookie (30-day expiration)
- No password recovery (MVP simplicity)

### **Permissions**
- **Public access**: Browse courses, groups, rosters, read-only group pages
- **Member-only actions**: Post messages, toggle status, leave group
- **Action requires auth**: Create group, join group, post messages
- **Owner-only actions**: Delete reported messages

### **Message Limits**
- 500 character limit per message
- 50 message limit per group (older messages trimmed)
- Plain text only (no formatting, links, etc.)
- HTML stripped automatically

### **Name Formatting**
- Public display: "First L." format (e.g., "John D.")
- Full names stored in database
- Owner always shown first in member lists

---

## 🔒 Security Features

- **Password hashing**: bcryptjs with salt rounds
- **SQL injection protection**: Prisma parameterized queries
- **XSS protection**: Message sanitization (HTML stripping)
- **Session management**: Cookie-based with expiration
- **Input validation**: Message length limits, name validation
- **Transaction safety**: Database transactions for atomic operations
- **Login throttling**: Max 5 attempts per 10 minutes per IP/username combination
  - Prevents brute force attacks
  - Automatic cleanup of old attempts
  - Resets on successful login
- **Maintenance mode**: Environment variable to disable write operations
- **Admin privileges**: Admin can delete any message, manage reported content

---

## 📱 Responsive Design

- **Mobile-friendly**: Responsive Tailwind classes
- **Fixed-width container**: Max-width screen-lg (1024px) centered
- **Card-based layout**: White cards on neutral background
- **Touch-friendly**: Adequate button sizes and spacing
- **Accessible**: Focus states, aria-labels, color contrast AA compliant

---

## 🎯 Design System

### **Color Palette**
- **UH Red**: #C8102E (primary actions, accents)
- **UH Red Dark**: #A00D26 (hover states)
- **Neutral backgrounds**: neutral-50, neutral-100
- **Card backgrounds**: white with neutral-200 borders
- **Text**: neutral-900 (high contrast), neutral-600/700 (secondary)

### **Typography**
- **Headings**: text-4xl/5xl (hero), text-2xl (section titles), font-semibold
- **Body**: text-base, text-sm for meta information
- **Tracking**: tracking-tight for headings

### **Components**
- **Cards**: rounded-2xl, shadow-sm, border border-neutral-200
- **Buttons**: 
  - Primary: bg-[#C8102E], text-white, rounded-2xl
  - Secondary: bg-white, border-2 border-[#C8102E], text-[#C8102E]
  - Danger: text-red-600, hover:bg-red-50
- **Status chips**: Color-coded badges (OPEN=green, CLOSED=red, IN_GROUP=blue)
- **Skeleton loaders**: Animated placeholders during data fetch

---

## 🚀 Getting Started

### **Installation**
```bash
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run prisma.seed
npm run dev
```

### **Production Build**
```bash
npx prisma generate
npx prisma migrate deploy
npm run build
npm start
```

### **Database Management**
```bash
# View database in browser
npx prisma studio

# Reset database
npx prisma migrate reset
npm run prisma.seed
```

---

## 📝 File Structure

```
GroupChatProject/
├── components/
│   ├── AuthModal.js          # Authentication modal
│   ├── UserIndicator.js      # User status dropdown
│   └── Toast.js              # Toast notifications (unused)
├── lib/
│   ├── cookies.js            # Cookie utility functions
│   ├── data.js               # Database access layer (Prisma)
│   ├── messageSanitize.js    # Message sanitization utilities
│   ├── nameFormat.js         # Name formatting utilities
│   ├── maintenance.js        # Maintenance mode utility
│   ├── throttle.js           # Login throttling utility
│   └── prisma.js             # Prisma client singleton
├── pages/
│   ├── _app.js               # App wrapper with UserIndicator
│   ├── index.js              # Homepage with UH theme
│   ├── admin.js              # Admin dashboard
│   ├── my-groups.js          # User's groups page
│   ├── profile.js            # Profile/name update page
│   ├── courses/
│   │   └── [courseCode].js   # Course detail page
│   ├── groups/
│   │   └── [groupId].js      # Group detail page with chat
│   └── api/
│       ├── admin/
│       │   ├── dashboard.js  # Admin dashboard API
│       │   ├── reported-messages.js # Reported messages API
│       │   └── messages/
│       │       └── [messageId]/
│       │           └── resolve.js # Resolve message API
│       ├── auth/
│       │   └── login.js      # Authentication API (with throttling)
│       ├── chat/
│       │   └── [groupId].js # Chat API
│       ├── courses.js        # Courses list API
│       ├── courses/
│       │   └── [courseCode].js # Course detail API
│       ├── groups/
│       │   ├── create.js     # Create group API
│       │   └── [groupId].js  # Group operations API
│       ├── homepage.js       # Homepage data API
│       ├── health.js          # Health check API
│       ├── maintenance-status.js # Maintenance status API
│       ├── messages/
│       │   └── [messageId]/
│       │       ├── delete.js # Delete message API
│       │       └── report.js # Report message API
│       └── user/
│           ├── [courseCode].js # User group status API
│           ├── groups.js     # User's groups API
│           └── update-name.js # Name update API
├── prisma/
│   ├── schema.prisma         # Database schema
│   ├── seed.js               # Database seeding script
│   └── dev.db                # SQLite database (gitignored)
├── styles/
│   └── globals.css           # Global styles + Tailwind
├── tailwind.config.js        # Tailwind configuration
├── postcss.config.js         # PostCSS configuration
├── next.config.js            # Next.js configuration
├── package.json              # Dependencies and scripts
├── UPDATE_LOG.md             # Change log
└── README.md                 # Basic documentation
```

---

## 🔧 Key Technical Details

### **Database Transactions**
- `joinGroup()`: Wrapped in transaction to enforce "one group per course" constraint
- `createGroup()`: Transaction ensures atomicity of group creation + member addition
- `leaveGroup()`: Transaction handles member removal + auto-delete of empty groups
- `updateUserName()`: Transaction updates name across all related tables

### **Polling System**
- Chat polls every 3 seconds using `setInterval`
- Cleans up on component unmount
- Shows loading state during fetch

### **Error Handling**
- Friendly error messages for all user-facing errors
- Inline error display in modals and forms
- 404 pages for not found resources
- Network error handling with retry logic

### **State Management**
- React hooks (useState, useEffect) for local state
- Cookie-based session persistence
- LocalStorage for admin session
- No global state management library (kept simple)

---

## 🎓 Current Capabilities Summary

✅ **Authentication**: Password-based with bcrypt hashing
✅ **Course Browsing**: Public access to all courses and groups
✅ **Group Creation**: Signed-in users can create groups
✅ **Group Joining**: Join open groups (max 5 members)
✅ **One Group Per Course**: Database-enforced constraint
✅ **Real-time Chat**: Polling-based chat for group members
✅ **Message Moderation**: Report and soft-delete messages
✅ **Profile Management**: Update display name with password verification
✅ **My Groups**: View all user's groups in one place
✅ **Admin Dashboard**: Analytics and management interface
✅ **Admin Reported Messages**: Review and manage reported messages from last 7 days
✅ **Public Invite Links**: Shareable group URLs
✅ **Name Privacy**: Public display shows "First L." format
✅ **Owner Badge**: Group creator identification
✅ **Auto-cleanup**: Empty groups automatically deleted
✅ **QR Code Support**: Direct course links via `?course=CODE`
✅ **Course Search**: Real-time filtering on homepage
✅ **UH Theming**: University of You branded design
✅ **Responsive Design**: Mobile-friendly layout
✅ **Accessibility**: AA contrast, focus states, aria-labels
✅ **Login Throttling**: Brute force protection (5 attempts per 10 min per IP/username)
✅ **Maintenance Mode**: Environment-based service control with banner
✅ **Health Check**: `/api/health` endpoint for monitoring
✅ **Terms & Privacy Pages**: Legal pages with footer on all pages
✅ **Report Icon**: Tiny icon on messages for registered users only

---

## 📋 Known Limitations (MVP)

- No password recovery mechanism
- No real-time websockets (uses polling)
- No file uploads or image sharing
- No notifications for new messages
- No group search/filter beyond course browsing
- No user profile pages (only name update)
- SQLite database (single-file, not multi-server compatible)
- No email verification
- No group scheduling or calendar integration
- No message editing (only deletion)
- No admin user management UI (only dashboard)
- No analytics beyond basic counts
- Maintenance mode throttling is in-memory (resets on server restart)
- Login throttling is in-memory (resets on server restart)

---

## 🔮 Potential Future Enhancements

- WebSocket support for real-time chat
- Email notifications
- Group scheduling/calendar
- File sharing
- Advanced search and filtering
- User profiles with avatars
- Password recovery
- Email verification
- Group announcements
- Study session scheduling
- Group analytics
- Mobile app (React Native)
- Multi-university support

---

**Application Version**: 1.0.0 (MVP)
**Last Updated**: 2024
**Framework**: Next.js 14 (Pages Router)
**Database**: SQLite via Prisma ORM
**Styling**: Tailwind CSS 3.4.0
**Theme**: University of You (Red #C8102E)

---

*This is a comprehensive summary of all features, capabilities, and technical details of the Campus Study Groups application.*

