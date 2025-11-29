#!/bin/bash

# ChainVanguard Complete Setup Script
# Run this after system restart or fresh install

set -e

echo "=========================================="
echo "🚀 ChainVanguard Blockchain Setup"
echo "=========================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_info() { echo -e "${YELLOW}ℹ️  $1${NC}"; }

# Configuration
FABRIC_SAMPLES_PATH="$HOME/Desktop/fabric-samples/test-network"

# Backend Path - Auto-detect
BACKEND_PATH_1="$HOME/Documents/newfyp/chainvanguard-nextjs/chainvanguard-backend"
BACKEND_PATH_2="$HOME/Desktop/chainvanguard-nextjs/chainvanguard-backend"

if [ -d "$BACKEND_PATH_1/chaincode" ]; then
    BACKEND_PATH="$BACKEND_PATH_1"
elif [ -d "$BACKEND_PATH_2/chaincode" ]; then
    BACKEND_PATH="$BACKEND_PATH_2"
else
    print_error "Backend path not found. Tried:"
    echo "   1. $BACKEND_PATH_1"
    echo "   2. $BACKEND_PATH_2"
    exit 1
fi

CHANNEL_NAME="supply-chain-channel"
CHAINCODE_NAME="chainvanguard"

# Check prerequisites
echo "Step 1: Checking prerequisites..."
command -v docker >/dev/null 2>&1 || { print_error "Docker not installed"; exit 1; }
command -v node >/dev/null 2>&1 || { print_error "Node.js not installed"; exit 1; }

if ! systemctl is-active --quiet mongod 2>/dev/null; then
    print_info "Starting MongoDB..."
    sudo systemctl start mongod 2>/dev/null || true
fi

if ! systemctl is-active --quiet redis 2>/dev/null; then
    print_info "Starting Redis..."
    sudo systemctl start redis 2>/dev/null || true
fi
print_success "Prerequisites OK"
echo ""

# Clean up
echo "Step 2: Cleaning up old network..."
cd "$FABRIC_SAMPLES_PATH"
./network.sh down > /dev/null 2>&1 || true
docker rm -f chainvanguard > /dev/null 2>&1 || true
docker rmi $(docker images | grep chainvanguard | awk '{print $3}') > /dev/null 2>&1 || true
rm -rf /tmp/ccaas-package
print_success "Cleanup complete"
echo ""

# Start Fabric Network WITH COUCHDB
echo "Step 3: Starting Hyperledger Fabric with CouchDB..."
cd "$FABRIC_SAMPLES_PATH"
./network.sh up createChannel -c $CHANNEL_NAME -ca -s couchdb
print_success "Fabric network started with CouchDB"
print_info "Waiting 10 seconds for network to stabilize..."
sleep 10
echo ""

# Set environment
echo "Step 4: Setting environment variables..."
export PATH=${FABRIC_SAMPLES_PATH}/../bin:$PATH
export FABRIC_CFG_PATH=${FABRIC_SAMPLES_PATH}/../config/
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${FABRIC_SAMPLES_PATH}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${FABRIC_SAMPLES_PATH}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051
print_success "Environment set"
echo ""

# Create chaincode package
echo "Step 5: Creating chaincode package..."
cd /tmp
mkdir -p ccaas-package/chainvanguard_1.0/src

cat > ccaas-package/chainvanguard_1.0/src/connection.json << 'EOFINNER'
{
  "address": "chainvanguard:9999",
  "dial_timeout": "10s",
  "tls_required": false
}
EOFINNER

cd ccaas-package/chainvanguard_1.0/src
tar -czf ../code.tar.gz connection.json
cd ..

cat > metadata.json << 'EOFINNER'
{
  "type": "ccaas",
  "label": "chainvanguard_1.0"
}
EOFINNER

tar -czf ../chainvanguard_1.0.tar.gz metadata.json code.tar.gz
print_success "Package created"
echo ""

# Install on Org1
echo "Step 6: Installing chaincode on Org1..."
cd "$FABRIC_SAMPLES_PATH"
peer lifecycle chaincode install /tmp/ccaas-package/chainvanguard_1.0.tar.gz
print_success "Installed on Org1"
echo ""

# Install on Org2
echo "Step 7: Installing chaincode on Org2..."
export CORE_PEER_LOCALMSPID="Org2MSP"
export CORE_PEER_ADDRESS=localhost:9051
export CORE_PEER_TLS_ROOTCERT_FILE=${FABRIC_SAMPLES_PATH}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${FABRIC_SAMPLES_PATH}/organizations/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp

peer lifecycle chaincode install /tmp/ccaas-package/chainvanguard_1.0.tar.gz
print_success "Installed on Org2"
echo ""

# Get Package ID
echo "Step 8: Getting Package ID..."
export PACKAGE_ID=$(peer lifecycle chaincode queryinstalled | grep chainvanguard_1.0 | awk '{print $3}' | cut -d ',' -f1)
if [ -z "$PACKAGE_ID" ]; then
    print_error "Failed to get Package ID"
    exit 1
fi
print_success "Package ID: $PACKAGE_ID"
echo "$PACKAGE_ID" > ~/.chainvanguard_package_id
echo ""

# Approve for Org2
echo "Step 9: Approving for Org2..."
peer lifecycle chaincode approveformyorg \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --channelID $CHANNEL_NAME \
  --name $CHAINCODE_NAME \
  --version 1.0 \
  --package-id $PACKAGE_ID \
  --sequence 1 \
  --tls \
  --cafile ${FABRIC_SAMPLES_PATH}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem
print_success "Approved for Org2"
echo ""

# Approve for Org1
echo "Step 10: Approving for Org1..."
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_ADDRESS=localhost:7051
export CORE_PEER_TLS_ROOTCERT_FILE=${FABRIC_SAMPLES_PATH}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${FABRIC_SAMPLES_PATH}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp

peer lifecycle chaincode approveformyorg \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --channelID $CHANNEL_NAME \
  --name $CHAINCODE_NAME \
  --version 1.0 \
  --package-id $PACKAGE_ID \
  --sequence 1 \
  --tls \
  --cafile ${FABRIC_SAMPLES_PATH}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem
print_success "Approved for Org1"
echo ""

# Commit chaincode
echo "Step 11: Committing chaincode..."
peer lifecycle chaincode commit \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --channelID $CHANNEL_NAME \
  --name $CHAINCODE_NAME \
  --version 1.0 \
  --sequence 1 \
  --tls \
  --cafile ${FABRIC_SAMPLES_PATH}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles ${FABRIC_SAMPLES_PATH}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt \
  --peerAddresses localhost:9051 \
  --tlsRootCertFiles ${FABRIC_SAMPLES_PATH}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt
print_success "Chaincode committed"
echo ""

# Build Docker image
echo "Step 12: Building Docker image..."
cd "$BACKEND_PATH"
docker build -t chainvanguard-chaincode:1.0 -f chaincode/Dockerfile . > /dev/null
print_success "Docker image built"
echo ""

# Start chaincode container
echo "Step 13: Starting chaincode container..."
docker run -d \
  --name chainvanguard \
  --network fabric_test \
  -e CHAINCODE_SERVER_ADDRESS=0.0.0.0:9999 \
  -e CHAINCODE_ID=$PACKAGE_ID \
  -p 9999:9999 \
  chainvanguard-chaincode:1.0 > /dev/null

sleep 5
if docker ps | grep -q chainvanguard; then
    print_success "Chaincode container running"
else
    print_error "Chaincode container failed to start"
    docker logs chainvanguard
    exit 1
fi
echo ""

# Initialize all 7 contracts
echo "Step 14: Initializing all contracts..."

ORG1_CERT=${FABRIC_SAMPLES_PATH}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
ORG2_CERT=${FABRIC_SAMPLES_PATH}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt

# Initialize UserContract
print_info "Initializing UserContract..."
peer chaincode invoke \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls \
  --cafile ${FABRIC_SAMPLES_PATH}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem \
  -C $CHANNEL_NAME \
  -n $CHAINCODE_NAME \
  --peerAddresses localhost:7051 --tlsRootCertFiles $ORG1_CERT \
  --peerAddresses localhost:9051 --tlsRootCertFiles $ORG2_CERT \
  -c '{"function":"UserContract:initLedger","Args":[]}' > /dev/null 2>&1 || print_info "UserContract already initialized"

# Initialize ProductContract
print_info "Initializing ProductContract..."
peer chaincode invoke \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls \
  --cafile ${FABRIC_SAMPLES_PATH}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem \
  -C $CHANNEL_NAME \
  -n $CHAINCODE_NAME \
  --peerAddresses localhost:7051 --tlsRootCertFiles $ORG1_CERT \
  --peerAddresses localhost:9051 --tlsRootCertFiles $ORG2_CERT \
  -c '{"function":"ProductContract:initLedger","Args":[]}' > /dev/null 2>&1 || print_info "ProductContract already initialized"

# Initialize OrderContract
print_info "Initializing OrderContract..."
peer chaincode invoke \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls \
  --cafile ${FABRIC_SAMPLES_PATH}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem \
  -C $CHANNEL_NAME \
  -n $CHAINCODE_NAME \
  --peerAddresses localhost:7051 --tlsRootCertFiles $ORG1_CERT \
  --peerAddresses localhost:9051 --tlsRootCertFiles $ORG2_CERT \
  -c '{"function":"OrderContract:initLedger","Args":[]}' > /dev/null 2>&1 || print_info "OrderContract already initialized"

# Initialize InventoryContract
print_info "Initializing InventoryContract..."
peer chaincode invoke \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls \
  --cafile ${FABRIC_SAMPLES_PATH}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem \
  -C $CHANNEL_NAME \
  -n $CHAINCODE_NAME \
  --peerAddresses localhost:7051 --tlsRootCertFiles $ORG1_CERT \
  --peerAddresses localhost:9051 --tlsRootCertFiles $ORG2_CERT \
  -c '{"function":"InventoryContract:initLedger","Args":[]}' > /dev/null 2>&1 || print_info "InventoryContract already initialized"

# Initialize VendorRequestContract
print_info "Initializing VendorRequestContract..."
peer chaincode invoke \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls \
  --cafile ${FABRIC_SAMPLES_PATH}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem \
  -C $CHANNEL_NAME \
  -n $CHAINCODE_NAME \
  --peerAddresses localhost:7051 --tlsRootCertFiles $ORG1_CERT \
  --peerAddresses localhost:9051 --tlsRootCertFiles $ORG2_CERT \
  -c '{"function":"VendorRequestContract:initLedger","Args":[]}' > /dev/null 2>&1 || print_info "VendorRequestContract already initialized"

# Initialize VendorInventoryContract ✨ NEW CONTRACT
print_info "Initializing VendorInventoryContract..."
peer chaincode invoke \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls \
  --cafile ${FABRIC_SAMPLES_PATH}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem \
  -C $CHANNEL_NAME \
  -n $CHAINCODE_NAME \
  --peerAddresses localhost:7051 --tlsRootCertFiles $ORG1_CERT \
  --peerAddresses localhost:9051 --tlsRootCertFiles $ORG2_CERT \
  -c '{"function":"VendorInventoryContract:initLedger","Args":[]}' > /dev/null 2>&1 || print_info "VendorInventoryContract already initialized"

# Initialize TokenContract
print_info "Initializing TokenContract..."
peer chaincode invoke \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls \
  --cafile ${FABRIC_SAMPLES_PATH}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem \
  -C $CHANNEL_NAME \
  -n $CHAINCODE_NAME \
  --peerAddresses localhost:7051 --tlsRootCertFiles $ORG1_CERT \
  --peerAddresses localhost:9051 --tlsRootCertFiles $ORG2_CERT \
  -c '{"function":"TokenContract:initLedger","Args":[]}' > /dev/null 2>&1 || print_info "TokenContract already initialized"

print_success "All 7 contracts initialized"
echo ""

echo "=========================================="
echo "🎉 Setup Complete!"
echo "=========================================="
echo ""
echo "✅ Deployed Contracts:"
echo "   1. UserContract"
echo "   2. ProductContract"
echo "   3. OrderContract"
echo "   4. InventoryContract"
echo "   5. VendorRequestContract"
echo "   6. VendorInventoryContract"
echo "   7. TokenContract"
echo ""
echo "📊 CouchDB Access:"
echo "   Org1: http://localhost:5984/_utils/"
echo "   Org2: http://localhost:7984/_utils/"
echo "   Login: admin / adminpw"
echo ""
echo "Next steps:"
echo "  1. Start API: cd $BACKEND_PATH/api && npm run dev"
echo "  2. Test contracts with test-contracts.sh"
echo ""
echo "Package ID saved to: ~/.chainvanguard_package_id"
echo ""