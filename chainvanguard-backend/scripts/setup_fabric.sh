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

echo "🧹 Removing old ledgers and artifacts..."
if [ -d "~/Desktop/fabric-samples/test-network" ]; then
  cd ~/Desktop/fabric-samples/test-network
  ./network.sh down || true
  rm -rf organizations channel-artifacts system-genesis-block ledger-data
  cd ~/Desktop
fi

echo "🧽 Cleaning Docker containers, networks, and volumes..."
docker stop $(docker ps -aq) >/dev/null 2>&1 || true
docker rm $(docker ps -aq) >/dev/null 2>&1 || true
docker network prune -f
docker volume prune -f
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
# Step 4: Copy Orgs to API
#--------------------------------------------------
echo "📁 Copying organizations to API..."
cd ~/Desktop/chainvanguard-nextjs/chainvanguard-backend/api
rm -rf organizations wallet
cp -r ~/Desktop/fabric-samples/test-network/organizations .

echo "✅ Copied organizations to API."

#--------------------------------------------------
# Step 5: Final Message
#--------------------------------------------------
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Fabric Setup Complete!"
echo "👉 Next steps:"
echo "   1️⃣ Deploy your chaincode using deploy-all-chaincodes.sh script"
echo "   2️⃣ cd ~/Desktop/chainvanguard-nextjs/chainvanguard-backend/api"
echo "   3️⃣ npm install"
echo "   4️⃣ npm run dev"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"