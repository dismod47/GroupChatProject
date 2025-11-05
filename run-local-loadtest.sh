#!/usr/bin/env bash
# Load test script for GroupChatProject
# Seeds test data and runs load test

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3000"
TEST_PREFIX="[TEST]"

# Check if server is running
echo -e "${YELLOW}Checking if server is running at ${BASE_URL}...${NC}"
if ! curl -s --head ${BASE_URL}/api/health > /dev/null; then
  echo -e "${RED}Error: Server not running at ${BASE_URL}${NC}"
  echo "Please start the server with: npm run dev"
  exit 1
fi
echo -e "${GREEN}Server is running${NC}"

# Seed test data
echo -e "\n${YELLOW}Seeding test data...${NC}"
node scripts/loadtest-seed.js
echo -e "${GREEN}Test data seeded${NC}"

# Run load test
echo -e "\n${YELLOW}Running load test...${NC}"
node scripts/loadtest-run.js

# Results summary will be printed by the test script
echo -e "\n${GREEN}Load test complete${NC}"
echo -e "\n${YELLOW}Note: Test data has been kept. Run cleanup script to remove it.${NC}"

exit 0

