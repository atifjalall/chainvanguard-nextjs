#!/bin/bash

# Deploy BackupContract to Hyperledger Fabric
# This script upgrades the existing chaincode to include BackupContract

set -e

echo ""
echo "========================================================================"
echo " DEPLOYING BACKUPCONTRACT TO HYPERLEDGER FABRIC"
echo "========================================================================"
echo ""

# Set paths
export PATH=$HOME/Desktop/fabric-samples/bin:$PATH
export FABRIC_CFG_PATH=$HOME/Desktop/fabric-samples/config/
CHAINCODE_PATH="$HOME/Desktop/chainvanguard-nextjs/chainvanguard-backend/chaincode"
TEST_NETWORK_PATH="$HOME/Desktop/fabric-samples/test-network"

# Chaincode details
CHAINCODE_NAME="chainvanguard"
VERSION="2.0"
SEQUENCE="2"
CHANNEL_NAME="supply-chain-channel"

echo "📦 Chaincode Details:"
echo "   Name:     $CHAINCODE_NAME"
echo "   Version:  $VERSION"
echo "   Sequence: $SEQUENCE"
echo "   Channel:  $CHANNEL_NAME"
echo "   Path:     $CHAINCODE_PATH"
echo ""

# Navigate to test network
cd $TEST_NETWORK_PATH

# Step 1: Package the chaincode
echo "========================================="
echo "STEP 1: Packaging Chaincode"
echo "========================================="
echo ""

PACKAGE_FILE="${CHAINCODE_NAME}_${VERSION}.tar.gz"

if [ -f "$PACKAGE_FILE" ]; then
    echo "⚠️  Package file already exists, removing..."
    rm "$PACKAGE_FILE"
fi

peer lifecycle chaincode package "$PACKAGE_FILE" \
    --path "$CHAINCODE_PATH" \
    --lang node \
    --label "${CHAINCODE_NAME}_${VERSION}"

echo "✅ Chaincode packaged: $PACKAGE_FILE"
echo ""

# Step 2: Install on Org1
echo "========================================="
echo "STEP 2: Installing on Org1"
echo "========================================="
echo ""

export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=$TEST_NETWORK_PATH/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=$TEST_NETWORK_PATH/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051

peer lifecycle chaincode install "$PACKAGE_FILE"

echo "✅ Installed on Org1"
echo ""

# Step 3: Install on Org2
echo "========================================="
echo "STEP 3: Installing on Org2"
echo "========================================="
echo ""

export CORE_PEER_LOCALMSPID="Org2MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=$TEST_NETWORK_PATH/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=$TEST_NETWORK_PATH/organizations/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp
export CORE_PEER_ADDRESS=localhost:9051

peer lifecycle chaincode install "$PACKAGE_FILE"

echo "✅ Installed on Org2"
echo ""

# Step 4: Query installed chaincode to get package ID
echo "========================================="
echo "STEP 4: Querying Package ID"
echo "========================================="
echo ""

# Query from Org1
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=$TEST_NETWORK_PATH/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=$TEST_NETWORK_PATH/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051

PACKAGE_ID=$(peer lifecycle chaincode queryinstalled | grep "${CHAINCODE_NAME}_${VERSION}" | sed 's/^Package ID: \(.*\), Label:.*$/\1/')

if [ -z "$PACKAGE_ID" ]; then
    echo "❌ Failed to get package ID"
    exit 1
fi

echo "✅ Package ID: $PACKAGE_ID"
echo ""

# Step 5: Approve for Org1
echo "========================================="
echo "STEP 5: Approving for Org1"
echo "========================================="
echo ""

peer lifecycle chaincode approveformyorg \
    -o localhost:7050 \
    --ordererTLSHostnameOverride orderer.example.com \
    --tls \
    --cafile $TEST_NETWORK_PATH/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem \
    --channelID "$CHANNEL_NAME" \
    --name "$CHAINCODE_NAME" \
    --version "$VERSION" \
    --package-id "$PACKAGE_ID" \
    --sequence "$SEQUENCE"

echo "✅ Approved for Org1"
echo ""

# Step 6: Approve for Org2
echo "========================================="
echo "STEP 6: Approving for Org2"
echo "========================================="
echo ""

export CORE_PEER_LOCALMSPID="Org2MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=$TEST_NETWORK_PATH/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=$TEST_NETWORK_PATH/organizations/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp
export CORE_PEER_ADDRESS=localhost:9051

peer lifecycle chaincode approveformyorg \
    -o localhost:7050 \
    --ordererTLSHostnameOverride orderer.example.com \
    --tls \
    --cafile $TEST_NETWORK_PATH/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem \
    --channelID "$CHANNEL_NAME" \
    --name "$CHAINCODE_NAME" \
    --version "$VERSION" \
    --package-id "$PACKAGE_ID" \
    --sequence "$SEQUENCE"

echo "✅ Approved for Org2"
echo ""

# Step 7: Check commit readiness
echo "========================================="
echo "STEP 7: Checking Commit Readiness"
echo "========================================="
echo ""

peer lifecycle chaincode checkcommitreadiness \
    --channelID "$CHANNEL_NAME" \
    --name "$CHAINCODE_NAME" \
    --version "$VERSION" \
    --sequence "$SEQUENCE" \
    --output json

echo ""

# Step 8: Commit chaincode
echo "========================================="
echo "STEP 8: Committing Chaincode"
echo "========================================="
echo ""

peer lifecycle chaincode commit \
    -o localhost:7050 \
    --ordererTLSHostnameOverride orderer.example.com \
    --tls \
    --cafile $TEST_NETWORK_PATH/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem \
    --channelID "$CHANNEL_NAME" \
    --name "$CHAINCODE_NAME" \
    --version "$VERSION" \
    --sequence "$SEQUENCE" \
    --peerAddresses localhost:7051 \
    --tlsRootCertFiles $TEST_NETWORK_PATH/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt \
    --peerAddresses localhost:9051 \
    --tlsRootCertFiles $TEST_NETWORK_PATH/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt

echo "✅ Chaincode committed"
echo ""

# Step 9: Verify deployment
echo "========================================="
echo "STEP 9: Verifying Deployment"
echo "========================================="
echo ""

peer lifecycle chaincode querycommitted \
    --channelID "$CHANNEL_NAME" \
    --name "$CHAINCODE_NAME"

echo ""
echo "========================================================================"
echo "✅ BACKUPCONTRACT DEPLOYED SUCCESSFULLY!"
echo "========================================================================"
echo ""
echo "You can now use the BackupContract in your application."
echo ""
echo "To test it:"
echo "  cd ~/Desktop/chainvanguard-nextjs/chainvanguard-backend/api"
echo "  node -r dotenv/config src/scripts/end-to-end-disaster-recovery-test.js dotenv_config_path=.env"
echo ""
