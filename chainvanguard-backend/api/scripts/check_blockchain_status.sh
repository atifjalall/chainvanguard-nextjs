#!/bin/bash

echo "🔍 Checking Blockchain Status"
echo "=============================="
echo ""

# Check Docker containers
echo "1. Docker Containers:"
CONTAINERS=$(docker ps | grep hyperledger | wc -l)
if [ $CONTAINERS -gt 0 ]; then
    echo "   ✅ $CONTAINERS Fabric containers running"
    docker ps --format "   - {{.Names}}" | grep hyperledger
else
    echo "   ❌ No Fabric containers running"
    echo "   Run: cd network && ./network.sh up && ./network.sh deployCC"
fi

echo ""

# Check MongoDB products
echo "2. Products in MongoDB:"
MONGO_COUNT=$(mongosh mongodb://localhost:27017/test --quiet --eval 'db.products.countDocuments()' 2>/dev/null)
echo "   Total: ${MONGO_COUNT:-0}"

echo ""

# Check blockchain verification status
echo "3. Blockchain Verification:"
VERIFIED=$(mongosh mongodb://localhost:27017/test --quiet --eval 'db.products.countDocuments({blockchainVerified: true})' 2>/dev/null)
UNVERIFIED=$(mongosh mongodb://localhost:27017/test --quiet --eval 'db.products.countDocuments({blockchainVerified: false})' 2>/dev/null)
echo "   ✅ Verified on blockchain: ${VERIFIED:-0}"
echo "   ❌ Not verified: ${UNVERIFIED:-0}"

echo ""

# Recommendation
if [ $CONTAINERS -eq 0 ]; then
    echo "⚠️  Action Required:"
    echo "   1. Start Fabric network:"
    echo "      cd network && ./network.sh up && ./network.sh deployCC"
    echo ""
    echo "   2. Sync products to blockchain:"
    echo "      cd api && node scripts/sync_to_blockchain.js"
elif [ "${UNVERIFIED:-0}" -gt 0 ]; then
    echo "⚠️  Action Required:"
    echo "   Sync products to blockchain:"
    echo "   cd api && node scripts/sync_to_blockchain.js"
else
    echo "✅ Everything looks good!"
fi

echo ""