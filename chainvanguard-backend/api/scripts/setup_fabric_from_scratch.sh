#!/bin/bash
set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " 🧱 Hyperledger Fabric Full Setup - From Scratch"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

#--------------------------------------------------
# Step 1: Clean Up Old Setup
#--------------------------------------------------
echo "🧹 Cleaning up old Fabric setup..."
cd ~/Desktop || exit

# Stop and remove old containers
if [ -d "fabric-samples/test-network" ]; then
  cd fabric-samples/test-network
  ./network.sh down || true
  cd ~/Desktop
fi

docker stop $(docker ps -aq) >/dev/null 2>&1 || true
docker rm $(docker ps -aq) >/dev/null 2>&1 || true
docker volume prune -f
docker network prune -f
docker system prune -a --volumes -f

rm -rf ~/Desktop/fabric-samples
echo "✅ Old setup removed."

#--------------------------------------------------
# Step 2: Clone and Install Fabric
#--------------------------------------------------
echo "📦 Cloning fabric-samples and installing binaries..."
git clone https://github.com/hyperledger/fabric-samples.git
cd fabric-samples

# Install latest binaries, docker images, and samples
curl -sSL https://raw.githubusercontent.com/hyperledger/fabric/main/scripts/install-fabric.sh | bash -s -- docker samples binary

#--------------------------------------------------
# Step 3: Start Network
#--------------------------------------------------
echo "🚀 Starting Fabric Test Network..."
cd test-network

# Restore cryptogen configs if missing
if [ ! -d "organizations/cryptogen" ]; then
  git checkout -- organizations/cryptogen
fi

export PATH=${PWD}/../bin:$PATH
export FABRIC_CFG_PATH=${PWD}/../config/

./network.sh up createChannel -c supply-chain-channel
echo "✅ Fabric network and channel started."

#--------------------------------------------------
# Step 4: Deploy Chaincode
#--------------------------------------------------
CHAINCODE_PATH=~/Desktop/chainvanguard-nextjs/chainvanguard-backend/chaincode/textile-scm
CHAINCODE_NAME=textile-scm
CHAINCODE_LANG=javascript
CHANNEL_NAME=supply-chain-channel

echo "⚙️  Deploying chaincode: ${CHAINCODE_NAME}..."
./network.sh deployCC \
  -ccn $CHAINCODE_NAME \
  -ccp $CHAINCODE_PATH \
  -ccl $CHAINCODE_LANG \
  -c $CHANNEL_NAME
echo "✅ Chaincode deployed successfully."

#--------------------------------------------------
# Step 5: Test Chaincode
#--------------------------------------------------
echo "🧪 Running initial test..."

export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051
export FABRIC_CFG_PATH=$PWD/../config/

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

sleep 5

# Query Ledger
peer chaincode query -C $CHANNEL_NAME -n $CHAINCODE_NAME -c '{"function":"GetAllProducts","Args":[]}'
echo "✅ Chaincode test complete."

#--------------------------------------------------
# Step 6: Copy Orgs to API
#--------------------------------------------------
echo "📁 Copying organizations to API..."
cd ~/Desktop/chainvanguard-nextjs/chainvanguard-backend/api
rm -rf organizations wallet
cp -r ~/Desktop/fabric-samples/test-network/organizations .

echo "✅ Copied organizations to API."

#--------------------------------------------------
# Step 7: Final Message
#--------------------------------------------------
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Fabric Setup Complete!"
echo "👉 Next steps:"
echo "   1️⃣ cd ~/Desktop/chainvanguard-nextjs/chainvanguard-backend/api"
echo "   2️⃣ npm install"
echo "   3️⃣ npm run dev"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"