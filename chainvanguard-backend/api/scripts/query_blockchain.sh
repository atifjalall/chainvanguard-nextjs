#!/bin/bash

# ChainVanguard - Blockchain Data Query Test
# Tests what data is actually stored on Hyperledger Fabric

echo "🔗 BLOCKCHAIN DATA QUERY TEST"
echo "=============================="
echo ""

# Configuration
CHANNEL_NAME="supply-chain-channel"
FABRIC_PATH="$HOME/Desktop/fabric-samples/test-network"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if Fabric exists
if [ ! -d "$FABRIC_PATH" ]; then
    echo -e "${RED}❌ Fabric network not found!${NC}"
    echo "Please run: ./setup_fabric_from_scratch.sh"
    exit 1
fi

cd "$FABRIC_PATH" || exit

# Set environment for Org1
export PATH=${PWD}/../bin:$PATH
export FABRIC_CFG_PATH=$PWD/../config/
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051

echo -e "${BLUE}1️⃣ Checking Network Status...${NC}"
if docker ps | grep -q "peer0.org1.example.com"; then
    echo -e "${GREEN}✅ Network is running${NC}"
else
    echo -e "${RED}❌ Network is NOT running${NC}"
    echo "Start it with: cd $FABRIC_PATH && ./network.sh up createChannel -c supply-chain-channel"
    exit 1
fi

echo ""
echo -e "${BLUE}2️⃣ Querying Users on Blockchain...${NC}"
peer chaincode query \
    -C $CHANNEL_NAME \
    -n user \
    -c '{"function":"UserContract:getAllUsers","Args":[]}' \
    2>&1 | python3 -m json.tool

echo ""
echo -e "${BLUE}3️⃣ Querying Products on Blockchain...${NC}"
peer chaincode query \
    -C $CHANNEL_NAME \
    -n product \
    -c '{"function":"ProductContract:getAllProducts","Args":[]}' \
    2>&1 | python3 -m json.tool

echo ""
echo -e "${BLUE}4️⃣ Querying Orders on Blockchain...${NC}"
peer chaincode query \
    -C $CHANNEL_NAME \
    -n order \
    -c '{"function":"OrderContract:getAllOrders","Args":[]}' \
    2>&1 | python3 -m json.tool

echo ""
echo -e "${BLUE}5️⃣ Channel Information...${NC}"
peer channel getinfo -c $CHANNEL_NAME

echo ""
echo -e "${GREEN}✅ Blockchain query test completed!${NC}"