#!/bin/bash

API_URL="http://localhost:3001/api"

echo "🧪 Testing Expert Dashboard Routes..."
echo "======================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# You need an expert token - get this from login
EXPERT_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGY2MTY4YzNhZjlhMDhlZGY1NzA3NmYiLCJ3YWxsZXRBZGRyZXNzIjoiMHg0ZWVjMzkxY2JhM2UwZjM4MWZkOTYwNTJkNDRjYjJhZTAzOGE2YjU5Iiwicm9sZSI6ImV4cGVydCIsImlhdCI6MTc2MDk1ODI0MiwiZXhwIjoxNzYxNTYzMDQyfQ.CX3qPnxI_WT4b6rGNSD4UbpFlAdwm_t8s6UABg7iE9o"

echo -e "${BLUE}1️⃣ Testing Expert Dashboard...${NC}"
curl -s -X GET "${API_URL}/expert/dashboard" \
  -H "Authorization: Bearer ${EXPERT_TOKEN}" \
  -H "Content-Type: application/json" | python3 -m json.tool

echo ""
echo ""
echo -e "${BLUE}2️⃣ Testing Get All Transactions...${NC}"
curl -s -X GET "${API_URL}/expert/transactions?page=1&limit=10" \
  -H "Authorization: Bearer ${EXPERT_TOKEN}" \
  -H "Content-Type: application/json" | python3 -m json.tool

echo ""
echo ""
echo -e "${BLUE}3️⃣ Testing Consensus Status...${NC}"
curl -s -X GET "${API_URL}/expert/consensus/status" \
  -H "Authorization: Bearer ${EXPERT_TOKEN}" \
  -H "Content-Type: application/json" | python3 -m json.tool

echo ""
echo ""
echo -e "${BLUE}4️⃣ Testing Consensus Metrics (24h)...${NC}"
curl -s -X GET "${API_URL}/expert/consensus/metrics?timeRange=24h" \
  -H "Authorization: Bearer ${EXPERT_TOKEN}" \
  -H "Content-Type: application/json" | python3 -m json.tool

echo ""
echo ""
echo -e "${BLUE}5️⃣ Testing Fault Tolerance Status...${NC}"
curl -s -X GET "${API_URL}/expert/fault-tolerance/status" \
  -H "Authorization: Bearer ${EXPERT_TOKEN}" \
  -H "Content-Type: application/json" | python3 -m json.tool

echo ""
echo ""
echo -e "${BLUE}6️⃣ Testing Fault Tolerance Stats (7d)...${NC}"
curl -s -X GET "${API_URL}/expert/fault-tolerance/stats?timeRange=7d" \
  -H "Authorization: Bearer ${EXPERT_TOKEN}" \
  -H "Content-Type: application/json" | python3 -m json.tool

echo ""
echo ""
echo -e "${BLUE}7️⃣ Testing Blockchain Logs...${NC}"
curl -s -X GET "${API_URL}/expert/logs?page=1&limit=10" \
  -H "Authorization: Bearer ${EXPERT_TOKEN}" \
  -H "Content-Type: application/json" | python3 -m json.tool

echo ""
echo ""
echo -e "${BLUE}8️⃣ Testing Security Overview...${NC}"
curl -s -X GET "${API_URL}/expert/security/overview" \
  -H "Authorization: Bearer ${EXPERT_TOKEN}" \
  -H "Content-Type: application/json" | python3 -m json.tool

echo ""
echo ""
echo -e "${YELLOW}9️⃣ Testing Disable User (Skipped - requires valid user ID)${NC}"
echo "# To test: curl -X POST ${API_URL}/expert/security/disable-user \\"
echo "#   -H 'Authorization: Bearer \$EXPERT_TOKEN' \\"
echo "#   -d '{\"userId\": \"USER_ID_HERE\", \"reason\": \"Security violation\"}'"

echo ""
echo ""
echo -e "${GREEN}✅ Expert Routes tests completed!${NC}"