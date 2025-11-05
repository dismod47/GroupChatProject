#!/usr/bin/env node
/**
 * Seed script for load testing
 * Creates test data tagged with [TEST] prefix
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();
const TEST_PREFIX = '[TEST]';

async function main() {
  console.log('Seeding test data for load testing...');

  // Create test users
  const testUsers = [];
  for (let i = 1; i <= 50; i++) {
    const userName = `${TEST_PREFIX}User${i}`;
    const hashedPassword = await bcrypt.hash('testpass123', 10);
    
    try {
      await prisma.user.upsert({
        where: { userName },
        update: {},
        create: {
          userName,
          password: hashedPassword,
        },
      });
      testUsers.push(userName);
    } catch (error) {
      // Ignore if already exists
    }
  }
  console.log(`Created ${testUsers.length} test users`);

  // Get CS101 course
  const cs101 = await prisma.course.findUnique({
    where: { code: 'CS101' },
  });

  if (!cs101) {
    console.error('CS101 course not found. Please run prisma seed first.');
    process.exit(1);
  }

  // Add test users to roster
  for (const userName of testUsers) {
    await prisma.rosterEntry.upsert({
      where: {
        courseCode_userName: {
          courseCode: 'CS101',
          userName,
        },
      },
      update: {},
      create: {
        courseCode: 'CS101',
        userName,
      },
    });
  }
  console.log('Added test users to CS101 roster');

  // Create test groups
  const testGroups = [];
  for (let i = 1; i <= 10; i++) {
    const groupName = `${TEST_PREFIX}Group${i}`;
    const creatorName = testUsers[i % testUsers.length]; // Distribute creators

    try {
      const group = await prisma.group.create({
        data: {
          name: groupName,
          courseCode: 'CS101',
          creatorName,
          isOpen: true,
          members: {
            create: {
              userName: creatorName,
            },
          },
        },
      });
      testGroups.push(group);
    } catch (error) {
      // Ignore if creation fails (e.g., user already in another group)
    }
  }
  console.log(`Created ${testGroups.length} test groups`);

  // Create test messages in a few groups
  const messagesCreated = [];
  for (let i = 0; i < Math.min(5, testGroups.length); i++) {
    const group = testGroups[i];
    for (let j = 1; j <= 20; j++) {
      const messageText = `${TEST_PREFIX} Message ${j} in ${group.name}`;
      try {
        await prisma.message.create({
          data: {
            groupId: group.id,
            author: group.creatorName,
            text: messageText,
          },
        });
        messagesCreated.push(messageText);
      } catch (error) {
        // Ignore
      }
    }
  }
  console.log(`Created ${messagesCreated.length} test messages`);

  console.log('\nTest data seeded successfully!');
}

main()
  .catch((error) => {
    console.error('Error seeding test data:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

