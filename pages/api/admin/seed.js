// One-time seed endpoint for initial database setup
const prisma = require('@/lib/prisma');
const bcrypt = require('bcryptjs');
const data = require('@/lib/data');

export default async function handler(req, res) {
  // Support both GET and POST for easier access
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Starting database seed...');

    // Check if courses already exist
    const existingCourses = await prisma.course.findMany();
    if (existingCourses.length > 0) {
      return res.status(200).json({ 
        message: 'Database already seeded',
        courses: existingCourses.length,
        skipped: true
      });
    }

    // Create courses
    const courses = [
      { code: 'CS101', title: 'Introduction to Computer Science' },
      { code: 'MATH201', title: 'Calculus I' },
      { code: 'PHYS301', title: 'Physics for Engineers' },
      { code: 'ENG101', title: 'English Composition' },
      { code: 'ENGINEERING103', title: 'Introduction to Engineering' },
    ];

    for (const course of courses) {
      await prisma.course.upsert({
        where: { code: course.code },
        update: {},
        create: course,
      });
    }

    console.log('Created courses');

    // Create CS101 groups
    const cs101Code = 'CS101';
    const seededGroups = [
      { name: 'Algorithm Masters', creator: 'Alice Chen' },
      { name: 'Data Structures Team', creator: 'Bob Smith' },
      { name: 'Code Review Squad', creator: 'Charlie Brown' },
      { name: 'Study Buddies', creator: 'Diana Prince' },
    ];

    for (const { name, creator } of seededGroups) {
      // Create group with creator
      const group = await prisma.group.create({
        data: {
          name,
          courseCode: cs101Code,
          creatorName: creator,
          isOpen: true,
        },
      });

      // Add creator as member
      await prisma.groupMember.create({
        data: {
          groupId: group.id,
          userName: creator,
        },
      });

      // Add to roster
      await prisma.rosterEntry.upsert({
        where: {
          courseCode_userName: {
            courseCode: cs101Code,
            userName: creator,
          },
        },
        update: {},
        create: {
          courseCode: cs101Code,
          userName: creator,
        },
      });
    }

    console.log('Created CS101 groups');

    // Create test user john_doe
    const hashedPassword = await bcrypt.hash('password123', 10);

    const user = await prisma.user.upsert({
      where: { userName: 'john_doe' },
      update: {},
      create: {
        userName: 'john_doe',
        password: hashedPassword,
      },
    });

    // Create ENGINEERING103 group with john_doe as leader
    const eng103Group = await prisma.group.findFirst({
      where: {
        courseCode: 'ENGINEERING103',
        creatorName: 'john_doe',
      },
    });

    if (!eng103Group) {
      const newGroup = await prisma.group.create({
        data: {
          name: 'Engineering Study Group',
          courseCode: 'ENGINEERING103',
          creatorName: user.userName,
          isOpen: true,
        },
      });

      await prisma.groupMember.create({
        data: {
          groupId: newGroup.id,
          userName: user.userName,
        },
      });

      await prisma.rosterEntry.upsert({
        where: {
          courseCode_userName: {
            courseCode: 'ENGINEERING103',
            userName: user.userName,
          },
        },
        update: {},
        create: {
          courseCode: 'ENGINEERING103',
          userName: user.userName,
        },
      });

      await prisma.message.create({
        data: {
          groupId: newGroup.id,
          author: user.userName,
          text: 'Welcome to Engineering Study Group!',
        },
      });

      console.log('✅ Created ENGINEERING103 group with john_doe as leader');
    }

    // Get final counts
    const courseCount = await prisma.course.count();
    const groupCount = await prisma.group.count();
    const userCount = await prisma.user.count();

    console.log('✅ Seeding completed!');

    return res.status(200).json({
      message: 'Database seeded successfully',
      counts: {
        courses: courseCount,
        groups: groupCount,
        users: userCount,
      },
      testUser: {
        username: 'john_doe',
        password: 'password123',
      },
    });
  } catch (error) {
    console.error('Error seeding database:', error);
    return res.status(500).json({
      error: 'Failed to seed database',
      message: error.message,
    });
  }
}

