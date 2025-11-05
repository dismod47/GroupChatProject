// Seed script for initial data
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

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

  // Check if groups already exist
  const existingGroups = await prisma.group.findMany({
    where: { courseCode: cs101Code },
  });

  if (existingGroups.length === 0) {
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
  } else {
    console.log('CS101 groups already exist, skipping');
  }

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
  } else {
    console.log('ℹ️  ENGINEERING103 group already exists');
  }

  console.log('✅ User: john_doe (password: password123)');
  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

