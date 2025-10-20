#!/bin/bash

source /Users/atifjalal/Desktop/chainvanguard-nextjs/chainvanguard-backend/api/.env

API_URL="http://localhost:3001/api"
SUPPLIER_TOKEN="$SUPPLIER_TOKEN"

echo "🧪 Testing Ministry Routes..."
echo "=============================="
echo ""

echo "1️⃣ Testing Industry Overview..."
curl -s -X GET "${API_URL}/ministry/overview" \
  -H "Authorization: Bearer ${SUPPLIER_TOKEN}" | python3 -m json.tool

echo ""
echo ""
echo "2️⃣ Testing Vendors List..."
curl -s -X GET "${API_URL}/ministry/vendors?page=1&limit=10" \
  -H "Authorization: Bearer ${SUPPLIER_TOKEN}" | python3 -m json.tool

echo ""
echo "✅ Ministry tests completed!"