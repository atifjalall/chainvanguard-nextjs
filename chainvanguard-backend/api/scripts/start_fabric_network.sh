#!/bin/bash
set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Starting Hyperledger Fabric Network"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

#--------------------------------------------------
# Step 1: Navigate to test-network
#--------------------------------------------------
cd ~/Desktop/fabric-samples/test-network || {
  echo "❌ test-network folder not found. Please reinstall Fabric first."
  exit 1
}

#--------------------------------------------------
# Step 2: Export Environment Variables
#--------------------------------------------------
export PATH=${PWD}/../bin:$PATH
export FABRIC_CFG_PATH=${PWD}/../config/

#--------------------------------------------------
# Step 3: Bring Up Network
#--------------------------------------------------
echo "🧱 Starting Fabric containers and creating channel..."
./network.sh up createChannel -c supply-chain-channel
echo "✅ Network started successfully."

#--------------------------------------------------
# Step 4: Deploy Chaincode
#--------------------------------------------------
CHAINCODE_PATH=~/Desktop/chainvanguard-nextjs/chainvanguard-backend/chaincode
CHANNEL_NAME=supply-chain-channel

echo "⚙️ Deploying USER chaincode..."
./network.sh deployCC \
  -ccn user \
  -ccp $CHAINCODE_PATH \
  -ccl javascript \
  -c $CHANNEL_NAME \
  -ccv 1.2

echo "⚙️ Deploying PRODUCT chaincode..."
./network.sh deployCC \
  -ccn product \
  -ccp $CHAINCODE_PATH \
  -ccl javascript \
  -c $CHANNEL_NAME \
  -ccv 1.0

echo "⚙️ Deploying ORDER chaincode..."
./network.sh deployCC \
  -ccn order \
  -ccp $CHAINCODE_PATH \
  -ccl javascript \
  -c $CHANNEL_NAME \
  -ccv 1.0
echo "✅ Chaincode deployed successfully."

#--------------------------------------------------
# Step 5: Initialize & Query
#--------------------------------------------------
echo "🧪 Initializing ledger and testing query..."

export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051

# Initialize Ledger
peer chaincode invoke \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls \
  --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" \
  -C $CHANNEL_NAME \
  -n $CHAINCODE_NAME \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" \
  --peerAddresses localhost:9051 \
  --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" \
  -c '{"function":"InitLedger","Args":[]}'

sleep 3

# Query Ledger
echo "🧪 Testing chaincode queries..."

peer chaincode query -C $CHANNEL_NAME -n user -c '{"function":"getAllUsers","Args":[]}'
peer chaincode query -C $CHANNEL_NAME -n product -c '{"function":"ProductContract:getAllProducts","Args":[]}'
peer chaincode query -C $CHANNEL_NAME -n order -c '{"function":"OrderContract:getAllOrders","Args":[]}'

echo "✅ All chaincodes deployed and tested successfully."

#--------------------------------------------------
# Step 6: Copy Fresh Organizations to API
#--------------------------------------------------
echo "📁 Copying organizations to backend API..."
cd ~/Desktop/chainvanguard-nextjs/chainvanguard-backend/api
rm -rf organizations wallet
cp -r ~/Desktop/fabric-samples/test-network/organizations .
echo "✅ Copied successfully."

#--------------------------------------------------
# Step 7: Completion Message
#--------------------------------------------------
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Fabric Network Started Successfully!"
echo "👉 Next Steps:"
echo "   cd ~/Desktop/chainvanguard-nextjs/chainvanguard-backend/api"
echo "   npm run dev"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"