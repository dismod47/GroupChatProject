// Data access layer using Prisma + SQLite

const prisma = require('./prisma');
const bcrypt = require('bcryptjs');
const audit = require('./audit');

// Get all courses
async function getAllCourses() {
  const courses = await prisma.course.findMany({
    orderBy: { code: 'asc' },
  });
  return courses;
}

// Get course by code
async function getCourse(courseCode) {
  const course = await prisma.course.findUnique({
    where: { code: courseCode },
  });
  return course;
}

// Add to roster
async function addToRoster(courseCode, name) {
  await prisma.rosterEntry.upsert({
    where: {
      courseCode_userName: {
        courseCode,
        userName: name,
      },
    },
    update: {},
    create: {
      courseCode,
      userName: name,
    },
  });
  
  const roster = await prisma.rosterEntry.findMany({
    where: { courseCode },
    select: { userName: true },
  });
  return roster.map(r => r.userName);
}

// Get roster with status
async function getRosterWithStatus(courseCode) {
  const roster = await prisma.rosterEntry.findMany({
    where: { courseCode },
    select: { userName: true },
  });

  const groupMembers = await prisma.groupMember.findMany({
    where: {
      group: {
        courseCode,
      },
    },
    select: { userName: true },
  });

  // Get unique user names using Set
  const inGroups = new Set(groupMembers.map(gm => gm.userName));

  return roster.map(r => ({
    name: r.userName,
    status: inGroups.has(r.userName) ? 'IN_GROUP' : 'OPEN',
  }));
}

// Get groups for course
async function getGroups(courseCode) {
  const groups = await prisma.group.findMany({
    where: { courseCode },
    include: {
      members: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return groups.map(g => ({
    id: g.id,
    name: g.name,
    size: g.members.length,
    maxSize: 5,
    isOpen: g.isOpen,
    creatorName: g.creatorName,
  }));
}

// Get group by ID (searches across all courses)
async function getGroup(courseCode, groupId) {
  // First try the specified course
  let group = await prisma.group.findFirst({
    where: {
      id: groupId,
      courseCode,
    },
    include: {
      members: true,
      messages: {
        orderBy: { timestamp: 'asc' },
        take: 50, // Keep only last 50
      },
    },
  });

  // If not found, search all courses
  if (!group) {
    group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: true,
        messages: {
          orderBy: { timestamp: 'asc' },
          take: 50,
        },
      },
    });
  }

  if (!group) return null;

  // Format to match old structure
  return {
    id: group.id,
    name: group.name,
    courseCode: group.courseCode,
    members: group.members.map(m => m.userName),
    isOpen: group.isOpen,
    messages: group.messages.map(m => ({
      id: m.id,
      author: m.author,
      text: m.text,
      timestamp: m.timestamp.getTime(),
    })),
    createdAt: group.createdAt.getTime(),
    creatorName: group.creatorName,
  };
}

// Create group
async function createGroup(courseCode, groupName, creatorName) {
  // Use transaction to ensure atomicity and enforce one-group-per-course constraint
  const result = await prisma.$transaction(async (tx) => {
    // Database-level enforcement: Check if user already in ANY group for this course
    const existingMember = await tx.groupMember.findFirst({
      where: {
        userName: creatorName,
        group: {
          courseCode,
        },
      },
      select: { 
        groupId: true,
        group: {
          select: {
            name: true,
          },
        },
      },
    });

    if (existingMember) {
      return { 
        error: 'ALREADY_IN_GROUP', 
        message: "You're already in a group for this course.",
        groupId: existingMember.groupId 
      };
    }

    // Create group with creator as first member and owner
    const newGroup = await tx.group.create({
      data: {
        name: groupName,
        courseCode,
        creatorName: creatorName,
        isOpen: true,
        members: {
          create: {
            userName: creatorName,
          },
        },
      },
      include: {
        members: true,
      },
    });

    // Add to roster (within transaction)
    await tx.rosterEntry.upsert({
      where: {
        courseCode_userName: {
          courseCode: courseCode,
          userName: creatorName,
        },
      },
      update: {},
      create: {
        courseCode: courseCode,
        userName: creatorName,
      },
    });

    return {
      group: {
        id: newGroup.id,
        name: newGroup.name,
        members: newGroup.members.map(m => m.userName),
        isOpen: newGroup.isOpen,
        messages: [],
        createdAt: newGroup.createdAt.getTime(),
        creatorName: newGroup.creatorName,
      },
    };
  });

  // Audit log (outside transaction)
  if (result && result.group && !result.error) {
    await audit.logEvent(creatorName, 'GROUP_CREATED', 'group', result.group.id, `Course: ${courseCode}`);
  }
  
  return result;
}

// Join group
async function joinGroup(courseCode, groupId, userName) {
  // Use transaction to ensure atomicity and enforce one-group-per-course constraint
  const result = await prisma.$transaction(async (tx) => {
    // Find the group (may be in different course than specified)
    let group = await tx.group.findFirst({
      where: {
        id: groupId,
        courseCode,
      },
      include: {
        members: true,
        course: true,
      },
    });

    let actualCourseCode = courseCode;

    // If not found, search all courses
    if (!group) {
      group = await tx.group.findUnique({
        where: { id: groupId },
        include: {
          members: true,
          course: true,
        },
      });
      if (group) {
        actualCourseCode = group.course.code;
      }
    }

    if (!group) {
      return { error: 'GROUP_NOT_FOUND' };
    }

    // Database-level enforcement: Check if user already in ANY group for this course
    const existingMember = await tx.groupMember.findFirst({
      where: {
        userName,
        group: {
          courseCode: actualCourseCode,
        },
      },
      select: { 
        groupId: true,
        group: {
          select: {
            name: true,
          },
        },
      },
    });

    if (existingMember) {
      return { 
        error: 'ALREADY_IN_GROUP', 
        message: "You're already in a group for this course.",
        groupId: existingMember.groupId 
      };
    }

    // Additional validations
    if (!group.isOpen) {
      return { error: 'GROUP_CLOSED' };
    }

    // Check current member count within transaction
    const currentMemberCount = await tx.groupMember.count({
      where: { groupId: group.id },
    });

    if (currentMemberCount >= 5) {
      return { error: 'GROUP_FULL' };
    }

    // Create group membership
    await tx.groupMember.create({
      data: {
        groupId: group.id,
        userName,
      },
    });

    // Add to roster (within transaction)
    await tx.rosterEntry.upsert({
      where: {
        courseCode_userName: {
          courseCode: actualCourseCode,
          userName: userName,
        },
      },
      update: {},
      create: {
        courseCode: actualCourseCode,
        userName: userName,
      },
    });

    // Fetch updated group
    const updatedGroup = await tx.group.findUnique({
      where: { id: groupId },
      include: {
        members: true,
      },
    });

    // Get creator from group's creatorName field
    const groupWithCreator = await tx.group.findUnique({
      where: { id: groupId },
      select: { creatorName: true },
    });

    return {
      group: {
        id: updatedGroup.id,
        name: updatedGroup.name,
        members: updatedGroup.members.map(m => m.userName),
        isOpen: updatedGroup.isOpen,
        messages: [],
        createdAt: updatedGroup.createdAt.getTime(),
        creatorName: groupWithCreator?.creatorName || null,
      },
    };
  });

  // Audit log (outside transaction)
  if (result && result.group && !result.error) {
    await audit.logEvent(userName, 'GROUP_JOINED', 'group', groupId, `Course: ${result.group.courseCode || courseCode}`);
  }
  
  return result;
}

// Leave group
async function leaveGroup(courseCode, groupId, userName) {
  // Use transaction to ensure atomicity
  return await prisma.$transaction(async (tx) => {
    // Check if user is a member
    const member = await tx.groupMember.findUnique({
      where: {
        groupId_userName: {
          groupId,
          userName,
        },
      },
    });

    if (!member) {
      return { error: 'NOT_MEMBER' };
    }

    // Remove member
    await tx.groupMember.delete({
      where: {
        id: member.id,
      },
    });

    // Check if group is now empty
    const remainingMembers = await tx.groupMember.count({
      where: { groupId },
    });

    if (remainingMembers === 0) {
      // Auto-delete empty group (messages and members cascade delete via schema)
      await tx.group.delete({
        where: { id: groupId },
      });
      return { group: null, archived: true };
    }

    // Fetch updated group
    const updatedGroup = await tx.group.findUnique({
      where: { id: groupId },
      include: {
        members: true,
      },
    });

    return {
      group: {
        id: updatedGroup.id,
        name: updatedGroup.name,
        members: updatedGroup.members.map(m => m.userName),
        isOpen: updatedGroup.isOpen,
        messages: [],
        createdAt: updatedGroup.createdAt.getTime(),
      },
    };
  });

  // Audit log (outside transaction)
  if (result) {
    if (result.archived) {
      await audit.logEvent('system', 'GROUP_AUTO_DELETED', 'group', groupId, `Course: ${courseCode}`);
    } else if (result.group && !result.error) {
      await audit.logEvent(userName, 'GROUP_LEFT', 'group', groupId, `Course: ${courseCode}`);
    }
  }
  
  return result;
}

// Toggle group open/closed
async function toggleGroupStatus(courseCode, groupId, userName) {
  // Check if user is a member
  const member = await prisma.groupMember.findUnique({
    where: {
      groupId_userName: {
        groupId,
        userName,
      },
    },
  });

  if (!member) {
    return { error: 'NOT_MEMBER' };
  }

  // Get current status and toggle
  const group = await prisma.group.findUnique({
    where: { id: groupId },
  });

  const updatedGroup = await prisma.group.update({
    where: { id: groupId },
    data: {
      isOpen: !group.isOpen,
    },
    include: {
      members: true,
    },
  });

  // Audit log
  await audit.logEvent(userName, 'GROUP_TOGGLED', 'group', groupId, `Status: ${updatedGroup.isOpen ? 'OPEN' : 'CLOSED'}`);

  return {
    group: {
      id: updatedGroup.id,
      name: updatedGroup.name,
      members: updatedGroup.members.map(m => m.userName),
      isOpen: updatedGroup.isOpen,
      messages: [],
      createdAt: updatedGroup.createdAt.getTime(),
      creatorName: updatedGroup.creatorName,
    },
  };
}

// Add message to group chat
async function addMessage(courseCode, groupId, userName, messageText) {
  const { sanitizeMessage } = require('./messageSanitize');

  // Check if user is a member
  const member = await prisma.groupMember.findUnique({
    where: {
      groupId_userName: {
        groupId,
        userName,
      },
    },
  });

  if (!member) {
    return { error: 'NOT_MEMBER' };
  }

  // Sanitize message
  const sanitizedText = sanitizeMessage(messageText);
  if (!sanitizedText) {
    return { error: 'EMPTY_MESSAGE' };
  }

  // Create message
  const message = await prisma.message.create({
    data: {
      groupId,
      author: userName,
      text: sanitizedText,
    },
  });

  // Clean up old messages (keep only last 50 non-deleted)
  const allMessages = await prisma.message.findMany({
    where: { 
      groupId,
      deleted: false, // Only count non-deleted messages
    },
    orderBy: { timestamp: 'asc' },
    select: { id: true },
  });

  if (allMessages.length > 50) {
    const messagesToDelete = allMessages.slice(0, allMessages.length - 50);
    await prisma.message.deleteMany({
      where: {
        id: {
          in: messagesToDelete.map(m => m.id),
        },
      },
    });
  }

  // Audit log
  await audit.logEvent(userName, 'MESSAGE_POSTED', 'message', message.id, `Group: ${groupId}`);

  return {
    message: {
      id: message.id,
      author: message.author,
      text: message.text,
      timestamp: message.timestamp.getTime(),
    },
  };
}

// Get messages for group (excludes deleted messages)
async function getMessages(courseCode, groupId) {
  // Find group to verify it exists
  const group = await prisma.group.findUnique({
    where: { id: groupId },
  });

  if (!group) {
    return { error: 'GROUP_NOT_FOUND' };
  }

  const messages = await prisma.message.findMany({
    where: { 
      groupId,
      deleted: false, // Only get non-deleted messages
    },
    include: {
      reactions: {
        select: {
          emoji: true,
          userName: true,
        },
      },
    },
    orderBy: { timestamp: 'asc' },
    take: 50,
  });

  // Group reactions by emoji and count
  return {
    messages: messages.map(m => {
      // Aggregate reactions: { emoji: [usernames] }
      const reactionsByEmoji = {};
      m.reactions.forEach(r => {
        if (!reactionsByEmoji[r.emoji]) {
          reactionsByEmoji[r.emoji] = [];
        }
        reactionsByEmoji[r.emoji].push(r.userName);
      });

      return {
        id: m.id,
        author: m.author,
        text: m.text,
        timestamp: m.timestamp.getTime(),
        reported: m.reported,
        reactions: reactionsByEmoji,
      };
    }),
  };
}

// Report a message
async function reportMessage(courseCode, groupId, messageId, userName) {
  // Verify user exists (can be any authenticated user)
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: {
      group: true,
    },
  });

  if (!message || message.groupId !== groupId) {
    return { error: 'MESSAGE_NOT_FOUND' };
  }

  if (message.deleted) {
    return { error: 'MESSAGE_DELETED' };
  }

  // Mark as reported
  await prisma.message.update({
    where: { id: messageId },
    data: { reported: true },
  });

  // Audit log
  await audit.logEvent(userName, 'MESSAGE_REPORTED', 'message', messageId, `Group: ${groupId}`);

  return { success: true };
}

// Soft-delete a message (owners/admins only)
async function deleteMessage(courseCode, groupId, messageId, userName) {
  // Allow admin to delete any message (userName === 'admin' bypasses owner check)
  if (userName === 'admin') {
    await prisma.message.update({
      where: { id: messageId },
      data: { deleted: true },
    });
    // Audit log
    await audit.logEvent(userName, 'MESSAGE_DELETED', 'message', messageId, `Group: ${groupId} (admin)`);
    return { success: true };
  }

  // For non-admin users, check if user is group owner
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { creatorName: true },
  });

  if (!group) {
    return { error: 'GROUP_NOT_FOUND' };
  }

  if (group.creatorName !== userName) {
    return { error: 'NOT_OWNER' };
  }

  // Soft-delete message
  await prisma.message.update({
    where: { id: messageId },
    data: { deleted: true },
  });

  // Audit log
  await audit.logEvent(userName, 'MESSAGE_DELETED', 'message', messageId, `Group: ${groupId}`);

  return { success: true };
}

// Check if user is in group
async function isUserInGroup(courseCode, userName) {
  const member = await prisma.groupMember.findFirst({
    where: {
      userName,
      group: {
        courseCode,
      },
    },
    select: { groupId: true },
  });

  return member ? member.groupId : null;
}

// Authenticate user (login or create)
async function authenticateUser(userName, password, createIfNotExists = false) {
  // Try to find existing user
  const existingUser = await prisma.user.findUnique({
    where: { userName },
  });

  if (existingUser) {
    // Verify password
    const isValid = await bcrypt.compare(password, existingUser.password);
    if (!isValid) {
      return { error: 'INVALID_PASSWORD', message: 'Incorrect password' };
    }
    // Audit log for successful login
    await audit.logEvent(userName, 'USER_LOGIN', 'user', userName);
    return { userName: existingUser.userName };
  }

  // User doesn't exist
  if (!createIfNotExists) {
    return { error: 'USER_NOT_FOUND', message: 'User not found. Please create an account.' };
  }

  // Create new user
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = await prisma.user.create({
    data: {
      userName,
      password: hashedPassword,
    },
  });

  // Audit log for account creation
  await audit.logEvent(userName, 'USER_REGISTERED', 'user', userName);

  return { userName: newUser.userName };
}

// Get all groups for a user across all courses
async function getUserGroups(userName) {
  // Find all group memberships
  const memberships = await prisma.groupMember.findMany({
    where: { userName },
    include: {
      group: {
        include: {
          course: true,
          members: true,
        },
      },
    },
    orderBy: {
      group: {
        createdAt: 'desc',
      },
    },
  });

  // Format the response
  return memberships.map(m => ({
    groupId: m.group.id,
    groupName: m.group.name,
    courseCode: m.group.course.code,
    courseTitle: m.group.course.title,
    isOpen: m.group.isOpen,
    size: m.group.members.length,
    maxSize: 5,
  }));
}

// Update user name (requires password verification and updates all references)
async function updateUserName(oldUserName, newUserName, password) {
  // Use transaction to ensure atomicity across all updates
  return await prisma.$transaction(async (tx) => {
    // Verify user exists and password is correct
    const user = await tx.user.findUnique({
      where: { userName: oldUserName },
    });

    if (!user) {
      return { error: 'USER_NOT_FOUND', message: 'User not found.' };
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return { error: 'INVALID_PASSWORD', message: 'Incorrect password.' };
    }

    // Check if new username already exists
    const existingUser = await tx.user.findUnique({
      where: { userName: newUserName },
    });

    if (existingUser) {
      return { error: 'USERNAME_TAKEN', message: 'This name is already taken. Please choose another.' };
    }

    // Update User table
    await tx.user.update({
      where: { userName: oldUserName },
      data: { userName: newUserName },
    });

    // Update all GroupMember entries
    await tx.groupMember.updateMany({
      where: { userName: oldUserName },
      data: { userName: newUserName },
    });

    // Update all RosterEntry entries
    await tx.rosterEntry.updateMany({
      where: { userName: oldUserName },
      data: { userName: newUserName },
    });

    // Update all Message author fields
    await tx.message.updateMany({
      where: { author: oldUserName },
      data: { author: newUserName },
    });

    // Update Group creatorName if user is a creator
    await tx.group.updateMany({
      where: { creatorName: oldUserName },
      data: { creatorName: newUserName },
    });

    // Audit log (outside transaction)
    await audit.logEvent(oldUserName, 'USER_NAME_CHANGED', 'user', oldUserName, `To: ${newUserName}`);

    return { userName: newUserName };
  });
}

// Toggle reaction on a message (add if not exists, remove if exists)
async function toggleReaction(messageId, userName, emoji) {
  // Validate emoji (only allow 👍, ❤️, 💡)
  const allowedEmojis = ['👍', '❤️', '💡'];
  if (!allowedEmojis.includes(emoji)) {
    return { error: 'INVALID_EMOJI' };
  }

  // Check if message exists and is not deleted
  const message = await prisma.message.findUnique({
    where: { id: messageId },
  });

  if (!message || message.deleted) {
    return { error: 'MESSAGE_NOT_FOUND' };
  }

  // Check if reaction already exists
  const existingReaction = await prisma.reaction.findUnique({
    where: {
      messageId_userName_emoji: {
        messageId,
        userName,
        emoji,
      },
    },
  });

  if (existingReaction) {
    // Remove reaction
    await prisma.reaction.delete({
      where: {
        messageId_userName_emoji: {
          messageId,
          userName,
          emoji,
        },
      },
    });

    // Audit log
    await audit.logEvent(userName, 'REACTION_REMOVED', 'message', messageId, `Emoji: ${emoji}`);

    return { action: 'removed' };
  } else {
    // Add reaction
    await prisma.reaction.create({
      data: {
        messageId,
        userName,
        emoji,
      },
    });

    // Audit log
    await audit.logEvent(userName, 'REACTION_ADDED', 'message', messageId, `Emoji: ${emoji}`);

    return { action: 'added' };
  }
}

module.exports = {
  getAllCourses,
  getCourse,
  getGroups,
  getGroup,
  getRosterWithStatus,
  createGroup,
  joinGroup,
  leaveGroup,
  toggleGroupStatus,
  addMessage,
  getMessages,
  isUserInGroup,
  authenticateUser,
  getUserGroups,
  reportMessage,
  deleteMessage,
  updateUserName,
  toggleReaction,
};
