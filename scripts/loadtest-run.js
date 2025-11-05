#!/usr/bin/env node
/**
 * Load test runner using native Node.js
 * Simulates concurrent users hitting the API
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';
const CONCURRENT_USERS = 20;
const REQUESTS_PER_USER = 10;
const TEST_PREFIX = '[TEST]';

// Request statistics
const stats = {
  total: 0,
  success: 0,
  errors: 0,
  statusCodes: {},
  responseTimes: [],
};

// Helper function to make HTTP request
function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const url = new URL(path, BASE_URL);
    
    const reqOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        const duration = Date.now() - startTime;
        stats.total++;
        
        if (res.statusCode >= 200 && res.statusCode < 300) {
          stats.success++;
        } else {
          stats.errors++;
        }
        
        stats.statusCodes[res.statusCode] = (stats.statusCodes[res.statusCode] || 0) + 1;
        stats.responseTimes.push(duration);
        
        resolve({ status: res.statusCode, duration, data });
      });
    });

    req.on('error', (error) => {
      const duration = Date.now() - startTime;
      stats.total++;
      stats.errors++;
      stats.responseTimes.push(duration);
      resolve({ error: error.message, duration });
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

// Simulate a single user
async function simulateUser(userId) {
  const userName = `${TEST_PREFIX}User${userId % 50 + 1}`;
  const password = 'testpass123';

  for (let i = 0; i < REQUESTS_PER_USER; i++) {
    // Mix of different request types
    const requestType = Math.floor(Math.random() * 5);
    
    try {
      switch (requestType) {
        case 0:
          // Health check
          await makeRequest('/api/health');
          break;
        case 1:
          // Get courses
          await makeRequest('/api/courses');
          break;
        case 2:
          // Get homepage data
          await makeRequest('/api/homepage');
          break;
        case 3:
          // Get course details
          await makeRequest('/api/courses/CS101');
          break;
        case 4:
          // Login attempt
          await makeRequest('/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: {
              userName,
              password,
              createIfNotExists: false,
            },
          });
          break;
      }
    } catch (error) {
      // Request already handled in makeRequest
    }

    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 50));
  }
}

// Calculate percentiles
function percentile(values, p) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((sorted.length * p) / 100) - 1;
  return sorted[Math.max(0, index)];
}

// Print summary
function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('LOAD TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Requests: ${stats.total}`);
  console.log(`Successful: ${stats.success} (${((stats.success / stats.total) * 100).toFixed(1)}%)`);
  console.log(`Errors: ${stats.errors} (${((stats.errors / stats.total) * 100).toFixed(1)}%)`);
  console.log('\nStatus Code Distribution:');
  Object.entries(stats.statusCodes)
    .sort(([a], [b]) => a - b)
    .forEach(([code, count]) => {
      console.log(`  ${code}: ${count} (${((count / stats.total) * 100).toFixed(1)}%)`);
    });

  if (stats.responseTimes.length > 0) {
    console.log('\nResponse Time Statistics (ms):');
    const sorted = [...stats.responseTimes].sort((a, b) => a - b);
    console.log(`  Min: ${Math.min(...sorted)}`);
    console.log(`  P50 (Median): ${percentile(sorted, 50)}`);
    console.log(`  P95: ${percentile(sorted, 95)}`);
    console.log(`  P99: ${percentile(sorted, 99)}`);
    console.log(`  Max: ${Math.max(...sorted)}`);
    const avg = sorted.reduce((a, b) => a + b, 0) / sorted.length;
    console.log(`  Avg: ${avg.toFixed(1)}`);
  }
  console.log('='.repeat(60) + '\n');
}

// Run load test
async function main() {
  console.log(`Starting load test with ${CONCURRENT_USERS} users, ${REQUESTS_PER_USER} requests each...`);
  console.log(`Total requests: ${CONCURRENT_USERS * REQUESTS_PER_USER}`);
  
  const startTime = Date.now();

  // Run all users concurrently
  const userPromises = [];
  for (let i = 1; i <= CONCURRENT_USERS; i++) {
    userPromises.push(simulateUser(i));
  }

  await Promise.all(userPromises);

  const duration = (Date.now() - startTime) / 1000;
  console.log(`\nLoad test completed in ${duration.toFixed(2)} seconds`);
  console.log(`Requests/second: ${(stats.total / duration).toFixed(2)}`);

  printSummary();
}

main()
  .catch((error) => {
    console.error('Error during load test:', error);
    process.exit(1);
  });

