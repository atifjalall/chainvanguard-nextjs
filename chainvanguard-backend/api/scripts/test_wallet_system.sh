#!/bin/bash

API_URL="http://localhost:3001/api"

echo "🧪 Testing Complete Wallet System..."
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# ✅ FIX: Use real tokens from your actual login
CUSTOMER_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGY2MTY4YjNhZjlhMDhlZGY1NzA3NmQiLCJ3YWxsZXRBZGRyZXNzIjoiMHgwNGY4ZmY4ODYwZDk2NDBmMTAwNDViZDYyZDNhY2YzYzUxNGY3ZmFlIiwicm9sZSI6ImN1c3RvbWVyIiwiaWF0IjoxNzYwOTU4MjQwLCJleHAiOjE3NjE1NjMwNDB9.lXgYu2pUzr6XbK01XgtcSwflPJ266b0Cu6Pts6o2Phs"
EXPERT_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGY2MTY4YzNhZjlhMDhlZGY1NzA3NmYiLCJ3YWxsZXRBZGRyZXNzIjoiMHg0ZWVjMzkxY2JhM2UwZjM4MWZkOTYwNTJkNDRjYjJhZTAzOGE2YjU5Iiwicm9sZSI6ImV4cGVydCIsImlhdCI6MTc2MDk1ODI0MiwiZXhwIjoxNzYxNTYzMDQyfQ.CX3qPnxI_WT4b6rGNSD4UbpFlAdwm_t8s6UABg7iE9o"

# ✅ FIX: Get real user IDs from the tokens
CUSTOMER_ID="68f6168b3af9a08edf57076d"  # From your JWT token
VENDOR_ID="68f6168a3af9a08edf570769"    # Get from another user if needed

echo -e "${BLUE}1️⃣ Testing Get Balance (Customer)...${NC}"
curl -s -X GET "${API_URL}/wallet/balance" \
  -H "Authorization: Bearer ${CUSTOMER_TOKEN}" | python3 -m json.tool

echo ""
echo ""
echo -e "${BLUE}2️⃣ Testing Add Funds (\$500)...${NC}"
curl -s -X POST "${API_URL}/wallet/add-funds" \
  -H "Authorization: Bearer ${CUSTOMER_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 500,
    "paymentMethod": "Credit Card",
    "metadata": {
      "cardLast4": "4242",
      "cardType": "Visa"
    }
  }' | python3 -m json.tool

echo ""
echo ""
echo -e "${BLUE}3️⃣ Testing Check Balance After Deposit...${NC}"
curl -s -X GET "${API_URL}/wallet/balance" \
  -H "Authorization: Bearer ${CUSTOMER_TOKEN}" | python3 -m json.tool

echo ""
echo ""
echo -e "${BLUE}4️⃣ Testing Transfer Credits (\$50 to Vendor)...${NC}"
echo -e "${YELLOW}⚠️  Skipping - need real vendor ID${NC}"
# Uncomment when you have a real vendor ID:
# curl -s -X POST "${API_URL}/wallet/transfer" \
#   -H "Authorization: Bearer ${CUSTOMER_TOKEN}" \
#   -H "Content-Type: application/json" \
#   -d "{
#     \"toUserId\": \"${VENDOR_ID}\",
#     \"amount\": 50,
#     \"description\": \"Payment for consulting\"
#   }" | python3 -m json.tool

echo ""
echo ""
echo -e "${BLUE}5️⃣ Testing Transaction History...${NC}"
curl -s -X GET "${API_URL}/wallet/transactions?page=1&limit=10" \
  -H "Authorization: Bearer ${CUSTOMER_TOKEN}" | python3 -m json.tool

echo ""
echo ""
echo -e "${BLUE}6️⃣ Testing Withdraw Funds (\$100)...${NC}"
curl -s -X POST "${API_URL}/wallet/withdraw" \
  -H "Authorization: Bearer ${CUSTOMER_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100,
    "withdrawalMethod": "bank",
    "accountDetails": {
      "bankName": "Chase Bank",
      "accountNumber": "1234567890",
      "routingNumber": "021000021"
    }
  }' | python3 -m json.tool

echo ""
echo ""
echo -e "${BLUE}7️⃣ Testing Final Balance...${NC}"
curl -s -X GET "${API_URL}/wallet/balance" \
  -H "Authorization: Bearer ${CUSTOMER_TOKEN}" | python3 -m json.tool

echo ""
echo ""
echo -e "${YELLOW}8️⃣ Testing Freeze Wallet (Expert Only)...${NC}"
curl -s -X POST "${API_URL}/wallet/freeze/${CUSTOMER_ID}" \
  -H "Authorization: Bearer ${EXPERT_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Suspicious activity detected"
  }' | python3 -m json.tool

echo ""
echo ""
echo -e "${YELLOW}9️⃣ Testing Unfreeze Wallet (Expert Only)...${NC}"
curl -s -X POST "${API_URL}/wallet/unfreeze/${CUSTOMER_ID}" \
  -H "Authorization: Bearer ${EXPERT_TOKEN}" \
  -H "Content-Type: application/json" | python3 -m json.tool

echo ""
echo ""
echo -e "${GREEN}✅ Complete Wallet System tests finished!${NC}"