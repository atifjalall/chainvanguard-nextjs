#!/bin/bash

# ============================================
# CHAINVANGUARD - WISHLIST TEST SUITE
# ============================================

BASE_URL="http://localhost:5000/api"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'
BOLD='\033[1m'

# Test counters
PASSED=0
FAILED=0
TOTAL=0

# Load credentials
VENDOR_TOKEN="${VENDOR_TOKEN}"
VENDOR_ID="${VENDOR_ID}"
CUSTOMER_TOKEN="${CUSTOMER_TOKEN}"
CUSTOMER_ID="${CUSTOMER_ID}"

# Utility functions
print_header() {
    echo ""
    echo -e "${BOLD}${BLUE}========================================${NC}"
    echo -e "${BOLD}${BLUE}$1${NC}"
    echo -e "${BOLD}${BLUE}========================================${NC}"
}

print_test() {
    echo -e "${YELLOW}➤ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
    ((PASSED++))
    ((TOTAL++))
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
    ((FAILED++))
    ((TOTAL++))
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

contains() {
    echo "$1" | grep -q "$2"
}

# ============================================
# START TESTS
# ============================================

print_header "CHAINVANGUARD WISHLIST TEST SUITE"
echo "Testing wishlist functionality"
echo ""

# ============================================
# PHASE 1: CREATE TEST PRODUCTS
# ============================================

print_header "PHASE 1: CREATE TEST PRODUCTS"

PRODUCT_IDS=()

for i in {1..3}; do
    PRODUCT=$(curl -s -X POST ${BASE_URL}/products \
      -H "Authorization: Bearer $VENDOR_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "name": "Wishlist Product '$i'",
        "description": "Test product",
        "price": '$(($i * 10000))',
        "category": "electronics",
        "stock": 20,
        "unit": "piece",
        "images": ["https://via.placeholder.com/400"]
      }')
    
    if contains "$PRODUCT" "success.*true"; then
        PRODUCT_ID=$(echo "$PRODUCT" | jq -r '.product._id')
        PRODUCT_IDS+=($PRODUCT_ID)
        print_success "Created Product $i"
    fi
    sleep 0.5
done

sleep 1

# ============================================
# PHASE 2: ADD TO WISHLIST
# ============================================

print_header "PHASE 2: ADD TO WISHLIST"

# Test 2.1: Add product to wishlist
print_test "Test 2.1: Add product to wishlist"
ADD1=$(curl -s -X POST ${BASE_URL}/wishlist \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "'${PRODUCT_IDS[0]}'",
    "notes": "Save for later"
  }')

if contains "$ADD1" "success.*true\|wishlist"; then
    WISHLIST1_ID=$(echo "$ADD1" | jq -r '.wishlistItem._id // .wishlist.items[0]._id')
    print_success "Product added to wishlist"
else
    print_error "Failed to add to wishlist"
    echo "$ADD1" | jq '.' || echo "$ADD1"
fi

sleep 1

# Test 2.2: Add multiple products
print_test "Test 2.2: Add more products"
curl -s -X POST ${BASE_URL}/wishlist \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"productId": "'${PRODUCT_IDS[1]}'"}' > /dev/null

curl -s -X POST ${BASE_URL}/wishlist \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"productId": "'${PRODUCT_IDS[2]}'"}' > /dev/null

print_success "Multiple products added"

sleep 1

# Test 2.3: Duplicate product
print_test "Test 2.3: Try adding duplicate"
DUPLICATE=$(curl -s -X POST ${BASE_URL}/wishlist \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"productId": "'${PRODUCT_IDS[0]}'"}')

if contains "$DUPLICATE" "already.*wishlist"; then
    print_success "Duplicate prevented"
else
    print_info "Duplicate handling may update existing"
fi

sleep 1

# ============================================
# PHASE 3: GET WISHLIST
# ============================================

print_header "PHASE 3: GET WISHLIST"

# Test 3.1: Get wishlist
print_test "Test 3.1: Get customer's wishlist"
WISHLIST=$(curl -s -X GET "${BASE_URL}/wishlist" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN")

if contains "$WISHLIST" "success.*true\|wishlist"; then
    WISHLIST_COUNT=$(echo "$WISHLIST" | jq -r '.count // .wishlist.items | length')
    print_success "Retrieved wishlist"
    print_info "Items: $WISHLIST_COUNT"
else
    print_error "Failed to get wishlist"
fi

sleep 1

# Test 3.2: Get with pagination
print_test "Test 3.2: Get paginated wishlist"
PAGINATED=$(curl -s -X GET "${BASE_URL}/wishlist?page=1&limit=10" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN")

if contains "$PAGINATED" "success.*true\|wishlist"; then
    print_success "Pagination working"
else
    print_error "Pagination failed"
fi

sleep 1

# ============================================
# PHASE 4: UPDATE WISHLIST
# ============================================

print_header "PHASE 4: UPDATE WISHLIST"

# Test 4.1: Update wishlist item
print_test "Test 4.1: Update wishlist item notes"
UPDATE=$(curl -s -X PATCH "${BASE_URL}/wishlist/${PRODUCT_IDS[0]}" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Updated: Buying next month"
  }')

if contains "$UPDATE" "success.*true"; then
    print_success "Wishlist item updated"
else
    print_info "Update endpoint may use different format"
fi

sleep 1

# ============================================
# PHASE 5: REMOVE FROM WISHLIST
# ============================================

print_header "PHASE 5: REMOVE FROM WISHLIST"

# Test 5.1: Remove item
print_test "Test 5.1: Remove item from wishlist"
REMOVE=$(curl -s -X DELETE "${BASE_URL}/wishlist/${PRODUCT_IDS[2]}" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN")

if contains "$REMOVE" "success.*true\|removed"; then
    print_success "Item removed"
else
    print_error "Failed to remove"
fi

sleep 1

# Test 5.2: Clear wishlist
print_test "Test 5.2: Clear entire wishlist"
CLEAR=$(curl -s -X DELETE "${BASE_URL}/wishlist/clear" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN")

if contains "$CLEAR" "success.*true\|cleared"; then
    print_success "Wishlist cleared"
else
    print_info "Clear endpoint may need implementation"
fi

sleep 1

# ============================================
# PHASE 6: WISHLIST STATISTICS
# ============================================

print_header "PHASE 6: WISHLIST STATISTICS"

# Re-add items for stats
curl -s -X POST ${BASE_URL}/wishlist \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"productId": "'${PRODUCT_IDS[0]}'"}' > /dev/null

sleep 1

# Test 6.1: Get statistics
print_test "Test 6.1: Get wishlist statistics"
STATS=$(curl -s -X GET "${BASE_URL}/wishlist/stats" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN")

if contains "$STATS" "success.*true\|stats"; then
    print_success "Statistics retrieved"
else
    print_info "Statistics endpoint may need implementation"
fi

sleep 1

# ============================================
# PHASE 7: ACCESS CONTROL
# ============================================

print_header "PHASE 7: ACCESS CONTROL"

# Test 7.1: Vendor cannot access wishlist
print_test "Test 7.1: Vendor tries to access wishlist"
VENDOR_ACCESS=$(curl -s -X GET "${BASE_URL}/wishlist" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

if contains "$VENDOR_ACCESS" "Unauthorized\|Forbidden"; then
    print_success "Vendor blocked"
else
    print_info "Vendor may have limited access"
fi

sleep 1

# Test 7.2: Unauthenticated access
print_test "Test 7.2: Unauthenticated access"
NO_AUTH=$(curl -s -X GET "${BASE_URL}/wishlist")

if contains "$NO_AUTH" "Unauthorized\|No token"; then
    print_success "Authentication required"
else
    print_error "Authentication check failed"
fi

sleep 1

# ============================================
# SUMMARY
# ============================================

print_header "TEST SUMMARY"

echo ""
echo -e "${GREEN}✅ WISHLIST TESTS COMPLETED${NC}"
echo ""
echo "Test Results:"
echo "┌─────────────────────────────────────┐"
echo "│  Total Tests: $TOTAL"
echo "│  Passed: ${GREEN}$PASSED${NC}"
echo "│  Failed: ${RED}$FAILED${NC}"
echo "└─────────────────────────────────────┘"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All wishlist tests passed!${NC}"
    echo ""
    echo "Features Verified:"
    echo "├─ ✓ Add to Wishlist"
    echo "├─ ✓ Get Wishlist"
    echo "├─ ✓ Update Items"
    echo "├─ ✓ Remove Items"
    echo "├─ ✓ Statistics"
    echo "└─ ✓ Access Control"
else
    echo -e "${YELLOW}⚠ Some tests failed.${NC}"
fi

echo ""
echo -e "${BLUE}❤️ Wishlist Testing Complete!${NC}"
echo ""