#!/bin/bash
# ===============================================================
# 🚀 ChainVanguard - Order Chaincode Deployment Script
# ===============================================================
# Works with Hyperledger Fabric v2.x
# Deploys order-chaincode across Org1 and Org2
# ===============================================================

set -e  # Exit on error
echo "======================="
echo "🔧 Starting Order Chaincode Deployment"
echo "======================="

# --- CONFIG ---
CHANNEL_NAME="supply-chain-channel"
CC_NAME="order"
CC_VERSION="1.0"
CC_SEQUENCE="1"
CC_LABEL="order_${CC_VERSION}"
CC_SRC_PATH=~/Desktop/chainvanguard-nextjs/chainvanguard-backend/chaincode
CC_PACKAGE_FILE=~/Desktop/chainvanguard-nextjs/chainvanguard-backend/order-chaincode-v${CC_VERSION}.tar.gz
TEST_NETWORK_PATH=~/Desktop/fabric-samples/test-network

# ---------------------------------------------------------------
# Step 1: Package the chaincode
# ---------------------------------------------------------------
echo "📦 Packaging order chaincode..."
cd $CC_SRC_PATH/..
peer lifecycle chaincode package ${CC_PACKAGE_FILE} \
  --path ./chaincode \
  --lang node \
  --label ${CC_LABEL}

# ---------------------------------------------------------------
# Step 2: Install chaincode on Org1
# ---------------------------------------------------------------
echo "🏢 Installing order chaincode on Org1..."
cd $TEST_NETWORK_PATH

export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051

peer lifecycle chaincode install ${CC_PACKAGE_FILE}

# ---------------------------------------------------------------
# Step 3: Install chaincode on Org2
# ---------------------------------------------------------------
echo "🏢 Installing order chaincode on Org2..."

export CORE_PEER_LOCALMSPID="Org2MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp
export CORE_PEER_ADDRESS=localhost:9051

peer lifecycle chaincode install ${CC_PACKAGE_FILE}

# ---------------------------------------------------------------
# Step 4: Get package ID (from Org1)
# ---------------------------------------------------------------
echo "🔍 Query installed chaincodes on Org1..."
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051

peer lifecycle chaincode queryinstalled > installed_order.txt
CC_PACKAGE_ID=$(grep "${CC_LABEL}" installed_order.txt | awk -F "[, ]+" '{print $3}' | sed 's/,$//')

echo "✅ Detected Package ID: ${CC_PACKAGE_ID}"

# ---------------------------------------------------------------
# Step 5: Approve chaincode for Org1
# ---------------------------------------------------------------
echo "🗳️ Approving order chaincode for Org1..."
peer lifecycle chaincode approveformyorg \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --channelID ${CHANNEL_NAME} \
  --name ${CC_NAME} \
  --version ${CC_VERSION} \
  --package-id ${CC_PACKAGE_ID} \
  --sequence ${CC_SEQUENCE} \
  --tls \
  --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem"

# ---------------------------------------------------------------
# Step 6: Approve chaincode for Org2
# ---------------------------------------------------------------
echo "🗳️ Approving order chaincode for Org2..."
export CORE_PEER_LOCALMSPID="Org2MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp
export CORE_PEER_ADDRESS=localhost:9051

peer lifecycle chaincode approveformyorg \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --channelID ${CHANNEL_NAME} \
  --name ${CC_NAME} \
  --version ${CC_VERSION} \
  --package-id ${CC_PACKAGE_ID} \
  --sequence ${CC_SEQUENCE} \
  --tls \
  --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem"

# ---------------------------------------------------------------
# Step 7: Check commit readiness
# ---------------------------------------------------------------
echo "🔎 Checking commit readiness..."
peer lifecycle chaincode checkcommitreadiness \
  --channelID ${CHANNEL_NAME} \
  --name ${CC_NAME} \
  --version ${CC_VERSION} \
  --sequence ${CC_SEQUENCE} \
  --tls \
  --output json \
  --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem"

# ---------------------------------------------------------------
# Step 8: Commit the chaincode definition
# ---------------------------------------------------------------
echo "🚀 Committing order chaincode definition..."
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051

peer lifecycle chaincode commit \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --channelID ${CHANNEL_NAME} \
  --name ${CC_NAME} \
  --version ${CC_VERSION} \
  --sequence ${CC_SEQUENCE} \
  --tls \
  --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" \
  --peerAddresses localhost:9051 \
  --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt"

# ---------------------------------------------------------------
# Step 9: Verify commit
# ---------------------------------------------------------------
echo "✅ Verifying committed chaincode..."
peer lifecycle chaincode querycommitted -C ${CHANNEL_NAME} --name ${CC_NAME}

# ---------------------------------------------------------------
# Step 10: Test query (getAllOrders)
# ---------------------------------------------------------------
echo "🧩 Running test query (getAllOrders)..."
peer chaincode query \
  -C ${CHANNEL_NAME} \
  -n ${CC_NAME} \
  -c '{"function":"OrderContract:getAllOrders","Args":[]}' \
  --tls \
  --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem"

echo ""
echo "🎉 Order Chaincode Deployment completed successfully!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Next Steps:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣  Test order creation:"
echo "   peer chaincode invoke -C supply-chain-channel -n order \\"
echo "     --peerAddresses localhost:7051 --tlsRootCertFiles \"\${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt\" \\"
echo "     --peerAddresses localhost:9051 --tlsRootCertFiles \"\${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt\" \\"
echo "     --tls --cafile \"\${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem\" \\"
echo "     -c '{\"function\":\"OrderContract:createOrder\",\"Args\":[\"{\\\"orderId\\\":\\\"test-order-001\\\",\\\"orderNumber\\\":\\\"ORD-TEST-001\\\",\\\"customerId\\\":\\\"cust-001\\\",\\\"sellerId\\\":\\\"seller-001\\\",\\\"items\\\":[],\\\"total\\\":100}\"]}'"
echo ""
echo "2️⃣  Start your backend: cd ~/Desktop/chainvanguard-nextjs/chainvanguard-backend/api && npm run dev"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"