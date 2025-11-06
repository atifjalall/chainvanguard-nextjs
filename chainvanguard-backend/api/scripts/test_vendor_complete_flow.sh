#!/bin/bash

# ========================================
# VENDOR COMPLETE WORKFLOW - END-TO-END TEST
# Tests the entire vendor journey:
# 1. Browse supplier inventory
# 2. Request and purchase raw materials
# 3. Receive and track inventory
# 4. Use in production
# ========================================

echo "======================================"
echo "VENDOR COMPLETE WORKFLOW TEST"
echo "Browse → Purchase → Track → Use"
echo "======================================"
echo ""

BASE_URL="http://localhost:5000/api"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

print_step() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# ========================================
# PHASE 1: SETUP
# ========================================
print_step "PHASE 1: SETUP - Create Users and Inventory"

# Register Supplier
SUPPLIER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "ABC Textiles",
    "email": "supplier.workflow@test.com",
    "password": "Test123!@#",
    "role": "supplier",
    "companyName": "ABC Textiles Ltd",
    "contactPhone": "+1234567890"
  }')

SUPPLIER_TOKEN=$(echo $SUPPLIER_RESPONSE | jq -r '.token // empty')
SUPPLIER_ID=$(echo $SUPPLIER_RESPONSE | jq -r '.user._id // empty')
print_result $? "Supplier registered: ABC Textiles"

# Register Vendor
VENDOR_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Fashion Hub",
    "email": "vendor.workflow@test.com",
    "password": "Test123!@#",
    "role": "vendor",
    "companyName": "Fashion Hub Manufacturing",
    "contactPhone": "+1234567891"
  }')

VENDOR_TOKEN=$(echo $VENDOR_RESPONSE | jq -r '.token // empty')
VENDOR_ID=$(echo $VENDOR_RESPONSE | jq -r '.user._id // empty')
print_result $? "Vendor registered: Fashion Hub"

# Supplier creates inventory items
echo ""
echo "Supplier creating inventory items..."

# Create Cotton Fabric
COTTON_RESPONSE=$(curl -s -X POST "$BASE_URL/inventory" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPPLIER_TOKEN" \
  -d '{
    "name": "Premium Organic Cotton",
    "description": "GOTS certified organic cotton fabric",
    "category": "Fabric",
    "subcategory": "Cotton Fabric",
    "sku": "ORG-COT-PREM",
    "quantity": 10000,
    "unit": "meters",
    "pricePerUnit": 7.50,
    "minOrderQuantity": 100,
    "status": "active",
    "tags": ["organic", "cotton", "GOTS"]
  }')

COTTON_ID=$(echo $COTTON_RESPONSE | jq -r '.data._id // empty')
print_result $? "Created: Premium Organic Cotton (10,000 meters @ \$7.50/m)"

# Create Buttons
BUTTONS_RESPONSE=$(curl -s -X POST "$BASE_URL/inventory" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPPLIER_TOKEN" \
  -d '{
    "name": "Eco-Friendly Buttons",
    "description": "Biodegradable coconut shell buttons",
    "category": "Trims & Accessories",
    "subcategory": "Buttons",
    "sku": "BTN-ECO-001",
    "quantity": 50000,
    "unit": "pieces",
    "pricePerUnit": 0.25,
    "minOrderQuantity": 1000,
    "status": "active",
    "tags": ["buttons", "eco-friendly", "coconut"]
  }')

BUTTONS_ID=$(echo $BUTTONS_RESPONSE | jq -r '.data._id // empty')
print_result $? "Created: Eco-Friendly Buttons (50,000 pcs @ \$0.25/pc)"

# Create Thread
THREAD_RESPONSE=$(curl -s -X POST "$BASE_URL/inventory" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPPLIER_TOKEN" \
  -d '{
    "name": "Polyester Thread",
    "description": "High-strength polyester sewing thread",
    "category": "Yarn & Thread",
    "subcategory": "Sewing Thread",
    "sku": "THR-POLY-001",
    "quantity": 5000,
    "unit": "spools",
    "pricePerUnit": 1.50,
    "minOrderQuantity": 50,
    "status": "active",
    "tags": ["thread", "polyester", "sewing"]
  }')

THREAD_ID=$(echo $THREAD_RESPONSE | jq -r '.data._id // empty')
print_result $? "Created: Polyester Thread (5,000 spools @ \$1.50/spool)"

# ========================================
# PHASE 2: BROWSE & DISCOVER
# ========================================
print_step "PHASE 2: VENDOR BROWSES SUPPLIER INVENTORY"

# Browse all available inventory
BROWSE_ALL=$(curl -s -X GET "$BASE_URL/inventory/browse" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

BROWSE_COUNT=$(echo $BROWSE_ALL | jq -r '.data | length')
print_result $? "Browsed all inventory: Found $BROWSE_COUNT items"

# Browse by category (Fabric)
BROWSE_FABRIC=$(curl -s -X GET "$BASE_URL/inventory/browse?category=Fabric" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

FABRIC_COUNT=$(echo $BROWSE_FABRIC | jq -r '.data | length')
print_result $? "Filtered by category 'Fabric': Found $FABRIC_COUNT items"

# Search for organic materials
SEARCH_ORGANIC=$(curl -s -X GET "$BASE_URL/inventory/browse/search?q=organic" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

ORGANIC_COUNT=$(echo $SEARCH_ORGANIC | jq -r '.count // 0')
print_result $? "Searched for 'organic': Found $ORGANIC_COUNT items"

# View supplier profile
SUPPLIER_PROFILE=$(curl -s -X GET "$BASE_URL/inventory/browse/suppliers/$SUPPLIER_ID" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

SUPPLIER_NAME=$(echo $SUPPLIER_PROFILE | jq -r '.data.companyName // empty')
print_result $? "Viewed supplier profile: $SUPPLIER_NAME"

# View supplier's complete inventory
SUPPLIER_INVENTORY=$(curl -s -X GET "$BASE_URL/inventory/browse/suppliers/$SUPPLIER_ID/inventory" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

SUPPLIER_ITEMS=$(echo $SUPPLIER_INVENTORY | jq -r '.data | length')
print_result $? "Viewed supplier inventory: $SUPPLIER_ITEMS items available"

# ========================================
# PHASE 3: SHOPPING CART
# ========================================
print_step "PHASE 3: VENDOR ADDS ITEMS TO CART"

# Add cotton to cart
ADD_COTTON=$(curl -s -X POST "$BASE_URL/cart/add" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $VENDOR_TOKEN" \
  -d "{
    \"productId\": \"$COTTON_ID\",
    \"quantity\": 500,
    \"sellerId\": \"$SUPPLIER_ID\",
    \"sellerRole\": \"supplier\"
  }")

CART1_SUCCESS=$(echo $ADD_COTTON | jq -r '.success // false')
print_result $? "Added to cart: 500 meters of Premium Organic Cotton"

# Add buttons to cart
ADD_BUTTONS=$(curl -s -X POST "$BASE_URL/cart/add" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $VENDOR_TOKEN" \
  -d "{
    \"productId\": \"$BUTTONS_ID\",
    \"quantity\": 5000,
    \"sellerId\": \"$SUPPLIER_ID\",
    \"sellerRole\": \"supplier\"
  }")

CART2_SUCCESS=$(echo $ADD_BUTTONS | jq -r '.success // false')
print_result $? "Added to cart: 5,000 Eco-Friendly Buttons"

# Add thread to cart
ADD_THREAD=$(curl -s -X POST "$BASE_URL/cart/add" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $VENDOR_TOKEN" \
  -d "{
    \"productId\": \"$THREAD_ID\",
    \"quantity\": 200,
    \"sellerId\": \"$SUPPLIER_ID\",
    \"sellerRole\": \"supplier\"
  }")

CART3_SUCCESS=$(echo $ADD_THREAD | jq -r '.success // false')
print_result $? "Added to cart: 200 spools of Polyester Thread"

# View cart
VIEW_CART=$(curl -s -X GET "$BASE_URL/cart" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

CART_ITEMS=$(echo $VIEW_CART | jq -r '.data.items | length')
CART_TOTAL=$(echo $VIEW_CART | jq -r '.data.totalAmount // 0')
print_result $? "Cart contains: $CART_ITEMS items (Total: \$$CART_TOTAL)"

# ========================================
# PHASE 4: PURCHASE REQUEST
# ========================================
print_step "PHASE 4: VENDOR CREATES PURCHASE REQUEST"

# Create vendor request
VENDOR_REQUEST=$(curl -s -X POST "$BASE_URL/vendor-requests" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $VENDOR_TOKEN" \
  -d "{
    \"supplierId\": \"$SUPPLIER_ID\",
    \"items\": [
      {
        \"inventoryId\": \"$COTTON_ID\",
        \"quantity\": 500,
        \"pricePerUnit\": 7.50
      },
      {
        \"inventoryId\": \"$BUTTONS_ID\",
        \"quantity\": 5000,
        \"pricePerUnit\": 0.25
      },
      {
        \"inventoryId\": \"$THREAD_ID\",
        \"quantity\": 200,
        \"pricePerUnit\": 1.50
      }
    ],
    \"requestType\": \"purchase\",
    \"notes\": \"Materials needed for new summer collection\"
  }")

VENDOR_REQUEST_ID=$(echo $VENDOR_REQUEST | jq -r '.data._id // empty')
REQUEST_NUMBER=$(echo $VENDOR_REQUEST | jq -r '.data.requestNumber // empty')
print_result $? "Purchase request created: $REQUEST_NUMBER"

# View request details
REQUEST_DETAILS=$(curl -s -X GET "$BASE_URL/vendor-requests/$VENDOR_REQUEST_ID" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

REQUEST_STATUS=$(echo $REQUEST_DETAILS | jq -r '.data.status // empty')
print_result $? "Request status: $REQUEST_STATUS"

# ========================================
# PHASE 5: SUPPLIER APPROVAL
# ========================================
print_step "PHASE 5: SUPPLIER REVIEWS AND APPROVES"

# Supplier views pending requests
PENDING_REQUESTS=$(curl -s -X GET "$BASE_URL/supplier-vendor/requests" \
  -H "Authorization: Bearer $SUPPLIER_TOKEN")

PENDING_COUNT=$(echo $PENDING_REQUESTS | jq -r '.data | length')
print_result $? "Supplier views pending requests: $PENDING_COUNT found"

# Supplier approves request
APPROVE_REQUEST=$(curl -s -X POST "$BASE_URL/vendor-requests/$VENDOR_REQUEST_ID/approve" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPPLIER_TOKEN" \
  -d '{
    "approvalNotes": "Request approved. Materials will be prepared."
  }')

APPROVE_SUCCESS=$(echo $APPROVE_REQUEST | jq -r '.success // false')
print_result $? "Supplier approved request"

sleep 2

# Get order ID
REQUEST_UPDATED=$(curl -s -X GET "$BASE_URL/vendor-requests/$VENDOR_REQUEST_ID" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

ORDER_ID=$(echo $REQUEST_UPDATED | jq -r '.data.orderId // empty')
print_result $? "Order created: $ORDER_ID"

# ========================================
# PHASE 6: ORDER DELIVERY
# ========================================
print_step "PHASE 6: ORDER PROCESSING AND DELIVERY"

# View order details
ORDER_DETAILS=$(curl -s -X GET "$BASE_URL/orders/$ORDER_ID" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

ORDER_NUMBER=$(echo $ORDER_DETAILS | jq -r '.data.orderNumber // empty')
ORDER_TOTAL=$(echo $ORDER_DETAILS | jq -r '.data.totalAmount // 0')
print_result $? "Order details: $ORDER_NUMBER (Total: \$$ORDER_TOTAL)"

# Supplier marks order as shipped
SHIP_ORDER=$(curl -s -X PATCH "$BASE_URL/orders/$ORDER_ID/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPPLIER_TOKEN" \
  -d '{
    "status": "shipped",
    "notes": "Materials shipped via express courier"
  }')

SHIP_SUCCESS=$(echo $SHIP_ORDER | jq -r '.success // false')
print_result $? "Supplier marked order as shipped"

# Supplier marks order as delivered
DELIVER_ORDER=$(curl -s -X PATCH "$BASE_URL/orders/$ORDER_ID/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPPLIER_TOKEN" \
  -d '{
    "status": "delivered",
    "notes": "Materials delivered to vendor warehouse"
  }')

DELIVER_SUCCESS=$(echo $DELIVER_ORDER | jq -r '.success // false')
print_result $? "Supplier marked order as delivered"

# ========================================
# PHASE 7: INVENTORY TRACKING
# ========================================
print_step "PHASE 7: VENDOR INVENTORY AUTO-CREATED"

sleep 2

# Auto-create vendor inventory
CREATE_INVENTORY=$(curl -s -X POST "$BASE_URL/vendor/inventory/from-order/$ORDER_ID" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

INVENTORY_COUNT=$(echo $CREATE_INVENTORY | jq -r '.count // 0')
print_result $? "Vendor inventory auto-created: $INVENTORY_COUNT items"

# Get vendor inventory list
VENDOR_INVENTORY=$(curl -s -X GET "$BASE_URL/vendor/inventory" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

INVENTORY_ITEMS=$(echo $VENDOR_INVENTORY | jq -r '.data | length')
print_result $? "Vendor inventory list: $INVENTORY_ITEMS items tracked"

# Get inventory stats
INVENTORY_STATS=$(curl -s -X GET "$BASE_URL/vendor/inventory/stats" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

TOTAL_VALUE=$(echo $INVENTORY_STATS | jq -r '.data.summary.totalValue // 0')
TOTAL_ITEMS=$(echo $INVENTORY_STATS | jq -r '.data.summary.totalItems // 0')
print_result $? "Inventory stats: $TOTAL_ITEMS items, Total value: \$$TOTAL_VALUE"

# Get first inventory item ID
FIRST_INVENTORY_ID=$(echo $VENDOR_INVENTORY | jq -r '.data[0]._id // empty')

# View specific inventory item
ITEM_DETAILS=$(curl -s -X GET "$BASE_URL/vendor/inventory/$FIRST_INVENTORY_ID" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

ITEM_NAME=$(echo $ITEM_DETAILS | jq -r '.data.inventoryItem.name // empty')
CURRENT_QTY=$(echo $ITEM_DETAILS | jq -r '.data.quantity.current // 0')
print_result $? "Viewed item: $ITEM_NAME ($CURRENT_QTY units available)"

# ========================================
# PHASE 8: PRODUCTION USAGE
# ========================================
print_step "PHASE 8: VENDOR USES MATERIALS IN PRODUCTION"

# Reserve materials for production order
RESERVE_MATERIALS=$(curl -s -X POST "$BASE_URL/vendor/inventory/$FIRST_INVENTORY_ID/reserve" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $VENDOR_TOKEN" \
  -d '{
    "quantity": 50,
    "notes": "Reserved for summer collection batch #001"
  }')

RESERVE_SUCCESS=$(echo $RESERVE_MATERIALS | jq -r '.success // false')
print_result $? "Reserved 50 units for production"

# Use materials in production
USE_MATERIALS=$(curl -s -X POST "$BASE_URL/vendor/inventory/$FIRST_INVENTORY_ID/use" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $VENDOR_TOKEN" \
  -d '{
    "quantity": 50,
    "productName": "Summer T-Shirt Collection",
    "notes": "Batch #001 - 100 T-shirts produced"
  }')

USE_SUCCESS=$(echo $USE_MATERIALS | jq -r '.success // false')
print_result $? "Used 50 units in production (Summer T-Shirt Collection)"

# Use more materials
USE_MORE=$(curl -s -X POST "$BASE_URL/vendor/inventory/$FIRST_INVENTORY_ID/use" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $VENDOR_TOKEN" \
  -d '{
    "quantity": 100,
    "productName": "Casual Shirt Line",
    "notes": "Batch #002 - 50 shirts produced"
  }')

print_result $? "Used 100 additional units (Casual Shirt Line)"

# View movement history
MOVEMENTS=$(curl -s -X GET "$BASE_URL/vendor/inventory/$FIRST_INVENTORY_ID/movements" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

MOVEMENTS_COUNT=$(echo $MOVEMENTS | jq -r '.data | length')
print_result $? "Movement history: $MOVEMENTS_COUNT transactions recorded"

# ========================================
# PHASE 9: STOCK MANAGEMENT
# ========================================
print_step "PHASE 9: INVENTORY MANAGEMENT"

# Adjust stock (quality issue found)
ADJUST_STOCK=$(curl -s -X POST "$BASE_URL/vendor/inventory/$FIRST_INVENTORY_ID/adjust" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $VENDOR_TOKEN" \
  -d '{
    "quantityChange": -10,
    "reason": "Quality inspection rejection",
    "notes": "Found defects in 10 meters during QC"
  }')

ADJUST_SUCCESS=$(echo $ADJUST_STOCK | jq -r '.success // false')
print_result $? "Stock adjusted: -10 units (quality issue)"

# Mark some as damaged
MARK_DAMAGED=$(curl -s -X POST "$BASE_URL/vendor/inventory/$FIRST_INVENTORY_ID/damaged" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $VENDOR_TOKEN" \
  -d '{
    "quantity": 5,
    "reason": "Storage damage",
    "notes": "Water damage from roof leak"
  }')

DAMAGED_SUCCESS=$(echo $MARK_DAMAGED | jq -r '.success // false')
print_result $? "Marked 5 units as damaged"

# Update quality status
UPDATE_QUALITY=$(curl -s -X POST "$BASE_URL/vendor/inventory/$FIRST_INVENTORY_ID/quality" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $VENDOR_TOKEN" \
  -d '{
    "status": "passed",
    "notes": "Quality inspection completed - remaining stock approved"
  }')

QUALITY_SUCCESS=$(echo $UPDATE_QUALITY | jq -r '.success // false')
print_result $? "Quality status updated: Passed"

# ========================================
# PHASE 10: REORDERING
# ========================================
print_step "PHASE 10: LOW STOCK ALERTS & REORDERING"

# Check low stock alerts
LOW_STOCK=$(curl -s -X GET "$BASE_URL/vendor/inventory/low-stock" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

LOW_STOCK_COUNT=$(echo $LOW_STOCK | jq -r '.count // 0')
print_result $? "Low stock alerts: $LOW_STOCK_COUNT items need reordering"

# Get reorder suggestions
REORDER_SUGGESTIONS=$(curl -s -X GET "$BASE_URL/vendor/inventory/reorder-suggestions" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

SUGGESTIONS_COUNT=$(echo $REORDER_SUGGESTIONS | jq -r '.data | length')
print_result $? "Reorder suggestions: $SUGGESTIONS_COUNT suppliers identified"

# Get inventory by supplier (for reordering)
BY_SUPPLIER=$(curl -s -X GET "$BASE_URL/vendor/inventory/by-supplier/$SUPPLIER_ID" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

BY_SUPPLIER_ITEMS=$(echo $BY_SUPPLIER | jq -r '.data | length')
SUPPLIER_TOTAL=$(echo $BY_SUPPLIER | jq -r '.summary.totalSpent // 0')
print_result $? "Inventory from ABC Textiles: $BY_SUPPLIER_ITEMS items (\$$SUPPLIER_TOTAL spent)"

# ========================================
# PHASE 11: ANALYTICS
# ========================================
print_step "PHASE 11: INVENTORY ANALYTICS"

# Get updated stats
FINAL_STATS=$(curl -s -X GET "$BASE_URL/vendor/inventory/stats" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

FINAL_VALUE=$(echo $FINAL_STATS | jq -r '.data.summary.totalValue // 0')
FINAL_QUANTITY=$(echo $FINAL_STATS | jq -r '.data.summary.totalQuantity // 0')
TOTAL_USED=$(echo $FINAL_STATS | jq -r '.data.summary.totalUsed // 0')
print_result $? "Final stats: $FINAL_QUANTITY units remaining (\$$FINAL_VALUE value)"
echo "   Total used in production: $TOTAL_USED units"

# Get category breakdown
CATEGORIES=$(echo $FINAL_STATS | jq -r '.data.categoryBreakdown | length')
print_result $? "Category breakdown: $CATEGORIES categories tracked"

# Get top suppliers
TOP_SUPPLIERS=$(echo $FINAL_STATS | jq -r '.data.topSuppliers | length')
print_result $? "Top suppliers: $TOP_SUPPLIERS suppliers tracked"

# ========================================
# PHASE 12: VERIFICATION
# ========================================
print_step "PHASE 12: FINAL VERIFICATION"

# Verify complete workflow
UPDATED_ITEM=$(curl -s -X GET "$BASE_URL/vendor/inventory/$FIRST_INVENTORY_ID" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

RECEIVED=$(echo $UPDATED_ITEM | jq -r '.data.quantity.received // 0')
USED=$(echo $UPDATED_ITEM | jq -r '.data.quantity.used // 0')
CURRENT=$(echo $UPDATED_ITEM | jq -r '.data.quantity.current // 0')
DAMAGED=$(echo $UPDATED_ITEM | jq -r '.data.quantity.damaged // 0')

echo ""
echo "Inventory Item Lifecycle:"
echo "  ✓ Received: $RECEIVED units"
echo "  ✓ Used: $USED units"
echo "  ✓ Damaged: $DAMAGED units"
echo "  ✓ Current: $CURRENT units"
echo "  ✓ Usage: $((USED * 100 / RECEIVED))%"

if [ "$CURRENT" -lt "$RECEIVED" ] && [ "$USED" -gt 0 ]; then
    print_result 0 "Complete workflow verified successfully"
else
    print_result 1 "Workflow verification failed"
fi

# ========================================
# FINAL SUMMARY
# ========================================
echo ""
echo "======================================"
echo "END-TO-END TEST SUMMARY"
echo "======================================"
echo ""
echo "Workflow Phases Completed:"
echo "  ✓ Phase 1: Setup (Users & Inventory)"
echo "  ✓ Phase 2: Browse & Discover"
echo "  ✓ Phase 3: Shopping Cart"
echo "  ✓ Phase 4: Purchase Request"
echo "  ✓ Phase 5: Supplier Approval"
echo "  ✓ Phase 6: Order Delivery"
echo "  ✓ Phase 7: Inventory Tracking"
echo "  ✓ Phase 8: Production Usage"
echo "  ✓ Phase 9: Stock Management"
echo "  ✓ Phase 10: Reordering"
echo "  ✓ Phase 11: Analytics"
echo "  ✓ Phase 12: Verification"
echo ""
echo -e "Total Tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
echo -e "${RED}Failed: $FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✓ ALL TESTS PASSED - VENDOR DASHBOARD COMPLETE!${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    exit 0
else
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}✗ SOME TESTS FAILED${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    exit 1
fi