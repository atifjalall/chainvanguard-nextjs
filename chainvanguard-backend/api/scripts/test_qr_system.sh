#!/bin/bash

API_URL="http://localhost:3001/api"

echo "🧪 Testing QR Code System..."
echo "======================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# You need to replace these with actual tokens/IDs from your system
VENDOR_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGY2MTY4YTNhZjlhMDhlZGY1NzA3NjkiLCJ3YWxsZXRBZGRyZXNzIjoiMHhmY2E2MzA2NDU1Mzc0OTU4ZjdlNWRlOTc1Nzg1YzE2ZTg5M2U5ZTliIiwicm9sZSI6InZlbmRvciIsImlhdCI6MTc2MDk1ODIzOCwiZXhwIjoxNzYxNTYzMDM4fQ.VxpL4NajknNsmKNLmBtKxv5Ex539P6JQPol_gkadPEg"
PRODUCT_ID="68f617c53af9a08edf5707a9"

echo -e "${BLUE}1️⃣ Generating QR code for product...${NC}"
GENERATE_RESPONSE=$(curl -s -X POST "${API_URL}/qr/product/${PRODUCT_ID}/generate" \
  -H "Authorization: Bearer ${VENDOR_TOKEN}" \
  -H "Content-Type: application/json")

echo "$GENERATE_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$GENERATE_RESPONSE"

# Extract QR code from response
QR_CODE=$(echo "$GENERATE_RESPONSE" | grep -o '"code":"[^"]*' | grep -o '[^"]*$')

echo ""
echo -e "${BLUE}2️⃣ Scanning QR code: ${QR_CODE}${NC}"
curl -s -X POST "${API_URL}/qr/scan" \
  -H "Content-Type: application/json" \
  -d "{
    \"qrCode\": \"${QR_CODE}\",
    \"location\": {
      \"latitude\": 31.5204,
      \"longitude\": 74.3587,
      \"address\": \"Lahore, Pakistan\"
    },
    \"device\": \"Test Script\"
  }" | python3 -m json.tool

echo ""
echo -e "${BLUE}3️⃣ Tracking product via QR...${NC}"
curl -s -X GET "${API_URL}/qr/track/${QR_CODE}" | python3 -m json.tool

echo ""
echo -e "${BLUE}4️⃣ Verifying QR authenticity...${NC}"
curl -s -X GET "${API_URL}/qr/verify/${QR_CODE}" | python3 -m json.tool

echo ""
echo -e "${BLUE}5️⃣ Getting QR image URL...${NC}"
curl -s -X GET "${API_URL}/qr/${QR_CODE}/image" | python3 -m json.tool

echo ""
echo -e "${GREEN}✅ QR System tests completed!${NC}"