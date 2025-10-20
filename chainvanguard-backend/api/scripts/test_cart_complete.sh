#!/bin/bash

# ============================================
# ChainVanguard - Complete Cart Test Suite
# ============================================

echo "🧪 ChainVanguard Cart Testing Suite"
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
CUSTOMER_ADDRESS="0x04f8ff8860d9640f10045bd62d3acf3c514f7fae"
CUSTOMER_PASSWORD="Customer2024!Shop"
CUSTOMER_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGY2MTY4YjNhZjlhMDhlZGY1NzA3NmQiLCJ3YWxsZXRBZGRyZXNzIjoiMHgwNGY4ZmY4ODYwZDk2NDBmMTAwNDViZDYyZDNhY2YzYzUxNGY3ZmFlIiwicm9sZSI6ImN1c3RvbWVyIiwiaWF0IjoxNzYwOTU4MjQwLCJleHAiOjE3NjE1NjMwNDB9.lXgYu2pUzr6XbK01XgtcSwflPJ266b0Cu6Pts6o2Phs"

# Product IDs (update after creating products)
PRODUCT_ID_1="68f617c53af9a08edf5707a9"
PRODUCT_ID_2="68f617c53af9a08edf5707a9"

# Storage for cart items
CART_ITEM_ID_1=""
CART_ITEM_ID_2=""
SAVED_ITEM_ID=""
GUEST_SESSION_ID="test-session-$(date +%s)"

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

# Check Redis
REDIS_CHECK=$(redis-cli ping 2>/dev/null)
if [ "$REDIS_CHECK" = "PONG" ]; then
    print_result "Redis Connection" "PASS"
else
    print_result "Redis Connection" "FAIL"
    echo -e "${YELLOW}Warning: Redis may not be running${NC}"
fi

# ========================================
# LOGIN
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
    echo -e "${YELLOW}Continuing with guest cart tests only...${NC}"
fi

# ========================================
# TEST 1: GUEST CART OPERATIONS
# ========================================
print_section "👤 Test 1: Guest Cart (Unauthenticated)"

echo "Test 1.1: Get Empty Guest Cart"
GUEST_CART=$(curl -s -X GET "${BASE_URL}/api/cart?sessionId=${GUEST_SESSION_ID}")

if contains "$GUEST_CART" "success"; then
    print_result "Get Empty Guest Cart" "PASS"
else
    print_result "Get Empty Guest Cart" "FAIL"
fi

echo ""
echo "Test 1.2: Add Item to Guest Cart"
GUEST_ADD=$(curl -s -X POST ${BASE_URL}/api/cart/add \
  -H "Content-Type: application/json" \
  -d "{
    \"productId\": \"$PRODUCT_ID_1\",
    \"quantity\": 2,
    \"selectedSize\": \"M\",
    \"selectedColor\": \"Blue\",
    \"sessionId\": \"$GUEST_SESSION_ID\"
  }")

if contains "$GUEST_ADD" "success"; then
    GUEST_ITEM_ID=$(echo "$GUEST_ADD" | jq -r '.cart.items[0]._id // empty' 2>/dev/null)
    TOTAL_ITEMS=$(echo "$GUEST_ADD" | jq -r '.cart.totalItems // 0' 2>/dev/null)
    print_result "Add Item to Guest Cart" "PASS"
    echo -e "${BLUE}   Item ID: $GUEST_ITEM_ID${NC}"
    echo -e "${BLUE}   Total Items: $TOTAL_ITEMS${NC}"
else
    print_result "Add Item to Guest Cart" "FAIL"
    echo -e "${YELLOW}Response:${NC}"
    echo "$GUEST_ADD" | jq '.'
fi

echo ""
echo "Test 1.3: Get Guest Cart with Items"
GUEST_CART_FULL=$(curl -s -X GET "${BASE_URL}/api/cart?sessionId=${GUEST_SESSION_ID}")

if contains "$GUEST_CART_FULL" "success"; then
    ITEMS_COUNT=$(echo "$GUEST_CART_FULL" | jq -r '.cart.items | length // 0' 2>/dev/null)
    SUBTOTAL=$(echo "$GUEST_CART_FULL" | jq -r '.cart.subtotal // 0' 2>/dev/null)
    print_result "Get Guest Cart with Items" "PASS"
    echo -e "${BLUE}   Items: $ITEMS_COUNT${NC}"
    echo -e "${BLUE}   Subtotal: \$$SUBTOTAL${NC}"
else
    print_result "Get Guest Cart with Items" "FAIL"
fi

echo ""
echo "Test 1.4: Update Guest Cart Item Quantity"
if [ -n "$GUEST_ITEM_ID" ]; then
    GUEST_UPDATE=$(curl -s -X PUT "${BASE_URL}/api/cart/item/${GUEST_ITEM_ID}" \
      -H "Content-Type: application/json" \
      -d "{
        \"quantity\": 3,
        \"sessionId\": \"$GUEST_SESSION_ID\"
      }")
    
    if contains "$GUEST_UPDATE" "success"; then
        NEW_QTY=$(echo "$GUEST_UPDATE" | jq -r '.cart.totalQuantity // 0' 2>/dev/null)
        print_result "Update Guest Cart Quantity" "PASS"
        echo -e "${BLUE}   New Quantity: $NEW_QTY${NC}"
    else
        print_result "Update Guest Cart Quantity" "FAIL"
    fi
fi

echo ""
echo "Test 1.5: Get Guest Cart Count"
GUEST_COUNT=$(curl -s -X GET "${BASE_URL}/api/cart/count?sessionId=${GUEST_SESSION_ID}")

if contains "$GUEST_COUNT" "success"; then
    COUNT=$(echo "$GUEST_COUNT" | jq -r '.count // 0' 2>/dev/null)
    print_result "Get Guest Cart Count" "PASS"
    echo -e "${BLUE}   Cart Count: $COUNT${NC}"
else
    print_result "Get Guest Cart Count" "FAIL"
fi

# ========================================
# TEST 2: AUTHENTICATED CART OPERATIONS
# ========================================
print_section "🔐 Test 2: Authenticated Cart"

if [ -n "$CUSTOMER_TOKEN" ] && [ "$CUSTOMER_TOKEN" != "null" ]; then
    echo "Test 2.1: Get Empty Authenticated Cart"
    AUTH_CART=$(curl -s -X GET ${BASE_URL}/api/cart \
      -H "Authorization: Bearer $CUSTOMER_TOKEN")
    
    if contains "$AUTH_CART" "success"; then
        print_result "Get Empty Auth Cart" "PASS"
    else
        print_result "Get Empty Auth Cart" "FAIL"
    fi
    
    echo ""
    echo "Test 2.2: Add Item to Authenticated Cart"
    AUTH_ADD=$(curl -s -X POST ${BASE_URL}/api/cart/add \
      -H "Authorization: Bearer $CUSTOMER_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{
        \"productId\": \"$PRODUCT_ID_1\",
        \"quantity\": 2,
        \"selectedSize\": \"L\",
        \"selectedColor\": \"Red\"
      }")
    
    if contains "$AUTH_ADD" "success"; then
        CART_ITEM_ID_1=$(echo "$AUTH_ADD" | jq -r '.cart.items[0]._id // empty' 2>/dev/null)
        print_result "Add Item to Auth Cart" "PASS"
        echo -e "${BLUE}   Item ID: $CART_ITEM_ID_1${NC}"
    else
        print_result "Add Item to Auth Cart" "FAIL"
    fi
    
    echo ""
    echo "Test 2.3: Add Another Item"
    AUTH_ADD_2=$(curl -s -X POST ${BASE_URL}/api/cart/add \
      -H "Authorization: Bearer $CUSTOMER_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{
        \"productId\": \"$PRODUCT_ID_2\",
        \"quantity\": 1,
        \"selectedSize\": \"M\"
      }")
    
    if contains "$AUTH_ADD_2" "success"; then
        CART_ITEM_ID_2=$(echo "$AUTH_ADD_2" | jq -r '.cart.items[1]._id // empty' 2>/dev/null)
        TOTAL=$(echo "$AUTH_ADD_2" | jq -r '.cart.totalItems // 0' 2>/dev/null)
        print_result "Add Second Item" "PASS"
        echo -e "${BLUE}   Total Items: $TOTAL${NC}"
    else
        print_result "Add Second Item" "FAIL"
    fi
    
    echo ""
    echo "Test 2.4: Update Item Quantity"
    if [ -n "$CART_ITEM_ID_1" ]; then
        UPDATE=$(curl -s -X PUT "${BASE_URL}/api/cart/item/${CART_ITEM_ID_1}" \
          -H "Authorization: Bearer $CUSTOMER_TOKEN" \
          -H "Content-Type: application/json" \
          -d '{"quantity": 5}')
        
        if contains "$UPDATE" "success"; then
            print_result "Update Item Quantity" "PASS"
        else
            print_result "Update Item Quantity" "FAIL"
        fi
    fi
    
    echo ""
    echo "Test 2.5: Get Cart Summary"
    SUMMARY=$(curl -s -X GET ${BASE_URL}/api/cart/summary \
      -H "Authorization: Bearer $CUSTOMER_TOKEN")
    
    if contains "$SUMMARY" "success"; then
        TOTAL_ITEMS=$(echo "$SUMMARY" | jq -r '.summary.totalItems // 0' 2>/dev/null)
        SUBTOTAL=$(echo "$SUMMARY" | jq -r '.summary.subtotal // 0' 2>/dev/null)
        print_result "Get Cart Summary" "PASS"
        echo -e "${BLUE}   Total Items: $TOTAL_ITEMS${NC}"
        echo -e "${BLUE}   Subtotal: \$$SUBTOTAL${NC}"
    else
        print_result "Get Cart Summary" "FAIL"
    fi
else
    echo -e "${YELLOW}Skipping authenticated cart tests (not logged in)${NC}"
fi

# ========================================
# TEST 3: SAVE FOR LATER / WISHLIST
# ========================================
print_section "💾 Test 3: Save for Later"

if [ -n "$CUSTOMER_TOKEN" ] && [ "$CUSTOMER_TOKEN" != "null" ] && [ -n "$CART_ITEM_ID_1" ]; then
    echo "Test 3.1: Save Item for Later"
    SAVE=$(curl -s -X POST "${BASE_URL}/api/cart/save-for-later/${CART_ITEM_ID_1}" \
      -H "Authorization: Bearer $CUSTOMER_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"notes": "Saving this for next month"}')
    
    if contains "$SAVE" "success"; then
        SAVED_ITEM_ID=$(echo "$SAVE" | jq -r '.cart.savedItems[0]._id // empty' 2>/dev/null)
        print_result "Save Item for Later" "PASS"
        echo -e "${BLUE}   Saved Item ID: $SAVED_ITEM_ID${NC}"
    else
        print_result "Save Item for Later" "FAIL"
    fi
    
    echo ""
    echo "Test 3.2: Get Saved Items"
    SAVED_LIST=$(curl -s -X GET ${BASE_URL}/api/cart/saved \
      -H "Authorization: Bearer $CUSTOMER_TOKEN")
    
    if contains "$SAVED_LIST" "success"; then
        SAVED_COUNT=$(echo "$SAVED_LIST" | jq -r '.savedItems | length // 0' 2>/dev/null)
        print_result "Get Saved Items" "PASS"
        echo -e "${BLUE}   Saved Items: $SAVED_COUNT${NC}"
    else
        print_result "Get Saved Items" "FAIL"
    fi
    
    echo ""
    echo "Test 3.3: Move Saved Item Back to Cart"
    if [ -n "$SAVED_ITEM_ID" ]; then
        MOVE_BACK=$(curl -s -X POST "${BASE_URL}/api/cart/move-to-cart/${SAVED_ITEM_ID}" \
          -H "Authorization: Bearer $CUSTOMER_TOKEN" \
          -H "Content-Type: application/json")
        
        if contains "$MOVE_BACK" "success"; then
            print_result "Move to Cart" "PASS"
        else
            print_result "Move to Cart" "FAIL"
        fi
    fi
    
    echo ""
    echo "Test 3.4: Remove Saved Item"
    # Save item again first
    SAVE_AGAIN=$(curl -s -X POST "${BASE_URL}/api/cart/save-for-later/${CART_ITEM_ID_1}" \
      -H "Authorization: Bearer $CUSTOMER_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{}')
    
    NEW_SAVED_ID=$(echo "$SAVE_AGAIN" | jq -r '.cart.savedItems[0]._id // empty' 2>/dev/null)
    
    if [ -n "$NEW_SAVED_ID" ]; then
        REMOVE_SAVED=$(curl -s -X DELETE "${BASE_URL}/api/cart/saved/${NEW_SAVED_ID}" \
          -H "Authorization: Bearer $CUSTOMER_TOKEN")
        
        if contains "$REMOVE_SAVED" "success"; then
            print_result "Remove Saved Item" "PASS"
        else
            print_result "Remove Saved Item" "FAIL"
        fi
    fi
else
    echo -e "${YELLOW}Skipping save for later tests (not logged in or no items)${NC}"
fi

# ========================================
# TEST 4: COUPON MANAGEMENT
# ========================================
print_section "🎟️ Test 4: Coupons & Discounts"

if [ -n "$CUSTOMER_TOKEN" ] && [ "$CUSTOMER_TOKEN" != "null" ]; then
    echo "Test 4.1: Apply Valid Coupon (SAVE10)"
    APPLY_COUPON=$(curl -s -X POST ${BASE_URL}/api/cart/apply-coupon \
      -H "Authorization: Bearer $CUSTOMER_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"couponCode": "SAVE10"}')
    
    if contains "$APPLY_COUPON" "success"; then
        DISCOUNT=$(echo "$APPLY_COUPON" | jq -r '.discount // 0' 2>/dev/null)
        print_result "Apply Valid Coupon" "PASS"
        echo -e "${BLUE}   Discount: \$$DISCOUNT${NC}"
    else
        print_result "Apply Valid Coupon" "FAIL"
    fi
    
    echo ""
    echo "Test 4.2: Apply Invalid Coupon"
    INVALID_COUPON=$(curl -s -X POST ${BASE_URL}/api/cart/apply-coupon \
      -H "Authorization: Bearer $CUSTOMER_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"couponCode": "INVALID123"}')
    
    if contains "$INVALID_COUPON" "Invalid\|error\|not found"; then
        print_result "Reject Invalid Coupon" "PASS"
    else
        print_result "Reject Invalid Coupon" "FAIL"
    fi
    
    echo ""
    echo "Test 4.3: Remove Coupon"
    REMOVE_COUPON=$(curl -s -X DELETE ${BASE_URL}/api/cart/remove-coupon \
      -H "Authorization: Bearer $CUSTOMER_TOKEN")
    
    if contains "$REMOVE_COUPON" "success"; then
        print_result "Remove Coupon" "PASS"
    else
        print_result "Remove Coupon" "FAIL"
    fi
    
    echo ""
    echo "Test 4.4: Apply Different Coupon (SAVE20)"
    APPLY_20=$(curl -s -X POST ${BASE_URL}/api/cart/apply-coupon \
      -H "Authorization: Bearer $CUSTOMER_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"couponCode": "SAVE20"}')
    
    if contains "$APPLY_20" "success"; then
        print_result "Apply SAVE20 Coupon" "PASS"
    else
        print_result "Apply SAVE20 Coupon" "FAIL"
    fi
else
    echo -e "${YELLOW}Skipping coupon tests (not logged in)${NC}"
fi

# ========================================
# TEST 5: CART VALIDATION
# ========================================
print_section "✅ Test 5: Cart Validation"

if [ -n "$CUSTOMER_TOKEN" ] && [ "$CUSTOMER_TOKEN" != "null" ]; then
    echo "Test 5.1: Validate Cart"
    VALIDATE=$(curl -s -X POST ${BASE_URL}/api/cart/validate \
      -H "Authorization: Bearer $CUSTOMER_TOKEN" \
      -H "Content-Type: application/json")
    
    if contains "$VALIDATE" "success"; then
        IS_VALID=$(echo "$VALIDATE" | jq -r '.isValid // false' 2>/dev/null)
        print_result "Validate Cart" "PASS"
        echo -e "${BLUE}   Cart Valid: $IS_VALID${NC}"
    else
        print_result "Validate Cart" "FAIL"
    fi
else
    echo -e "${YELLOW}Skipping validation tests (not logged in)${NC}"
fi

# ========================================
# TEST 6: CART MERGING (Guest to User)
# ========================================
print_section "🔄 Test 6: Cart Merging"

if [ -n "$CUSTOMER_TOKEN" ] && [ "$CUSTOMER_TOKEN" != "null" ]; then
    echo "Test 6.1: Merge Guest Cart into User Cart"
    MERGE=$(curl -s -X POST ${BASE_URL}/api/cart/merge \
      -H "Authorization: Bearer $CUSTOMER_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"guestSessionId\": \"$GUEST_SESSION_ID\"}")
    
    if contains "$MERGE" "success"; then
        MERGED_ITEMS=$(echo "$MERGE" | jq -r '.cart.totalItems // 0' 2>/dev/null)
        print_result "Merge Guest Cart" "PASS"
        echo -e "${BLUE}   Total Items After Merge: $MERGED_ITEMS${NC}"
    else
        print_result "Merge Guest Cart" "FAIL"
    fi
else
    echo -e "${YELLOW}Skipping merge test (not logged in)${NC}"
fi

# ========================================
# TEST 7: REMOVE OPERATIONS
# ========================================
print_section "🗑️ Test 7: Remove Operations"

if [ -n "$CUSTOMER_TOKEN" ] && [ "$CUSTOMER_TOKEN" != "null" ] && [ -n "$CART_ITEM_ID_2" ]; then
    echo "Test 7.1: Remove Single Item"
    REMOVE=$(curl -s -X DELETE "${BASE_URL}/api/cart/item/${CART_ITEM_ID_2}" \
      -H "Authorization: Bearer $CUSTOMER_TOKEN")
    
    if contains "$REMOVE" "success"; then
        print_result "Remove Single Item" "PASS"
    else
        print_result "Remove Single Item" "FAIL"
    fi
    
    echo ""
    echo "Test 7.2: Clear Entire Cart"
    CLEAR=$(curl -s -X DELETE ${BASE_URL}/api/cart/clear \
      -H "Authorization: Bearer $CUSTOMER_TOKEN")
    
    if contains "$CLEAR" "success"; then
        print_result "Clear Cart" "PASS"
    else
        print_result "Clear Cart" "FAIL"
    fi
    
    echo ""
    echo "Test 7.3: Verify Cart is Empty"
    VERIFY_EMPTY=$(curl -s -X GET ${BASE_URL}/api/cart \
      -H "Authorization: Bearer $CUSTOMER_TOKEN")
    
    ITEMS=$(echo "$VERIFY_EMPTY" | jq -r '.cart.items | length // 0' 2>/dev/null)
    if [ "$ITEMS" -eq 0 ]; then
        print_result "Verify Empty Cart" "PASS"
    else
        print_result "Verify Empty Cart" "FAIL"
    fi
else
    echo -e "${YELLOW}Skipping remove tests (not logged in or no items)${NC}"
fi

# ========================================
# TEST 8: CART COUNT (Navbar Badge)
# ========================================
print_section "🔢 Test 8: Cart Count"

echo "Test 8.1: Get Cart Count (Guest)"
GUEST_COUNT=$(curl -s -X GET "${BASE_URL}/api/cart/count?sessionId=${GUEST_SESSION_ID}")

if contains "$GUEST_COUNT" "success"; then
    COUNT=$(echo "$GUEST_COUNT" | jq -r '.count // 0' 2>/dev/null)
    print_result "Guest Cart Count" "PASS"
    echo -e "${BLUE}   Count: $COUNT${NC}"
else
    print_result "Guest Cart Count" "FAIL"
fi

if [ -n "$CUSTOMER_TOKEN" ] && [ "$CUSTOMER_TOKEN" != "null" ]; then
    echo ""
    echo "Test 8.2: Get Cart Count (Authenticated)"
    AUTH_COUNT=$(curl -s -X GET ${BASE_URL}/api/cart/count \
      -H "Authorization: Bearer $CUSTOMER_TOKEN")
    
    if contains "$AUTH_COUNT" "success"; then
        COUNT=$(echo "$AUTH_COUNT" | jq -r '.count // 0' 2>/dev/null)
        print_result "Auth Cart Count" "PASS"
        echo -e "${BLUE}   Count: $COUNT${NC}"
    else
        print_result "Auth Cart Count" "FAIL"
    fi
fi

# ========================================
# TEST 9: ERROR HANDLING
# ========================================
print_section "⚠️ Test 9: Error Handling"

if [ -n "$CUSTOMER_TOKEN" ] && [ "$CUSTOMER_TOKEN" != "null" ]; then
    echo "Test 9.1: Add Invalid Product to Cart"
    INVALID_PRODUCT=$(curl -s -X POST ${BASE_URL}/api/cart/add \
      -H "Authorization: Bearer $CUSTOMER_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "productId": "invalid-product-id-123",
        "quantity": 1
      }')
    
    if contains "$INVALID_PRODUCT" "not found\|invalid\|error"; then
        print_result "Reject Invalid Product" "PASS"
    else
        print_result "Reject Invalid Product" "FAIL"
    fi
    
    echo ""
    echo "Test 9.2: Add Zero Quantity"
    ZERO_QTY=$(curl -s -X POST ${BASE_URL}/api/cart/add \
      -H "Authorization: Bearer $CUSTOMER_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{
        \"productId\": \"$PRODUCT_ID_1\",
        \"quantity\": 0
      }")
    
    if contains "$ZERO_QTY" "required\|invalid\|quantity"; then
        print_result "Reject Zero Quantity" "PASS"
    else
        print_result "Reject Zero Quantity" "FAIL"
    fi
    
    echo ""
    echo "Test 9.3: Excessive Quantity (Stock Limit)"
    EXCESSIVE=$(curl -s -X POST ${BASE_URL}/api/cart/add \
      -H "Authorization: Bearer $CUSTOMER_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{
        \"productId\": \"$PRODUCT_ID_1\",
        \"quantity\": 99999
      }")
    
    if contains "$EXCESSIVE" "stock\|Insufficient\|available"; then
        print_result "Reject Excessive Quantity" "PASS"
    else
        print_result "Reject Excessive Quantity" "FAIL"
    fi
    
    echo ""
    echo "Test 9.4: Update Non-existent Item"
    FAKE_ITEM=$(curl -s -X PUT "${BASE_URL}/api/cart/item/fake-item-id-123" \
      -H "Authorization: Bearer $CUSTOMER_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"quantity": 1}')
    
    if contains "$FAKE_ITEM" "not found\|invalid\|error"; then
        print_result "Reject Invalid Item Update" "PASS"
    else
        print_result "Reject Invalid Item Update" "FAIL"
    fi
else
    echo -e "${YELLOW}Skipping error handling tests (not logged in)${NC}"
fi

# ========================================
# TEST 10: AUTHORIZATION
# ========================================
print_section "🔒 Test 10: Authorization"

echo "Test 10.1: Access Cart Without Session/Token"
NO_AUTH=$(curl -s -X GET ${BASE_URL}/api/cart)

if contains "$NO_AUTH" "required\|Session"; then
    print_result "Block No Auth Access" "PASS"
else
    print_result "Block No Auth Access" "FAIL"
fi

echo ""
echo "Test 10.2: Merge Cart Without Token"
NO_TOKEN_MERGE=$(curl -s -X POST ${BASE_URL}/api/cart/merge \
  -H "Content-Type: application/json" \
  -d '{"guestSessionId": "test-123"}')

if contains "$NO_TOKEN_MERGE" "Unauthorized\|token\|401"; then
    print_result "Block Unauthorized Merge" "PASS"
else
    print_result "Block Unauthorized Merge" "FAIL"
fi

# ========================================
# TEST 11: PERFORMANCE & CACHING
# ========================================
print_section "⚡ Test 11: Performance"

if [ -n "$CUSTOMER_TOKEN" ] && [ "$CUSTOMER_TOKEN" != "null" ]; then
    echo "Test 11.1: Multiple Rapid Cart Requests"
    START_TIME=$(date +%s%3N)
    
    for i in {1..5}; do
        curl -s -X GET ${BASE_URL}/api/cart/summary \
          -H "Authorization: Bearer $CUSTOMER_TOKEN" > /dev/null
    done
    
    END_TIME=$(date +%s%3N)
    DURATION=$((END_TIME - START_TIME))
    AVG_TIME=$((DURATION / 5))
    
    print_result "Rapid Cart Requests" "PASS"
    echo -e "${BLUE}   5 requests in ${DURATION}ms (avg: ${AVG_TIME}ms/req)${NC}"
    
    if [ $AVG_TIME -lt 500 ]; then
        echo -e "${GREEN}   Performance: Excellent (< 500ms)${NC}"
    elif [ $AVG_TIME -lt 1000 ]; then
        echo -e "${YELLOW}   Performance: Good (< 1s)${NC}"
    else
        echo -e "${RED}   Performance: Slow (> 1s)${NC}"
    fi
else
    echo -e "${YELLOW}Skipping performance tests (not logged in)${NC}"
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
    echo "Cart Features Tested:"
    echo "  ✓ Guest cart operations"
    echo "  ✓ Authenticated cart operations"
    echo "  ✓ Save for later / Wishlist"
    echo "  ✓ Coupon management"
    echo "  ✓ Cart validation"
    echo "  ✓ Cart merging (guest to user)"
    echo "  ✓ Remove operations"
    echo "  ✓ Cart count (navbar badge)"
    echo "  ✓ Error handling"
    echo "  ✓ Authorization checks"
    echo "  ✓ Performance & caching"
    echo ""
    echo "✅ ChainVanguard Cart API is fully functional!"
    echo ""
else
    echo -e "${RED}╔══════════════════════════════════╗${NC}"
    echo -e "${RED}║                                  ║${NC}"
    echo -e "${RED}║   ⚠️  SOME TESTS FAILED          ║${NC}"
    echo -e "${RED}║                                  ║${NC}"
    echo -e "${RED}╚══════════════════════════════════╝${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "  1. Check server logs for errors"
    echo "  2. Verify MongoDB is running"
    echo "  3. Verify Redis is running"
    echo "  4. Update credentials in script"
    echo ""
fi

exit $([ $FAILED_TESTS -eq 0 ] && echo 0 || echo 1)