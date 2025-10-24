#!/bin/bash

source /Users/atifjalal/Desktop/chainvanguard-nextjs/chainvanguard-backend/api/.env

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
SUPPLIER_PASSWORD="$SUPPLIER_PASSWORD"
SUPPLIER_ADDRESS="$SUPPLIER_ADDRESS"
SUPPLIER_TOKEN="$SUPPLIER_TOKEN"

VENDOR_PASSWORD="$VENDOR_PASSWORD"
VENDOR_ADDRESS="$VENDOR_ADDRESS"
VENDOR_TOKEN="$VENDOR_TOKEN"

CUSTOMER_PASSWORD="$CUSTOMER_PASSWORD"
CUSTOMER_ADDRESS="$CUSTOMER_ADDRESS"
CUSTOMER_TOKEN="$CUSTOMER_TOKEN"

EXPERT_PASSWORD="$EXPERT_PASSWORD"
EXPERT_ADDRESS="$EXPERT_ADDRESS"
EXPERT_TOKEN="$EXPERT_TOKEN"

PRODUCT_ID_1="$PRODUCT_ID_1"
PRODUCT_ID_2="$PRODUCT_ID_2"

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
# WALLET SETUP
# ========================================
print_section "💰 Wallet Setup"

echo "Adding funds to customer wallet..."
ADD_FUNDS=$(curl -s -X POST ${BASE_URL}/api/wallet/deposit \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": 10000, "description": "Test funding for orders"}')

if contains "$ADD_FUNDS" "success"; then
    # Try multiple paths to get balance
    BALANCE=$(echo "$ADD_FUNDS" | jq -r '.wallet.balance // .balance // .data.newBalance // .newBalance // 0')
    print_result "Customer Wallet Funded" "PASS"
    echo -e "${BLUE}   New Balance: \$$BALANCE${NC}"
    
    # Verify balance is actually added
    if [ "$BALANCE" = "0" ] || [ -z "$BALANCE" ] || [ "$BALANCE" = "null" ]; then
        echo -e "${RED}   ⚠️ CRITICAL: Balance is $BALANCE after deposit!${NC}"
        echo -e "${YELLOW}   Debug Response:${NC}"
        echo "$ADD_FUNDS" | jq '.'
        exit 1
    fi
else
    print_result "Customer Wallet Funded" "FAIL"
    echo "$ADD_FUNDS" | jq '.'
    exit 1
fi

echo ""
echo "Verifying wallet balance..."
BALANCE_CHECK=$(curl -s -X GET ${BASE_URL}/api/wallet/balance \
  -H "Authorization: Bearer $CUSTOMER_TOKEN")

if contains "$BALANCE_CHECK" "success"; then
    CURRENT_BALANCE=$(echo "$BALANCE_CHECK" | jq -r '.wallet.balance // .balance // .data.balance // 0')
    print_result "Wallet Balance Check" "PASS"
    echo -e "${BLUE}   Available Balance: \$$CURRENT_BALANCE${NC}"
    
    # Verify balance before proceeding
    if [ "$CURRENT_BALANCE" = "0" ] || [ -z "$CURRENT_BALANCE" ] || [ "$CURRENT_BALANCE" = "null" ]; then
        echo -e "${RED}   ⚠️ CRITICAL: Balance verification failed!${NC}"
        echo "$BALANCE_CHECK" | jq '.'
        exit 1
    fi
else
    print_result "Wallet Balance Check" "FAIL"
    exit 1
fi

# ========================================
# TEST 1: CREATE ORDERS
# ========================================
print_section "📦 Test 1: Create Orders"

echo "Test 1.1: Create Order from Supplier Product (Wallet Payment)"
CREATE_ORDER_1=$(curl -s -X POST ${BASE_URL}/api/orders \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"items\": [
      {
        \"productId\": \"$PRODUCT_ID_1\",
        \"quantity\": 2
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
    \"paymentMethod\": \"wallet\",
    \"customerNotes\": \"Please handle with care\"
  }")

if contains "$CREATE_ORDER_1" "success"; then
    ORDER_ID_1=$(echo "$CREATE_ORDER_1" | jq -r '.order.id // .order._id // .data.order._id // .data.order.id // empty' 2>/dev/null)
    ORDER_NUMBER_1=$(echo "$CREATE_ORDER_1" | jq -r '.order.orderNumber // .data.order.orderNumber // .data.orderNumber // empty' 2>/dev/null)
    TOTAL=$(echo "$CREATE_ORDER_1" | jq -r '.order.total // .order.totalAmount // .data.order.total // .data.total // 0')
    STATUS=$(echo "$CREATE_ORDER_1" | jq -r '.order.status // .data.order.status // .data.status // "unknown"')
    PAYMENT_STATUS=$(echo "$CREATE_ORDER_1" | jq -r '.order.paymentStatus // .data.order.paymentStatus // .data.paymentStatus // "unknown"')
    
    print_result "Create Order 1 (Wallet Payment)" "PASS"
    echo -e "${BLUE}   Order ID: $ORDER_ID_1${NC}"
    echo -e "${BLUE}   Order Number: $ORDER_NUMBER_1${NC}"
    echo -e "${BLUE}   Status: $STATUS${NC}"
    echo -e "${BLUE}   Payment Status: $PAYMENT_STATUS${NC}"
    echo -e "${BLUE}   Total: \$$TOTAL${NC}"
else
    print_result "Create Order 1 (Wallet Payment)" "FAIL"
    echo -e "${YELLOW}Response:${NC}"
    echo "$CREATE_ORDER_1" | jq '.' 2>/dev/null || echo "$CREATE_ORDER_1"
fi

echo ""
echo "Test 1.2: Create Multi-Item Order (Wallet Payment)"
CREATE_ORDER_2=$(curl -s -X POST ${BASE_URL}/api/orders \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"items\": [
      {
        \"productId\": \"$PRODUCT_ID_1\",
        \"quantity\": 1
      },
      {
        \"productId\": \"$PRODUCT_ID_2\",
        \"quantity\": 1
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
    \"paymentMethod\": \"wallet\"
  }")

if contains "$CREATE_ORDER_2" "success"; then
    ORDER_ID_2=$(echo "$CREATE_ORDER_2" | jq -r '.order.id // .order._id // .data.order._id // .data.order.id // empty' 2>/dev/null)
    ORDER_NUMBER_2=$(echo "$CREATE_ORDER_2" | jq -r '.order.orderNumber // .data.order.orderNumber // .data.orderNumber // empty' 2>/dev/null)
    TOTAL_2=$(echo "$CREATE_ORDER_2" | jq -r '.order.total // .order.totalAmount // .data.order.total // .data.total // 0')
    
    print_result "Create Multi-Item Order" "PASS"
    echo -e "${BLUE}   Order ID: $ORDER_ID_2${NC}"
    echo -e "${BLUE}   Order Number: $ORDER_NUMBER_2${NC}"
    echo -e "${BLUE}   Total: \$$TOTAL_2${NC}"
else
    print_result "Create Multi-Item Order" "FAIL"
    echo -e "${YELLOW}Response:${NC}"
    echo "$CREATE_ORDER_2" | jq '.' 2>/dev/null || echo "$CREATE_ORDER_2"
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
if [ -n "$ORDER_ID_1" ] && [ "$ORDER_ID_1" != "null" ]; then
    GET_ORDER=$(curl -s -X GET "${BASE_URL}/api/orders/${ORDER_ID_1}" \
      -H "Authorization: Bearer $CUSTOMER_TOKEN")

    if contains "$GET_ORDER" "success"; then
        STATUS=$(echo "$GET_ORDER" | jq -r '.order.status // .data.status // empty' 2>/dev/null)
        PAYMENT=$(echo "$GET_ORDER" | jq -r '.order.paymentStatus // .data.paymentStatus // empty' 2>/dev/null)
        TRACKING=$(echo "$GET_ORDER" | jq -r '.order.trackingNumber // .data.trackingNumber // "Not assigned"' 2>/dev/null)
        
        print_result "Get Order by ID" "PASS"
        echo -e "${BLUE}   Status: $STATUS${NC}"
        echo -e "${BLUE}   Payment: $PAYMENT${NC}"
        echo -e "${BLUE}   Tracking: $TRACKING${NC}"
    else
        print_result "Get Order by ID" "FAIL"
    fi
else
    echo -e "${YELLOW}   Skipped - ORDER_ID_1 not available${NC}"
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

if [ -n "$ORDER_ID_1" ] && [ "$ORDER_ID_1" != "null" ]; then
    echo "Test 3.1: Track Order"
    TRACK=$(curl -s -X GET "${BASE_URL}/api/orders/${ORDER_ID_1}/track" \
      -H "Authorization: Bearer $CUSTOMER_TOKEN")
    
    if contains "$TRACK" "success\|orderNumber"; then
        TRACKING_STATUS=$(echo "$TRACK" | jq -r '.status // .tracking.status // "pending"' 2>/dev/null)
        CURRENT_LOC=$(echo "$TRACK" | jq -r '.currentLocation // "Order placed"' 2>/dev/null)
        print_result "Track Order" "PASS"
        echo -e "${BLUE}   Status: $TRACKING_STATUS${NC}"
        echo -e "${BLUE}   Location: $CURRENT_LOC${NC}"
    else
        print_result "Track Order" "FAIL"
    fi
else
    echo -e "${YELLOW}Test 3.1: Skipped - No ORDER_ID_1${NC}"
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
    TRACKING_NUM=$(echo "$SHIPPED" | jq -r '.order.trackingNumber // empty')
    print_result "Mark as Shipped" "PASS"
    if [ -n "$TRACKING_NUM" ] && [ "$TRACKING_NUM" != "null" ]; then
        echo -e "${BLUE}   Tracking Number: $TRACKING_NUM${NC}"
    else
        echo -e "${YELLOW}   Tracking Number: Not set${NC}"
    fi
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
# TEST 5.5: REFUND VERIFICATION
# ========================================
print_section "💰 Test 5.5: Refund Verification"

if [ -n "$ORDER_ID_2" ]; then
    echo "Test 5.5.1: Check Wallet Balance After Cancellation"
    WALLET_AFTER_CANCEL=$(curl -s -X GET ${BASE_URL}/api/wallet/balance \
      -H "Authorization: Bearer $CUSTOMER_TOKEN")
    
    if contains "$WALLET_AFTER_CANCEL" "success"; then
        BALANCE_AFTER=$(echo "$WALLET_AFTER_CANCEL" | jq -r '.wallet.balance // .balance // .data.balance // 0')
        print_result "Wallet Balance After Cancellation" "PASS"
        echo -e "${BLUE}   Balance After Cancellation: \$$BALANCE_AFTER${NC}"
        echo -e "${GREEN}   Refund should be reflected in balance${NC}"
    else
        print_result "Wallet Balance After Cancellation" "FAIL"
    fi
    
    echo ""
    echo "Test 5.5.2: Verify Refund Transaction"
    TRANSACTIONS=$(curl -s -X GET "${BASE_URL}/api/wallet/transactions?limit=5" \
      -H "Authorization: Bearer $CUSTOMER_TOKEN")
    
    if contains "$TRANSACTIONS" "refund"; then
        print_result "Refund Transaction Recorded" "PASS"
        echo -e "${GREEN}   Refund transaction found in wallet history${NC}"
    else
        print_result "Refund Transaction Recorded" "FAIL"
        echo -e "${YELLOW}   No refund transaction found${NC}"
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
    "paymentMethod": "wallet"
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

if contains "$MISSING" "success.*false\\|required\\|missing\\|invalid\\|must contain\\|at least one"; then
    print_result "Missing Fields Rejected" "PASS"
else
    print_result "Missing Fields Rejected" "FAIL"
fi

# ========================================
# TEST 12: REFUND SYSTEM
# ========================================
print_section "💰 Test 12: Refund System"

echo "Test 12.1: Check Initial Wallet Balance"
BALANCE_BEFORE_ORDER=$(curl -s -X GET ${BASE_URL}/api/wallet/balance \
  -H "Authorization: Bearer $CUSTOMER_TOKEN")

INITIAL_BALANCE=$(echo "$BALANCE_BEFORE_ORDER" | jq -r '.wallet.balance // .balance // 0')
echo -e "${BLUE}   Initial Balance: \$$INITIAL_BALANCE${NC}"

if [ -z "$INITIAL_BALANCE" ] || [ "$INITIAL_BALANCE" = "null" ] || [ "$INITIAL_BALANCE" = "0" ]; then
    echo -e "${RED}   ⚠️ WARNING: Initial balance is $INITIAL_BALANCE${NC}"
    echo -e "${YELLOW}   Adding more funds for refund test...${NC}"
    
    ADD_MORE=$(curl -s -X POST ${BASE_URL}/api/wallet/deposit \
      -H "Authorization: Bearer $CUSTOMER_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"amount": 500, "description": "Additional funds for refund test"}')
    
    sleep 1
    
    BALANCE_BEFORE_ORDER=$(curl -s -X GET ${BASE_URL}/api/wallet/balance \
      -H "Authorization: Bearer $CUSTOMER_TOKEN")
    INITIAL_BALANCE=$(echo "$BALANCE_BEFORE_ORDER" | jq -r '.wallet.balance // .balance // 0')
    echo -e "${BLUE}   Updated Balance: \$$INITIAL_BALANCE${NC}"
fi

echo ""
echo "Test 12.2: Create Order for Refund Test"
REFUND_ORDER=$(curl -s -X POST ${BASE_URL}/api/orders \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"items\": [{\"productId\": \"$PRODUCT_ID_1\", \"quantity\": 1}],
    \"shippingAddress\": {
      \"name\": \"Test User\",
      \"addressLine1\": \"123 Test St\",
      \"city\": \"Test City\",
      \"state\": \"TS\",
      \"postalCode\": \"12345\",
      \"country\": \"USA\",
      \"phone\": \"+1 555 0000\"
    },
    \"paymentMethod\": \"wallet\"
  }")

if contains "$REFUND_ORDER" "success"; then
    REFUND_ORDER_ID=$(echo "$REFUND_ORDER" | jq -r '.order.id // .order._id // empty')
    REFUND_ORDER_TOTAL=$(echo "$REFUND_ORDER" | jq -r '.order.total // 0')
    print_result "Create Order for Refund" "PASS"
    echo -e "${BLUE}   Order ID: $REFUND_ORDER_ID${NC}"
    echo -e "${BLUE}   Order Total: \$$REFUND_ORDER_TOTAL${NC}"
else
    print_result "Create Order for Refund" "FAIL"
    echo -e "${RED}   Response: $REFUND_ORDER${NC}"
fi

sleep 1

echo ""
echo "Test 12.3: Check Balance After Order (Before Refund)"
BALANCE_AFTER_ORDER=$(curl -s -X GET ${BASE_URL}/api/wallet/balance \
  -H "Authorization: Bearer $CUSTOMER_TOKEN")
BALANCE_AFTER_PURCHASE=$(echo "$BALANCE_AFTER_ORDER" | jq -r '.wallet.balance // .balance // 0')
echo -e "${BLUE}   Balance After Purchase: \$$BALANCE_AFTER_PURCHASE${NC}"

# Calculate expected balance after refund
EXPECTED_BALANCE=$(echo "$BALANCE_AFTER_PURCHASE + $REFUND_ORDER_TOTAL" | bc)
echo -e "${YELLOW}   Expected Balance After Refund: \$$EXPECTED_BALANCE${NC}"

sleep 1

echo ""
echo "Test 12.4: Cancel Order (Should Trigger Automatic Refund)"
if [ -n "$REFUND_ORDER_ID" ] && [ "$REFUND_ORDER_ID" != "null" ]; then
    CANCEL_WITH_REFUND=$(curl -s -X POST "${BASE_URL}/api/orders/${REFUND_ORDER_ID}/cancel" \
      -H "Authorization: Bearer $CUSTOMER_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "reason": "Testing refund system",
        "notes": "Automated refund test"
      }')
    
    # Check if cancellation was successful and mentions refund
    if contains "$CANCEL_WITH_REFUND" "success"; then
        if contains "$CANCEL_WITH_REFUND" "refund"; then
            REFUND_MENTIONED=$(echo "$CANCEL_WITH_REFUND" | jq -r '.order.refundAmount // .refundAmount // 0')
            print_result "Cancel Order with Automatic Refund" "PASS"
            echo -e "${GREEN}   ✅ Refund processed automatically${NC}"
            echo -e "${BLUE}   Refund Amount: \$$REFUND_MENTIONED${NC}"
        else
            print_result "Cancel Order with Automatic Refund" "FAIL"
            echo -e "${YELLOW}   Order cancelled but refund not mentioned${NC}"
        fi
    else
        print_result "Cancel Order with Automatic Refund" "FAIL"
        echo -e "${RED}   Cancellation failed${NC}"
    fi
else
    echo -e "${YELLOW}   Skipped - No REFUND_ORDER_ID${NC}"
fi

sleep 2

echo ""
echo "Test 12.5: Verify Wallet Balance Restored"
BALANCE_AFTER_REFUND=$(curl -s -X GET ${BASE_URL}/api/wallet/balance \
  -H "Authorization: Bearer $CUSTOMER_TOKEN")

FINAL_BALANCE=$(echo "$BALANCE_AFTER_REFUND" | jq -r '.wallet.balance // .balance // 0')

# Compare final balance with expected balance (allow small rounding differences)
BALANCE_DIFF=$(echo "$FINAL_BALANCE - $EXPECTED_BALANCE" | bc)
BALANCE_DIFF_ABS=$(echo "$BALANCE_DIFF" | tr -d '-')

if [ "$BALANCE_DIFF_ABS" = "0" ] || [ $(echo "$BALANCE_DIFF_ABS < 0.01" | bc) -eq 1 ]; then
    print_result "Wallet Balance Restored" "PASS"
    echo -e "${BLUE}   Balance Before Order: \$$INITIAL_BALANCE${NC}"
    echo -e "${BLUE}   Order Amount: \$$REFUND_ORDER_TOTAL${NC}"
    echo -e "${BLUE}   Balance After Purchase: \$$BALANCE_AFTER_PURCHASE${NC}"
    echo -e "${BLUE}   Expected After Refund: \$$EXPECTED_BALANCE${NC}"
    echo -e "${BLUE}   Actual Final Balance: \$$FINAL_BALANCE${NC}"
    echo -e "${GREEN}   ✅ Refund successfully credited to wallet!${NC}"
else
    print_result "Wallet Balance Restored" "FAIL"
    echo -e "${RED}   ❌ Balance mismatch!${NC}"
    echo -e "${YELLOW}   Expected: \$$EXPECTED_BALANCE${NC}"
    echo -e "${YELLOW}   Got: \$$FINAL_BALANCE${NC}"
    echo -e "${YELLOW}   Difference: \$$BALANCE_DIFF${NC}"
fi

echo ""
echo "Test 12.6: Verify Refund in Transaction History"
REFUND_HISTORY=$(curl -s -X GET "${BASE_URL}/api/wallet/transactions?limit=10" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN")

if contains "$REFUND_HISTORY" "refund"; then
    # Try to extract the most recent refund transaction
    REFUND_AMOUNT=$(echo "$REFUND_HISTORY" | jq -r '
      .data[] | 
      select(.type == "refund") | 
      .amount' | head -1 2>/dev/null)
    
    if [ -n "$REFUND_AMOUNT" ] && [ "$REFUND_AMOUNT" != "null" ]; then
        print_result "Refund Transaction History" "PASS"
        echo -e "${BLUE}   Refund Amount in History: \$$REFUND_AMOUNT${NC}"
        echo -e "${GREEN}   ✅ Refund transaction recorded in wallet history${NC}"
    else
        print_result "Refund Transaction History" "PASS"
        echo -e "${GREEN}   Refund found in transaction history${NC}"
    fi
else
    print_result "Refund Transaction History" "FAIL"
    echo -e "${RED}   No refund transaction found in history${NC}"
    echo -e "${YELLOW}   Recent transactions:${NC}"
    echo "$REFUND_HISTORY" | jq -r '.data[0:3] | .[] | "\(.type): $\(.amount)"' 2>/dev/null || echo "   Unable to parse transactions"
fi

echo ""
echo "Test 12.7: Verify Order Payment Status is 'refunded'"
if [ -n "$REFUND_ORDER_ID" ] && [ "$REFUND_ORDER_ID" != "null" ]; then
    REFUNDED_ORDER=$(curl -s -X GET "${BASE_URL}/api/orders/${REFUND_ORDER_ID}" \
      -H "Authorization: Bearer $CUSTOMER_TOKEN")
    
    PAYMENT_STATUS=$(echo "$REFUNDED_ORDER" | jq -r '.order.paymentStatus // .data.order.paymentStatus // empty')
    
    if [ "$PAYMENT_STATUS" = "refunded" ]; then
        print_result "Order Payment Status Updated" "PASS"
        echo -e "${BLUE}   Payment Status: $PAYMENT_STATUS${NC}"
    else
        print_result "Order Payment Status Updated" "FAIL"
        echo -e "${YELLOW}   Payment Status: $PAYMENT_STATUS (expected: refunded)${NC}"
    fi
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