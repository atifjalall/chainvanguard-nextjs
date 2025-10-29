#!/bin/bash

# Quick test of inventory blockchain integration

echo ""
echo "🔍 QUICK BLOCKCHAIN VERIFICATION TEST"
echo "=========================================="
echo ""

# Get the inventory ID from the recent test
INVENTORY_ID="69022dc38f0fdf0f42cc3fe4"

echo "📦 Testing Inventory ID: $INVENTORY_ID"
echo ""

# Navigate to fabric test-network
cd ~/Desktop/fabric-samples/test-network

# Set environment
export PATH=${PWD}/../bin:$PATH
export FABRIC_CFG_PATH=$PWD/../config/
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051

echo "1️⃣ Checking if inventory exists on blockchain..."
echo "   Command: peer chaincode query -C supply-chain-channel -n inventory"
echo ""

RESULT=$(peer chaincode query \
  -C supply-chain-channel \
  -n inventory \
  -c "{\"function\":\"inventory:getInventory\",\"Args\":[\"$INVENTORY_ID\"]}" 2>&1)

if echo "$RESULT" | grep -q "inventoryId"; then
    echo "✅ SUCCESS! Inventory found on blockchain!"
    echo ""
    echo "📊 Blockchain Data:"
    echo "$RESULT" | jq -C '.' 2>/dev/null || echo "$RESULT"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✅ DATA IS BEING STORED ON BLOCKCHAIN!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
else
    echo "❌ Inventory not found on blockchain"
    echo ""
    echo "Response:"
    echo "$RESULT"
    echo ""
    echo "This might mean the inventory was created in MongoDB but not on blockchain."
fi

echo ""
echo "2️⃣ Checking transaction history..."
echo ""

HISTORY=$(peer chaincode query \
  -C supply-chain-channel \
  -n inventory \
  -c "{\"function\":\"inventory:getInventoryHistory\",\"Args\":[\"$INVENTORY_ID\"]}" 2>&1)

if echo "$HISTORY" | grep -q "txId"; then
    TX_COUNT=$(echo "$HISTORY" | jq '. | length' 2>/dev/null || echo "?")
    echo "✅ Found $TX_COUNT transactions in history!"
    echo ""
    echo "📜 Transaction History:"
    echo "$HISTORY" | jq -C '.' 2>/dev/null || echo "$HISTORY"
else
    echo "⚠️  No transaction history found (or empty array)"
    echo "Response: $HISTORY"
fi

echo ""
echo "3️⃣ Quick Summary:"
echo ""

if echo "$RESULT" | grep -q "inventoryId"; then
    echo "✅ Inventory Record: EXISTS on blockchain"
    echo "✅ Data Persistence: CONFIRMED"
    echo "✅ Blockchain Integration: WORKING"
    echo ""
    echo "🎉 Your inventory system is successfully using blockchain!"
else
    echo "❌ Issue: Data not found on blockchain"
    echo ""
    echo "Possible causes:"
    echo "  • Inventory was created before chaincode fixes"
    echo "  • API saved to MongoDB but blockchain failed"
    echo ""
    echo "Solution: Create a NEW inventory item after restarting API"
fi

echo ""