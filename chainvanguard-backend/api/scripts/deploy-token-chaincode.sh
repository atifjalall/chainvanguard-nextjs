#!/bin/bash

# ========================================
# Token Chaincode Deployment - CORRECTED
# Uses ~/Desktop/fabric-samples path
# TLS Enabled (working config)
# ========================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}🪙 ChainVanguard Token Deployment${NC}"
echo -e "${BLUE}========================================${NC}"

# CORRECTED PATH: ~/Desktop/fabric-samples
cd ~/Desktop/fabric-samples/test-network

# Set environment with TLS ENABLED (your working config)
export PATH=${PWD}/../bin:$PATH
export FABRIC_CFG_PATH=$PWD/../config/
export CORE_PEER_TLS_ENABLED=true

CHAINCODE_NAME="token"
CHANNEL_NAME="supply-chain-channel"
VERSION="1.0"
SEQUENCE="1"
CHAINCODE_PATH="$HOME/Desktop/chainvanguard-nextjs/chainvanguard-backend/chaincode"

echo -e "${YELLOW}Configuration:${NC}"
echo "  Chaincode: $CHAINCODE_NAME"
echo "  Channel: $CHANNEL_NAME"
echo "  Version: $VERSION"
echo "  Path: $CHAINCODE_PATH"
echo "  Fabric: ~/Desktop/fabric-samples"
echo ""

# Check chaincode path
if [ ! -d "$CHAINCODE_PATH" ]; then
  echo -e "${RED}❌ Chaincode path not found: $CHAINCODE_PATH${NC}"
  exit 1
fi

if [ ! -f "$CHAINCODE_PATH/lib/tokenContract.js" ]; then
  echo -e "${RED}❌ tokenContract.js not found!${NC}"
  echo -e "${YELLOW}Please run: cp tokenContract.js $CHAINCODE_PATH/lib/${NC}"
  exit 1
fi

# Check if index.js exports TokenContract
if ! grep -q "TokenContract" "$CHAINCODE_PATH/index.js"; then
  echo -e "${RED}❌ TokenContract not exported in index.js${NC}"
  echo -e "${YELLOW}Please update $CHAINCODE_PATH/index.js to include TokenContract${NC}"
  exit 1
fi

# ========================================
# STEP 1: Package
# ========================================
echo -e "${BLUE}Step 1: Packaging chaincode...${NC}"
peer lifecycle chaincode package ${CHAINCODE_NAME}.tar.gz \
  --path "$CHAINCODE_PATH" \
  --lang node \
  --label ${CHAINCODE_NAME}_${VERSION}

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Chaincode packaged successfully${NC}"
else
  echo -e "${RED}❌ Failed to package chaincode${NC}"
  exit 1
fi

# ========================================
# STEP 2: Install on Org1
# ========================================
echo -e "${BLUE}Step 2: Installing on Org1...${NC}"

export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051

peer lifecycle chaincode install ${CHAINCODE_NAME}.tar.gz

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Installed on Org1${NC}"
else
  echo -e "${RED}❌ Failed to install on Org1${NC}"
  exit 1
fi

# Get package ID
PACKAGE_ID=$(peer lifecycle chaincode queryinstalled | grep ${CHAINCODE_NAME}_${VERSION} | awk '{print $3}' | sed 's/,$//')

if [ -z "$PACKAGE_ID" ]; then
  echo -e "${RED}❌ Failed to get package ID${NC}"
  exit 1
fi

echo -e "${GREEN}Package ID: ${PACKAGE_ID}${NC}"

# ========================================
# STEP 3: Approve for Org1
# ========================================
echo -e "${BLUE}Step 3: Approving for Org1...${NC}"

peer lifecycle chaincode approveformyorg -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --channelID ${CHANNEL_NAME} \
  --name ${CHAINCODE_NAME} \
  --version ${VERSION} \
  --package-id ${PACKAGE_ID} \
  --sequence ${SEQUENCE} \
  --tls \
  --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem"

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Approved by Org1${NC}"
else
  echo -e "${RED}❌ Failed to approve for Org1${NC}"
  exit 1
fi

# ========================================
# STEP 4: Install on Org2
# ========================================
echo -e "${BLUE}Step 4: Installing on Org2...${NC}"

export CORE_PEER_LOCALMSPID="Org2MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp
export CORE_PEER_ADDRESS=localhost:9051

peer lifecycle chaincode install ${CHAINCODE_NAME}.tar.gz

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Installed on Org2${NC}"
else
  echo -e "${RED}❌ Failed to install on Org2${NC}"
  exit 1
fi

# ========================================
# STEP 5: Approve for Org2
# ========================================
echo -e "${BLUE}Step 5: Approving for Org2...${NC}"

peer lifecycle chaincode approveformyorg -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --channelID ${CHANNEL_NAME} \
  --name ${CHAINCODE_NAME} \
  --version ${VERSION} \
  --package-id ${PACKAGE_ID} \
  --sequence ${SEQUENCE} \
  --tls \
  --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem"

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Approved by Org2${NC}"
else
  echo -e "${RED}❌ Failed to approve for Org2${NC}"
  exit 1
fi

# ========================================
# STEP 6: Check Commit Readiness
# ========================================
echo -e "${BLUE}Step 6: Checking commit readiness...${NC}"

peer lifecycle chaincode checkcommitreadiness \
  --channelID ${CHANNEL_NAME} \
  --name ${CHAINCODE_NAME} \
  --version ${VERSION} \
  --sequence ${SEQUENCE} \
  --tls \
  --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" \
  --output json

# ========================================
# STEP 7: Commit
# ========================================
echo -e "${BLUE}Step 7: Committing chaincode...${NC}"

peer lifecycle chaincode commit -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --channelID ${CHANNEL_NAME} \
  --name ${CHAINCODE_NAME} \
  --version ${VERSION} \
  --sequence ${SEQUENCE} \
  --tls \
  --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles ${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt \
  --peerAddresses localhost:9051 \
  --tlsRootCertFiles ${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Chaincode committed successfully${NC}"
else
  echo -e "${RED}❌ Failed to commit chaincode${NC}"
  exit 1
fi

# ========================================
# STEP 8: Verify
# ========================================
echo -e "${BLUE}Step 8: Verifying deployment...${NC}"

peer lifecycle chaincode querycommitted \
  --channelID ${CHANNEL_NAME} \
  --name ${CHAINCODE_NAME}

# ========================================
# STEP 9: Initialize
# ========================================
echo -e "${BLUE}Step 9: Initializing token ledger...${NC}"

peer chaincode invoke -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls \
  --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" \
  -C ${CHANNEL_NAME} \
  -n ${CHAINCODE_NAME} \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles ${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt \
  --peerAddresses localhost:9051 \
  --tlsRootCertFiles ${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt \
  -c '{"function":"TokenContract:initLedger","Args":[]}'

sleep 3

# ========================================
# STEP 10: Test
# ========================================
echo -e "${BLUE}Step 10: Testing token operations...${NC}"

echo -e "${YELLOW}Testing: Get token info${NC}"
peer chaincode query -C ${CHANNEL_NAME} -n ${CHAINCODE_NAME} \
  -c '{"function":"TokenContract:getTokenInfo","Args":[]}'

echo ""
echo -e "${YELLOW}Testing: Create test account${NC}"
peer chaincode invoke -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls \
  --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" \
  -C ${CHANNEL_NAME} \
  -n ${CHAINCODE_NAME} \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles ${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt \
  --peerAddresses localhost:9051 \
  --tlsRootCertFiles ${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt \
  -c '{"function":"TokenContract:createAccount","Args":["test_user_123","0xABC123DEF456","1000"]}'

sleep 3

echo ""
echo -e "${YELLOW}Testing: Check balance${NC}"
peer chaincode query -C ${CHANNEL_NAME} -n ${CHAINCODE_NAME} \
  -c '{"function":"TokenContract:balanceOf","Args":["test_user_123"]}'

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Token Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Token Details:${NC}"
echo "  Name: ChainVanguard Token"
echo "  Symbol: CVT"
echo "  Decimals: 2"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "1. Update fabric.service.js - Add token methods"
echo "2. Update wallet.balance.service.js - Use blockchain"
echo "3. Replace currency references (PKR/USD → CVT)"
echo ""