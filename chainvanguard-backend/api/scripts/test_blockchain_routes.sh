#!/bin/bash

source /Users/atifjalal/Desktop/chainvanguard-nextjs/chainvanguard-backend/api/.env

API_URL="http://localhost:3001/api"

echo "🧪 Testing Blockchain Verification Routes..."
echo "=============================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# Use actual IDs from your database
PRODUCT_ID="$PRODUCT_ID_1"
ORDER_ID="$ORDER_ID_1"
TX_ID="$TX_ID"
AUTH_TOKEN="$EXPERT_TOKEN"


echo -e "${BLUE}1️⃣ Testing Product Blockchain History...${NC}"
curl -s -X GET "${API_URL}/blockchain/product-history/${PRODUCT_ID}" \
  -H "Content-Type: application/json" | python3 -m json.tool

echo ""
echo ""
echo -e "${BLUE}2️⃣ Testing Network Health...${NC}"
curl -s -X GET "${API_URL}/blockchain/network-health" \
  -H "Content-Type: application/json" | python3 -m json.tool

echo ""
echo ""
echo -e "${BLUE}3️⃣ Testing Transaction Verification...${NC}"
curl -s -X GET "${API_URL}/blockchain/verify-tx/${TX_ID}" \
  -H "Content-Type: application/json" | python3 -m json.tool

echo ""
echo ""
echo -e "${GREEN}✅ Blockchain Verification tests completed!${NC}"