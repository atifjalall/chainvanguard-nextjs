#!/bin/bash

# ========================================
# Mint 1 Million Tokens to All Users
# ========================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}🪙 Minting 1M Tokens to All Users${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
API_DIR="$(dirname "$SCRIPT_DIR")"

echo -e "${YELLOW}ℹ️  This will mint 1,000,000 CVT to each user${NC}"
echo -e "${YELLOW}ℹ️  API Directory: $API_DIR${NC}"
echo ""

# Confirm
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo -e "${RED}❌ Aborted${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}▶ Running minting script...${NC}"
echo ""

# Run the Node.js script
cd "$API_DIR"
node scripts/mint-initial-tokens.js

echo ""
echo -e "${GREEN}✅ Done!${NC}"
