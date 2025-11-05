#!/usr/bin/env node
/**
 * Cleanup script for load test data
 * Removes all [TEST] tagged data
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const TEST_PREFIX = '[TEST]';

async function main() {
  console.log('Cleaning up test data...');

  // Find all test data
  const testUsers = await prisma.user.findMany({
    where: {
      userName: {
        contains: TEST_PREFIX,
      },
    },
  });

  const testMessages = await prisma.message.findMany({
    where: {
      OR: [
        { author: { contains: TEST_PREFIX } },
        { text: { contains: TEST_PREFIX } },
      ],
    },
    include: {
      group: true,
    },
  });

  const testGroups = await prisma.group.findMany({
    where: {
      name: {
        contains: TEST_PREFIX,
      },
    },
  });

  // Delete in correct order to respect foreign keys
  // 1. Delete messages
  if (testMessages.length > 0) {
    const messageIds = testMessages.map(m => m.id);
    await prisma.message.deleteMany({
      where: {
        id: {
          in: messageIds,
        },
      },
    });
    console.log(`Deleted ${messageIds.length} test messages`);
  }

  // 2. Delete group members
  const testGroupIds = testGroups.map(g => g.id);
  if (testGroupIds.length > 0) {
    await prisma.groupMember.deleteMany({
      where: {
        groupId: {
          in: testGroupIds,
        },
      },
    });
  }

  // 3. Delete groups
  if (testGroups.length > 0) {
    await prisma.group.deleteMany({
      where: {
        id: {
          in: testGroupIds,
        },
      },
    });
    console.log(`Deleted ${testGroups.length} test groups`);
  }

  // 4. Delete roster entries
  if (testUsers.length > 0) {
    const testUsernames = testUsers.map(u => u.userName);
    await prisma.rosterEntry.deleteMany({
      where: {
        userName: {
          in: testUsernames,
        },
      },
    });
  }

  // 5. Delete audit logs
  await prisma.auditLog.deleteMany({
    where: {
      OR: [
        { actor: { contains: TEST_PREFIX } },
        { detail: { contains: TEST_PREFIX } },
      ],
    },
  });

  // 6. Delete users
  if (testUsers.length > 0) {
    await prisma.user.deleteMany({
      where: {
        userName: {
          in: testUsers.map(u => u.userName),
        },
      },
    });
    console.log(`Deleted ${testUsers.length} test users`);
  }

  console.log('Cleanup complete!');
}

main()
  .catch((error) => {
    console.error('Error during cleanup:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

