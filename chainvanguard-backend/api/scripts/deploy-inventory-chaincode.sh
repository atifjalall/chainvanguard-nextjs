#!/bin/bash

# ============================================
# DEPLOY INVENTORY CHAINCODE
# Deploys inventory smart contract to Hyperledger Fabric
# ============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${YELLOW}>>> $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Configuration
CHAINCODE_NAME="inventory"
TIMESTAMP=$(date +%s)
CHAINCODE_VERSION="1.${TIMESTAMP}"
CHANNEL_NAME="supply-chain-channel"
CHAINCODE_PATH=~/Desktop/chainvanguard-nextjs/chainvanguard-backend/chaincode
FABRIC_NETWORK_PATH=~/Desktop/fabric-samples/test-network

print_status "Starting Inventory Chaincode Deployment"
echo ""

# ============================================
# 1. CHECK PREREQUISITES
# ============================================

print_status "Checking prerequisites..."

# Check if Fabric network is running
if ! docker ps | grep -q peer0.org1.example.com; then
    print_error "Fabric network is not running"
    print_status "Please start the network first using:"
    echo "cd ~/Desktop/fabric-samples/test-network"
    echo "./network.sh up createChannel -c supply-chain-channel"
    exit 1
fi

print_success "Fabric network is running"

# Check if chaincode directory exists
if [ ! -d "$CHAINCODE_PATH" ]; then
    print_error "Chaincode directory not found: $CHAINCODE_PATH"
    exit 1
fi

# Check if inventoryContract.js exists
if [ ! -f "$CHAINCODE_PATH/lib/inventoryContract.js" ]; then
    print_error "inventoryContract.js not found in $CHAINCODE_PATH/lib/"
    exit 1
fi

print_success "Chaincode files found"

# Check if fabric-samples directory exists
if [ ! -d "$FABRIC_NETWORK_PATH" ]; then
    print_error "Fabric network directory not found: $FABRIC_NETWORK_PATH"
    exit 1
fi

print_success "Fabric network directory found"

# ============================================
# 2. DEPLOY USING NETWORK.SH
# ============================================

print_status "Deploying inventory chaincode using network.sh..."

cd $FABRIC_NETWORK_PATH

./network.sh deployCC \
  -ccn $CHAINCODE_NAME \
  -ccp $CHAINCODE_PATH \
  -ccl javascript \
  -c $CHANNEL_NAME \
  -ccv $CHAINCODE_VERSION

if [ $? -eq 0 ]; then
    print_success "Chaincode deployed successfully"
else
    print_error "Failed to deploy chaincode"
    exit 1
fi

# ============================================
# 3. VERIFY DEPLOYMENT
# ============================================

print_status "Verifying deployment..."

# Set environment variables for Org1
export PATH=${PWD}/../bin:$PATH
export FABRIC_CFG_PATH=$PWD/../config/
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051

peer lifecycle chaincode querycommitted \
  --channelID ${CHANNEL_NAME} \
  --name ${CHAINCODE_NAME} \
  --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem"

if [ $? -eq 0 ]; then
    print_success "Chaincode deployment verified"
else
    print_error "Failed to verify deployment"
    exit 1
fi

# ============================================
# 4. INITIALIZE CHAINCODE
# ============================================

print_status "Initializing chaincode..."

peer chaincode invoke \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls \
  --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" \
  -C ${CHANNEL_NAME} \
  -n ${CHAINCODE_NAME} \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" \
  --peerAddresses localhost:9051 \
  --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" \
  -c '{"function":"initLedger","Args":[]}' 2>&1

if [ $? -eq 0 ]; then
    print_success "Chaincode initialized"
else
    print_error "Failed to initialize chaincode (this may be okay if already initialized)"
fi

# ============================================
# 5. TEST CHAINCODE
# ============================================

print_status "Testing chaincode with sample query..."

sleep 3

peer chaincode query \
  -C ${CHANNEL_NAME} \
  -n ${CHAINCODE_NAME} \
  -c '{"function":"initLedger","Args":[]}' 2>&1

if [ $? -eq 0 ]; then
    print_success "Chaincode is responding to queries"
else
    print_error "Chaincode query failed (may need manual testing)"
fi

# ============================================
# SUMMARY
# ============================================

echo ""
echo "=========================================="
echo -e "${GREEN}INVENTORY CHAINCODE DEPLOYMENT COMPLETE${NC}"
echo "=========================================="
echo ""
echo "Chaincode Name: $CHAINCODE_NAME"
echo "Version: $CHAINCODE_VERSION"
echo "Channel: $CHANNEL_NAME"
echo "Chaincode Path: $CHAINCODE_PATH"
echo ""
echo "The inventory chaincode is now deployed and ready to use!"
echo ""
echo "You can now:"
echo "1. Create inventory items on the blockchain"
echo "2. Track inventory movements"
echo "3. Transfer inventory between parties"
echo "4. Query inventory history"
echo ""
echo "Example queries:"
echo "peer chaincode query -C $CHANNEL_NAME -n $CHAINCODE_NAME -c '{\"function\":\"queryAllInventory\",\"Args\":[]}'"
echo ""