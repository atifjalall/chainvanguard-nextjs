#!/bin/bash

API_URL="http://localhost:3001/api"

echo "🧪 Testing Blockchain Verification Routes..."
echo "=============================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# Use actual IDs from your database
PRODUCT_ID="68f617c53af9a08edf5707a9"
ORDER_ID="68f618cbde739232fb0dfc72"
TX_ID="cd685668a094c1d921e75aaa1b31272cf01ec9188f30b38132eabd8d67f4061b"
AUTH_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGY2MTY4YzNhZjlhMDhlZGY1NzA3NmYiLCJ3YWxsZXRBZGRyZXNzIjoiMHg0ZWVjMzkxY2JhM2UwZjM4MWZkOTYwNTJkNDRjYjJhZTAzOGE2YjU5Iiwicm9sZSI6ImV4cGVydCIsImlhdCI6MTc2MDk1ODI0MiwiZXhwIjoxNzYxNTYzMDQyfQ.CX3qPnxI_WT4b6rGNSD4UbpFlAdwm_t8s6UABg7iE9o"


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