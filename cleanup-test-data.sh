#!/usr/bin/env bash
# Cleanup script for load test data
# Removes all [TEST] tagged data

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Cleaning up test data...${NC}"

# Run the cleanup script
node scripts/loadtest-cleanup.js

echo -e "${GREEN}Cleanup complete${NC}"

