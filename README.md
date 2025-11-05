# Campus Study Groups — Ultra-Basic QR Web App (MVP)

A simple, beginner-friendly web app that lets students scan a QR code, pick a course, view groups/roster, then register with just a name to create/join a study group (max 5 per group) and use a simple chat.

## Features

- **QR Code Support**: QR codes can include `?course=CODE` to preselect a course
- **Course Browser**: View available courses, active groups, and course roster
- **Group Management**: Create or join study groups (max 5 members per group)
- **One Group Per Course**: Each user can only be in one group per course
- **Lightweight Registration**: Just enter your name (stored in a cookie)
- **Simple Chat**: Text chat with polling (updates every 3 seconds)
- **Public Browsing**: Anyone can view courses and groups; actions require a name

## Tech Stack

- **Next.js** (Pages Router) with JavaScript
- **React** for UI
- **js-cookie** for cookie management
- **Prisma** + **SQLite** for data persistence

## Getting Started

### Prerequisites

- Node.js 14+ and npm (or yarn)

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up the database:
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   npx prisma db seed
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npx prisma generate
npx prisma migrate deploy
npm run build
npm start
```

## Usage

1. **Landing Page**: Select a course from the list, or visit with `?course=CODE` (e.g., `?course=CS101`)

2. **Course Page**: 
   - View active groups with size (e.g., 3/5) and Open/Closed status
   - Browse the course roster with student status (OPEN or IN_GROUP)
   - Create a new group or join an existing one (requires name)

3. **Group Page**:
   - View group members and details
   - Chat with group members (polling updates every 3 seconds)
   - Members can toggle group Open/Closed status
   - Members can leave the group

4. **Registration**: 
   - When creating/joining a group or posting, you'll be prompted to enter your name
   - Your name is saved in a cookie and persists across sessions

## Project Structure

```
├── pages/
│   ├── index.js                    # Landing page with course picker
│   ├── courses/
│   │   └── [courseCode].js         # Course detail page
│   ├── groups/
│   │   └── [groupId].js            # Group detail page with chat
│   └── api/
│       ├── courses.js               # Get all courses
│       ├── courses/[courseCode].js  # Get course details
│       ├── groups/
│       │   ├── create.js           # Create new group
│       │   └── [groupId].js        # Get/join/update group
│       ├── chat/[groupId].js       # Get/post chat messages
│       └── user/[courseCode].js    # Check user's group
├── lib/
│   ├── data.js                     # In-memory data store
│   └── cookies.js                  # Cookie utilities
└── styles/
    └── globals.css                  # Global styles
```

## Seeded Courses

The app comes with a few example courses:
- CS101 - Introduction to Computer Science
- MATH201 - Calculus I
- PHYS301 - Physics for Engineers
- ENG101 - English Composition

## Notes

- Data is stored in SQLite database (`prisma/dev.db`)
- User names are stored in cookies (30-day expiration)
- Chat messages are limited to 500 characters
- Maximum 50 messages per group (older messages are trimmed)
- Groups automatically archive when empty

## Database

This app uses Prisma with SQLite for data persistence. The database file is created in the `prisma/` directory.

To view the database:
```bash
npx prisma studio
```

To reset the database:
```bash
npx prisma migrate reset
npx prisma db seed
```

## License

This is a simple MVP project for educational purposes.

