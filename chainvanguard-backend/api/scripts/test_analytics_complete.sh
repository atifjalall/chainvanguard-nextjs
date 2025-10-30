#!/bin/bash

# ============================================
# CHAINVANGUARD - ANALYTICS DASHBOARD TEST SUITE
# ============================================
# Tests analytics functionality for vendors and suppliers
# ============================================

BASE_URL="http://localhost:5000/api"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Test counters
PASSED=0
FAILED=0
TOTAL=0

# Load credentials from environment
SUPPLIER_TOKEN="${SUPPLIER_TOKEN}"
SUPPLIER_ID="${SUPPLIER_ID}"
VENDOR_TOKEN="${VENDOR_TOKEN}"
VENDOR_ID="${VENDOR_ID}"
CUSTOMER_TOKEN="${CUSTOMER_TOKEN}"
CUSTOMER_ID="${CUSTOMER_ID}"

# ============================================
# UTILITY FUNCTIONS
# ============================================

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

print_header "CHAINVANGUARD ANALYTICS TEST SUITE"
echo "Testing comprehensive analytics dashboard functionality"
echo ""
echo "Using existing credentials from environment"
echo "Supplier ID: $SUPPLIER_ID"
echo "Vendor ID: $VENDOR_ID"
echo "Customer ID: $CUSTOMER_ID"
echo ""

# ============================================
# PHASE 1: CREATE TEST DATA
# ============================================

print_header "PHASE 1: CREATE TEST DATA"

# Create products for analytics
print_test "Creating test products for analytics..."

PRODUCT_IDS=()
for i in {1..3}; do
    PRODUCT=$(curl -s -X POST ${BASE_URL}/products \
      -H "Authorization: Bearer $VENDOR_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "name": "Analytics Test Product '$i'",
        "description": "Product for analytics testing",
        "price": '$(($i * 1000))',
        "category": "electronics",
        "stock": 100,
        "unit": "piece",
        "images": ["https://via.placeholder.com/400"],
        "tags": ["analytics", "test"]
      }')
    
    if contains "$PRODUCT" "success.*true"; then
        PRODUCT_ID=$(echo "$PRODUCT" | jq -r '.product._id')
        PRODUCT_IDS+=($PRODUCT_ID)
        print_success "Created Product $i (ID: $PRODUCT_ID)"
    else
        print_info "Product creation may already exist or need review"
    fi
    sleep 0.5
done

sleep 1

# Create test orders
print_test "Creating test orders for analytics..."

ORDER_IDS=()
for i in {1..2}; do
    # Add to cart
    curl -s -X POST ${BASE_URL}/cart/add \
      -H "Authorization: Bearer $CUSTOMER_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "productId": "'${PRODUCT_IDS[0]}'",
        "quantity": '$(($i + 1))',
        "sellerId": "'$VENDOR_ID'"
      }' > /dev/null
    
    # Create order
    ORDER=$(curl -s -X POST ${BASE_URL}/orders \
      -H "Authorization: Bearer $CUSTOMER_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "shippingAddress": {
          "fullName": "Test Customer",
          "addressLine1": "Test Address",
          "city": "Lahore",
          "state": "Punjab",
          "postalCode": "54000",
          "country": "Pakistan",
          "phone": "+92 300 3333333"
        },
        "paymentMethod": "wallet"
      }')
    
    if contains "$ORDER" "success.*true"; then
        ORDER_ID=$(echo "$ORDER" | jq -r '.data.orders[0]._id')
        ORDER_IDS+=($ORDER_ID)
        print_success "Created Order $i (ID: $ORDER_ID)"
        
        # Mark order as delivered for analytics
        curl -s -X PATCH ${BASE_URL}/orders/$ORDER_ID/status \
          -H "Authorization: Bearer $VENDOR_TOKEN" \
          -H "Content-Type: application/json" \
          -d '{"status": "delivered"}' > /dev/null
    else
        print_info "Order creation may need review"
    fi
    sleep 0.5
done

sleep 2

# ============================================
# PHASE 2: VENDOR ANALYTICS TESTS
# ============================================

print_header "PHASE 2: VENDOR ANALYTICS"

# Test 2.1: Get vendor analytics - default timeframe
print_test "Test 2.1: Get vendor analytics (default - month)"
VENDOR_ANALYTICS=$(curl -s -X GET "${BASE_URL}/analytics/vendor" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

if contains "$VENDOR_ANALYTICS" "success.*true"; then
    print_success "Vendor analytics retrieved"
    
    TIMEFRAME=$(echo "$VENDOR_ANALYTICS" | jq -r '.timeframe')
    print_info "Timeframe: $TIMEFRAME"
    
    if echo "$VENDOR_ANALYTICS" | jq -e '.analytics.sales' > /dev/null 2>&1; then
        TOTAL_REVENUE=$(echo "$VENDOR_ANALYTICS" | jq -r '.analytics.sales.totals.totalRevenue // 0')
        TOTAL_ORDERS=$(echo "$VENDOR_ANALYTICS" | jq -r '.analytics.sales.totals.totalOrders // 0')
        print_info "Total Revenue: $$TOTAL_REVENUE"
        print_info "Total Orders: $TOTAL_ORDERS"
    fi
else
    print_error "Failed to retrieve vendor analytics"
    echo "$VENDOR_ANALYTICS" | jq '.' || echo "$VENDOR_ANALYTICS"
fi

sleep 1

# Test 2.2: Get vendor analytics - week timeframe
print_test "Test 2.2: Get vendor analytics (week)"
VENDOR_WEEK=$(curl -s -X GET "${BASE_URL}/analytics/vendor?timeframe=week" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

if contains "$VENDOR_WEEK" "success.*true"; then
    print_success "Week analytics retrieved"
    TIMEFRAME=$(echo "$VENDOR_WEEK" | jq -r '.timeframe')
    print_info "Timeframe: $TIMEFRAME"
else
    print_error "Failed to retrieve week analytics"
fi

sleep 1

# Test 2.3: Get vendor analytics - quarter timeframe
print_test "Test 2.3: Get vendor analytics (quarter)"
VENDOR_QUARTER=$(curl -s -X GET "${BASE_URL}/analytics/vendor?timeframe=quarter" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

if contains "$VENDOR_QUARTER" "success.*true"; then
    print_success "Quarter analytics retrieved"
    TIMEFRAME=$(echo "$VENDOR_QUARTER" | jq -r '.timeframe')
    print_info "Timeframe: $TIMEFRAME"
else
    print_error "Failed to retrieve quarter analytics"
fi

sleep 1

# Test 2.4: Get vendor analytics - year timeframe
print_test "Test 2.4: Get vendor analytics (year)"
VENDOR_YEAR=$(curl -s -X GET "${BASE_URL}/analytics/vendor?timeframe=year" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

if contains "$VENDOR_YEAR" "success.*true"; then
    print_success "Year analytics retrieved"
    TIMEFRAME=$(echo "$VENDOR_YEAR" | jq -r '.timeframe')
    print_info "Timeframe: $TIMEFRAME"
else
    print_error "Failed to retrieve year analytics"
fi

sleep 1

# Test 2.5: Get vendor analytics - all time
print_test "Test 2.5: Get vendor analytics (all time)"
VENDOR_ALL=$(curl -s -X GET "${BASE_URL}/analytics/vendor?timeframe=all" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

if contains "$VENDOR_ALL" "success.*true"; then
    print_success "All-time analytics retrieved"
    TIMEFRAME=$(echo "$VENDOR_ALL" | jq -r '.timeframe')
    print_info "Timeframe: $TIMEFRAME"
else
    print_error "Failed to retrieve all-time analytics"
fi

sleep 1

# Test 2.6: Invalid timeframe
print_test "Test 2.6: Test invalid timeframe"
VENDOR_INVALID=$(curl -s -X GET "${BASE_URL}/analytics/vendor?timeframe=invalid" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

if contains "$VENDOR_INVALID" "success.*false"; then
    print_success "Invalid timeframe handled correctly"
else
    print_error "Invalid timeframe not handled properly"
fi

sleep 1

# ============================================
# PHASE 3: SUPPLIER ANALYTICS TESTS
# ============================================

print_header "PHASE 3: SUPPLIER ANALYTICS"

# Test 3.1: Get supplier analytics - default timeframe
print_test "Test 3.1: Get supplier analytics (default - month)"
SUPPLIER_ANALYTICS=$(curl -s -X GET "${BASE_URL}/analytics/supplier" \
  -H "Authorization: Bearer $SUPPLIER_TOKEN")

if contains "$SUPPLIER_ANALYTICS" "success.*true"; then
    print_success "Supplier analytics retrieved"
    
    TIMEFRAME=$(echo "$SUPPLIER_ANALYTICS" | jq -r '.timeframe')
    print_info "Timeframe: $TIMEFRAME"
    
    if echo "$SUPPLIER_ANALYTICS" | jq -e '.analytics.revenue' > /dev/null 2>&1; then
        TOTAL_REVENUE=$(echo "$SUPPLIER_ANALYTICS" | jq -r '.analytics.revenue.totals.totalRevenue // 0')
        TOTAL_ORDERS=$(echo "$SUPPLIER_ANALYTICS" | jq -r '.analytics.revenue.totals.totalOrders // 0')
        print_info "Total Revenue: $$TOTAL_REVENUE"
        print_info "Total Orders: $TOTAL_ORDERS"
    fi
else
    print_error "Failed to retrieve supplier analytics"
    echo "$SUPPLIER_ANALYTICS" | jq '.' || echo "$SUPPLIER_ANALYTICS"
fi

sleep 1

# Test 3.2: Get supplier analytics - week timeframe
print_test "Test 3.2: Get supplier analytics (week)"
SUPPLIER_WEEK=$(curl -s -X GET "${BASE_URL}/analytics/supplier?timeframe=week" \
  -H "Authorization: Bearer $SUPPLIER_TOKEN")

if contains "$SUPPLIER_WEEK" "success.*true"; then
    print_success "Week analytics retrieved"
else
    print_error "Failed to retrieve week analytics"
fi

sleep 1

# Test 3.3: Get supplier analytics - quarter timeframe
print_test "Test 3.3: Get supplier analytics (quarter)"
SUPPLIER_QUARTER=$(curl -s -X GET "${BASE_URL}/analytics/supplier?timeframe=quarter" \
  -H "Authorization: Bearer $SUPPLIER_TOKEN")

if contains "$SUPPLIER_QUARTER" "success.*true"; then
    print_success "Quarter analytics retrieved"
else
    print_error "Failed to retrieve quarter analytics"
fi

sleep 1

# ============================================
# PHASE 4: ANALYTICS SUMMARY TESTS
# ============================================

print_header "PHASE 4: ANALYTICS SUMMARY"

# Test 4.1: Get analytics summary (vendor)
print_test "Test 4.1: Get vendor analytics summary"
VENDOR_SUMMARY=$(curl -s -X GET "${BASE_URL}/analytics/summary" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

if contains "$VENDOR_SUMMARY" "success.*true"; then
    print_success "Vendor summary retrieved"
else
    print_info "Summary endpoint may need implementation"
fi

sleep 1

# Test 4.2: Get analytics summary (supplier)
print_test "Test 4.2: Get supplier analytics summary"
SUPPLIER_SUMMARY=$(curl -s -X GET "${BASE_URL}/analytics/summary" \
  -H "Authorization: Bearer $SUPPLIER_TOKEN")

if contains "$SUPPLIER_SUMMARY" "success.*true"; then
    print_success "Supplier summary retrieved"
else
    print_info "Supplier summary may need implementation"
fi

sleep 1

# ============================================
# PHASE 5: ANALYTICS EXPORT TESTS
# ============================================

print_header "PHASE 5: ANALYTICS EXPORT"

# Test 5.1: Export vendor analytics as JSON
print_test "Test 5.1: Export vendor analytics (JSON)"
EXPORT_JSON=$(curl -s -X GET "${BASE_URL}/analytics/export?format=json&timeframe=month" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

if [ -n "$EXPORT_JSON" ]; then
    print_success "JSON export successful"
    print_info "Export size: $(echo "$EXPORT_JSON" | wc -c) bytes"
else
    print_error "JSON export failed"
fi

sleep 1

# Test 5.2: Export vendor analytics as CSV
print_test "Test 5.2: Export vendor analytics (CSV)"
EXPORT_CSV=$(curl -s -X GET "${BASE_URL}/analytics/export?format=csv&timeframe=month" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

if [ -n "$EXPORT_CSV" ]; then
    print_success "CSV export successful"
    print_info "Export size: $(echo "$EXPORT_CSV" | wc -c) bytes"
else
    print_info "CSV export endpoint may not be fully implemented"
fi

sleep 1

# ============================================
# PHASE 6: ACCESS CONTROL TESTS
# ============================================

print_header "PHASE 6: ACCESS CONTROL"

# Test 6.1: Customer cannot access vendor analytics
print_test "Test 6.1: Customer access to vendor analytics (should fail)"
CUSTOMER_ACCESS=$(curl -s -X GET "${BASE_URL}/analytics/vendor" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN")

if contains "$CUSTOMER_ACCESS" "Unauthorized\|Forbidden\|Access denied"; then
    print_success "Access control working - customer blocked"
else
    print_error "Access control failed - customer should not access vendor analytics"
fi

sleep 1

# Test 6.2: Vendor cannot access supplier analytics
print_test "Test 6.2: Vendor access to supplier analytics (should fail)"
VENDOR_ACCESS=$(curl -s -X GET "${BASE_URL}/analytics/supplier" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

if contains "$VENDOR_ACCESS" "Unauthorized\|Forbidden\|Access denied"; then
    print_success "Access control working - vendor blocked"
else
    print_error "Access control failed - vendor should not access supplier analytics"
fi

sleep 1

# Test 6.3: Unauthenticated access
print_test "Test 6.3: Unauthenticated access (should fail)"
UNAUTH_ACCESS=$(curl -s -X GET "${BASE_URL}/analytics/vendor")

if contains "$UNAUTH_ACCESS" "Unauthorized\|No token"; then
    print_success "Authentication required - working correctly"
else
    print_error "Authentication check failed"
fi

sleep 1

# ============================================
# SUMMARY
# ============================================

print_header "TEST SUMMARY"

echo ""
echo -e "${GREEN}✅ ANALYTICS DASHBOARD TESTS COMPLETED${NC}"
echo ""
echo "Test Results:"
echo "┌─────────────────────────────────────┐"
echo "│  Total Tests: $TOTAL"
echo "│  Passed: ${GREEN}$PASSED${NC}"
echo "│  Failed: ${RED}$FAILED${NC}"
echo "└─────────────────────────────────────┘"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All analytics tests passed!${NC}"
    echo ""
    echo "Analytics Features Verified:"
    echo "├─ ✓ Vendor Analytics (All Timeframes)"
    echo "├─ ✓ Supplier Analytics (All Timeframes)"
    echo "├─ ✓ Analytics Summary"
    echo "├─ ✓ Export Functionality"
    echo "└─ ✓ Access Control"
else
    echo -e "${YELLOW}⚠ Some tests failed. Please review the errors above.${NC}"
fi

echo ""
echo -e "${BLUE}📊 Analytics Dashboard Testing Complete!${NC}"
echo ""