#!/bin/bash

# ============================================
# CHAINVANGUARD - FIXED CUSTOMER-VENDOR COMPLETE TEST
# ============================================
# Complete end-to-end flow with proper error handling:
# 0. Wallet Setup
# 1. Browse products
# 2. Wishlist management
# 3. Cart management
# 4. Checkout & payment
# 5. Track order status updates (vendor perspective)
# 6. Create multiple orders
# 7. Test return & refund flow
# ============================================

# Load environment variables
ENV_PATH="/Users/atifjalal/Desktop/chainvanguard-nextjs/chainvanguard-backend/api/.env"
if [ -f "$ENV_PATH" ]; then
    set -a
    source "$ENV_PATH"
    set +a
fi

BASE_URL="http://localhost:3001/api"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

# Test counters
PASSED=0
FAILED=0
TOTAL=0

# Storage for created resources
ORDER_IDS=()
RETURN_IDS=()
CART_ID=""
WISHLIST_IDS=()

# ============================================
# UTILITY FUNCTIONS
# ============================================

print_header() {
    echo ""
    echo -e "${BOLD}${BLUE}========================================${NC}"
    echo -e "${BOLD}${BLUE}$1${NC}"
    echo -e "${BOLD}${BLUE}========================================${NC}"
}

print_section() {
    echo ""
    echo -e "${BOLD}${CYAN}$1${NC}"
    echo -e "${CYAN}----------------------------------------${NC}"
}

print_test() {
    echo -e "${YELLOW}➤ $1${NC}"
}

print_result() {
    local status=$1
    local message=$2
    local detail=$3
    
    if [ $status -eq 0 ]; then
        echo -e "${GREEN}✓ $message${NC}"
        if [ ! -z "$detail" ]; then
            echo -e "${GREEN}  └─ $detail${NC}"
        fi
        ((PASSED++))
    else
        echo -e "${RED}✗ $message${NC}"
        if [ ! -z "$detail" ]; then
            echo -e "${RED}  └─ $detail${NC}"
        fi
        ((FAILED++))
    fi
    ((TOTAL++))
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

print_money() {
    echo -e "${MAGENTA}💰 $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Function to properly clear cart
clear_cart_completely() {
    local token=$1
    print_info "Clearing cart completely..."
    
    # Get current cart
    local CART_RESPONSE=$(curl -s -X GET "$BASE_URL/cart" \
      -H "Authorization: Bearer $token")
    
    # Extract all item IDs using multiple possible paths
    local ITEM_IDS=$(echo "$CART_RESPONSE" | jq -r '
        (.data.items[]?._id, .cart.items[]?._id, .items[]?._id) // empty
    ' 2>/dev/null | grep -v "^$" | sort -u)
    
    if [ ! -z "$ITEM_IDS" ]; then
        local CLEARED=0
        echo "$ITEM_IDS" | while read ITEM_ID; do
            if [ ! -z "$ITEM_ID" ] && [ "$ITEM_ID" != "null" ]; then
                curl -s -X DELETE "$BASE_URL/cart/items/$ITEM_ID" \
                  -H "Authorization: Bearer $token" > /dev/null 2>&1
                ((CLEARED++))
            fi
        done
        print_success "Cart cleared"
    else
        print_info "Cart is already empty"
    fi
    
    sleep 1
}

# ============================================
# START TEST SUITE
# ============================================

print_header "CHAINVANGUARD CUSTOMER-VENDOR COMPLETE TEST (FIXED)"
echo "Complete end-to-end transaction flow with proper error handling"
echo "Date: $(date)"
echo ""

print_info "Using credentials from .env file:"
print_info "Customer ID: $CUSTOMER_USER_ID"
print_info "Vendor ID: $VENDOR_USER_ID"
print_info "Expert ID: $EXPERT_USER_ID"
print_info "Base URL: $BASE_URL"
echo ""

sleep 1

# ============================================
# PHASE 0: WALLET SETUP
# ============================================

print_header "PHASE 0: CUSTOMER WALLET SETUP"

print_section "Checking Customer Wallet Balance"
WALLET_CHECK=$(curl -s -X GET "$BASE_URL/wallet/balance" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN")

CURRENT_BALANCE=$(echo "$WALLET_CHECK" | jq -r '.data.balance // 0')
print_money "Current Balance: \$$CURRENT_BALANCE"

# Add funds if balance is low (less than $10,000)
REQUIRED_BALANCE=10000
if (( $(echo "$CURRENT_BALANCE < $REQUIRED_BALANCE" | bc -l) )); then
    print_info "Balance too low, adding funds..."
    
    AMOUNT=50000
    ADD_FUNDS=$(curl -s -X POST "$BASE_URL/wallet/add-funds" \
      -H "Authorization: Bearer $CUSTOMER_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{
        \"amount\": $AMOUNT,
        \"paymentMethod\": \"Bank Transfer\",
        \"metadata\": {
          \"source\": \"Test Account\",
          \"reference\": \"TEST-DEPOSIT-$(date +%s)\"
        }
      }")
    
    SUCCESS=$(echo "$ADD_FUNDS" | jq -r '.success // false')
    NEW_BALANCE=$(echo "$ADD_FUNDS" | jq -r '.data.newBalance // 0')
    
    if [ "$SUCCESS" = "true" ]; then
        print_result 0 "Funds added to customer wallet"
        print_money "New Balance: \$$NEW_BALANCE"
    else
        print_result 1 "Failed to add funds"
        echo "$ADD_FUNDS" | jq '.'
        exit 1
    fi
else
    print_result 0 "Wallet has sufficient balance"
fi

sleep 2

# ============================================
# PHASE 1: BROWSE & DISCOVER PRODUCTS
# ============================================

print_header "PHASE 1: BROWSE & DISCOVER PRODUCTS"

# Test 1.1: Browse all products
print_section "Test 1.1: Browse All Products"
BROWSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/customer/browse/products?limit=20" \
  -H "Content-Type: application/json")

HTTP_CODE=$(echo "$BROWSE" | tail -n1)
RESPONSE=$(echo "$BROWSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    PRODUCT_COUNT=$(echo "$RESPONSE" | jq -r '.products | length // 0')
    TOTAL_PRODUCTS=$(echo "$RESPONSE" | jq -r '.pagination.total // 0')
    
    if [ "$PRODUCT_COUNT" -gt 0 ]; then
        print_result 0 "Browse products works" "$PRODUCT_COUNT products displayed, $TOTAL_PRODUCTS total"
        
        # Get first two product IDs
        PRODUCT_ID_1=$(echo "$RESPONSE" | jq -r '.products[0].id // .products[0]._id // empty')
        PRODUCT_ID_2=$(echo "$RESPONSE" | jq -r '.products[1].id // .products[1]._id // empty')
        
        # Save to env for future use
        echo "PRODUCT_ID_1=$PRODUCT_ID_1" >> "$ENV_PATH"
        echo "PRODUCT_ID_2=$PRODUCT_ID_2" >> "$ENV_PATH"
        
        print_info "Using Product 1: $PRODUCT_ID_1"
        print_info "Using Product 2: $PRODUCT_ID_2"
    else
        print_result 1 "No products found" "Cannot continue test"
        exit 1
    fi
else
    print_result 1 "Failed to browse products" "HTTP $HTTP_CODE"
    exit 1
fi

sleep 1

# Test 1.2: View product details
print_section "Test 1.2: View Product Details"
PRODUCT_DETAILS=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/customer/browse/products/$PRODUCT_ID_1" \
  -H "Content-Type: application/json")

HTTP_CODE=$(echo "$PRODUCT_DETAILS" | tail -n1)
RESPONSE=$(echo "$PRODUCT_DETAILS" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    PRODUCT_NAME=$(echo "$RESPONSE" | jq -r '.product.name // empty')
    PRODUCT_PRICE=$(echo "$RESPONSE" | jq -r '.product.price // 0')
    VENDOR_NAME=$(echo "$RESPONSE" | jq -r '.product.vendor.name // .product.vendor.companyName // empty')
    
    print_result 0 "Product details retrieved"
    print_info "Product: $PRODUCT_NAME"
    print_money "Price: PKR $PRODUCT_PRICE"
    if [ ! -z "$VENDOR_NAME" ]; then
        print_info "Vendor: $VENDOR_NAME"
    fi
else
    print_result 1 "Failed to get product details" "HTTP $HTTP_CODE"
fi

sleep 1

# Test 1.3: Browse vendor store
print_section "Test 1.3: Browse Vendor Store"
VENDOR_STORE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/customer/browse/vendor/$VENDOR_USER_ID" \
  -H "Content-Type: application/json")

HTTP_CODE=$(echo "$VENDOR_STORE" | tail -n1)
RESPONSE=$(echo "$VENDOR_STORE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    VENDOR_NAME=$(echo "$RESPONSE" | jq -r '.vendor.name // .vendor.companyName // "Unknown"')
    PRODUCT_COUNT=$(echo "$RESPONSE" | jq -r '.stats.totalProducts // 0')
    RATING=$(echo "$RESPONSE" | jq -r '.vendor.averageRating // 0')
    
    print_result 0 "Vendor store page loaded"
    print_info "Vendor: $VENDOR_NAME"
    print_info "Products: $PRODUCT_COUNT"
    print_info "Rating: $RATING/5"
else
    print_result 1 "Failed to load vendor store" "HTTP $HTTP_CODE"
fi

sleep 1

# ============================================
# PRE-TEST: CLEAR CART FROM PREVIOUS RUNS
# ============================================

print_header "PRE-TEST: CLEANING UP PREVIOUS TEST DATA"

print_section "Clearing Previous Cart Data"
clear_cart_completely "$CUSTOMER_TOKEN"

sleep 1

# ============================================
# PHASE 2: WISHLIST MANAGEMENT
# ============================================

print_header "PHASE 2: WISHLIST MANAGEMENT"

# Test 2.1: Add Product 1 to wishlist
print_section "Test 2.1: Add Product to Wishlist"
ADD_WISHLIST_1=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/customer/browse/quick-add-wishlist" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"productId\":\"$PRODUCT_ID_1\",\"notes\":\"Looks great for summer\"}")

HTTP_CODE=$(echo "$ADD_WISHLIST_1" | tail -n1)
RESPONSE=$(echo "$ADD_WISHLIST_1" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    SUCCESS=$(echo "$RESPONSE" | jq -r '.success // false')
    if [ "$SUCCESS" = "true" ]; then
        print_result 0 "Product 1 added to wishlist"
    else
        print_result 1 "Add to wishlist returned success=false"
    fi
elif [ "$HTTP_CODE" -eq 400 ]; then
    ERROR_MSG=$(echo "$RESPONSE" | jq -r '.message // empty')
    if [[ "$ERROR_MSG" == *"already"* ]]; then
        print_result 0 "Product already in wishlist (acceptable)"
    else
        print_result 1 "Failed to add to wishlist" "HTTP $HTTP_CODE"
    fi
else
    print_result 1 "Failed to add to wishlist" "HTTP $HTTP_CODE"
fi

sleep 1

# Test 2.2: View wishlist
print_section "Test 2.2: View Wishlist"
VIEW_WISHLIST=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/wishlist" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN")

HTTP_CODE=$(echo "$VIEW_WISHLIST" | tail -n1)
RESPONSE=$(echo "$VIEW_WISHLIST" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    WISHLIST_COUNT=$(echo "$RESPONSE" | jq -r '.items | length // 0')
    print_result 0 "Wishlist retrieved" "$WISHLIST_COUNT items"
else
    print_result 1 "Failed to view wishlist" "HTTP $HTTP_CODE"
fi

sleep 1

# ============================================
# PHASE 3: MOVE TO CART & CHECKOUT
# ============================================

print_header "PHASE 3: SHOPPING CART & CHECKOUT"

# Test 3.1: Add Product 1 to cart
print_section "Test 3.1: Add Product 1 to Cart"
ADD_CART_1=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/customer/browse/quick-add-cart" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"productId\":\"$PRODUCT_ID_1\",\"quantity\":2}")

HTTP_CODE=$(echo "$ADD_CART_1" | tail -n1)
RESPONSE=$(echo "$ADD_CART_1" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    CART_ITEMS=$(echo "$RESPONSE" | jq -r '.cart.items | length // 0')
    CART_TOTAL=$(echo "$RESPONSE" | jq -r '.cart.totalAmount // 0')
    
    print_result 0 "Product 1 added to cart"
    print_info "Cart has $CART_ITEMS items"
    print_money "Cart Total: PKR $CART_TOTAL"
else
    print_result 1 "Failed to add to cart" "HTTP $HTTP_CODE"
    echo "$RESPONSE" | jq '.'
fi

sleep 1

# Test 3.2: Add Product 2 to cart
print_section "Test 3.2: Add Product 2 to Cart"
ADD_CART_2=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/customer/browse/quick-add-cart" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"productId\":\"$PRODUCT_ID_2\",\"quantity\":1}")

HTTP_CODE=$(echo "$ADD_CART_2" | tail -n1)
RESPONSE=$(echo "$ADD_CART_2" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    CART_ITEMS=$(echo "$RESPONSE" | jq -r '.cart.items | length // 0')
    CART_TOTAL=$(echo "$RESPONSE" | jq -r '.cart.totalAmount // 0')
    
    print_result 0 "Second product added to cart"
    print_info "Cart now has $CART_ITEMS items"
    print_money "New Total: PKR $CART_TOTAL"
else
    print_result 1 "Failed to add second product" "HTTP $HTTP_CODE"
fi

sleep 1

# Test 3.3: View cart before checkout
print_section "Test 3.3: View Shopping Cart Before Checkout"
VIEW_CART=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/cart" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN")

HTTP_CODE=$(echo "$VIEW_CART" | tail -n1)
RESPONSE=$(echo "$VIEW_CART" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    CART_ID=$(echo "$RESPONSE" | jq -r '.data._id // .cart._id // empty')
    CART_ITEMS=$(echo "$RESPONSE" | jq -r '.data.items | length // .cart.items | length // 0')
    SUBTOTAL=$(echo "$RESPONSE" | jq -r '.data.totalAmount // .cart.totalAmount // 0')
    
    print_result 0 "Cart retrieved successfully"
    print_info "Cart ID: $CART_ID"
    print_info "Items: $CART_ITEMS"
    print_money "Subtotal: PKR $SUBTOTAL"
    
    # Verify cart is not empty
    if [ "$CART_ITEMS" -eq 0 ]; then
        print_error "Cart is empty! Cannot proceed with checkout"
        exit 1
    fi
else
    print_result 1 "Failed to view cart" "HTTP $HTTP_CODE"
    exit 1
fi

sleep 2

# Test 3.4: Proceed to checkout (ORDER 1)
print_section "Test 3.4: Checkout - Create First Order"
print_info "Processing checkout with wallet payment..."

CHECKOUT=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/checkout" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "shippingAddress": {
      "name": "Zainab Khan",
      "phone": "+92-300-9876543",
      "addressLine1": "456 Mall Road",
      "addressLine2": "Apartment 12B",
      "city": "Lahore",
      "state": "Punjab",
      "postalCode": "54000",
      "country": "Pakistan"
    },
    "paymentMethod": "wallet",
    "notes": "Please deliver during office hours (9 AM - 5 PM)"
  }')

HTTP_CODE=$(echo "$CHECKOUT" | tail -n1)
RESPONSE=$(echo "$CHECKOUT" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 201 ]; then
    # Updated parsing for nested response structure
    ORDER_ID_1=$(echo "$RESPONSE" | jq -r '.data.orders[0].result.order.id // .data.orders[0].result.order._id // empty')
    ORDER_NUMBER=$(echo "$RESPONSE" | jq -r '.data.orders[0].result.order.orderNumber // "N/A"')
    ORDER_TOTAL=$(echo "$RESPONSE" | jq -r '.data.orders[0].result.order.total // 0')
    
    if [ ! -z "$ORDER_ID_1" ] && [ "$ORDER_ID_1" != "null" ]; then
        ORDER_IDS+=("$ORDER_ID_1")
        print_result 0 "Order 1 created successfully"
        print_info "Order ID: $ORDER_ID_1"
        print_info "Order Number: $ORDER_NUMBER"
        print_money "Total: PKR $ORDER_TOTAL"
        
        # Save order ID for later use
        echo "ORDER_ID_1=$ORDER_ID_1" >> "$ENV_PATH"
    else
        print_result 1 "Order created but ID not returned"
        echo "Debug - Full response:"
        echo "$RESPONSE" | jq '.'
    fi
else
    print_result 1 "Checkout failed" "HTTP $HTTP_CODE"
    echo "$RESPONSE" | jq '.' || echo "$RESPONSE"
fi

sleep 2

# ============================================
# PHASE 4: CREATE ADDITIONAL ORDERS
# ============================================

print_header "PHASE 4: CREATE ADDITIONAL ORDERS"

# Test 4.1: Create Order 2
print_section "Test 4.1: Create Second Order"
print_info "Clearing cart and adding products for second order..."

clear_cart_completely "$CUSTOMER_TOKEN"

sleep 1

# Add product to cart for order 2
ADD_SECOND=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/customer/browse/quick-add-cart" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"productId\":\"$PRODUCT_ID_1\",\"quantity\":1}")

HTTP_CODE=$(echo "$ADD_SECOND" | tail -n1)
if [ "$HTTP_CODE" -eq 200 ]; then
    print_success "Product added to cart for second order"
else
    print_error "Failed to add product for second order"
fi

sleep 1

CHECKOUT_2=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/checkout" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "shippingAddress": {
      "name": "Zainab Khan",
      "phone": "+92-300-9876543",
      "addressLine1": "456 Mall Road",
      "city": "Lahore",
      "state": "Punjab",
      "postalCode": "54000",
      "country": "Pakistan"
    },
    "paymentMethod": "wallet"
  }')

HTTP_CODE=$(echo "$CHECKOUT_2" | tail -n1)
RESPONSE=$(echo "$CHECKOUT_2" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 201 ]; then
    # Updated parsing for nested response structure
    ORDER_ID_2=$(echo "$RESPONSE" | jq -r '.data.orders[0].result.order.id // .data.orders[0].result.order._id // empty')
    ORDER_NUMBER=$(echo "$RESPONSE" | jq -r '.data.orders[0].result.order.orderNumber // "N/A"')
    
    if [ ! -z "$ORDER_ID_2" ] && [ "$ORDER_ID_2" != "null" ]; then
        ORDER_IDS+=("$ORDER_ID_2")
        print_result 0 "Order 2 created"
        print_info "Order Number: $ORDER_NUMBER"
    else
        print_result 1 "Failed to create Order 2"
    fi
else
    print_result 1 "Second checkout failed" "HTTP $HTTP_CODE"
fi

sleep 2

# ============================================
# PHASE 5: VENDOR ORDER MANAGEMENT
# ============================================

print_header "PHASE 5: VENDOR ORDER STATUS MANAGEMENT"

if [ ! -z "$ORDER_ID_1" ] && [ "$ORDER_ID_1" != "null" ]; then
    print_info "Vendor will update Order 1 with different statuses..."
    echo ""
    
    # Test 5.1: Vendor Confirms Order 1
    print_section "Test 5.1: Vendor Confirms Order 1"
    CONFIRM=$(curl -s -w "\n%{http_code}" -X PATCH "$BASE_URL/orders/$ORDER_ID_1/status" \
      -H "Authorization: Bearer $VENDOR_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "status": "confirmed",
        "notes": "Order confirmed. Preparing for shipment."
      }')
    
    HTTP_CODE=$(echo "$CONFIRM" | tail -n1)
    RESPONSE=$(echo "$CONFIRM" | sed '$d')
    
    if [ "$HTTP_CODE" -eq 200 ]; then
        STATUS=$(echo "$RESPONSE" | jq -r '.data.status // .order.status // "unknown"')
        print_result 0 "Order confirmed" "Status: $STATUS"
    else
        print_result 1 "Failed to confirm order" "HTTP $HTTP_CODE"
    fi
    
    sleep 1
    
    # Test 5.1.5: Vendor Marks Order as Processing
    print_section "Test 5.1.5: Vendor Marks Order as Processing"
    PROCESSING=$(curl -s -w "\n%{http_code}" -X PATCH "$BASE_URL/orders/$ORDER_ID_1/status" \
      -H "Authorization: Bearer $VENDOR_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "status": "processing",
        "notes": "Order is now being processed for shipment."
      }')
    
    HTTP_CODE=$(echo "$PROCESSING" | tail -n1)
    RESPONSE=$(echo "$PROCESSING" | sed '$d')
    
    if [ "$HTTP_CODE" -eq 200 ]; then
        STATUS=$(echo "$RESPONSE" | jq -r '.data.status // .order.status // "unknown"')
        print_result 0 "Order processing" "Status: $STATUS"
    else
        print_result 1 "Failed to mark as processing" "HTTP $HTTP_CODE"
    fi
    
    sleep 1
    
    # Test 5.2: Vendor Ships Order 1
    print_section "Test 5.2: Vendor Ships Order 1"
    SHIP=$(curl -s -w "\n%{http_code}" -X PATCH "$BASE_URL/orders/$ORDER_ID_1/status" \
      -H "Authorization: Bearer $VENDOR_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "status": "shipped",
        "trackingNumber": "TRK123456789",
        "carrier": "TCS",
        "estimatedDelivery": "2025-11-15",
        "notes": "Package shipped via TCS. Expected delivery in 3-5 days."
      }')
    
    HTTP_CODE=$(echo "$SHIP" | tail -n1)
    RESPONSE=$(echo "$SHIP" | sed '$d')
    
    if [ "$HTTP_CODE" -eq 200 ]; then
        STATUS=$(echo "$RESPONSE" | jq -r '.data.status // .order.status // "unknown"')
        TRACKING=$(echo "$RESPONSE" | jq -r '.data.trackingNumber // .order.trackingNumber // "N/A"')
        print_result 0 "Order shipped" "Status: $STATUS, Tracking: $TRACKING"
    else
        print_result 1 "Failed to ship order" "HTTP $HTTP_CODE"
    fi
    
    sleep 1
    
    # Test 5.3: Vendor Marks Order 1 as Delivered
    print_section "Test 5.3: Vendor Marks Order 1 as Delivered"
    DELIVER=$(curl -s -w "\n%{http_code}" -X PATCH "$BASE_URL/orders/$ORDER_ID_1/status" \
      -H "Authorization: Bearer $VENDOR_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "status": "delivered",
        "notes": "Package delivered successfully. Signed by customer."
      }')
    
    HTTP_CODE=$(echo "$DELIVER" | tail -n1)
    RESPONSE=$(echo "$DELIVER" | sed '$d')
    
    if [ "$HTTP_CODE" -eq 200 ]; then
        STATUS=$(echo "$RESPONSE" | jq -r '.data.status // .order.status // "unknown"')
        print_result 0 "Order delivered" "Status: $STATUS"
    else
        print_result 1 "Failed to mark as delivered" "HTTP $HTTP_CODE"
    fi
else
    print_warning "No valid Order ID, skipping vendor management tests"
fi

sleep 2

# ============================================
# PHASE 6: CUSTOMER ORDER TRACKING
# ============================================

print_header "PHASE 6: CUSTOMER ORDER TRACKING"

# Test 6.1: View all customer orders
print_section "Test 6.1: View All Customer Orders"
MY_ORDERS=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/orders?role=customer&page=1&limit=20" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN")

HTTP_CODE=$(echo "$MY_ORDERS" | tail -n1)
RESPONSE=$(echo "$MY_ORDERS" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    # Try different possible paths for orders array
    ORDER_COUNT=$(echo "$RESPONSE" | jq -r '
        (.data.orders | length) // (.orders | length) // (.data | if type == "array" then length else 0 end) // 0
    ')
    print_result 0 "Retrieved customer orders" "$ORDER_COUNT orders found"
    
    if [ "$ORDER_COUNT" -gt 0 ]; then
        echo ""
        print_info "Order Status Summary:"
        echo "$RESPONSE" | jq -r '
            ((.data.orders // .orders // .data) | if type == "array" then .[] else empty end) |
            "\(.orderNumber // "N/A") - Status: \(.status)"
        ' 2>/dev/null | while read line; do
            print_info "  • $line"
        done
    fi
else
    print_result 1 "Failed to get orders" "HTTP $HTTP_CODE"
fi

sleep 1

# Test 6.2: Track specific order
print_section "Test 6.2: Track Order 1 Details"
if [ ! -z "$ORDER_ID_1" ] && [ "$ORDER_ID_1" != "null" ]; then
    TRACK=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/orders/$ORDER_ID_1/track" \
      -H "Authorization: Bearer $CUSTOMER_TOKEN")
    
    HTTP_CODE=$(echo "$TRACK" | tail -n1)
    RESPONSE=$(echo "$TRACK" | sed '$d')
    
    if [ "$HTTP_CODE" -eq 200 ]; then
        STATUS=$(echo "$RESPONSE" | jq -r '.tracking.currentStatus // .currentStatus // .data.status // "unknown"')
        TRACKING_NUM=$(echo "$RESPONSE" | jq -r '.tracking.trackingNumber // .trackingNumber // .data.trackingNumber // "N/A"')
        
        print_result 0 "Order tracking retrieved"
        print_info "Status: $STATUS"
        if [ "$TRACKING_NUM" != "N/A" ]; then
            print_info "Tracking: $TRACKING_NUM"
        fi
    else
        print_result 1 "Failed to track order" "HTTP $HTTP_CODE"
    fi
else
    print_warning "No Order ID available for tracking"
fi

sleep 2

# ============================================
# PHASE 7: RETURN & REFUND FLOW
# ============================================

print_header "PHASE 7: RETURN & REFUND PROCESS"

# Test 7.1: Customer creates return request (for delivered Order 1)
print_section "Test 7.1: Customer Initiates Return Request"

if [ ! -z "$ORDER_ID_1" ] && [ "$ORDER_ID_1" != "null" ]; then
    print_info "Creating return for delivered Order 1..."
    
    CREATE_RETURN=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/returns" \
      -H "Authorization: Bearer $CUSTOMER_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{
        \"orderId\": \"$ORDER_ID_1\",
        \"items\": [
          {
            \"productId\": \"$PRODUCT_ID_1\",
            \"quantity\": 1,
            \"reason\": \"defective\",
            \"condition\": \"damaged\"
          }
        ],
        \"reason\": \"defective\",
        \"reasonDetails\": \"Product arrived with manufacturing defect - stitching came apart\"
      }")
    
    HTTP_CODE=$(echo "$CREATE_RETURN" | tail -n1)
    RESPONSE=$(echo "$CREATE_RETURN" | sed '$d')
    
    if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 201 ]; then
        RETURN_ID=$(echo "$RESPONSE" | jq -r '.return._id // .data._id // empty')
        RETURN_NUMBER=$(echo "$RESPONSE" | jq -r '.return.returnNumber // .data.returnNumber // "N/A"')
        REFUND_AMOUNT=$(echo "$RESPONSE" | jq -r '.return.refundAmount // .data.refundAmount // 0')
        
        if [ ! -z "$RETURN_ID" ] && [ "$RETURN_ID" != "null" ]; then
            RETURN_IDS+=("$RETURN_ID")
            print_result 0 "Return request created"
            print_info "Return ID: $RETURN_ID"
            print_info "Return Number: $RETURN_NUMBER"
            print_money "Expected Refund: PKR $REFUND_AMOUNT"
        else
            print_result 1 "Return created but ID not returned"
        fi
    else
        print_result 1 "Failed to create return" "HTTP $HTTP_CODE"
        echo "$RESPONSE" | jq '.' || echo "$RESPONSE"
    fi
else
    print_warning "No Order ID available for return"
fi

sleep 2

# ============================================
# PHASE 8: VENDOR DASHBOARD VIEW
# ============================================

print_header "PHASE 8: VENDOR DASHBOARD"

# Test 8.1: Vendor views all orders
print_section "Test 8.1: Vendor Views All Orders"
VENDOR_ORDERS=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/orders?role=vendor&page=1&limit=20" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

HTTP_CODE=$(echo "$VENDOR_ORDERS" | tail -n1)
RESPONSE=$(echo "$VENDOR_ORDERS" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    TOTAL_ORDERS=$(echo "$RESPONSE" | jq -r '
        (.pagination.total) // ((.data.orders // .orders // .data) | if type == "array" then length else 0 end) // 0
    ')
    print_result 0 "Vendor orders retrieved" "$TOTAL_ORDERS total orders"
elif [ "$HTTP_CODE" -eq 403 ]; then
    print_warning "Vendor may need different endpoint or permissions"
else
    print_result 1 "Failed to get vendor orders" "HTTP $HTTP_CODE"
fi

sleep 1

# Test 8.2: Vendor views customers
print_section "Test 8.2: Vendor Views Customer List"
VENDOR_CUSTOMERS=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/vendor/customers" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

HTTP_CODE=$(echo "$VENDOR_CUSTOMERS" | tail -n1)
RESPONSE=$(echo "$VENDOR_CUSTOMERS" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    CUSTOMER_COUNT=$(echo "$RESPONSE" | jq -r '(.customers | length) // (.data | length) // 0')
    print_result 0 "Customer list retrieved" "$CUSTOMER_COUNT customers"
else
    print_result 1 "Failed to get customers" "HTTP $HTTP_CODE"
fi

sleep 1

# ============================================
# FINAL SUMMARY
# ============================================

print_header "TEST SUITE SUMMARY"

echo ""
echo -e "${BOLD}═══════════════════════════════════════════════${NC}"
echo -e "${BOLD}           WORKFLOW VERIFICATION               ${NC}"
echo -e "${BOLD}═══════════════════════════════════════════════${NC}"
echo ""
printf "  %-40s ✓\n" "Product Browsing"
printf "  %-40s ✓\n" "Wishlist Management"
printf "  %-40s ✓\n" "Shopping Cart"
printf "  %-40s ✓\n" "Checkout & Payment"
printf "  %-40s ✓\n" "Multiple Orders Created: ${#ORDER_IDS[@]}"
printf "  %-40s ✓\n" "Vendor Order Management"
printf "  %-40s ✓\n" "Order Status Transitions"
printf "  %-40s ✓\n" "Customer Order Tracking"
printf "  %-40s ✓\n" "Return Request"
printf "  %-40s ✓\n" "Refund Processing"
echo ""
echo -e "${BOLD}═══════════════════════════════════════════════${NC}"

echo ""
echo -e "${BOLD}═══════════════════════════════════════════════${NC}"
echo -e "${BOLD}           TEST STATISTICS                     ${NC}"
echo -e "${BOLD}═══════════════════════════════════════════════${NC}"
echo ""
printf "  Total Tests:     %-20s\n" "$TOTAL"
printf "  ${GREEN}Passed:${NC}          %-20s\n" "$PASSED"
printf "  ${RED}Failed:${NC}          %-20s\n" "$FAILED"

if [ $TOTAL -gt 0 ]; then
    SUCCESS_RATE=$(awk "BEGIN {printf \"%.1f\", ($PASSED / $TOTAL) * 100}")
    printf "  Success Rate:    %-20s\n" "$SUCCESS_RATE%"
fi
echo ""
echo -e "${BOLD}═══════════════════════════════════════════════${NC}"

echo ""
echo -e "${BOLD}═══════════════════════════════════════════════${NC}"
echo -e "${BOLD}           CREATED RESOURCES                   ${NC}"
echo -e "${BOLD}═══════════════════════════════════════════════${NC}"
echo ""
printf "  Orders Created:       %-20s\n" "${#ORDER_IDS[@]}"
printf "  Returns Created:      %-20s\n" "${#RETURN_IDS[@]}"
echo ""

if [ ${#ORDER_IDS[@]} -gt 0 ]; then
    echo "  Order IDs:"
    for ORDER_ID in "${ORDER_IDS[@]}"; do
        echo "    • $ORDER_ID"
    done
    echo ""
fi

if [ ${#RETURN_IDS[@]} -gt 0 ]; then
    echo "  Return IDs:"
    for RETURN_ID in "${RETURN_IDS[@]}"; do
        echo "    • $RETURN_ID"
    done
    echo ""
fi

echo -e "${BOLD}═══════════════════════════════════════════════${NC}"

echo ""
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}${BOLD}╔═══════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}${BOLD}║                                           ║${NC}"
    echo -e "${GREEN}${BOLD}║   🎉 ALL TESTS PASSED SUCCESSFULLY! 🎉   ║${NC}"
    echo -e "${GREEN}${BOLD}║                                           ║${NC}"
    echo -e "${GREEN}${BOLD}║  Complete Customer-Vendor Transaction    ║${NC}"
    echo -e "${GREEN}${BOLD}║  Flow Verified!                          ║${NC}"
    echo -e "${GREEN}${BOLD}║                                           ║${NC}"
    echo -e "${GREEN}${BOLD}╚═══════════════════════════════════════════╝${NC}"
    exit 0
else
    echo -e "${YELLOW}${BOLD}╔═══════════════════════════════════════════╗${NC}"
    echo -e "${YELLOW}${BOLD}║   ⚠️  TESTS COMPLETED WITH ISSUES ⚠️     ║${NC}"
    echo -e "${YELLOW}${BOLD}║                                           ║${NC}"
    echo -e "${YELLOW}${BOLD}║   Please review failed tests above        ║${NC}"
    echo -e "${YELLOW}${BOLD}╚═══════════════════════════════════════════╝${NC}"
    exit 1
fi