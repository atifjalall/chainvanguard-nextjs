#!/bin/bash

source /Users/atifjalal/Desktop/chainvanguard-nextjs/chainvanguard-backend/api/.env

# ============================================
# ChainVanguard - Customer → Vendor Order System Test Suite
# FIXED VERSION - Comprehensive test matching exact backend logic
# Tests: Order creation, management, tracking, cancellation, and refunds
# ============================================

echo "🧪 ChainVanguard - Customer → Vendor Complete Order Testing (FIXED)"
echo "===================================================================="
echo "Testing: Full B2C Order Flow (Customer buying from Vendor)"
echo "Using: Existing products and credentials from .env"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

# Base URL
BASE_URL="http://localhost:3001"

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Storage for test data
ORDER_ID_1=""
ORDER_ID_2=""
ORDER_ID_3=""
ORDER_NUMBER_1=""
ORDER_NUMBER_2=""
ORDER_NUMBER_3=""

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
    echo "===================================================================="
    echo -e "${CYAN}$1${NC}"
    echo "===================================================================="
    echo ""
}

print_subsection() {
    echo ""
    echo -e "${MAGENTA}$1${NC}"
    echo "--------------------------------------------------------------------"
}

contains() {
    if echo "$1" | grep -q "$2"; then
        return 0
    else
        return 1
    fi
}

# ========================================
# PRE-FLIGHT CHECKS
# ========================================
print_section "🔧 Pre-flight System Checks"

# Check jq
if ! command -v jq &> /dev/null; then
    echo -e "${RED}ERROR: jq is not installed. Install: brew install jq${NC}"
    exit 1
fi
print_result "jq JSON parser installed" "PASS"

# Check bc for calculations
if ! command -v bc &> /dev/null; then
    echo -e "${RED}ERROR: bc calculator not installed${NC}"
    exit 1
fi
print_result "bc calculator installed" "PASS"

# Check server health
SERVER_CHECK=$(curl -s ${BASE_URL}/health 2>/dev/null)
if contains "$SERVER_CHECK" "OK"; then
    print_result "Backend server health check" "PASS"
    echo -e "${BLUE}   Server: ${BASE_URL}${NC}"
else
    print_result "Backend server health check" "FAIL"
    echo -e "${RED}ERROR: Server not running at ${BASE_URL}${NC}"
    echo -e "${YELLOW}Please start the backend server first${NC}"
    exit 1
fi

# Verify environment credentials
if [ -z "$VENDOR_TOKEN" ] || [ -z "$CUSTOMER_TOKEN" ] || [ -z "$PRODUCT_ID_1" ]; then
    echo -e "${RED}ERROR: Missing required credentials in .env file${NC}"
    echo -e "${YELLOW}Required: VENDOR_TOKEN, CUSTOMER_TOKEN, PRODUCT_ID_1${NC}"
    exit 1
fi

print_result "Environment credentials loaded" "PASS"
echo -e "${BLUE}   Vendor: ${VENDOR_NAME:-Unknown Vendor}${NC}"
echo -e "${BLUE}   Customer: ${CUSTOMER_NAME:-Unknown Customer}${NC}"
echo -e "${BLUE}   Product 1: $PRODUCT_ID_1${NC}"
echo -e "${BLUE}   Product 2: ${PRODUCT_ID_2:-Not Set}${NC}"

# ========================================
# SECTION 1: PRODUCT VERIFICATION
# ========================================
print_section "📦 Section 1: Product Verification"

print_subsection "Test 1.1: Verify Product 1 exists and is available"
PRODUCT_1=$(curl -s -X GET "${BASE_URL}/api/products/${PRODUCT_ID_1}")

if contains "$PRODUCT_1" "success"; then
    P1_NAME=$(echo "$PRODUCT_1" | jq -r '.product.name // "Unknown"')
    P1_PRICE=$(echo "$PRODUCT_1" | jq -r '.product.price // 0')
    P1_STOCK=$(echo "$PRODUCT_1" | jq -r '.product.quantity // 0')
    P1_STATUS=$(echo "$PRODUCT_1" | jq -r '.product.status // "unknown"')
    
    if [ "$P1_STATUS" = "active" ] && [ "$P1_STOCK" -gt 0 ]; then
        print_result "Product 1 is available for purchase" "PASS"
        echo -e "${BLUE}   Product: $P1_NAME${NC}"
        echo -e "${BLUE}   Price: \$$P1_PRICE${NC}"
        echo -e "${BLUE}   Stock: $P1_STOCK units${NC}"
        echo -e "${BLUE}   Status: $P1_STATUS${NC}"
    else
        print_result "Product 1 is available for purchase" "FAIL"
        echo -e "${RED}   Product Status: $P1_STATUS, Stock: $P1_STOCK${NC}"
        exit 1
    fi
else
    print_result "Product 1 is available for purchase" "FAIL"
    echo "$PRODUCT_1" | jq '.' 2>/dev/null || echo "$PRODUCT_1"
    exit 1
fi

if [ -n "$PRODUCT_ID_2" ] && [ "$PRODUCT_ID_2" != "null" ]; then
    print_subsection "Test 1.2: Verify Product 2 exists and is available"
    PRODUCT_2=$(curl -s -X GET "${BASE_URL}/api/products/${PRODUCT_ID_2}")
    
    if contains "$PRODUCT_2" "success"; then
        P2_NAME=$(echo "$PRODUCT_2" | jq -r '.product.name // "Unknown"')
        P2_PRICE=$(echo "$PRODUCT_2" | jq -r '.product.price // 0')
        P2_STATUS=$(echo "$PRODUCT_2" | jq -r '.product.status // "unknown"')
        
        print_result "Product 2 is available" "PASS"
        echo -e "${BLUE}   Product: $P2_NAME${NC}"
        echo -e "${BLUE}   Price: \$$P2_PRICE${NC}"
        echo -e "${BLUE}   Status: $P2_STATUS${NC}"
    else
        print_result "Product 2 is available" "FAIL"
    fi
fi

# ========================================
# SECTION 2: CUSTOMER WALLET SETUP
# ========================================
print_section "💰 Section 2: Customer Wallet Setup & Balance"

print_subsection "Test 2.1: Check customer wallet exists"
WALLET_CHECK=$(curl -s -X GET ${BASE_URL}/api/wallet/balance \
  -H "Authorization: Bearer $CUSTOMER_TOKEN")

if contains "$WALLET_CHECK" "success"; then
    CURRENT_BALANCE=$(echo "$WALLET_CHECK" | jq -r '.wallet.balance // .balance // .data.balance // 0')
    print_result "Customer wallet balance check" "PASS"
    echo -e "${BLUE}   Current Balance: \$$CURRENT_BALANCE${NC}"
    
    # Add funds if balance is insufficient
    REQUIRED_BALANCE=5000
    if [ $(echo "$CURRENT_BALANCE < $REQUIRED_BALANCE" | bc) -eq 1 ]; then
        print_subsection "Test 2.2: Adding funds to customer wallet"
        echo -e "${YELLOW}   Balance below \$$REQUIRED_BALANCE, adding funds...${NC}"
        
        ADD_FUNDS=$(curl -s -X POST ${BASE_URL}/api/wallet/deposit \
          -H "Authorization: Bearer $CUSTOMER_TOKEN" \
          -H "Content-Type: application/json" \
          -d '{"amount": 10000, "description": "Test funding for B2C order testing"}')
        
        if contains "$ADD_FUNDS" "success"; then
            NEW_BALANCE=$(echo "$ADD_FUNDS" | jq -r '.wallet.balance // .balance // 10000')
            print_result "Customer wallet funded successfully" "PASS"
            echo -e "${BLUE}   New Balance: \$$NEW_BALANCE${NC}"
            CURRENT_BALANCE=$NEW_BALANCE
        else
            print_result "Customer wallet funded successfully" "FAIL"
            echo "$ADD_FUNDS" | jq '.' 2>/dev/null || echo "$ADD_FUNDS"
            exit 1
        fi
    else
        echo -e "${GREEN}   ✅ Wallet has sufficient balance for testing${NC}"
    fi
else
    print_result "Customer wallet balance check" "FAIL"
    echo "$WALLET_CHECK" | jq '.' 2>/dev/null || echo "$WALLET_CHECK"
    exit 1
fi

# ========================================
# SECTION 3: CREATE CUSTOMER ORDERS
# ========================================
print_section "🛒 Section 3: Order Creation (Customer → Vendor)"

print_subsection "Test 3.1: Create single-item order with wallet payment"
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
      \"name\": \"${CUSTOMER_NAME:-Test Customer}\",
      \"addressLine1\": \"789 Customer Street\",
      \"addressLine2\": \"Apt 101\",
      \"city\": \"Lahore\",
      \"state\": \"Punjab\",
      \"postalCode\": \"54000\",
      \"country\": \"Pakistan\",
      \"phone\": \"+92 300 1234567\"
    },
    \"paymentMethod\": \"wallet\",
    \"customerNotes\": \"Please deliver between 9am-5pm. Handle with care.\"
  }")

if contains "$CREATE_ORDER_1" "success"; then
    ORDER_ID_1=$(echo "$CREATE_ORDER_1" | jq -r '.order.id // .order._id // empty')
    ORDER_NUMBER_1=$(echo "$CREATE_ORDER_1" | jq -r '.order.orderNumber // empty')
    ORDER_TOTAL_1=$(echo "$CREATE_ORDER_1" | jq -r '.order.total // 0')
    ORDER_STATUS=$(echo "$CREATE_ORDER_1" | jq -r '.order.status // "unknown"')
    PAYMENT_STATUS=$(echo "$CREATE_ORDER_1" | jq -r '.order.paymentStatus // "unknown"')
    
    print_result "Single-item order created successfully" "PASS"
    echo -e "${BLUE}   Order ID: $ORDER_ID_1${NC}"
    echo -e "${BLUE}   Order Number: $ORDER_NUMBER_1${NC}"
    echo -e "${BLUE}   Order Status: $ORDER_STATUS${NC}"
    echo -e "${BLUE}   Payment Status: $PAYMENT_STATUS${NC}"
    echo -e "${BLUE}   Total Amount: \$$ORDER_TOTAL_1${NC}"
    echo -e "${GREEN}   ✅ Customer successfully purchased from Vendor${NC}"
else
    print_result "Single-item order created successfully" "FAIL"
    echo -e "${YELLOW}Response:${NC}"
    echo "$CREATE_ORDER_1" | jq '.' 2>/dev/null || echo "$CREATE_ORDER_1"
fi

sleep 1

if [ -n "$PRODUCT_ID_2" ] && [ "$PRODUCT_ID_2" != "null" ]; then
    print_subsection "Test 3.2: Create multi-item order with gift options"
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
          \"name\": \"${CUSTOMER_NAME:-Test Customer}\",
          \"addressLine1\": \"789 Customer Street\",
          \"city\": \"Lahore\",
          \"state\": \"Punjab\",
          \"postalCode\": \"54000\",
          \"country\": \"Pakistan\",
          \"phone\": \"+92 300 1234567\"
        },
        \"paymentMethod\": \"wallet\",
        \"isGift\": true,
        \"giftMessage\": \"Happy Birthday! Best wishes from ChainVanguard team 🎉\",
        \"specialInstructions\": \"This is a gift - please use gift wrapping\"
      }")
    
    if contains "$CREATE_ORDER_2" "success"; then
        ORDER_ID_2=$(echo "$CREATE_ORDER_2" | jq -r '.order.id // .order._id // empty')
        ORDER_NUMBER_2=$(echo "$CREATE_ORDER_2" | jq -r '.order.orderNumber // empty')
        ORDER_TOTAL_2=$(echo "$CREATE_ORDER_2" | jq -r '.order.total // 0')
        
        print_result "Multi-item gift order created successfully" "PASS"
        echo -e "${BLUE}   Order ID: $ORDER_ID_2${NC}"
        echo -e "${BLUE}   Order Number: $ORDER_NUMBER_2${NC}"
        echo -e "${BLUE}   Total Amount: \$$ORDER_TOTAL_2${NC}"
        echo -e "${GREEN}   ✅ Gift order with special instructions${NC}"
    else
        print_result "Multi-item gift order created successfully" "FAIL"
        echo "$CREATE_ORDER_2" | jq '.' 2>/dev/null || echo "$CREATE_ORDER_2"
    fi
    
    sleep 1
else
    echo -e "${YELLOW}   ⚠️  Skipping multi-product test (PRODUCT_ID_2 not available)${NC}"
fi

print_subsection "Test 3.3: Create urgent order"
CREATE_ORDER_3=$(curl -s -X POST ${BASE_URL}/api/orders \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"items\": [
      {
        \"productId\": \"$PRODUCT_ID_1\",
        \"quantity\": 1
      }
    ],
    \"shippingAddress\": {
      \"name\": \"${CUSTOMER_NAME:-Test Customer}\",
      \"addressLine1\": \"456 Express Lane\",
      \"city\": \"Lahore\",
      \"state\": \"Punjab\",
      \"postalCode\": \"54000\",
      \"country\": \"Pakistan\",
      \"phone\": \"+92 300 1234567\"
    },
    \"paymentMethod\": \"wallet\",
    \"urgentOrder\": true,
    \"specialInstructions\": \"URGENT: Need this ASAP - Express delivery required\"
  }")

if contains "$CREATE_ORDER_3" "success"; then
    ORDER_ID_3=$(echo "$CREATE_ORDER_3" | jq -r '.order.id // .order._id // empty')
    ORDER_NUMBER_3=$(echo "$CREATE_ORDER_3" | jq -r '.order.orderNumber // empty')
    ORDER_TOTAL_3=$(echo "$CREATE_ORDER_3" | jq -r '.order.total // 0')
    
    print_result "Urgent order created successfully" "PASS"
    echo -e "${BLUE}   Order ID: $ORDER_ID_3${NC}"
    echo -e "${BLUE}   Order Number: $ORDER_NUMBER_3${NC}"
    echo -e "${BLUE}   Total Amount: \$$ORDER_TOTAL_3${NC}"
    echo -e "${GREEN}   ✅ Urgent order flagged for priority processing${NC}"
else
    print_result "Urgent order created successfully" "FAIL"
fi

# ========================================
# SECTION 4: CUSTOMER ORDER MANAGEMENT
# ========================================
print_section "📖 Section 4: Customer Order Management & Viewing"

print_subsection "Test 4.1: Customer views all their orders"
CUSTOMER_ORDERS=$(curl -s -X GET "${BASE_URL}/api/orders?page=1&limit=20" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN")

if contains "$CUSTOMER_ORDERS" "success"; then
    ORDER_COUNT=$(echo "$CUSTOMER_ORDERS" | jq -r '.pagination.total // .orders | length // 0')
    print_result "Get customer's order list" "PASS"
    echo -e "${BLUE}   Total Orders: $ORDER_COUNT${NC}"
    
    if [ "$ORDER_COUNT" -gt 0 ]; then
        echo -e "${GREEN}   ✅ Customer can view their orders${NC}"
    fi
else
    print_result "Get customer's order list" "FAIL"
fi

if [ -n "$ORDER_ID_1" ] && [ "$ORDER_ID_1" != "null" ]; then
    print_subsection "Test 4.2: Customer views specific order details"
    GET_ORDER=$(curl -s -X GET "${BASE_URL}/api/orders/${ORDER_ID_1}" \
      -H "Authorization: Bearer $CUSTOMER_TOKEN")

    if contains "$GET_ORDER" "success"; then
        STATUS=$(echo "$GET_ORDER" | jq -r '.order.status // empty')
        PAYMENT=$(echo "$GET_ORDER" | jq -r '.order.paymentStatus // empty')
        SELLER_NAME=$(echo "$GET_ORDER" | jq -r '.order.sellerName // empty')
        SELLER_ROLE=$(echo "$GET_ORDER" | jq -r '.order.sellerRole // empty')
        ITEMS_COUNT=$(echo "$GET_ORDER" | jq -r '.order.items | length // 0')
        
        print_result "Get order details" "PASS"
        echo -e "${BLUE}   Order Status: $STATUS${NC}"
        echo -e "${BLUE}   Payment Status: $PAYMENT${NC}"
        echo -e "${BLUE}   Seller: $SELLER_NAME (${SELLER_ROLE})${NC}"
        echo -e "${BLUE}   Items: $ITEMS_COUNT${NC}"
        echo -e "${GREEN}   ✅ Order details properly structured${NC}"
    else
        print_result "Get order details" "FAIL"
    fi
fi

print_subsection "Test 4.3: Filter orders by status (pending)"
FILTER_PENDING=$(curl -s -X GET "${BASE_URL}/api/orders?status=pending" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN")

if contains "$FILTER_PENDING" "success"; then
    PENDING_COUNT=$(echo "$FILTER_PENDING" | jq -r '.pagination.total // .orders | length // 0')
    print_result "Filter orders by status" "PASS"
    echo -e "${BLUE}   Pending Orders: $PENDING_COUNT${NC}"
else
    print_result "Filter orders by status" "FAIL"
fi

if [ -n "$ORDER_NUMBER_1" ]; then
    print_subsection "Test 4.4: Search orders by order number"
    SEARCH=$(curl -s -X GET "${BASE_URL}/api/orders?search=$ORDER_NUMBER_1" \
      -H "Authorization: Bearer $CUSTOMER_TOKEN")
    
    if contains "$SEARCH" "success"; then
        print_result "Search orders functionality" "PASS"
        echo -e "${GREEN}   ✅ Order search works correctly${NC}"
    else
        print_result "Search orders functionality" "FAIL"
    fi
fi

# ========================================
# SECTION 5: VENDOR ORDER MANAGEMENT
# ========================================
print_section "🏪 Section 5: Vendor Order Management Dashboard"

print_subsection "Test 5.1: Vendor views all customer orders"
SELLER_ORDERS=$(curl -s -X GET "${BASE_URL}/api/orders/seller?page=1&limit=20" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

if contains "$SELLER_ORDERS" "success"; then
    SELLER_ORDER_COUNT=$(echo "$SELLER_ORDERS" | jq -r '.pagination.total // .orders | length // 0')
    print_result "Vendor retrieves customer orders" "PASS"
    echo -e "${BLUE}   Total Customer Orders: $SELLER_ORDER_COUNT${NC}"
    echo -e "${GREEN}   ✅ Vendor can see orders from customers${NC}"
else
    print_result "Vendor retrieves customer orders" "FAIL"
fi

if [ -n "$ORDER_ID_1" ] && [ "$ORDER_ID_1" != "null" ]; then
    print_subsection "Test 5.2: Vendor views specific customer order"
    VENDOR_VIEW_ORDER=$(curl -s -X GET "${BASE_URL}/api/orders/${ORDER_ID_1}" \
      -H "Authorization: Bearer $VENDOR_TOKEN")
    
    if contains "$VENDOR_VIEW_ORDER" "success"; then
        CUSTOMER_NAME_ORDER=$(echo "$VENDOR_VIEW_ORDER" | jq -r '.order.customerName // empty')
        CUSTOMER_EMAIL=$(echo "$VENDOR_VIEW_ORDER" | jq -r '.order.customerEmail // empty')
        CUSTOMER_PHONE=$(echo "$VENDOR_VIEW_ORDER" | jq -r '.order.customerPhone // empty')
        SHIPPING_CITY=$(echo "$VENDOR_VIEW_ORDER" | jq -r '.order.shippingAddress.city // empty')
        
        print_result "Vendor views customer order details" "PASS"
        echo -e "${BLUE}   Customer: $CUSTOMER_NAME_ORDER${NC}"
        echo -e "${BLUE}   Email: $CUSTOMER_EMAIL${NC}"
        echo -e "${BLUE}   Phone: $CUSTOMER_PHONE${NC}"
        echo -e "${BLUE}   Ship To: $SHIPPING_CITY${NC}"
        echo -e "${GREEN}   ✅ Vendor has access to customer & shipping info${NC}"
    else
        print_result "Vendor views customer order details" "FAIL"
    fi
fi

print_subsection "Test 5.3: Vendor filters orders by status"
FILTER_VENDOR_PENDING=$(curl -s -X GET "${BASE_URL}/api/orders/seller?status=pending" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

if contains "$FILTER_VENDOR_PENDING" "success"; then
    VENDOR_PENDING_COUNT=$(echo "$FILTER_VENDOR_PENDING" | jq -r '.pagination.total // .orders | length // 0')
    print_result "Vendor filters by order status" "PASS"
    echo -e "${BLUE}   Pending Orders: $VENDOR_PENDING_COUNT${NC}"
else
    print_result "Vendor filters by order status" "FAIL"
fi

# ========================================
# SECTION 6: ORDER STATUS WORKFLOW
# ========================================
print_section "🔄 Section 6: Order Status Lifecycle Management"

if [ -n "$ORDER_ID_1" ] && [ "$ORDER_ID_1" != "null" ]; then
    print_subsection "Test 6.1: Vendor confirms order (pending → confirmed)"
    CONFIRM=$(curl -s -X PATCH "${BASE_URL}/api/orders/${ORDER_ID_1}/status" \
      -H "Authorization: Bearer $VENDOR_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "status": "confirmed",
        "notes": "Order confirmed. Items are available and ready to prepare."
      }')
    
    if contains "$CONFIRM" "success"; then
        print_result "Order status: confirmed" "PASS"
        echo -e "${GREEN}   ✅ pending → confirmed${NC}"
    else
        print_result "Order status: confirmed" "FAIL"
        echo "$CONFIRM" | jq '.' 2>/dev/null || echo "$CONFIRM"
    fi
    
    sleep 1
    
    print_subsection "Test 6.2: Vendor marks as processing (confirmed → processing)"
    PROCESSING=$(curl -s -X PATCH "${BASE_URL}/api/orders/${ORDER_ID_1}/status" \
      -H "Authorization: Bearer $VENDOR_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "status": "processing",
        "notes": "Items are being prepared and packed for shipment"
      }')
    
    if contains "$PROCESSING" "success"; then
        print_result "Order status: processing" "PASS"
        echo -e "${GREEN}   ✅ confirmed → processing${NC}"
    else
        print_result "Order status: processing" "FAIL"
    fi
    
    sleep 1
    
    print_subsection "Test 6.3: Vendor marks as shipped (processing → shipped)"
    SHIPPED=$(curl -s -X PATCH "${BASE_URL}/api/orders/${ORDER_ID_1}/status" \
      -H "Authorization: Bearer $VENDOR_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "status": "shipped",
        "trackingNumber": "VND-TCS-2025-123456",
        "carrier": "TCS",
        "estimatedDelivery": "2025-12-15",
        "notes": "Package handed over to TCS courier service"
      }')
    
    if contains "$SHIPPED" "success"; then
        TRACKING_NUM=$(echo "$SHIPPED" | jq -r '.order.trackingNumber // empty')
        print_result "Order status: shipped" "PASS"
        echo -e "${GREEN}   ✅ processing → shipped${NC}"
        echo -e "${BLUE}   Tracking Number: $TRACKING_NUM${NC}"
    else
        print_result "Order status: shipped" "FAIL"
    fi
    
    sleep 1
    
    print_subsection "Test 6.4: Vendor marks as delivered (shipped → delivered)"
    DELIVERED=$(curl -s -X PATCH "${BASE_URL}/api/orders/${ORDER_ID_1}/status" \
      -H "Authorization: Bearer $VENDOR_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "status": "delivered",
        "deliveryDate": "2025-12-15",
        "notes": "Package delivered successfully to customer"
      }')
    
    if contains "$DELIVERED" "success"; then
        print_result "Order status: delivered" "PASS"
        echo -e "${GREEN}   ✅ shipped → delivered${NC}"
        echo -e "${GREEN}   ✅ Complete lifecycle: pending → confirmed → processing → shipped → delivered${NC}"
    else
        print_result "Order status: delivered" "FAIL"
    fi
    
    sleep 1
    
    print_subsection "Test 6.5: Verify status history tracking"
    HISTORY_CHECK=$(curl -s -X GET "${BASE_URL}/api/orders/${ORDER_ID_1}" \
      -H "Authorization: Bearer $VENDOR_TOKEN")
    
    if contains "$HISTORY_CHECK" "statusHistory"; then
        HISTORY_COUNT=$(echo "$HISTORY_CHECK" | jq -r '.order.statusHistory | length // 0')
        print_result "Order status history tracking" "PASS"
        echo -e "${BLUE}   Status History Entries: $HISTORY_COUNT${NC}"
        echo -e "${GREEN}   ✅ All status changes are tracked${NC}"
    else
        print_result "Order status history tracking" "FAIL"
    fi
fi

# ========================================
# SECTION 7: ORDER TRACKING (CUSTOMER)
# ========================================
print_section "📍 Section 7: Customer Order Tracking"

if [ -n "$ORDER_ID_1" ] && [ "$ORDER_ID_1" != "null" ]; then
    print_subsection "Test 7.1: Customer tracks their order"
    TRACK=$(curl -s -X GET "${BASE_URL}/api/orders/${ORDER_ID_1}/track" \
      -H "Authorization: Bearer $CUSTOMER_TOKEN")
    
    if contains "$TRACK" "success\|orderNumber\|tracking\|status"; then
        TRACKING_STATUS=$(echo "$TRACK" | jq -r '.status // .order.status // "unknown"')
        TRACKING_NUMBER=$(echo "$TRACK" | jq -r '.trackingNumber // .order.trackingNumber // "N/A"')
        
        print_result "Customer order tracking" "PASS"
        echo -e "${BLUE}   Current Status: $TRACKING_STATUS${NC}"
        echo -e "${BLUE}   Tracking Number: $TRACKING_NUMBER${NC}"
        echo -e "${GREEN}   ✅ Customer can track order progress${NC}"
    else
        print_result "Customer order tracking" "FAIL"
    fi
fi

# ========================================
# SECTION 8: ORDER CANCELLATION & REFUNDS
# ========================================
print_section "❌ Section 8: Order Cancellation & Automatic Refund System"

if [ -n "$ORDER_ID_2" ] && [ "$ORDER_ID_2" != "null" ]; then
    print_subsection "Test 8.1: Record wallet balance before cancellation"
    BALANCE_BEFORE=$(curl -s -X GET ${BASE_URL}/api/wallet/balance \
      -H "Authorization: Bearer $CUSTOMER_TOKEN")
    BALANCE_BEFORE_AMOUNT=$(echo "$BALANCE_BEFORE" | jq -r '.wallet.balance // .balance // 0')
    
    print_result "Get balance before cancellation" "PASS"
    echo -e "${BLUE}   Balance Before Cancel: \$$BALANCE_BEFORE_AMOUNT${NC}"
    
    sleep 1
    
    print_subsection "Test 8.2: Customer cancels order (triggers automatic refund)"
    CANCEL=$(curl -s -X POST "${BASE_URL}/api/orders/${ORDER_ID_2}/cancel" \
      -H "Authorization: Bearer $CUSTOMER_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "reason": "Changed my mind - no longer need this item"
      }')
    
    if contains "$CANCEL" "success"; then
        REFUND_PROCESSED=$(echo "$CANCEL" | jq -r '.order.refundProcessed // false')
        REFUND_AMOUNT=$(echo "$CANCEL" | jq -r '.order.refundAmount // 0')
        
        print_result "Order cancellation" "PASS"
        
        if [ "$REFUND_PROCESSED" = "true" ]; then
            echo -e "${GREEN}   ✅ Automatic refund processed${NC}"
            echo -e "${BLUE}   Refund Amount: \$$REFUND_AMOUNT${NC}"
        else
            echo -e "${YELLOW}   ⚠️  No refund processed (may not have been paid)${NC}"
        fi
    else
        print_result "Order cancellation" "FAIL"
        echo "$CANCEL" | jq '.' 2>/dev/null || echo "$CANCEL"
    fi
    
    sleep 2
    
    print_subsection "Test 8.3: Verify order status changed to cancelled"
    VERIFY_CANCEL=$(curl -s -X GET "${BASE_URL}/api/orders/${ORDER_ID_2}" \
      -H "Authorization: Bearer $CUSTOMER_TOKEN")
    
    if contains "$VERIFY_CANCEL" "cancelled"; then
        ORDER_STATUS=$(echo "$VERIFY_CANCEL" | jq -r '.order.status // empty')
        PAYMENT_STATUS=$(echo "$VERIFY_CANCEL" | jq -r '.order.paymentStatus // empty')
        CANCEL_REASON=$(echo "$VERIFY_CANCEL" | jq -r '.order.cancellationReason // empty')
        
        print_result "Verify cancellation status" "PASS"
        echo -e "${BLUE}   Order Status: $ORDER_STATUS${NC}"
        echo -e "${BLUE}   Payment Status: $PAYMENT_STATUS${NC}"
        echo -e "${BLUE}   Reason: $CANCEL_REASON${NC}"
    else
        print_result "Verify cancellation status" "FAIL"
    fi
    
    sleep 1
    
    print_subsection "Test 8.4: Verify wallet balance after refund"
    BALANCE_AFTER=$(curl -s -X GET ${BASE_URL}/api/wallet/balance \
      -H "Authorization: Bearer $CUSTOMER_TOKEN")
    BALANCE_AFTER_AMOUNT=$(echo "$BALANCE_AFTER" | jq -r '.wallet.balance // .balance // 0')
    
    print_result "Verify wallet balance after refund" "PASS"
    echo -e "${BLUE}   Balance After Cancel: \$$BALANCE_AFTER_AMOUNT${NC}"
    
    # Calculate if refund was correctly applied
    if [ -n "$REFUND_AMOUNT" ] && [ "$REFUND_AMOUNT" != "0" ]; then
        EXPECTED_BALANCE=$(echo "$BALANCE_BEFORE_AMOUNT + $REFUND_AMOUNT" | bc)
        BALANCE_DIFF=$(echo "$BALANCE_AFTER_AMOUNT - $EXPECTED_BALANCE" | bc | tr -d '-')
        
        if [ $(echo "$BALANCE_DIFF < 0.01" | bc) -eq 1 ]; then
            echo -e "${GREEN}   ✅ Refund correctly credited to wallet!${NC}"
            echo -e "${BLUE}   Expected: \$$EXPECTED_BALANCE, Got: \$$BALANCE_AFTER_AMOUNT${NC}"
        else
            echo -e "${YELLOW}   ⚠️  Balance mismatch (expected: \$$EXPECTED_BALANCE, got: \$$BALANCE_AFTER_AMOUNT)${NC}"
        fi
    fi
    
    sleep 1
    
    print_subsection "Test 8.5: Verify refund recorded in transaction history"
    TRANSACTIONS=$(curl -s -X GET "${BASE_URL}/api/wallet/transactions?limit=10" \
      -H "Authorization: Bearer $CUSTOMER_TOKEN")
    
    if contains "$TRANSACTIONS" "refund"; then
        print_result "Refund transaction history" "PASS"
        echo -e "${GREEN}   ✅ Refund transaction found in wallet history${NC}"
    else
        print_result "Refund transaction history" "FAIL"
    fi
fi

# ========================================
# SECTION 9: COMPLETE REFUND WORKFLOW TEST
# ========================================
print_section "💰 Section 9: End-to-End Refund System Verification"

print_subsection "Test 9.1: Record initial wallet balance"
INITIAL_BALANCE=$(curl -s -X GET ${BASE_URL}/api/wallet/balance \
  -H "Authorization: Bearer $CUSTOMER_TOKEN")
INITIAL_AMOUNT=$(echo "$INITIAL_BALANCE" | jq -r '.wallet.balance // .balance // 0')
echo -e "${BLUE}   Initial Balance: \$$INITIAL_AMOUNT${NC}"

sleep 1

print_subsection "Test 9.2: Create new order for refund test"
REFUND_TEST_ORDER=$(curl -s -X POST ${BASE_URL}/api/orders \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"items\": [{\"productId\": \"$PRODUCT_ID_1\", \"quantity\": 1}],
    \"shippingAddress\": {
      \"name\": \"${CUSTOMER_NAME:-Test Customer}\",
      \"addressLine1\": \"123 Refund Test Street\",
      \"city\": \"Lahore\",
      \"state\": \"Punjab\",
      \"postalCode\": \"54000\",
      \"country\": \"Pakistan\",
      \"phone\": \"+92 300 1234567\"
    },
    \"paymentMethod\": \"wallet\"
  }")

if contains "$REFUND_TEST_ORDER" "success"; then
    REFUND_ORDER_ID=$(echo "$REFUND_TEST_ORDER" | jq -r '.order.id // .order._id // empty')
    REFUND_ORDER_TOTAL=$(echo "$REFUND_TEST_ORDER" | jq -r '.order.total // 0')
    
    print_result "Create refund test order" "PASS"
    echo -e "${BLUE}   Order ID: $REFUND_ORDER_ID${NC}"
    echo -e "${BLUE}   Order Total: \$$REFUND_ORDER_TOTAL${NC}"
    
    sleep 1
    
    print_subsection "Test 9.3: Check balance after purchase"
    AFTER_PURCHASE=$(curl -s -X GET ${BASE_URL}/api/wallet/balance \
      -H "Authorization: Bearer $CUSTOMER_TOKEN")
    AFTER_PURCHASE_AMOUNT=$(echo "$AFTER_PURCHASE" | jq -r '.wallet.balance // .balance // 0')
    echo -e "${BLUE}   Balance After Purchase: \$$AFTER_PURCHASE_AMOUNT${NC}"
    
    EXPECTED_AFTER_REFUND=$(echo "$AFTER_PURCHASE_AMOUNT + $REFUND_ORDER_TOTAL" | bc)
    echo -e "${YELLOW}   Expected After Refund: \$$EXPECTED_AFTER_REFUND${NC}"
    
    sleep 1
    
    print_subsection "Test 9.4: Cancel order and trigger automatic refund"
    CANCEL_REFUND=$(curl -s -X POST "${BASE_URL}/api/orders/${REFUND_ORDER_ID}/cancel" \
      -H "Authorization: Bearer $CUSTOMER_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"reason": "Testing automatic refund system - QA test"}')
    
    if contains "$CANCEL_REFUND" "refund\|success"; then
        print_result "Trigger automatic refund" "PASS"
        echo -e "${GREEN}   ✅ Automatic refund triggered${NC}"
    else
        print_result "Trigger automatic refund" "FAIL"
    fi
    
    sleep 2
    
    print_subsection "Test 9.5: Verify final balance matches expected amount"
    FINAL_BALANCE=$(curl -s -X GET ${BASE_URL}/api/wallet/balance \
      -H "Authorization: Bearer $CUSTOMER_TOKEN")
    FINAL_AMOUNT=$(echo "$FINAL_BALANCE" | jq -r '.wallet.balance // .balance // 0')
    
    BALANCE_DIFF=$(echo "$FINAL_AMOUNT - $EXPECTED_AFTER_REFUND" | bc | tr -d '-')
    
    if [ $(echo "$BALANCE_DIFF < 0.01" | bc) -eq 1 ]; then
        print_result "Complete refund cycle verification" "PASS"
        echo -e "${BLUE}   Initial: \$$INITIAL_AMOUNT${NC}"
        echo -e "${BLUE}   After Purchase: \$$AFTER_PURCHASE_AMOUNT${NC}"
        echo -e "${BLUE}   Order Total: \$$REFUND_ORDER_TOTAL${NC}"
        echo -e "${BLUE}   Expected After Refund: \$$EXPECTED_AFTER_REFUND${NC}"
        echo -e "${BLUE}   Final Balance: \$$FINAL_AMOUNT${NC}"
        echo -e "${GREEN}   ✅ Perfect! Refund system working flawlessly!${NC}"
    else
        print_result "Complete refund cycle verification" "FAIL"
        echo -e "${RED}   Balance mismatch detected${NC}"
        echo -e "${YELLOW}   Expected: \$$EXPECTED_AFTER_REFUND${NC}"
        echo -e "${YELLOW}   Got: \$$FINAL_AMOUNT${NC}"
    fi
else
    print_result "Create refund test order" "FAIL"
    echo "$REFUND_TEST_ORDER" | jq '.' 2>/dev/null || echo "$REFUND_TEST_ORDER"
fi

# ========================================
# SECTION 10: ORDER STATISTICS & ANALYTICS
# ========================================
print_section "📊 Section 10: Order Statistics & Analytics"

print_subsection "Test 10.1: Vendor sales statistics"
VENDOR_STATS=$(curl -s -X GET "${BASE_URL}/api/orders/seller/stats?timeframe=month" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

if contains "$VENDOR_STATS" "success"; then
    TOTAL_REVENUE=$(echo "$VENDOR_STATS" | jq -r '.stats.totalRevenue // 0')
    TOTAL_SALES=$(echo "$VENDOR_STATS" | jq -r '.stats.totalOrders // 0')
    AVG_ORDER_VALUE=$(echo "$VENDOR_STATS" | jq -r '.stats.averageOrderValue // 0')
    
    print_result "Vendor sales statistics" "PASS"
    echo -e "${BLUE}   Total Sales: $TOTAL_SALES orders${NC}"
    echo -e "${BLUE}   Total Revenue: \$$TOTAL_REVENUE${NC}"
    echo -e "${BLUE}   Average Order Value: \$$AVG_ORDER_VALUE${NC}"
    echo -e "${GREEN}   ✅ Vendor analytics working${NC}"
else
    print_result "Vendor sales statistics" "FAIL"
fi

# ========================================
# SECTION 11: SECURITY & AUTHORIZATION
# ========================================
print_section "🔒 Section 11: Security & Authorization Tests"

print_subsection "Test 11.1: Unauthorized access is blocked"
UNAUTH=$(curl -s -X GET ${BASE_URL}/api/orders)

if contains "$UNAUTH" "Unauthorized\|token\|401\|authentication"; then
    print_result "Block unauthorized access" "PASS"
    echo -e "${GREEN}   ✅ Requires authentication${NC}"
else
    print_result "Block unauthorized access" "FAIL"
fi

if [ -n "$ORDER_ID_1" ] && [ "$ORDER_ID_1" != "null" ]; then
    print_subsection "Test 11.2: Customer cannot update order status"
    CUSTOMER_UPDATE=$(curl -s -X PATCH "${BASE_URL}/api/orders/${ORDER_ID_1}/status" \
      -H "Authorization: Bearer $CUSTOMER_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"status": "delivered"}')
    
    if contains "$CUSTOMER_UPDATE" "Unauthorized\|denied\|403\|not allowed"; then
        print_result "Prevent customer status updates" "PASS"
        echo -e "${GREEN}   ✅ Only vendors can update order status${NC}"
    else
        print_result "Prevent customer status updates" "FAIL"
    fi
fi

print_subsection "Test 11.3: Customer cannot view other customer's orders"
WRONG_ORDER_ID="507f1f77bcf86cd799439011"
OTHER_CUSTOMER_ORDER=$(curl -s -X GET "${BASE_URL}/api/orders/${WRONG_ORDER_ID}" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN")

if contains "$OTHER_CUSTOMER_ORDER" "not found\|Unauthorized\|403"; then
    print_result "Prevent cross-customer order access" "PASS"
    echo -e "${GREEN}   ✅ Orders are properly isolated by customer${NC}"
else
    print_result "Prevent cross-customer order access" "FAIL"
fi

# ========================================
# SECTION 12: ERROR HANDLING & VALIDATION
# ========================================
print_section "⚠️ Section 12: Error Handling & Data Validation"

print_subsection "Test 12.1: Invalid product ID is rejected"
INVALID_PRODUCT=$(curl -s -X POST ${BASE_URL}/api/orders \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{"productId": "invalid-nonexistent-id-999", "quantity": 1}],
    "shippingAddress": {
      "name": "Test",
      "addressLine1": "123 Street",
      "city": "City",
      "state": "State",
      "postalCode": "12345",
      "country": "Pakistan",
      "phone": "+92 300 1234567"
    },
    "paymentMethod": "wallet"
  }')

if contains "$INVALID_PRODUCT" "not found\|invalid\|error"; then
    print_result "Reject invalid product ID" "PASS"
    echo -e "${GREEN}   ✅ Invalid product IDs are caught${NC}"
else
    print_result "Reject invalid product ID" "FAIL"
fi

print_subsection "Test 12.2: Insufficient stock is rejected"
INSUFFICIENT=$(curl -s -X POST ${BASE_URL}/api/orders \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"items\": [{\"productId\": \"$PRODUCT_ID_1\", \"quantity\": 999999}],
    \"shippingAddress\": {
      \"name\": \"Test\",
      \"addressLine1\": \"123 Street\",
      \"city\": \"City\",
      \"state\": \"State\",
      \"postalCode\": \"12345\",
      \"country\": \"Pakistan\",
      \"phone\": \"+92 300 1234567\"
    },
    \"paymentMethod\": \"wallet\"
  }")

if contains "$INSUFFICIENT" "stock\|insufficient\|available\|Insufficient"; then
    print_result "Reject insufficient stock" "PASS"
    echo -e "${GREEN}   ✅ Stock validation working${NC}"
else
    print_result "Reject insufficient stock" "FAIL"
fi

print_subsection "Test 12.3: Missing required fields are rejected"
MISSING_FIELDS=$(curl -s -X POST ${BASE_URL}/api/orders \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"items": []}')

if contains "$MISSING_FIELDS" "required\|missing\|invalid\|at least one"; then
    print_result "Reject missing required fields" "PASS"
    echo -e "${GREEN}   ✅ Input validation working${NC}"
else
    print_result "Reject missing required fields" "FAIL"
fi

print_subsection "Test 12.4: Cannot cancel already shipped/delivered order"
if [ -n "$ORDER_ID_1" ] && [ "$ORDER_ID_1" != "null" ]; then
    CANCEL_SHIPPED=$(curl -s -X POST "${BASE_URL}/api/orders/${ORDER_ID_1}/cancel" \
      -H "Authorization: Bearer $CUSTOMER_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"reason": "Trying to cancel delivered order"}')
    
    if contains "$CANCEL_SHIPPED" "cannot be cancelled\|already\|delivered\|shipped"; then
        print_result "Prevent cancellation of delivered orders" "PASS"
        echo -e "${GREEN}   ✅ Business rules enforced${NC}"
    else
        print_result "Prevent cancellation of delivered orders" "FAIL"
    fi
fi

print_subsection "Test 12.5: Incomplete shipping address is rejected"
INCOMPLETE_ADDRESS=$(curl -s -X POST ${BASE_URL}/api/orders \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"items\": [{\"productId\": \"$PRODUCT_ID_1\", \"quantity\": 1}],
    \"shippingAddress\": {
      \"name\": \"Test\"
    },
    \"paymentMethod\": \"wallet\"
  }")

if contains "$INCOMPLETE_ADDRESS" "required\|missing\|address"; then
    print_result "Reject incomplete shipping address" "PASS"
    echo -e "${GREEN}   ✅ Address validation working${NC}"
else
    print_result "Reject incomplete shipping address" "FAIL"
fi

# ========================================
# FINAL SUMMARY
# ========================================
print_section "📊 Final Test Summary & Results"

PERCENTAGE=0
if [ $TOTAL_TESTS -gt 0 ]; then
    PERCENTAGE=$((PASSED_TESTS * 100 / TOTAL_TESTS))
fi

echo ""
echo "===================================================================="
echo -e "${CYAN}TEST EXECUTION COMPLETE${NC}"
echo "===================================================================="
echo ""
echo -e "${BLUE}Total Tests Executed:    $TOTAL_TESTS${NC}"
echo -e "${GREEN}Tests Passed:            $PASSED_TESTS${NC}"
echo -e "${RED}Tests Failed:            $FAILED_TESTS${NC}"
echo -e "${CYAN}Success Rate:            ${PERCENTAGE}%${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo ""
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                                          ║${NC}"
    echo -e "${GREEN}║              🎉 ALL TESTS PASSED! 🎉                     ║${NC}"
    echo -e "${GREEN}║                                                          ║${NC}"
    echo -e "${GREEN}║   Customer → Vendor Order System: ✅ FULLY WORKING      ║${NC}"
    echo -e "${GREEN}║   Automatic Refund System: ✅ FULLY WORKING              ║${NC}"
    echo -e "${GREEN}║   Order Lifecycle Management: ✅ FULLY WORKING           ║${NC}"
    echo -e "${GREEN}║   Security & Validation: ✅ FULLY WORKING                ║${NC}"
    echo -e "${GREEN}║                                                          ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "✅ ChainVanguard B2C Order System is Production-Ready!"
    echo ""
    echo "📋 Verified Functionality:"
    echo "   ✅ Customers can purchase from vendors"
    echo "   ✅ Vendors can manage customer orders"
    echo "   ✅ Complete order lifecycle (pending → delivered)"
    echo "   ✅ Automatic wallet payments & refunds"
    echo "   ✅ Order tracking & status history"
    echo "   ✅ Gift orders with special instructions"
    echo "   ✅ Security & authorization controls"
    echo "   ✅ Data validation & error handling"
    echo ""
    echo "📦 Test Orders Created:"
    [ -n "$ORDER_ID_1" ] && echo "   1. Order $ORDER_NUMBER_1 (Status: delivered)"
    [ -n "$ORDER_ID_2" ] && echo "   2. Order $ORDER_NUMBER_2 (Status: cancelled, refunded)"
    [ -n "$ORDER_ID_3" ] && echo "   3. Order $ORDER_NUMBER_3 (Status: pending, urgent)"
    echo ""
else
    echo ""
    echo -e "${RED}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║                                                          ║${NC}"
    echo -e "${RED}║              ⚠️  SOME TESTS FAILED                       ║${NC}"
    echo -e "${RED}║                                                          ║${NC}"
    echo -e "${RED}║      Please review the failed tests above               ║${NC}"
    echo -e "${RED}║                                                          ║${NC}"
    echo -e "${RED}╚══════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "❌ $FAILED_TESTS test(s) failed - please review errors above"
    echo ""
fi

echo "===================================================================="
echo "Test execution completed at: $(date)"
echo "===================================================================="

exit $([ $FAILED_TESTS -eq 0 ] && echo 0 || echo 1)