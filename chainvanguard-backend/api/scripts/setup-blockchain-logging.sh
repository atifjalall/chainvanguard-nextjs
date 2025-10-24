#!/bin/bash

# Master Setup Script for Blockchain Logging
# This script sets everything up in one go

set -e

echo "======================================================"
echo "🚀 BLOCKCHAIN LOGGING - COMPLETE SETUP"
echo "======================================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "chaincode/lib/orderContract.js" ]; then
    echo -e "${RED}❌ Error: Please run this script from chainvanguard-backend directory${NC}"
    echo "   cd ~/Desktop/chainvanguard-nextjs/chainvanguard-backend"
    exit 1
fi

echo -e "${GREEN}✅ In correct directory${NC}"
echo ""

# Step 1: Deploy chaincode
echo -e "${BLUE}📦 Step 1/3: Deploying order chaincode with logging...${NC}"
cd ~/Desktop/fabric-samples/test-network

./network.sh deployCC \
    -ccn order \
    -ccp ~/Desktop/chainvanguard-nextjs/chainvanguard-backend/chaincode \
    -ccl javascript \
    -c supply-chain-channel \
    -ccv 1.1

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Chaincode deployment failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Chaincode deployed successfully${NC}"
echo ""

# Step 2: Check backend
echo -e "${BLUE}🔧 Step 2/3: Checking backend files...${NC}"

# Check if files were updated
if grep -q "createBlockchainLog" ~/Desktop/chainvanguard-nextjs/chainvanguard-backend/api/src/services/fabric_service.js; then
    echo -e "${GREEN}✅ fabric_service.js updated${NC}"
else
    echo -e "${RED}❌ fabric_service.js not updated${NC}"
    exit 1
fi

if grep -q "_saveToBlockchain" ~/Desktop/chainvanguard-nextjs/chainvanguard-backend/api/src/utils/logger.js; then
    echo -e "${GREEN}✅ logger.js updated${NC}"
else
    echo -e "${RED}❌ logger.js not updated${NC}"
    exit 1
fi

if grep -q "async createLog" ~/Desktop/chainvanguard-nextjs/chainvanguard-backend/chaincode/lib/orderContract.js; then
    echo -e "${GREEN}✅ orderContract.js updated${NC}"
else
    echo -e "${RED}❌ orderContract.js not updated${NC}"
    exit 1
fi

echo ""

# Step 3: Instructions for restart
echo -e "${BLUE}📋 Step 3/3: Next steps${NC}"
echo ""
echo -e "${YELLOW}To complete setup:${NC}"
echo ""
echo "1. Restart your backend:"
echo "   cd ~/Desktop/chainvanguard-nextjs/chainvanguard-backend/api"
echo "   npm run dev"
echo ""
echo "2. Test blockchain logging:"
echo "   (In a new terminal)"
echo "   cd ~/Desktop/chainvanguard-nextjs/chainvanguard-backend"
echo "   chmod +x test-blockchain-logs.sh"
echo "   ./test-blockchain-logs.sh"
echo ""
echo "3. Watch for these messages in backend console:"
echo "   📝 Log created in MongoDB: ..."
echo "   ⛓️ Log saved to blockchain: ..."
echo ""

echo "======================================================"
echo -e "${GREEN}✅ SETUP COMPLETE${NC}"
echo "======================================================"
echo ""
echo "Blockchain logging is now active! Logs will be saved to:"
echo "  • MongoDB (fast, queryable)"
echo "  • Hyperledger Fabric (immutable, auditable)"
echo ""
echo "Read BLOCKCHAIN_LOGGING_SOLUTION.md for full details."
echo ""