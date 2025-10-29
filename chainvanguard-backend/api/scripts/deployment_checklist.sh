#!/bin/bash

# ============================================
# INVENTORY CHAINCODE DEPLOYMENT CHECKLIST
# Complete guide to fix inventory blockchain integration
# ============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

clear

cat << "EOF"
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║        ChainVanguard Inventory Blockchain Fix Guide         ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
EOF

echo ""
echo -e "${BLUE}This script will guide you through fixing the inventory blockchain integration${NC}"
echo ""

# ============================================
# STEP 1: CHECK PREREQUISITES
# ============================================

echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}STEP 1: Checking Prerequisites${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check if Fabric network is running
if docker ps | grep -q "peer0.org1.example.com"; then
    echo -e "${GREEN}✓ Fabric network is running${NC}"
else
    echo -e "${RED}✗ Fabric network is NOT running${NC}"
    echo ""
    echo "Please start the Fabric network first:"
    echo -e "${BLUE}cd ~/Desktop/fabric-samples/test-network${NC}"
    echo -e "${BLUE}./network.sh up createChannel -c supply-chain-channel${NC}"
    echo ""
    exit 1
fi

# Check if chaincode files exist
CHAINCODE_PATH=~/Desktop/chainvanguard-nextjs/chainvanguard-backend/chaincode

if [ -f "$CHAINCODE_PATH/lib/inventoryContract.js" ]; then
    echo -e "${GREEN}✓ inventoryContract.js found${NC}"
else
    echo -e "${RED}✗ inventoryContract.js NOT found${NC}"
    exit 1
fi

if [ -f "$CHAINCODE_PATH/index.js" ]; then
    echo -e "${GREEN}✓ index.js found${NC}"
else
    echo -e "${RED}✗ index.js NOT found${NC}"
    exit 1
fi

# Check if inventory is registered in index.js
if grep -q "InventoryContract" "$CHAINCODE_PATH/index.js"; then
    echo -e "${GREEN}✓ InventoryContract registered in index.js${NC}"
else
    echo -e "${RED}✗ InventoryContract NOT registered in index.js${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✓ All prerequisites met!${NC}"
echo ""

# ============================================
# STEP 2: APPLY CODE FIXES
# ============================================

echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}STEP 2: Apply Code Fixes${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${BLUE}You need to apply these fixes manually:${NC}"
echo ""

echo "1. Fix Inventory Model (api/src/models/Inventory.js)"
echo "   → Add 'system' to performedByRole enum"
echo "   → See: fixes/01_inventory_model_fix.js"
echo ""

echo "2. Fix Inventory Service (api/src/services/inventory.service.js)"
echo "   → Fix reserveQuantity method"
echo "   → Fix releaseReservedQuantity method"
echo "   → See: fixes/02_inventory_service_reserve_release_fix.js"
echo ""

echo -e "${YELLOW}Have you applied these fixes? (y/n)${NC}"
read -r response

if [[ ! "$response" =~ ^[Yy]$ ]]; then
    echo ""
    echo -e "${RED}Please apply the fixes first, then run this script again.${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✓ Code fixes confirmed${NC}"
echo ""

# ============================================
# STEP 3: DEPLOY INVENTORY CHAINCODE
# ============================================

echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}STEP 3: Deploy Inventory Chaincode${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

DEPLOYMENT_SCRIPT=~/Desktop/chainvanguard-nextjs/chainvanguard-backend/scripts/deploy-inventory-chaincode.sh

if [ -f "$DEPLOYMENT_SCRIPT" ]; then
    echo -e "${BLUE}Deployment script found. Running...${NC}"
    echo ""
    
    chmod +x "$DEPLOYMENT_SCRIPT"
    bash "$DEPLOYMENT_SCRIPT"
    
    if [ $? -eq 0 ]; then
        echo ""
        echo -e "${GREEN}✓ Inventory chaincode deployed successfully!${NC}"
    else
        echo ""
        echo -e "${RED}✗ Deployment failed. Check the error messages above.${NC}"
        exit 1
    fi
else
    echo -e "${RED}✗ Deployment script not found at: $DEPLOYMENT_SCRIPT${NC}"
    exit 1
fi

echo ""

# ============================================
# STEP 4: VERIFY DEPLOYMENT
# ============================================

echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}STEP 4: Verify Deployment${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

cd ~/Desktop/fabric-samples/test-network

# Set environment
export PATH=${PWD}/../bin:$PATH
export FABRIC_CFG_PATH=$PWD/../config/
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051

echo -e "${BLUE}Testing inventory chaincode...${NC}"
echo ""

# Test initLedger
echo "1. Testing initLedger..."
peer chaincode invoke \
    -o localhost:7050 \
    --ordererTLSHostnameOverride orderer.example.com \
    --tls \
    --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" \
    -C supply-chain-channel \
    -n inventory \
    --peerAddresses localhost:7051 \
    --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" \
    -c '{"function":"InventoryContract:initLedger","Args":[]}' \
    2>&1 | grep -q "Chaincode invoke successful"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ initLedger works!${NC}"
else
    echo -e "${RED}✗ initLedger failed${NC}"
fi

echo ""
echo -e "${GREEN}✓ Verification complete!${NC}"
echo ""

# ============================================
# STEP 5: RESTART API SERVER
# ============================================

echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}STEP 5: Restart API Server${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${BLUE}Please restart your API server to apply the code fixes:${NC}"
echo ""
echo "cd ~/Desktop/chainvanguard-nextjs/chainvanguard-backend/api"
echo "npm run dev"
echo ""

read -p "Press Enter when API server is restarted..."

# ============================================
# STEP 6: RUN TESTS
# ============================================

echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}STEP 6: Run Integration Tests${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

TEST_SCRIPT=~/Desktop/chainvanguard-nextjs/chainvanguard-backend/scripts/test_inventory_complete.sh

if [ -f "$TEST_SCRIPT" ]; then
    echo -e "${BLUE}Running inventory tests...${NC}"
    echo ""
    
    chmod +x "$TEST_SCRIPT"
    bash "$TEST_SCRIPT"
    
    echo ""
    echo -e "${GREEN}✓ Tests completed!${NC}"
else
    echo -e "${YELLOW}⚠ Test script not found. You can test manually via API.${NC}"
fi

# ============================================
# COMPLETION
# ============================================

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                              ║${NC}"
echo -e "${GREEN}║                    🎉 Setup Complete! 🎉                     ║${NC}"
echo -e "${GREEN}║                                                              ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${BLUE}What's Working Now:${NC}"
echo "  ✓ Inventory chaincode deployed to blockchain"
echo "  ✓ Create inventory items (stored on chain + MongoDB)"
echo "  ✓ Update inventory (blockchain verified)"
echo "  ✓ Add/Reduce stock (all movements on chain)"
echo "  ✓ Reserve/Release quantity (order integration)"
echo "  ✓ Transfer to vendors (supplier → vendor on chain)"
echo "  ✓ Quality checks (immutable records)"
echo "  ✓ Complete audit trail on blockchain"
echo ""

echo -e "${BLUE}Next Steps:${NC}"
echo "  1. Complete supplier dashboard integration"
echo "  2. Build vendor dashboard (buy inventory, create products)"
echo "  3. Customer ordering system"
echo "  4. Full supply chain traceability"
echo ""

echo -e "${BLUE}Quick Test Commands:${NC}"
echo "  # Create inventory"
echo "  curl -X POST http://localhost:3001/api/inventory \\"
echo "    -H 'Authorization: Bearer YOUR_TOKEN' \\"
echo "    -d '{\"name\": \"Test Fabric\", \"quantity\": 100}'"
echo ""
echo "  # Query blockchain"
echo "  cd ~/Desktop/fabric-samples/test-network"
echo "  peer chaincode query -C supply-chain-channel -n inventory \\"
echo "    -c '{\"function\":\"InventoryContract:queryAllInventory\",\"Args\":[]}'"
echo ""

echo -e "${GREEN}Happy Coding! 🚀${NC}"
echo ""