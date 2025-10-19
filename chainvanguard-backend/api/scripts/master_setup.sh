#!/bin/bash

echo "╔══════════════════════════════════════════════════════════╗"
echo "║                                                          ║"
echo "║   🚀 ChainVanguard - Complete Setup & Deployment        ║"
echo "║                                                          ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Paths
FABRIC_SAMPLES=~/Desktop/fabric-samples
TEST_NETWORK=$FABRIC_SAMPLES/test-network
CHAINCODE_PATH=~/Desktop/chainvanguard-nextjs/chainvanguard-backend/chaincode
API_PATH=~/Desktop/chainvanguard-nextjs/chainvanguard-backend/api

# ============================================
# STEP 1: Clean Everything
# ============================================
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}STEP 1: Cleaning Previous Deployment${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

cd $TEST_NETWORK
./network.sh down

# Remove chaincode containers
docker rm -f $(docker ps -aq --filter "name=dev-peer") 2>/dev/null || true
docker rmi -f $(docker images -q --filter "reference=dev-peer*") 2>/dev/null || true
docker volume prune -f

echo -e "${GREEN}✅ Cleanup complete${NC}"
echo ""

# ============================================
# STEP 2: Start Fabric Network
# ============================================
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}STEP 2: Starting Fabric Network${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

cd $TEST_NETWORK
export PATH=${PWD}/../bin:$PATH
export FABRIC_CFG_PATH=${PWD}/../config/

./network.sh up createChannel -c supply-chain-channel

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to start network${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Network started${NC}"
echo ""

# ============================================
# STEP 3: Deploy User Chaincode
# ============================================
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}STEP 3: Deploying User Chaincode${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Package user chaincode
cd $CHAINCODE_PATH/..
CC_PACKAGE_FILE=user-chaincode-v1.2.tar.gz

peer lifecycle chaincode package ${CC_PACKAGE_FILE} \
  --path ./chaincode \
  --lang node \
  --label user_1.2

# Install on Org1
cd $TEST_NETWORK
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051

peer lifecycle chaincode install $CHAINCODE_PATH/../${CC_PACKAGE_FILE}

# Install on Org2
export CORE_PEER_LOCALMSPID="Org2MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp
export CORE_PEER_ADDRESS=localhost:9051

peer lifecycle chaincode install $CHAINCODE_PATH/../${CC_PACKAGE_FILE}

# Get package ID
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_ADDRESS=localhost:7051
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp

peer lifecycle chaincode queryinstalled > installed.txt
USER_PACKAGE_ID=$(grep "user_1.2" installed.txt | awk -F "[, ]+" '{print $3}' | sed 's/,$//')

echo -e "${BLUE}📦 User Package ID: $USER_PACKAGE_ID${NC}"

# Approve for Org1
peer lifecycle chaincode approveformyorg \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --channelID supply-chain-channel \
  --name user \
  --version 1.2 \
  --package-id ${USER_PACKAGE_ID} \
  --sequence 1 \
  --tls \
  --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem"

# Approve for Org2
export CORE_PEER_LOCALMSPID="Org2MSP"
export CORE_PEER_ADDRESS=localhost:9051
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp

peer lifecycle chaincode approveformyorg \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --channelID supply-chain-channel \
  --name user \
  --version 1.2 \
  --package-id ${USER_PACKAGE_ID} \
  --sequence 1 \
  --tls \
  --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem"

# Commit
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_ADDRESS=localhost:7051
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp

peer lifecycle chaincode commit \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --channelID supply-chain-channel \
  --name user \
  --version 1.2 \
  --sequence 1 \
  --tls \
  --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" \
  --peerAddresses localhost:9051 \
  --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt"

echo -e "${GREEN}✅ User chaincode deployed${NC}"
echo ""

# ============================================
# STEP 4: Deploy Product Chaincode
# ============================================
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}STEP 4: Deploying Product Chaincode${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Package product chaincode
cd $CHAINCODE_PATH/..
CC_PACKAGE_FILE_PRODUCT=product-chaincode-v1.0.tar.gz

peer lifecycle chaincode package ${CC_PACKAGE_FILE_PRODUCT} \
  --path ./chaincode \
  --lang node \
  --label product_1.0

# Install on Org1
cd $TEST_NETWORK
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_ADDRESS=localhost:7051
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp

peer lifecycle chaincode install $CHAINCODE_PATH/../${CC_PACKAGE_FILE_PRODUCT}

# Install on Org2
export CORE_PEER_LOCALMSPID="Org2MSP"
export CORE_PEER_ADDRESS=localhost:9051
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp

peer lifecycle chaincode install $CHAINCODE_PATH/../${CC_PACKAGE_FILE_PRODUCT}

# Get package ID
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_ADDRESS=localhost:7051
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp

peer lifecycle chaincode queryinstalled > installed_product.txt
PRODUCT_PACKAGE_ID=$(grep "product_1.0" installed_product.txt | awk -F "[, ]+" '{print $3}' | sed 's/,$//')

echo -e "${BLUE}📦 Product Package ID: $PRODUCT_PACKAGE_ID${NC}"

# Approve for Org1
peer lifecycle chaincode approveformyorg \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --channelID supply-chain-channel \
  --name product \
  --version 1.0 \
  --package-id ${PRODUCT_PACKAGE_ID} \
  --sequence 1 \
  --tls \
  --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem"

# Approve for Org2
export CORE_PEER_LOCALMSPID="Org2MSP"
export CORE_PEER_ADDRESS=localhost:9051
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp

peer lifecycle chaincode approveformyorg \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --channelID supply-chain-channel \
  --name product \
  --version 1.0 \
  --package-id ${PRODUCT_PACKAGE_ID} \
  --sequence 1 \
  --tls \
  --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem"

# Commit
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_ADDRESS=localhost:7051
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp

peer lifecycle chaincode commit \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --channelID supply-chain-channel \
  --name product \
  --version 1.0 \
  --sequence 1 \
  --tls \
  --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" \
  --peerAddresses localhost:9051 \
  --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt"

echo -e "${GREEN}✅ Product chaincode deployed${NC}"
echo ""

# ============================================
# STEP 5: Verify Deployment
# ============================================
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}STEP 5: Verifying Deployment${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

sleep 3

echo ""
echo "Deployed Chaincodes:"
docker ps --format "table {{.Names}}\t{{.Status}}" | grep -E "user|product"

echo ""
echo "Testing getAllUsers:"
peer chaincode query \
  -C supply-chain-channel \
  -n user \
  -c '{"function":"getAllUsers","Args":[]}' 2>&1 | head -5

echo ""
echo "Testing getAllProducts:"
peer chaincode query \
  -C supply-chain-channel \
  -n product \
  -c '{"function":"getAllProducts","Args":[]}' 2>&1 | head -5

echo -e "${GREEN}✅ Verification complete${NC}"
echo ""

# ============================================
# STEP 6: Clean MongoDB
# ============================================
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}STEP 6: Cleaning MongoDB${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

mongosh mongodb://localhost:27017/test --eval '
  db.users.deleteMany({});
  db.products.deleteMany({});
  print("✅ MongoDB cleaned");
'

echo -e "${GREEN}✅ MongoDB cleaned${NC}"
echo ""

# ============================================
# STEP 7: Update Backend Configuration
# ============================================
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}STEP 7: Updating Backend Configuration${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Create backup
cp $API_PATH/src/services/fabric.service.js $API_PATH/src/services/fabric.service.js.backup

# Update fabric.service.js (using sed for macOS)
sed -i '' 's/const userChaincodeName = ".*";/const userChaincodeName = "user";/' $API_PATH/src/services/fabric.service.js
sed -i '' 's/const productChaincodeName = ".*";/const productChaincodeName = "product";/' $API_PATH/src/services/fabric.service.js

echo -e "${GREEN}✅ Backend configuration updated${NC}"
echo ""

# ============================================
# FINAL SUMMARY
# ============================================
echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                          ║${NC}"
echo -e "${GREEN}║        🎉 DEPLOYMENT COMPLETE! 🎉                        ║${NC}"
echo -e "${GREEN}║                                                          ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📊 Summary:${NC}"
echo -e "  ✅ Network: Running"
echo -e "  ✅ User Chaincode: Deployed (name: user)"
echo -e "  ✅ Product Chaincode: Deployed (name: product)"
echo -e "  ✅ MongoDB: Cleaned"
echo -e "  ✅ Backend: Configured"
echo ""
echo -e "${YELLOW}🔧 Next Steps:${NC}"
echo -e "  1️⃣  Start API server:"
echo -e "     cd $API_PATH && npm run dev"
echo ""
echo -e "  2️⃣  Run auth tests to create users:"
echo -e "     cd $API_PATH/scripts && ./test_auth_complete.sh"
echo ""
echo -e "  3️⃣  Update product test script with new tokens/IDs"
echo ""
echo -e "  4️⃣  Run product tests:"
echo -e "     cd $API_PATH/scripts && ./test_products_complete.sh"
echo ""
echo -e "${CYAN}⚡ Quick Verification Commands:${NC}"
echo -e "  • Check containers: docker ps | grep hyperledger"
echo -e "  • Query users: peer chaincode query -C supply-chain-channel -n user -c '{\"function\":\"getAllUsers\",\"Args\":[]}'"
echo -e "  • Query products: peer chaincode query -C supply-chain-channel -n product -c '{\"function\":\"getAllProducts\",\"Args\":[]}'"
echo ""