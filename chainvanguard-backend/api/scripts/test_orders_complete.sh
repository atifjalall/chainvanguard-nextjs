#!/bin/bash

# ============================================
# ChainVanguard - Complete Order Test Suite
# ============================================

echo "🧪 ChainVanguard Order Testing Suite"
echo "=============================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Base URL
BASE_URL="http://localhost:3001"

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# ========================================
# PRE-FILLED CREDENTIALS
# ========================================
# Update these after running test_auth_complete.sh
SUPPLIER_ADDRESS="0xd4b21f9b271baf7e002baf5704ac95101b1deaaf"
SUPPLIER_PASSWORD="NewSupplier2024!Recovered"
SUPPLIER_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGY2MTY4OTNhZjlhMDhlZGY1NzA3NjciLCJ3YWxsZXRBZGRyZXNzIjoiMHhkNGIyMWY5YjI3MWJhZjdlMDAyYmFmNTcwNGFjOTUxMDFiMWRlYWFmIiwicm9sZSI6InN1cHBsaWVyIiwiaWF0IjoxNzYwOTU4MjI5LCJleHAiOjE3NjE1NjMwMjl9.Q-Mnkbv-z9yXRwKl4phz_CLY0radKS0mBOij8XmN8ts"

VENDOR_ADDRESS="0xfca6306455374958f7e5de975785c16e893e9e9b"
VENDOR_PASSWORD="NewVendor2024!Changed"
VENDOR_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGY2MTY4YTNhZjlhMDhlZGY1NzA3NjkiLCJ3YWxsZXRBZGRyZXNzIjoiMHhmY2E2MzA2NDU1Mzc0OTU4ZjdlNWRlOTc1Nzg1YzE2ZTg5M2U5ZTliIiwicm9sZSI6InZlbmRvciIsImlhdCI6MTc2MDk1ODIzOCwiZXhwIjoxNzYxNTYzMDM4fQ.VxpL4NajknNsmKNLmBtKxv5Ex539P6JQPol_gkadPEg"

CUSTOMER_ADDRESS="0x04f8ff8860d9640f10045bd62d3acf3c514f7fae"
CUSTOMER_PASSWORD="Customer2024!Shop"
CUSTOMER_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGY2MTY4YjNhZjlhMDhlZGY1NzA3NmQiLCJ3YWxsZXRBZGRyZXNzIjoiMHgwNGY4ZmY4ODYwZDk2NDBmMTAwNDViZDYyZDNhY2YzYzUxNGY3ZmFlIiwicm9sZSI6ImN1c3RvbWVyIiwiaWF0IjoxNzYwOTU4MjQwLCJleHAiOjE3NjE1NjMwNDB9.lXgYu2pUzr6XbK01XgtcSwflPJ266b0Cu6Pts6o2Phs"

EXPERT_ADDRESS="0x4eec391cba3e0f381fd96052d44cb2ae038a6b59"
EXPERT_PASSWORD="Expert2024!Blockchain"
EXPERT_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGY2MTY4YzNhZjlhMDhlZGY1NzA3NmYiLCJ3YWxsZXRBZGRyZXNzIjoiMHg0ZWVjMzkxY2JhM2UwZjM4MWZkOTYwNTJkNDRjYjJhZTAzOGE2YjU5Iiwicm9sZSI6ImV4cGVydCIsImlhdCI6MTc2MDk1ODI0MiwiZXhwIjoxNzYxNTYzMDQyfQ.CX3qPnxI_WT4b6rGNSD4UbpFlAdwm_t8s6UABg7iE9o"
# Product IDs (update after creating products)
PRODUCT_ID_1="68f617c53af9a08edf5707a9"
PRODUCT_ID_2="68f617c53af9a08edf5707a9"

# Storage for created orders
ORDER_ID_1=""
ORDER_ID_2=""
ORDER_NUMBER_1=""

# Functions
print_result() {
    local test_name=$1
    local result=$2
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if [ "$result" = "PASS" ]; then
        echo -e "${GREEN}✅ PASS${NC} - $test_name"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}❌ FAIL${NC} - $test_name"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

print_section() {
    echo ""
    echo "=========================================="
    echo -e "${CYAN}$1${NC}"
    echo "=========================================="
    echo ""
}

contains() {
    if echo "$1" | grep -q "$2"; then
        return 0
    else
        return 1
    fi
}

# ========================================
# PRE-FLIGHT CHECK
# ========================================
print_section "🔧 Pre-flight Checks"

# Check jq
if ! command -v jq &> /dev/null; then
    echo -e "${RED}jq is not installed. Install: brew install jq${NC}"
    exit 1
fi

# Check server
SERVER_CHECK=$(curl -s ${BASE_URL}/health 2>/dev/null)
if contains "$SERVER_CHECK" "OK"; then
    print_result "Server Health" "PASS"
else
    print_result "Server Health" "FAIL"
    echo -e "${RED}Server not running at ${BASE_URL}${NC}"
    exit 1
fi

# ========================================
# LOGIN ALL USERS
# ========================================
print_section "🔐 Authentication"

echo "Logging in as Customer..."
CUSTOMER_LOGIN=$(curl -s -X POST ${BASE_URL}/api/auth/login/password \
  -H "Content-Type: application/json" \
  -d "{
    \"address\": \"$CUSTOMER_ADDRESS\",
    \"password\": \"$CUSTOMER_PASSWORD\"
  }")

CUSTOMER_TOKEN=$(echo "$CUSTOMER_LOGIN" | jq -r '.data.token // .token // empty' 2>/dev/null)

if [ -n "$CUSTOMER_TOKEN" ] && [ "$CUSTOMER_TOKEN" != "null" ]; then
    print_result "Customer Login" "PASS"
    echo -e "${BLUE}   Token: ${CUSTOMER_TOKEN:0:40}...${NC}"
else
    print_result "Customer Login" "FAIL"
    echo -e "${YELLOW}Please update CUSTOMER_ADDRESS and CUSTOMER_PASSWORD${NC}"
fi

echo ""
echo "Logging in as Supplier..."
SUPPLIER_LOGIN=$(curl -s -X POST ${BASE_URL}/api/auth/login/password \
  -H "Content-Type: application/json" \
  -d "{
    \"address\": \"$SUPPLIER_ADDRESS\",
    \"password\": \"$SUPPLIER_PASSWORD\"
  }")

SUPPLIER_TOKEN=$(echo "$SUPPLIER_LOGIN" | jq -r '.data.token // .token // empty' 2>/dev/null)

if [ -n "$SUPPLIER_TOKEN" ] && [ "$SUPPLIER_TOKEN" != "null" ]; then
    print_result "Supplier Login" "PASS"
else
    print_result "Supplier Login" "FAIL"
fi

echo ""
echo "Logging in as Vendor..."
VENDOR_LOGIN=$(curl -s -X POST ${BASE_URL}/api/auth/login/password \
  -H "Content-Type: application/json" \
  -d "{
    \"address\": \"$VENDOR_ADDRESS\",
    \"password\": \"$VENDOR_PASSWORD\"
  }")

VENDOR_TOKEN=$(echo "$VENDOR_LOGIN" | jq -r '.data.token // .token // empty' 2>/dev/null)

if [ -n "$VENDOR_TOKEN" ] && [ "$VENDOR_TOKEN" != "null" ]; then
    print_result "Vendor Login" "PASS"
else
    print_result "Vendor Login" "FAIL"
fi

# ========================================
# TEST 1: CREATE ORDERS
# ========================================
print_section "📦 Test 1: Create Orders"

echo "Test 1.1: Create Order from Supplier Product"
CREATE_ORDER_1=$(curl -s -X POST ${BASE_URL}/api/orders \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"items\": [
      {
        \"productId\": \"$PRODUCT_ID_1\",
        \"quantity\": 2,
        \"selectedSize\": \"L\",
        \"selectedColor\": \"Blue\"
      }
    ],
    \"shippingAddress\": {
      \"name\": \"David Chen\",
      \"addressLine1\": \"789 Oak Street\",
      \"addressLine2\": \"Apt 4B\",
      \"city\": \"Palo Alto\",
      \"state\": \"CA\",
      \"postalCode\": \"94301\",
      \"country\": \"USA\",
      \"phone\": \"+1 650 555 0303\"
    },
    \"paymentMethod\": \"card\",
    \"notes\": \"Please handle with care\"
  }")

if contains "$CREATE_ORDER_1" "success"; then
    ORDER_ID_1=$(echo "$CREATE_ORDER_1" | jq -r '.order._id // .order.id // .data.order._id // empty' 2>/dev/null)
    ORDER_NUMBER_1=$(echo "$CREATE_ORDER_1" | jq -r '.order.orderNumber // .data.order.orderNumber // empty' 2>/dev/null)
    TOTAL=$(echo "$CREATE_ORDER_1" | jq -r '.order.totalAmount // .data.order.totalAmount // empty' 2>/dev/null)
    print_result "Create Order 1" "PASS"
    echo -e "${BLUE}   Order ID: $ORDER_ID_1${NC}"
    echo -e "${BLUE}   Order Number: $ORDER_NUMBER_1${NC}"
    echo -e "${BLUE}   Total: \$$TOTAL${NC}"
else
    print_result "Create Order 1" "FAIL"
    echo -e "${YELLOW}Response:${NC}"
    echo "$CREATE_ORDER_1" | jq '.'
fi

echo ""
echo "Test 1.2: Create Multi-Item Order"
CREATE_ORDER_2=$(curl -s -X POST ${BASE_URL}/api/orders \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"items\": [
      {
        \"productId\": \"$PRODUCT_ID_1\",
        \"quantity\": 1,
        \"selectedSize\": \"M\"
      },
      {
        \"productId\": \"$PRODUCT_ID_2\",
        \"quantity\": 1,
        \"selectedSize\": \"L\"
      }
    ],
    \"shippingAddress\": {
      \"name\": \"David Chen\",
      \"addressLine1\": \"789 Oak Street\",
      \"city\": \"Palo Alto\",
      \"state\": \"CA\",
      \"postalCode\": \"94301\",
      \"country\": \"USA\",
      \"phone\": \"+1 650 555 0303\"
    },
    \"paymentMethod\": \"card\"
  }")

if contains "$CREATE_ORDER_2" "success"; then
    ORDER_ID_2=$(echo "$CREATE_ORDER_2" | jq -r '.order._id // .data.order._id // empty' 2>/dev/null)
    print_result "Create Multi-Item Order" "PASS"
    echo -e "${BLUE}   Order ID: $ORDER_ID_2${NC}"
else
    print_result "Create Multi-Item Order" "FAIL"
fi

# ========================================
# TEST 2: READ ORDERS
# ========================================
print_section "📖 Test 2: Read Orders"

echo "Test 2.1: Get Customer Orders"
CUSTOMER_ORDERS=$(curl -s -X GET ${BASE_URL}/api/orders \
  -H "Authorization: Bearer $CUSTOMER_TOKEN")

if contains "$CUSTOMER_ORDERS" "success"; then
    ORDER_COUNT=$(echo "$CUSTOMER_ORDERS" | jq -r '.pagination.total // .orders | length // 0' 2>/dev/null)
    print_result "Get Customer Orders" "PASS"
    echo -e "${BLUE}   Total Orders: $ORDER_COUNT${NC}"
else
    print_result "Get Customer Orders" "FAIL"
fi

echo ""
echo "Test 2.2: Get Order by ID"
if [ -n "$ORDER_ID_1" ]; then
    GET_ORDER=$(curl -s -X GET "${BASE_URL}/api/orders/${ORDER_ID_1}" \
      -H "Authorization: Bearer $CUSTOMER_TOKEN")
    
    if contains "$GET_ORDER" "success"; then
        STATUS=$(echo "$GET_ORDER" | jq -r '.order.status // .data.status // empty' 2>/dev/null)
        print_result "Get Order by ID" "PASS"
        echo -e "${BLUE}   Status: $STATUS${NC}"
    else
        print_result "Get Order by ID" "FAIL"
    fi
fi

echo ""
echo "Test 2.3: Get Seller Orders (Supplier)"
SELLER_ORDERS=$(curl -s -X GET ${BASE_URL}/api/orders/seller \
  -H "Authorization: Bearer $SUPPLIER_TOKEN")

if contains "$SELLER_ORDERS" "success"; then
    SELLER_ORDER_COUNT=$(echo "$SELLER_ORDERS" | jq -r '.pagination.total // .orders | length // 0' 2>/dev/null)
    print_result "Get Seller Orders" "PASS"
    echo -e "${BLUE}   Seller Orders: $SELLER_ORDER_COUNT${NC}"
else
    print_result "Get Seller Orders" "FAIL"
fi

# ========================================
# TEST 3: ORDER TRACKING
# ========================================
print_section "📍 Test 3: Order Tracking"

if [ -n "$ORDER_ID_1" ]; then
    echo "Test 3.1: Track Order"
    TRACK=$(curl -s -X GET "${BASE_URL}/api/orders/${ORDER_ID_1}/track" \
      -H "Authorization: Bearer $CUSTOMER_TOKEN")
    
    if contains "$TRACK" "success"; then
        TRACKING_STATUS=$(echo "$TRACK" | jq -r '.tracking.status // empty' 2>/dev/null)
        print_result "Track Order" "PASS"
        echo -e "${BLUE}   Tracking Status: $TRACKING_STATUS${NC}"
    else
        print_result "Track Order" "FAIL"
    fi
fi

# ========================================
# TEST 4: ORDER STATUS UPDATES (SELLER)
# ========================================
print_section "🔄 Test 4: Order Status Updates"

if [ -n "$ORDER_ID_1" ]; then
    echo "Test 4.1: Confirm Order (Seller)"
    CONFIRM=$(curl -s -X PATCH "${BASE_URL}/api/orders/${ORDER_ID_1}/status" \
      -H "Authorization: Bearer $SUPPLIER_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "status": "confirmed",
        "notes": "Order confirmed and being prepared"
      }')
    
    if contains "$CONFIRM" "success"; then
        print_result "Confirm Order" "PASS"
    else
        print_result "Confirm Order" "FAIL"
    fi
    
    sleep 1
    
    echo ""
    echo "Test 4.2: Mark as Processing"
    PROCESSING=$(curl -s -X PATCH "${BASE_URL}/api/orders/${ORDER_ID_1}/status" \
      -H "Authorization: Bearer $SUPPLIER_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "status": "processing",
        "notes": "Order is being processed"
      }')
    
    if contains "$PROCESSING" "success"; then
        print_result "Mark as Processing" "PASS"
    else
        print_result "Mark as Processing" "FAIL"
    fi
    
    sleep 1
    
    echo ""
    echo "Test 4.3: Mark as Shipped"
    SHIPPED=$(curl -s -X PATCH "${BASE_URL}/api/orders/${ORDER_ID_1}/status" \
      -H "Authorization: Bearer $SUPPLIER_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "status": "shipped",
        "trackingNumber": "TRACK-123456789",
        "carrier": "FedEx",
        "estimatedDelivery": "2025-02-01",
        "notes": "Order shipped via FedEx"
      }')
    
    if contains "$SHIPPED" "success"; then
        TRACKING_NUM=$(echo "$SHIPPED" | jq -r '.order.tracking.trackingNumber // empty' 2>/dev/null)
        print_result "Mark as Shipped" "PASS"
        echo -e "${BLUE}   Tracking Number: $TRACKING_NUM${NC}"
    else
        print_result "Mark as Shipped" "FAIL"
    fi
    
    sleep 1
    
    echo ""
    echo "Test 4.4: Mark as Delivered"
    DELIVERED=$(curl -s -X PATCH "${BASE_URL}/api/orders/${ORDER_ID_1}/status" \
      -H "Authorization: Bearer $SUPPLIER_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "status": "delivered",
        "deliveryDate": "2025-01-28",
        "notes": "Successfully delivered"
      }')
    
    if contains "$DELIVERED" "success"; then
        print_result "Mark as Delivered" "PASS"
    else
        print_result "Mark as Delivered" "FAIL"
    fi
fi

# ========================================
# TEST 5: ORDER CANCELLATION
# ========================================
print_section "❌ Test 5: Order Cancellation"

if [ -n "$ORDER_ID_2" ]; then
    echo "Test 5.1: Cancel Order (Customer)"
    CANCEL=$(curl -s -X POST "${BASE_URL}/api/orders/${ORDER_ID_2}/cancel" \
      -H "Authorization: Bearer $CUSTOMER_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "reason": "Changed my mind",
        "notes": "Sorry, I no longer need these items"
      }')
    
    if contains "$CANCEL" "success"; then
        print_result "Cancel Order" "PASS"
    else
        print_result "Cancel Order" "FAIL"
    fi
    
    sleep 1
    
    echo ""
    echo "Test 5.2: Verify Cancellation"
    VERIFY_CANCEL=$(curl -s -X GET "${BASE_URL}/api/orders/${ORDER_ID_2}" \
      -H "Authorization: Bearer $CUSTOMER_TOKEN")
    
    if contains "$VERIFY_CANCEL" "cancelled"; then
        print_result "Verify Cancellation" "PASS"
    else
        print_result "Verify Cancellation" "FAIL"
    fi
fi

# ========================================
# TEST 6: ORDER FILTERS
# ========================================
print_section "🔍 Test 6: Order Filters"

echo "Test 6.1: Filter by Status (Delivered)"
FILTER_STATUS=$(curl -s -X GET "${BASE_URL}/api/orders?status=delivered" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN")

if contains "$FILTER_STATUS" "success"; then
    print_result "Filter by Status" "PASS"
else
    print_result "Filter by Status" "FAIL"
fi

echo ""
echo "Test 6.2: Filter by Date Range"
FILTER_DATE=$(curl -s -X GET "${BASE_URL}/api/orders?startDate=2025-01-01&endDate=2025-12-31" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN")

if contains "$FILTER_DATE" "success"; then
    print_result "Filter by Date Range" "PASS"
else
    print_result "Filter by Date Range" "FAIL"
fi

echo ""
echo "Test 6.3: Search Orders"
if [ -n "$ORDER_NUMBER_1" ]; then
    SEARCH=$(curl -s -X GET "${BASE_URL}/api/orders?search=$ORDER_NUMBER_1" \
      -H "Authorization: Bearer $CUSTOMER_TOKEN")
    
    if contains "$SEARCH" "success"; then
        print_result "Search Orders" "PASS"
    else
        print_result "Search Orders" "FAIL"
    fi
fi

# ========================================
# TEST 7: ORDER STATISTICS
# ========================================
print_section "📊 Test 7: Order Statistics"

echo "Test 7.1: Get Customer Statistics"
CUSTOMER_STATS=$(curl -s -X GET ${BASE_URL}/api/orders/stats \
  -H "Authorization: Bearer $CUSTOMER_TOKEN")

if contains "$CUSTOMER_STATS" "success"; then
    TOTAL_SPENT=$(echo "$CUSTOMER_STATS" | jq -r '.stats.totalSpent // 0' 2>/dev/null)
    TOTAL_ORDERS=$(echo "$CUSTOMER_STATS" | jq -r '.stats.totalOrders // 0' 2>/dev/null)
    print_result "Customer Statistics" "PASS"
    echo -e "${BLUE}   Total Orders: $TOTAL_ORDERS${NC}"
    echo -e "${BLUE}   Total Spent: \$$TOTAL_SPENT${NC}"
else
    print_result "Customer Statistics" "FAIL"
fi

echo ""
echo "Test 7.2: Get Seller Statistics"
SELLER_STATS=$(curl -s -X GET ${BASE_URL}/api/orders/seller/stats \
  -H "Authorization: Bearer $SUPPLIER_TOKEN")

if contains "$SELLER_STATS" "success"; then
    TOTAL_REVENUE=$(echo "$SELLER_STATS" | jq -r '.stats.totalRevenue // 0' 2>/dev/null)
    TOTAL_SOLD=$(echo "$SELLER_STATS" | jq -r '.stats.totalOrders // 0' 2>/dev/null)
    print_result "Seller Statistics" "PASS"
    echo -e "${BLUE}   Orders Sold: $TOTAL_SOLD${NC}"
    echo -e "${BLUE}   Revenue: \$$TOTAL_REVENUE${NC}"
else
    print_result "Seller Statistics" "FAIL"
fi

# ========================================
# TEST 8: BLOCKCHAIN VERIFICATION
# ========================================
print_section "⛓️  Test 8: Blockchain Verification"

if [ -n "$ORDER_ID_1" ]; then
    echo "Test 8.1: Get Order Blockchain History"
    BLOCKCHAIN=$(curl -s -X GET "${BASE_URL}/api/orders/${ORDER_ID_1}/blockchain" \
      -H "Authorization: Bearer $CUSTOMER_TOKEN")
    
    if contains "$BLOCKCHAIN" "success"; then
        VERIFIED=$(echo "$BLOCKCHAIN" | jq -r '.blockchainVerified // false' 2>/dev/null)
        print_result "Blockchain History" "PASS"
        echo -e "${BLUE}   Blockchain Verified: $VERIFIED${NC}"
    else
        print_result "Blockchain History" "FAIL"
        echo -e "${YELLOW}   Note: Order may not be on blockchain yet${NC}"
    fi
fi

# ========================================
# TEST 9: ADMIN ENDPOINTS (EXPERT)
# ========================================
print_section "👮 Test 9: Admin Endpoints"

# Login as Expert first
EXPERT_LOGIN=$(curl -s -X POST ${BASE_URL}/api/auth/login/password \
  -H "Content-Type: application/json" \
  -d "{
    \"address\": \"$EXPERT_ADDRESS\",
    \"password\": \"$EXPERT_PASSWORD\"
  }")

EXPERT_TOKEN=$(echo "$EXPERT_LOGIN" | jq -r '.data.token // .token // empty' 2>/dev/null)

if [ -n "$EXPERT_TOKEN" ] && [ "$EXPERT_TOKEN" != "null" ]; then
    echo "Test 9.1: Get All Orders (Expert)"
    ALL_ORDERS=$(curl -s -X GET ${BASE_URL}/api/orders/all \
      -H "Authorization: Bearer $EXPERT_TOKEN")
    
    if contains "$ALL_ORDERS" "success"; then
        TOTAL=$(echo "$ALL_ORDERS" | jq -r '.pagination.total // .orders | length // 0' 2>/dev/null)
        print_result "Get All Orders (Expert)" "PASS"
        echo -e "${BLUE}   Total System Orders: $TOTAL${NC}"
    else
        print_result "Get All Orders (Expert)" "FAIL"
    fi
    
    echo ""
    echo "Test 9.2: Get Platform Statistics (Expert)"
    PLATFORM_STATS=$(curl -s -X GET ${BASE_URL}/api/orders/platform/stats \
      -H "Authorization: Bearer $EXPERT_TOKEN")
    
    if contains "$PLATFORM_STATS" "success"; then
        print_result "Platform Statistics" "PASS"
    else
        print_result "Platform Statistics" "FAIL"
    fi
else
    echo -e "${YELLOW}Skipping Expert tests (login failed)${NC}"
fi

# ========================================
# TEST 10: AUTHORIZATION
# ========================================
print_section "🔒 Test 10: Authorization"

echo "Test 10.1: Unauthorized Order Access"
UNAUTH=$(curl -s -X GET ${BASE_URL}/api/orders \
  -H "Content-Type: application/json")

if contains "$UNAUTH" "Unauthorized\|token\|401"; then
    print_result "Block Unauthorized Access" "PASS"
else
    print_result "Block Unauthorized Access" "FAIL"
fi

echo ""
echo "Test 10.2: Customer Cannot Update Order Status"
if [ -n "$ORDER_ID_1" ]; then
    UNAUTH_UPDATE=$(curl -s -X PATCH "${BASE_URL}/api/orders/${ORDER_ID_1}/status" \
      -H "Authorization: Bearer $CUSTOMER_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"status": "delivered"}')
    
    if contains "$UNAUTH_UPDATE" "denied\|Unauthorized\|403"; then
        print_result "Block Customer Status Update" "PASS"
    else
        print_result "Block Customer Status Update" "FAIL"
    fi
fi

# ========================================
# TEST 11: ERROR HANDLING
# ========================================
print_section "⚠️ Test 11: Error Handling"

echo "Test 11.1: Create Order with Invalid Product"
INVALID_PRODUCT=$(curl -s -X POST ${BASE_URL}/api/orders \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{"productId": "invalid-id-123", "quantity": 1}],
    "shippingAddress": {
      "name": "Test User",
      "addressLine1": "123 Test St",
      "city": "Test City",
      "state": "TS",
      "postalCode": "12345",
      "country": "USA",
      "phone": "+1 555 0000"
    },
    "paymentMethod": "card"
  }')

if contains "$INVALID_PRODUCT" "not found\|invalid\|error"; then
    print_result "Invalid Product Rejected" "PASS"
else
    print_result "Invalid Product Rejected" "FAIL"
fi

echo ""
echo "Test 11.2: Create Order with Insufficient Stock"
INSUFFICIENT=$(curl -s -X POST ${BASE_URL}/api/orders \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"items\": [{\"productId\": \"$PRODUCT_ID_1\", \"quantity\": 99999}],
    \"shippingAddress\": {
      \"name\": \"Test User\",
      \"addressLine1\": \"123 Test St\",
      \"city\": \"Test City\",
      \"state\": \"TS\",
      \"postalCode\": \"12345\",
      \"country\": \"USA\",
      \"phone\": \"+1 555 0000\"
    },
    \"paymentMethod\": \"card\"
  }")

if contains "$INSUFFICIENT" "stock\|Insufficient\|available"; then
    print_result "Insufficient Stock Rejected" "PASS"
else
    print_result "Insufficient Stock Rejected" "FAIL"
fi

echo ""
echo "Test 11.3: Missing Required Fields"
MISSING=$(curl -s -X POST ${BASE_URL}/api/orders \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"items": []}')

if contains "$MISSING" "required\|missing\|invalid"; then
    print_result "Missing Fields Rejected" "PASS"
else
    print_result "Missing Fields Rejected" "FAIL"
fi

# ========================================
# SUMMARY
# ========================================
print_section "📊 Test Summary"

PERCENTAGE=$((PASSED_TESTS * 100 / TOTAL_TESTS))

echo -e "${BLUE}Total Tests:    $TOTAL_TESTS${NC}"
echo -e "${GREEN}Passed:         $PASSED_TESTS${NC}"
echo -e "${RED}Failed:         $FAILED_TESTS${NC}"
echo -e "${CYAN}Success Rate:   ${PERCENTAGE}%${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}╔══════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                  ║${NC}"
    echo -e "${GREEN}║    🎉 ALL TESTS PASSED! 🎉       ║${NC}"
    echo -e "${GREEN}║                                  ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════╝${NC}"
    echo ""
    echo "Created Orders:"
    [ -n "$ORDER_ID_1" ] && echo "  ✓ Order 1: $ORDER_ID_1 ($ORDER_NUMBER_1)"
    [ -n "$ORDER_ID_2" ] && echo "  ✓ Order 2: $ORDER_ID_2"
    echo ""
    echo "✅ ChainVanguard Order API is fully functional!"
    echo ""
else
    echo -e "${RED}╔══════════════════════════════════╗${NC}"
    echo -e "${RED}║                                  ║${NC}"
    echo -e "${RED}║   ⚠️  SOME TESTS FAILED          ║${NC}"
    echo -e "${RED}║                                  ║${NC}"
    echo -e "${RED}╚══════════════════════════════════╝${NC}"
    echo ""
fi

exit $([ $FAILED_TESTS -eq 0 ] && echo 0 || echo 1)