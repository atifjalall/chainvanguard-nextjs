#!/bin/bash

# ========================================
# VENDOR INVENTORY TRACKING - COMPLETE TEST
# Tests raw materials tracking for vendors
# ========================================

echo "======================================"
echo "VENDOR INVENTORY TRACKING TEST"
echo "======================================"
echo ""

BASE_URL="http://localhost:5000/api"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to print test result
print_result() {
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ PASS${NC}: $2"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}✗ FAIL${NC}: $2"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

# ========================================
# STEP 1: SETUP - Create Users and Login
# ========================================
echo -e "${YELLOW}[STEP 1] Setting up test users...${NC}"

# Register Supplier
SUPPLIER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Supplier",
    "email": "supplier.inventory@test.com",
    "password": "Test123!@#",
    "role": "supplier",
    "companyName": "Textile Supplies Inc",
    "contactPhone": "+1234567890"
  }')

SUPPLIER_TOKEN=$(echo $SUPPLIER_RESPONSE | jq -r '.token // empty')
SUPPLIER_ID=$(echo $SUPPLIER_RESPONSE | jq -r '.user._id // empty')

if [ -n "$SUPPLIER_TOKEN" ]; then
    print_result 0 "Supplier registered successfully"
else
    print_result 1 "Failed to register supplier"
fi

# Register Vendor
VENDOR_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Vendor",
    "email": "vendor.inventory@test.com",
    "password": "Test123!@#",
    "role": "vendor",
    "companyName": "Fashion Manufacturing Co",
    "contactPhone": "+1234567891"
  }')

VENDOR_TOKEN=$(echo $VENDOR_RESPONSE | jq -r '.token // empty')
VENDOR_ID=$(echo $VENDOR_RESPONSE | jq -r '.user._id // empty')

if [ -n "$VENDOR_TOKEN" ]; then
    print_result 0 "Vendor registered successfully"
else
    print_result 1 "Failed to register vendor"
fi

echo ""

# ========================================
# STEP 2: Supplier Creates Inventory
# ========================================
echo -e "${YELLOW}[STEP 2] Supplier creating raw material inventory...${NC}"

INVENTORY_RESPONSE=$(curl -s -X POST "$BASE_URL/inventory" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPPLIER_TOKEN" \
  -d '{
    "name": "Premium Cotton Fabric",
    "description": "100% organic cotton fabric, ideal for clothing manufacturing",
    "category": "Fabric",
    "subcategory": "Cotton Fabric",
    "sku": "COT-FAB-001",
    "quantity": 1000,
    "unit": "meters",
    "pricePerUnit": 5.50,
    "minOrderQuantity": 50,
    "maxOrderQuantity": 500,
    "reorderLevel": 200,
    "reorderQuantity": 500,
    "status": "active"
  }')

INVENTORY_ID=$(echo $INVENTORY_RESPONSE | jq -r '.data._id // empty')

if [ -n "$INVENTORY_ID" ]; then
    print_result 0 "Supplier created inventory item"
else
    print_result 1 "Failed to create inventory item"
fi

echo ""

# ========================================
# STEP 3: Vendor Creates Purchase Request
# ========================================
echo -e "${YELLOW}[STEP 3] Vendor creating purchase request...${NC}"

VENDOR_REQUEST_RESPONSE=$(curl -s -X POST "$BASE_URL/vendor-requests" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $VENDOR_TOKEN" \
  -d "{
    \"supplierId\": \"$SUPPLIER_ID\",
    \"items\": [
      {
        \"inventoryId\": \"$INVENTORY_ID\",
        \"quantity\": 100,
        \"pricePerUnit\": 5.50
      }
    ],
    \"requestType\": \"purchase\",
    \"notes\": \"Need cotton fabric for new product line\"
  }")

VENDOR_REQUEST_ID=$(echo $VENDOR_REQUEST_RESPONSE | jq -r '.data._id // empty')

if [ -n "$VENDOR_REQUEST_ID" ]; then
    print_result 0 "Vendor request created"
else
    print_result 1 "Failed to create vendor request"
fi

echo ""

# ========================================
# STEP 4: Supplier Approves Request
# ========================================
echo -e "${YELLOW}[STEP 4] Supplier approving vendor request...${NC}"

APPROVE_RESPONSE=$(curl -s -X POST "$BASE_URL/vendor-requests/$VENDOR_REQUEST_ID/approve" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPPLIER_TOKEN" \
  -d '{
    "approvalNotes": "Request approved, ready for order"
  }')

APPROVAL_SUCCESS=$(echo $APPROVE_RESPONSE | jq -r '.success // false')

if [ "$APPROVAL_SUCCESS" = "true" ]; then
    print_result 0 "Vendor request approved"
else
    print_result 1 "Failed to approve vendor request"
fi

# Get order ID from the approved request
sleep 2
REQUEST_DETAILS=$(curl -s -X GET "$BASE_URL/vendor-requests/$VENDOR_REQUEST_ID" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

ORDER_ID=$(echo $REQUEST_DETAILS | jq -r '.data.orderId // empty')

if [ -n "$ORDER_ID" ]; then
    print_result 0 "Order created from approved request"
else
    print_result 1 "Failed to create order from request"
fi

echo ""

# ========================================
# STEP 5: Mark Order as Delivered
# ========================================
echo -e "${YELLOW}[STEP 5] Marking order as delivered...${NC}"

DELIVERED_RESPONSE=$(curl -s -X PATCH "$BASE_URL/orders/$ORDER_ID/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPPLIER_TOKEN" \
  -d '{
    "status": "delivered",
    "notes": "Materials delivered to vendor warehouse"
  }')

DELIVERY_SUCCESS=$(echo $DELIVERED_RESPONSE | jq -r '.success // false')

if [ "$DELIVERY_SUCCESS" = "true" ]; then
    print_result 0 "Order marked as delivered"
else
    print_result 1 "Failed to mark order as delivered"
fi

echo ""

# ========================================
# STEP 6: Auto-Create Vendor Inventory
# ========================================
echo -e "${YELLOW}[STEP 6] Auto-creating vendor inventory from delivered order...${NC}"

sleep 2

CREATE_INVENTORY_RESPONSE=$(curl -s -X POST "$BASE_URL/vendor/inventory/from-order/$ORDER_ID" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

VENDOR_INVENTORY_ID=$(echo $CREATE_INVENTORY_RESPONSE | jq -r '.data[0]._id // empty')
CREATE_SUCCESS=$(echo $CREATE_INVENTORY_RESPONSE | jq -r '.success // false')

if [ "$CREATE_SUCCESS" = "true" ] && [ -n "$VENDOR_INVENTORY_ID" ]; then
    print_result 0 "Vendor inventory auto-created from order"
else
    print_result 1 "Failed to auto-create vendor inventory"
fi

echo ""

# ========================================
# STEP 7: Get Vendor Inventory List
# ========================================
echo -e "${YELLOW}[STEP 7] Testing vendor inventory endpoints...${NC}"

# Get all vendor inventory
INVENTORY_LIST=$(curl -s -X GET "$BASE_URL/vendor/inventory" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

INVENTORY_COUNT=$(echo $INVENTORY_LIST | jq -r '.data | length')

if [ "$INVENTORY_COUNT" -gt 0 ]; then
    print_result 0 "Retrieved vendor inventory list ($INVENTORY_COUNT items)"
else
    print_result 1 "Failed to retrieve vendor inventory"
fi

# Get inventory stats
STATS_RESPONSE=$(curl -s -X GET "$BASE_URL/vendor/inventory/stats" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

TOTAL_ITEMS=$(echo $STATS_RESPONSE | jq -r '.data.summary.totalItems // 0')

if [ "$TOTAL_ITEMS" -gt 0 ]; then
    print_result 0 "Retrieved vendor inventory stats"
else
    print_result 1 "Failed to retrieve inventory stats"
fi

# Get specific inventory item
ITEM_DETAILS=$(curl -s -X GET "$BASE_URL/vendor/inventory/$VENDOR_INVENTORY_ID" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

ITEM_NAME=$(echo $ITEM_DETAILS | jq -r '.data.inventoryItem.name // empty')

if [ -n "$ITEM_NAME" ]; then
    print_result 0 "Retrieved specific inventory item details"
else
    print_result 1 "Failed to retrieve item details"
fi

echo ""

# ========================================
# STEP 8: Test Stock Adjustments
# ========================================
echo -e "${YELLOW}[STEP 8] Testing stock adjustments...${NC}"

# Adjust stock (manual correction)
ADJUST_RESPONSE=$(curl -s -X POST "$BASE_URL/vendor/inventory/$VENDOR_INVENTORY_ID/adjust" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $VENDOR_TOKEN" \
  -d '{
    "quantityChange": -5,
    "reason": "Damaged during inspection",
    "notes": "Found 5 meters with defects"
  }')

ADJUST_SUCCESS=$(echo $ADJUST_RESPONSE | jq -r '.success // false')

if [ "$ADJUST_SUCCESS" = "true" ]; then
    print_result 0 "Stock adjustment successful"
else
    print_result 1 "Failed to adjust stock"
fi

# Mark some as damaged
DAMAGED_RESPONSE=$(curl -s -X POST "$BASE_URL/vendor/inventory/$VENDOR_INVENTORY_ID/damaged" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $VENDOR_TOKEN" \
  -d '{
    "quantity": 3,
    "reason": "Water damage",
    "notes": "Storage area leak"
  }')

DAMAGED_SUCCESS=$(echo $DAMAGED_RESPONSE | jq -r '.success // false')

if [ "$DAMAGED_SUCCESS" = "true" ]; then
    print_result 0 "Marked items as damaged"
else
    print_result 1 "Failed to mark items as damaged"
fi

echo ""

# ========================================
# STEP 9: Test Reserve and Release
# ========================================
echo -e "${YELLOW}[STEP 9] Testing reserve and release operations...${NC}"

# Reserve quantity for production
RESERVE_RESPONSE=$(curl -s -X POST "$BASE_URL/vendor/inventory/$VENDOR_INVENTORY_ID/reserve" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $VENDOR_TOKEN" \
  -d '{
    "quantity": 20,
    "notes": "Reserved for order #12345"
  }')

RESERVE_SUCCESS=$(echo $RESERVE_RESPONSE | jq -r '.success // false')

if [ "$RESERVE_SUCCESS" = "true" ]; then
    print_result 0 "Reserved quantity successfully"
else
    print_result 1 "Failed to reserve quantity"
fi

# Release some reserved quantity
RELEASE_RESPONSE=$(curl -s -X POST "$BASE_URL/vendor/inventory/$VENDOR_INVENTORY_ID/release" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $VENDOR_TOKEN" \
  -d '{
    "quantity": 5
  }')

RELEASE_SUCCESS=$(echo $RELEASE_RESPONSE | jq -r '.success // false')

if [ "$RELEASE_SUCCESS" = "true" ]; then
    print_result 0 "Released reserved quantity"
else
    print_result 1 "Failed to release quantity"
fi

echo ""

# ========================================
# STEP 10: Test Use in Production
# ========================================
echo -e "${YELLOW}[STEP 10] Testing use in production...${NC}"

USE_RESPONSE=$(curl -s -X POST "$BASE_URL/vendor/inventory/$VENDOR_INVENTORY_ID/use" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $VENDOR_TOKEN" \
  -d '{
    "quantity": 25,
    "productName": "Classic T-Shirt",
    "notes": "Used for production batch #001"
  }')

USE_SUCCESS=$(echo $USE_RESPONSE | jq -r '.success // false')

if [ "$USE_SUCCESS" = "true" ]; then
    print_result 0 "Material used in production"
else
    print_result 1 "Failed to use material in production"
fi

echo ""

# ========================================
# STEP 11: Test Movement History
# ========================================
echo -e "${YELLOW}[STEP 11] Testing movement history...${NC}"

MOVEMENTS_RESPONSE=$(curl -s -X GET "$BASE_URL/vendor/inventory/$VENDOR_INVENTORY_ID/movements" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

MOVEMENTS_COUNT=$(echo $MOVEMENTS_RESPONSE | jq -r '.data | length')

if [ "$MOVEMENTS_COUNT" -gt 0 ]; then
    print_result 0 "Retrieved movement history ($MOVEMENTS_COUNT movements)"
else
    print_result 1 "Failed to retrieve movement history"
fi

echo ""

# ========================================
# STEP 12: Test Low Stock Alerts
# ========================================
echo -e "${YELLOW}[STEP 12] Testing low stock alerts...${NC}"

# First, use more material to trigger low stock
USE_MORE_RESPONSE=$(curl -s -X POST "$BASE_URL/vendor/inventory/$VENDOR_INVENTORY_ID/use" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $VENDOR_TOKEN" \
  -d '{
    "quantity": 50,
    "productName": "Polo Shirts",
    "notes": "Production batch #002"
  }')

sleep 1

# Get low stock alerts
LOW_STOCK_RESPONSE=$(curl -s -X GET "$BASE_URL/vendor/inventory/low-stock" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

LOW_STOCK_COUNT=$(echo $LOW_STOCK_RESPONSE | jq -r '.count // 0')

if [ "$LOW_STOCK_COUNT" -ge 0 ]; then
    print_result 0 "Retrieved low stock alerts ($LOW_STOCK_COUNT items)"
else
    print_result 1 "Failed to retrieve low stock alerts"
fi

echo ""

# ========================================
# STEP 13: Test Reorder Suggestions
# ========================================
echo -e "${YELLOW}[STEP 13] Testing reorder suggestions...${NC}"

REORDER_RESPONSE=$(curl -s -X GET "$BASE_URL/vendor/inventory/reorder-suggestions" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

REORDER_SUCCESS=$(echo $REORDER_RESPONSE | jq -r '.success // false')

if [ "$REORDER_SUCCESS" = "true" ]; then
    print_result 0 "Retrieved reorder suggestions"
else
    print_result 1 "Failed to retrieve reorder suggestions"
fi

echo ""

# ========================================
# STEP 14: Test Filters and Search
# ========================================
echo -e "${YELLOW}[STEP 14] Testing filters and search...${NC}"

# Filter by supplier
FILTER_RESPONSE=$(curl -s -X GET "$BASE_URL/vendor/inventory?supplierId=$SUPPLIER_ID" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

FILTER_COUNT=$(echo $FILTER_RESPONSE | jq -r '.data | length')

if [ "$FILTER_COUNT" -gt 0 ]; then
    print_result 0 "Filter by supplier working"
else
    print_result 1 "Failed to filter by supplier"
fi

# Search inventory
SEARCH_RESPONSE=$(curl -s -X GET "$BASE_URL/vendor/inventory/search?q=cotton" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

SEARCH_COUNT=$(echo $SEARCH_RESPONSE | jq -r '.count // 0')

if [ "$SEARCH_COUNT" -gt 0 ]; then
    print_result 0 "Search working ($SEARCH_COUNT results)"
else
    print_result 1 "Failed to search inventory"
fi

# Get inventory by supplier
BY_SUPPLIER_RESPONSE=$(curl -s -X GET "$BASE_URL/vendor/inventory/by-supplier/$SUPPLIER_ID" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

BY_SUPPLIER_COUNT=$(echo $BY_SUPPLIER_RESPONSE | jq -r '.data | length')

if [ "$BY_SUPPLIER_COUNT" -gt 0 ]; then
    print_result 0 "Get by supplier working"
else
    print_result 1 "Failed to get inventory by supplier"
fi

echo ""

# ========================================
# STEP 15: Test Quality Status
# ========================================
echo -e "${YELLOW}[STEP 15] Testing quality status updates...${NC}"

QUALITY_RESPONSE=$(curl -s -X POST "$BASE_URL/vendor/inventory/$VENDOR_INVENTORY_ID/quality" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $VENDOR_TOKEN" \
  -d '{
    "status": "passed",
    "notes": "Quality inspection completed - all checks passed"
  }')

QUALITY_SUCCESS=$(echo $QUALITY_RESPONSE | jq -r '.success // false')

if [ "$QUALITY_SUCCESS" = "true" ]; then
    print_result 0 "Quality status updated"
else
    print_result 1 "Failed to update quality status"
fi

echo ""

# ========================================
# FINAL SUMMARY
# ========================================
echo "======================================"
echo "TEST SUMMARY"
echo "======================================"
echo -e "Total Tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
echo -e "${RED}Failed: $FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}✓ ALL TESTS PASSED!${NC}"
    exit 0
else
    echo -e "${RED}✗ SOME TESTS FAILED${NC}"
    exit 1
fi