#!/usr/bin/env bash
# Flow test script for GroupChatProject
# Creates 50 test students, 6 groups, fills them, and sends 50 conversational messages per group

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

# Run the flow test
echo -e "\n${YELLOW}Running flow test...${NC}"
node scripts/flow-test.js

echo -e "\n${GREEN}Flow test complete${NC}"
echo -e "${YELLOW}Note: Test data has been kept. Run cleanup script to remove it.${NC}"

exit 0

