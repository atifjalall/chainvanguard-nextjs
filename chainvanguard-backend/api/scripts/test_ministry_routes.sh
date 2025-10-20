#!/bin/bash

API_URL="http://localhost:3001/api"
SUPPLIER_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGY2MTY4OTNhZjlhMDhlZGY1NzA3NjciLCJ3YWxsZXRBZGRyZXNzIjoiMHhkNGIyMWY5YjI3MWJhZjdlMDAyYmFmNTcwNGFjOTUxMDFiMWRlYWFmIiwicm9sZSI6InN1cHBsaWVyIiwiaWF0IjoxNzYwOTU4MjI5LCJleHAiOjE3NjE1NjMwMjl9.Q-Mnkbv-z9yXRwKl4phz_CLY0radKS0mBOij8XmN8ts"

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