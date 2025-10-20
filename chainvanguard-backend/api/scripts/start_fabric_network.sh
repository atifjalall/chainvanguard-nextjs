#!/bin/bash
set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Starting Hyperledger Fabric Network"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

#--------------------------------------------------
# 🌐 GLOBAL CONFIGURATION
#--------------------------------------------------
NETWORK_DIR=~/Desktop/fabric-samples/test-network
CHAINCODE_PATH=~/Desktop/chainvanguard-nextjs/chainvanguard-backend/chaincode
CHANNEL_NAME="supply-chain-channel"
FABRIC_CFG_PATH=${NETWORK_DIR}/../config
CHAINCODE_LANG="javascript"

# You can select which chaincode(s) to deploy:
# Options: user, product, order, all
CHAINCODE_TARGET="all"

#--------------------------------------------------
# Step 1: Check and Navigate to test-network
#--------------------------------------------------
cd "$NETWORK_DIR" || {
  echo "❌ test-network folder not found. Please reinstall Fabric first."
  exit 1
}

#--------------------------------------------------
# Step 2: Export Environment Variables
#--------------------------------------------------
export PATH=${PWD}/../bin:$PATH
export FABRIC_CFG_PATH=$FABRIC_CFG_PATH

#--------------------------------------------------
# Step 3: Start Network
#--------------------------------------------------
echo "🧱 Starting Fabric containers and creating channel..."
./network.sh up createChannel -c $CHANNEL_NAME || echo "⚠️ Network or channel may already exist."
echo "✅ Network started successfully."

#--------------------------------------------------
# Step 4: Deploy Chaincodes
#--------------------------------------------------
deploy_chaincode() {
  local CC_NAME=$1
  local CC_VERSION=$2

  echo "⚙️ Deploying $CC_NAME chaincode (version $CC_VERSION)..."
  ./network.sh deployCC \
    -ccn $CC_NAME \
    -ccp $CHAINCODE_PATH \
    -ccl $CHAINCODE_LANG \
    -c $CHANNEL_NAME \
    -ccv $CC_VERSION || echo "⚠️ $CC_NAME deployment may already exist."
}

if [[ "$CHAINCODE_TARGET" == "all" || "$CHAINCODE_TARGET" == "user" ]]; then
  deploy_chaincode "user" "1.2"
fi

if [[ "$CHAINCODE_TARGET" == "all" || "$CHAINCODE_TARGET" == "product" ]]; then
  deploy_chaincode "product" "1.0"
fi

if [[ "$CHAINCODE_TARGET" == "all" || "$CHAINCODE_TARGET" == "order" ]]; then
  deploy_chaincode "order" "1.0"
fi

echo "✅ Chaincode deployment phase complete."

#--------------------------------------------------
# Step 5: Initialize & Query Chaincodes
#--------------------------------------------------
echo "🧪 Initializing ledger and running basic queries..."

export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051

# Helper to invoke InitLedger safely
invoke_init_ledger() {
  local CC_NAME=$1
  echo "🧩 Initializing ledger for $CC_NAME..."
  peer chaincode invoke \
    -o localhost:7050 \
    --ordererTLSHostnameOverride orderer.example.com \
    --tls \
    --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" \
    -C $CHANNEL_NAME \
    -n $CC_NAME \
    --peerAddresses localhost:7051 \
    --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" \
    --peerAddresses localhost:9051 \
    --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" \
    -c '{"function":"InitLedger","Args":[]}' || echo "⚠️ $CC_NAME ledger may already be initialized."
}

query_chaincode() {
  local CC_NAME=$1
  local FUNCTION=$2

  echo "🔍 Querying $CC_NAME chaincode ($FUNCTION)..."
  peer chaincode query -C $CHANNEL_NAME -n $CC_NAME -c "{\"function\":\"$FUNCTION\",\"Args\":[]}" || echo "⚠️ Query failed for $CC_NAME."
}

# Initialize + Query all chaincodes
if [[ "$CHAINCODE_TARGET" == "all" || "$CHAINCODE_TARGET" == "user" ]]; then
  invoke_init_ledger "user"
  query_chaincode "user" "getAllUsers"
fi

if [[ "$CHAINCODE_TARGET" == "all" || "$CHAINCODE_TARGET" == "product" ]]; then
  invoke_init_ledger "product"
  query_chaincode "product" "getAllProducts"
fi

if [[ "$CHAINCODE_TARGET" == "all" || "$CHAINCODE_TARGET" == "order" ]]; then
  invoke_init_ledger "order"
  query_chaincode "order" "getAllOrders"
fi

echo "✅ Ledger initialization and queries complete."

#--------------------------------------------------
# Step 6: Copy Organizations to Backend API
#--------------------------------------------------
echo "📁 Copying organizations folder to backend API..."
cd ~/Desktop/chainvanguard-nextjs/chainvanguard-backend/api
rm -rf organizations wallet
cp -r $NETWORK_DIR/organizations .
echo "✅ Organizations copied successfully."

#--------------------------------------------------
# Step 7: Completion Message
#--------------------------------------------------
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Fabric Network Started Successfully!"
echo "👉 Next Steps:"
echo "   cd ~/Desktop/chainvanguard-nextjs/chainvanguard-backend/api"
echo "   npm run dev"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"