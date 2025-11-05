#!/usr/bin/env node
/**
 * Flow test script for GroupChatProject
 * Creates 50 test students, 6 groups for MATH201, fills them, and sends 50 conversational messages per group
 */

const data = require('../lib/data');
const prisma = require('../lib/prisma');

const NUM_STUDENTS = 50;
const NUM_GROUPS = 6;
const MESSAGES_PER_GROUP = 50;
const COURSE_CODE = 'MATH201';
const TEST_PREFIX = '[TEST]';
const DELAY_MS = 1000; // 1 second delay between actions

const testUserNames = [];
const testGroups = [];

// Helper to log progress
function log(message) {
  console.log(`[FLOWTEST] ${message}`);
}

async function main() {
  log('Starting flow test...');

  // Step 1: Create 50 test students
  log(`Creating ${NUM_STUDENTS} test students...`);
  for (let i = 1; i <= NUM_STUDENTS; i++) {
    const userName = `${TEST_PREFIX}Student${i}`;
    const password = 'testpass123';
    
    try {
      const result = await data.authenticateUser(userName, password, true);
      if (result.error) {
        log(`Failed to create user ${userName}: ${result.error}`);
      } else {
        testUserNames.push(userName);
        log(`Created user ${i}/${NUM_STUDENTS}: ${userName}`);
      }
    } catch (error) {
      log(`Error creating user ${userName}: ${error.message}`);
    }
    
    // Wait 1 second between each user creation
    if (i < NUM_STUDENTS) {
      await new Promise(resolve => setTimeout(resolve, DELAY_MS));
    }
  }
  log(`Created ${testUserNames.length} test students`);

  // Step 2: All 50 students log in
  log('All students logging in...');
  for (let i = 0; i < testUserNames.length; i++) {
    const userName = testUserNames[i];
    try {
      const result = await data.authenticateUser(userName, 'testpass123', false);
      if (result.error) {
        log(`Failed login for ${userName}: ${result.error}`);
      } else {
        log(`Logged in ${i + 1}/${testUserNames.length}: ${userName}`);
      }
    } catch (error) {
      log(`Error logging in ${userName}: ${error.message}`);
    }
    
    // Wait 1 second between each login
    if (i < testUserNames.length - 1) {
      await new Promise(resolve => setTimeout(resolve, DELAY_MS));
    }
  }
  log('All students logged in');

  // Step 3: 6 students create separate groups with different names
  log(`Creating ${NUM_GROUPS} groups for ${COURSE_CODE}...`);
  const groupNames = [
    `${TEST_PREFIX} Calculus Warriors`,
    `${TEST_PREFIX} Math Gurus`,
    `${TEST_PREFIX} Number Crunchers`,
    `${TEST_PREFIX} Derivative Masters`,
    `${TEST_PREFIX} Integration Squad`,
    `${TEST_PREFIX} Limit Busters`
  ];
  
  const creators = testUserNames.slice(0, NUM_GROUPS);
  
  for (let i = 0; i < NUM_GROUPS && i < creators.length; i++) {
    try {
      const result = await data.createGroup(COURSE_CODE, groupNames[i], creators[i]);
      if (result.error) {
        log(`Failed to create group ${groupNames[i]}: ${result.error}`);
      } else {
        testGroups.push({
          id: result.group.id,
          name: groupNames[i],
          creator: creators[i]
        });
        log(`Created group ${i + 1}/${NUM_GROUPS}: ${groupNames[i]}`);
      }
    } catch (error) {
      log(`Error creating group ${groupNames[i]}: ${error.message}`);
    }
    
    // Wait 1 second between each group creation
    if (i < NUM_GROUPS - 1 && i < creators.length - 1) {
      await new Promise(resolve => setTimeout(resolve, DELAY_MS));
    }
  }
  log(`Created ${testGroups.length} groups`);

  // Step 4: Remaining students join groups randomly
  log('Filling groups with remaining students...');
  const remainingStudents = testUserNames.slice(NUM_GROUPS);
  let totalJoined = 0;
  
  for (let i = 0; i < remainingStudents.length; i++) {
    const student = remainingStudents[i];
    // Try to join a random group
    const availableGroups = [];
    for (const group of testGroups) {
      try {
        // Check current size
        const groupData = await data.getGroup(COURSE_CODE, group.id);
        if (groupData && groupData.members.length < 5) {
          availableGroups.push(group);
        }
      } catch (error) {
        log(`Error checking group ${group.name}: ${error.message}`);
      }
    }
    
    if (availableGroups.length > 0) {
      const randomGroup = availableGroups[Math.floor(Math.random() * availableGroups.length)];
      try {
        const result = await data.joinGroup(COURSE_CODE, randomGroup.id, student);
        if (result.error) {
          log(`Failed to join ${randomGroup.name}: ${result.error}`);
        } else {
          totalJoined++;
          log(`Joined ${i + 1}/${remainingStudents.length}: ${student} → ${randomGroup.name}`);
        }
      } catch (error) {
        log(`Error joining ${randomGroup.name}: ${error.message}`);
      }
    } else {
      log(`No available groups for ${student}`);
    }
    
    // Wait 1 second between each join
    if (i < remainingStudents.length - 1) {
      await new Promise(resolve => setTimeout(resolve, DELAY_MS));
    }
  }
  log(`Filled groups: ${totalJoined} students joined`);

  // Step 5: Students send 50 messages per group collectively (conversational)
  log(`Sending ${MESSAGES_PER_GROUP} messages per group...`);
  
  // Conversation templates for each group
  const conversationTemplates = [
    // Calculus Warriors
    [
      "Hey everyone! Ready to tackle these limits?",
      "I'm confused about L'Hospital's rule, can someone explain?",
      "Sure! Use it when you get 0/0 or infinity/infinity forms.",
      "Oh that makes sense! What about indeterminate forms?",
      "Those are tricky, you need to manipulate the expression first.",
      "Anyone have the notes from today's lecture?",
      "I'll share mine after I scan them!",
      "Thanks! You're a lifesaver",
      "Did you finish the homework problems?",
      "Yeah, but question 5 was brutal!",
      "I got stuck on that one too, anyone figure it out?",
      "I did! It's about continuity at a point.",
      "Can we do a review session this weekend?",
      "I'm down! Library at 2pm Saturday?",
      "Perfect! I'll bring snacks.",
      "Let's cover chapters 5 and 6 for the exam.",
      "Agreed. Those are definitely going to be on there.",
      "Should we create a study guide together?",
      "Great idea! I'll start with the key theorems.",
      "I can do the practice problems section.",
      "Don't forget about the chain rule examples!",
      "Right, that's super important.",
      "What about related rates?",
      "Those are my weak point for sure.",
      "We should practice those extra hard then.",
      "Sounds good. I'll bring my textbook.",
      "Anyone know what's on the exam format?",
      "I heard it's mostly conceptual questions.",
      "That's better than all calculations!",
      "I need to brush up on my trig identities though.",
      "Same here! There's so many to remember.",
      "Make flashcards, that's what I did.",
      "Good tip! I'll try that.",
      "Don't forget about the office hours this week!",
      "When is professor's office hours again?",
      "Tuesday and Thursday, 3-5pm in MATH 301.",
      "Perfect, I'll swing by with my questions.",
      "Let's make sure everyone's ready for this exam.",
      "We got this! Study hard everyone.",
      "Group effort! We'll all pass!",
      "Thanks for all the help guys.",
      "This is what study groups are for!",
      "Can someone explain the fundamental theorem of calculus?",
      "It connects differentiation and integration basically.",
      "More specifically, it's about the relationship between derivatives and integrals.",
      "That's the key concept for the whole course.",
      "Thanks for clarifying that!",
      "No problem, we're all in this together.",
      "I feel much more confident now.",
      "We should study together more often!",
      "Definitely! This group is really helpful."
    ],
    // Math Gurus
    [
      "What's up everyone! Ready to master calculus?",
      "I hope so! This exam is stressing me out.",
      "You've got this! We're here to help.",
      "I'm struggling with optimization problems.",
      "Those are tough! Let me break it down...",
      "Start by identifying what you're trying to maximize/minimize.",
      "Then find the constraints, right?",
      "Exactly! Set up the equation and take derivatives.",
      "Thanks! That makes it clearer.",
      "No worries! Anyone else need help?",
      "I do! The volume maximization problems confuse me.",
      "Those are fun once you get the pattern.",
      "Can we go through one example together?",
      "Sure! Here's how I approach them...",
      "This is so much easier in a group!",
      "Collaboration is key for calculus.",
      "I agree! Learning together helps.",
      "Should we meet up tomorrow to study?",
      "I'm free after 2pm if that works.",
      "Works for me! I'll book a study room.",
      "Great! I'll bring my notes.",
      "Don't forget to review the integration rules!",
      "Those are crucial for the exam.",
      "What about substitution method?",
      "That's my favorite technique!",
      "I'm still getting the hang of it.",
      "We can practice together.",
      "Thanks! I appreciate the support.",
      "This group is amazing!",
      "Let's make sure we all ace this test.",
      "When is everyone free this week?",
      "I'm free most afternoons.",
      "Same here, except Wednesday.",
      "What time works best for everyone?",
      "How about 3pm on Thursday?",
      "Perfect! I'll be there.",
      "Me too! What should we focus on?",
      "Let's go through the practice test together.",
      "Good idea! I'll print copies for everyone.",
      "You're the best!",
      "Don't forget about proper notation!",
      "That's so important for partial credit.",
      "Neat handwriting helps too.",
      "I need to practice that!",
      "We can all work on it together.",
      "Thanks for all the encouragement everyone!",
      "We're a team! We succeed together.",
      "I feel way more prepared now.",
      "This is exactly what I needed!",
      "Let's keep the momentum going!",
      "Agreed! Study hard everyone!"
    ],
    // Number Crunchers
    [
      "Hey team! Time to crunch some numbers!",
      "I love the energy! Let's do this!",
      "First question: derivatives or integrals?",
      "Derivatives are straightforward once you practice.",
      "I agree, but integration by parts trips me up.",
      "That's a common struggle! Want me to explain?",
      "Yes please! That would help a ton.",
      "It's basically the reverse of the product rule.",
      "So u*v rule but in reverse?",
      "Exactly! Choose u and dv strategically.",
      "What's the trick for choosing the right u?",
      "LIATE rule: Logarithms, Inverse trig, Algebraic, Trig, Exponential.",
      "Oh wow, that's a handy acronym!",
      "I'll never forget that now!",
      "Who's bringing snacks to the study session?",
      "I can bring chips and dip!",
      "I'll bring water and energy drinks.",
      "Perfect! I'll grab some cookies.",
      "We'll be fueled for hours!",
      "Let's tackle chapter 7 problems.",
      "Those are always on the exam.",
      "I'll start with the odd-numbered ones.",
      "I'll do the even ones!",
      "Great! Then we'll compare answers.",
      "Collaborative studying is the best.",
      "We should do this weekly.",
      "I'm totally in for that!",
      "What day works for everyone?",
      "How about Mondays at 4pm?",
      "I can do that! Library study room?",
      "Sounds perfect. I'll reserve it.",
      "Looking forward to it!",
      "Don't forget about the midpoint rule!",
      "That's for approximating integrals, right?",
      "Yes! And Simpson's rule too.",
      "Which one is more accurate?",
      "Simpson's rule generally is.",
      "Good to know for the exam!",
      "Anyone practice with the online tool?",
      "I did! It really helped visualize.",
      "The graphs make so much more sense now.",
      "We should all try it.",
      "I'll send the link in the chat.",
      "That would be awesome!",
      "Thanks for being so helpful everyone.",
      "We're all here to support each other!",
      "This group has made calculus way easier.",
      "I feel the same way!",
      "Let's keep this momentum going!",
      "Agreed! We've got this!"
    ],
    // Derivative Masters
    [
      "Welcome to the master class! Let's dominate calculus!",
      "I'm excited! Ready to learn everything!",
      "First topic: mastering the chain rule!",
      "That's the key to solving complex derivatives.",
      "Break it down into inside and outside functions.",
      "Then multiply the derivatives, right?",
      "Exactly! f'(g(x)) * g'(x)",
      "Thanks! I'm getting it now.",
      "Practice makes perfect with derivatives.",
      "I'll do all the assigned problems tonight.",
      "Same here! We can compare tomorrow.",
      "Good plan! I like our system.",
      "What about implicit differentiation?",
      "That's when you can't solve for y, right?",
      "Yes! Differentiate both sides with respect to x.",
      "Don't forget the chain rule applies to y!",
      "Right! That was my mistake on the last quiz.",
      "I made that error too!",
      "Let's make sure we don't repeat it.",
      "Study together and check each other's work.",
      "Great idea! Accountability helps.",
      "Should we create a formula sheet?",
      "Yes! But we won't have one on the exam, so we need to memorize.",
      "True, but making one helps us learn.",
      "Good point! I'll start compiling it.",
      "I'll add the trig derivative rules.",
      "I can add the exponential and logarithmic ones.",
      "Perfect! We'll have a complete reference.",
      "Anyone know what chapters the exam covers?",
      "I think it's chapters 3 through 6.",
      "That's a lot of material to review!",
      "We can break it down by week.",
      "Week 1: derivatives, Week 2: applications.",
      "Sounds like a solid plan!",
      "Let's also do practice exams.",
      "Those are so helpful for preparation.",
      "I'll find some online resources.",
      "Great! Share them in the group.",
      "Thanks for being so organized!",
      "Organization is key for success!",
      "I'm already feeling more prepared.",
      "Me too! This group is great.",
      "Don't forget about the power rule!",
      "That's the foundation of everything.",
      "d/dx(x^n) = n*x^(n-1)",
      "I'll never forget that formula!",
      "What about product and quotient rules?",
      "Those build on the power rule.",
      "Practice is essential for those.",
      "I'll do extra problems tonight.",
      "Let's support each other to success!",
      "We're all going to ace this!"
    ],
    // Integration Squad
    [
      "Hey squad! Let's integrate our knowledge!",
      "Love the pun! Ready to learn!",
      "Integration is just the reverse of differentiation.",
      "But somehow it feels so much harder!",
      "It's because there are more techniques to learn.",
      "True! Substitution, parts, partial fractions...",
      "Let's master them one by one.",
      "I'll start with basic substitution.",
      "Good approach! Build the foundation first.",
      "When should I use u-substitution?",
      "When you see an inner function and its derivative.",
      "Or when you can simplify an expression.",
      "Got it! I'll look for those patterns.",
      "Practice will make it second nature.",
      "Anyone want to work through examples?",
      "I do! Let's start with a simple one.",
      "How about ∫(2x)(x²+1)⁴ dx?",
      "Set u = x²+1, then du = 2x dx.",
      "Perfect! Now it becomes ∫u⁴ du.",
      "Which is u⁵/5 + C!",
      "You're getting it! Great job!",
      "Thanks! This is really helping.",
      "What about definite integrals?",
      "Those have specific limits of integration.",
      "Don't forget to evaluate at both limits.",
      "And subtract! That was my mistake.",
      "It's a common error! Just be careful.",
      "I'll triple-check my arithmetic.",
      "Good plan! Precision is important.",
      "Should we do timed practice problems?",
      "That's a great idea for exam prep!",
      "I'll set a timer for 5 minutes each.",
      "Let's start with easy ones first.",
      "Then work our way up to harder.",
      "I'm ready! Let's go!",
      "Don't forget the constant of integration!",
      "Oh yes! That's easy to forget.",
      "Always add +C in indefinite integrals.",
      "I'll make a note of that!",
      "What about trigonometric substitution?",
      "That's for radical expressions.",
      "More advanced but super useful.",
      "Let's save that for later in the week.",
      "Good plan! One thing at a time.",
      "This group is keeping me motivated!",
      "Same! I'm actually enjoying calculus now.",
      "It's amazing what collaboration does!",
      "Let's keep supporting each other!",
      "We'll all pass with flying colors!",
      "Integration squad for the win!"
    ],
    // Limit Busters
    [
      "Time to bust through all limits!",
      "I'm ready to break barriers!",
      "Let's start with basic limit properties.",
      "The limit of a sum is the sum of limits, right?",
      "Yes! And same for products and quotients.",
      "What about when we get 0/0 form?",
      "That's where factoring comes in handy.",
      "Or rationalizing when there are radicals.",
      "I always forget that technique!",
      "Practice it! It's on every exam.",
      "Will do! I'll do all the book problems.",
      "Same here! More practice, more confidence.",
      "What about limits at infinity?",
      "Those are about what happens as x grows.",
      "Look at the highest power terms.",
      "Divide by the highest power of x.",
      "Oh! That makes it so much simpler.",
      "The degree of numerator vs denominator matters.",
      "Can you give an example?",
      "Sure! (x²+1)/(3x²-5) → 1/3 as x→∞.",
      "Because the x² terms dominate!",
      "Exactly! You're getting it!",
      "This is really clicking now!",
      "I'm so glad we have this group!",
      "Me too! I was struggling before.",
      "Study groups make such a difference.",
      "Should we meet up this weekend?",
      "I'm free Saturday afternoon!",
      "Perfect! Study session time!",
      "I'll bring my problem sets.",
      "I'll bring coffee for everyone!",
      "You're the best!",
      "What about one-sided limits?",
      "Those approach from left or right only.",
      "Check both sides to see if they match.",
      "If they match, the limit exists.",
      "Thanks for clarifying that!",
      "Any time! We're all here to help.",
      "This group is so supportive!",
      "Let's make sure everyone passes!",
      "I believe we all can!",
      "With this study group, definitely!",
      "Don't forget L'Hospital's rule for 0/0!",
      "Or infinity/infinity forms!",
      "That rule is a lifesaver!",
      "It's my favorite technique!",
      "Let's master limits together!",
      "We're the limit busters!",
      "Nothing can stop us now!"
    ]
  ];
  
  for (let groupIdx = 0; groupIdx < testGroups.length; groupIdx++) {
    const group = testGroups[groupIdx];
    const template = conversationTemplates[groupIdx] || conversationTemplates[0];
    
    log(`  Sending messages for group: ${group.name}`);
    
    // Get current group members
    let groupData;
    try {
      groupData = await data.getGroup(COURSE_CODE, group.id);
    } catch (error) {
      log(`    Error getting group data: ${error.message}`);
      continue;
    }
    
    if (!groupData || groupData.members.length === 0) {
      log(`    No members in group ${group.name}`);
      continue;
    }
    
    const members = groupData.members;
    
    // Send conversational messages
    for (let i = 0; i < MESSAGES_PER_GROUP; i++) {
      // Cycle through members in order for natural conversation flow
      const memberIdx = i % members.length;
      const messageAuthor = members[memberIdx];
      const messageText = template[i] || `Great point! Let's keep working together.`;
      
      try {
        const result = await data.addMessage(COURSE_CODE, group.id, messageAuthor, messageText);
        if (result.error) {
          log(`    Failed to send message ${i + 1}: ${result.error}`);
        }
      } catch (error) {
        log(`    Error sending message ${i + 1}: ${error.message}`);
      }
      
      // Wait 1 second between each message
      if (i < MESSAGES_PER_GROUP - 1) {
        await new Promise(resolve => setTimeout(resolve, DELAY_MS));
      }
    }
    
    log(`    Sent ${MESSAGES_PER_GROUP} messages for ${group.name}`);
  }
  
  log('All messages sent');

  // Summary
  log('\n=== FLOW TEST SUMMARY ===');
  log(`Students created: ${testUserNames.length}`);
  log(`Groups created: ${testGroups.length}`);
  log(`Total messages sent: ${testGroups.length * MESSAGES_PER_GROUP}`);
  log('========================\n');
}

main()
  .catch((error) => {
    console.error('Flow test error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

