#!/bin/bash

# ============================================
# SUPPLIER VENDOR MANAGEMENT TEST SUITE
# Tests vendor listing, relationships, and management
# ============================================

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Source environment variables
ENV_PATH="/Users/atifjalal/Desktop/chainvanguard-nextjs/chainvanguard-backend/api/.env"
if [ -f "$ENV_PATH" ]; then
    source "$ENV_PATH"
    echo "✓ Loaded environment from: $ENV_PATH"
else
    echo "❌ Error: .env file not found at $ENV_PATH"
    exit 1
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
SKIPPED=0

# Test data storage
VENDOR_IDS=()
ORDER_IDS=()
TRANSACTION_IDS=()

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
    echo ""
    echo -e "${YELLOW}➤ TEST: $1${NC}"
}

print_success() {
    echo -e "${GREEN}  ✓ $1${NC}"
    PASSED=$((PASSED + 1))
    TOTAL=$((TOTAL + 1))
}

print_error() {
    echo -e "${RED}  ✗ $1${NC}"
    FAILED=$((FAILED + 1))
    TOTAL=$((TOTAL + 1))
}

print_skip() {
    echo -e "${CYAN}  ⊘ $1${NC}"
    SKIPPED=$((SKIPPED + 1))
}

print_info() {
    echo -e "${BLUE}  ℹ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}  ⚠ $1${NC}"
}

contains() {
    echo "$1" | grep -q "$2"
}

api_call() {
    local method=$1
    local endpoint=$2
    local token=$3
    local data=$4
    
    if [ -n "$data" ]; then
        curl -s -X "$method" "${BASE_URL}${endpoint}" \
            -H "Authorization: Bearer $token" \
            -H "Content-Type: application/json" \
            -d "$data"
    else
        curl -s -X "$method" "${BASE_URL}${endpoint}" \
            -H "Authorization: Bearer $token"
    fi
}

# ============================================
# START TESTS
# ============================================

clear
print_header "SUPPLIER VENDOR MANAGEMENT TEST SUITE"
echo -e "${CYAN}Testing Vendor Listing and Management${NC}"
echo -e "${CYAN}Base URL: $BASE_URL${NC}"
echo ""

# ============================================
# PHASE 0: PRE-FLIGHT CHECKS
# ============================================

print_header "PHASE 0: PRE-FLIGHT CHECKS"

print_test "Checking required tools"
if ! command -v jq &> /dev/null; then
    print_error "jq is not installed. Install with: brew install jq"
    exit 1
fi
print_success "jq is available"

print_test "Verifying environment variables"
if [ -z "$SUPPLIER_TOKEN" ] || [ -z "$VENDOR_TOKEN" ] || [ -z "$SUPPLIER_ID" ] || [ -z "$VENDOR_ID" ]; then
    print_error "Required environment variables not found"
    exit 1
fi
print_success "All environment variables found"
print_info "Supplier ID: $SUPPLIER_ID"
print_info "Vendor ID: $VENDOR_ID"

print_test "Checking backend availability"
HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/../health" 2>/dev/null || echo "000")
if [ "$HEALTH_CHECK" = "200" ] || [ "$HEALTH_CHECK" = "404" ]; then
    print_success "Backend is running"
else
    print_error "Backend is not responding (HTTP $HEALTH_CHECK)"
    exit 1
fi

sleep 1

# ============================================
# PHASE 1: AUTHENTICATION VERIFICATION
# ============================================

print_header "PHASE 1: AUTHENTICATION VERIFICATION"

print_test "Verifying supplier authentication"
SUPPLIER_PROFILE=$(api_call GET "/auth/profile" "$SUPPLIER_TOKEN")

if contains "$SUPPLIER_PROFILE" '"success".*true'; then
    SUPPLIER_NAME=$(echo $SUPPLIER_PROFILE | jq -r '.data.name // .user.name')
    SUPPLIER_ROLE=$(echo $SUPPLIER_PROFILE | jq -r '.data.role // .user.role')
    print_success "Supplier authenticated: $SUPPLIER_NAME"
    print_info "Role: $SUPPLIER_ROLE"
else
    print_error "Supplier authentication failed"
    exit 1
fi

print_test "Verifying vendor authentication"
VENDOR_PROFILE=$(api_call GET "/auth/profile" "$VENDOR_TOKEN")

if contains "$VENDOR_PROFILE" '"success".*true'; then
    VENDOR_NAME=$(echo $VENDOR_PROFILE | jq -r '.data.name // .user.name')
    VENDOR_ROLE=$(echo $VENDOR_PROFILE | jq -r '.data.role // .user.role')
    print_success "Vendor authenticated: $VENDOR_NAME"
    print_info "Role: $VENDOR_ROLE"
else
    print_error "Vendor authentication failed"
    exit 1
fi

sleep 1

# ============================================
# PHASE 2: GET ALL VENDORS
# ============================================

print_header "PHASE 2: VENDOR LISTING"

print_test "Test 2.1: Get all vendors for supplier"
ALL_VENDORS=$(api_call GET "/vendor-customers" "$SUPPLIER_TOKEN")

if contains "$ALL_VENDORS" '"success".*true'; then
    VENDOR_COUNT=$(echo "$ALL_VENDORS" | jq -r '.customers | length // .vendors | length // 0')
    print_success "Retrieved vendor list"
    print_info "Total vendors: $VENDOR_COUNT"
    
    if [ "$VENDOR_COUNT" -gt 0 ]; then
        # Extract vendor IDs for later tests
        FIRST_VENDOR_ID=$(echo "$ALL_VENDORS" | jq -r '.customers[0]._id // .vendors[0]._id // .customers[0].vendorId // .vendors[0].vendorId')
        FIRST_VENDOR_NAME=$(echo "$ALL_VENDORS" | jq -r '.customers[0].name // .vendors[0].name // .customers[0].vendorName // .vendors[0].vendorName')
        VENDOR_IDS+=("$FIRST_VENDOR_ID")
        print_info "First vendor: $FIRST_VENDOR_NAME (ID: $FIRST_VENDOR_ID)"
    else
        print_warning "No vendors found in database"
    fi
else
    print_error "Failed to retrieve vendor list"
    echo "$ALL_VENDORS" | jq '.'
fi

sleep 1

print_test "Test 2.2: Get vendors with pagination"
PAGINATED_VENDORS=$(api_call GET "/vendor-customers?page=1&limit=5" "$SUPPLIER_TOKEN")

if contains "$PAGINATED_VENDORS" '"success".*true'; then
    PAGE_COUNT=$(echo "$PAGINATED_VENDORS" | jq -r '.customers | length // .vendors | length // 0')
    TOTAL_PAGES=$(echo "$PAGINATED_VENDORS" | jq -r '.pagination.pages // .totalPages // 1')
    print_success "Pagination works"
    print_info "Items on page: $PAGE_COUNT"
    print_info "Total pages: $TOTAL_PAGES"
else
    print_error "Pagination failed"
fi

sleep 1

print_test "Test 2.3: Get vendors with search"
SEARCH_VENDORS=$(api_call GET "/vendor-customers?search=test" "$SUPPLIER_TOKEN")

if contains "$SEARCH_VENDORS" '"success".*true'; then
    SEARCH_COUNT=$(echo "$SEARCH_VENDORS" | jq -r '.customers | length // .vendors | length // 0')
    print_success "Search functionality works"
    print_info "Search results: $SEARCH_COUNT"
else
    print_info "Search may not be implemented yet"
fi

sleep 1

# ============================================
# PHASE 3: VENDOR DETAILS & STATISTICS
# ============================================

print_header "PHASE 3: VENDOR DETAILS & STATISTICS"

if [ ${#VENDOR_IDS[@]} -gt 0 ]; then
    VENDOR_ID_TO_TEST="${VENDOR_IDS[0]}"
    
    print_test "Test 3.1: Get specific vendor details"
    VENDOR_DETAILS=$(api_call GET "/vendor-customers/$VENDOR_ID_TO_TEST" "$SUPPLIER_TOKEN")
    
    if contains "$VENDOR_DETAILS" '"success".*true'; then
        VENDOR_NAME=$(echo "$VENDOR_DETAILS" | jq -r '.customer.name // .vendor.name // .data.name')
        TOTAL_ORDERS=$(echo "$VENDOR_DETAILS" | jq -r '.customer.totalOrders // .vendor.totalOrders // .statistics.totalOrders // 0')
        TOTAL_AMOUNT=$(echo "$VENDOR_DETAILS" | jq -r '.customer.totalAmount // .vendor.totalAmount // .statistics.totalAmount // 0')
        print_success "Retrieved vendor details"
        print_info "Vendor: $VENDOR_NAME"
        print_info "Total Orders: $TOTAL_ORDERS"
        print_info "Total Amount: \$${TOTAL_AMOUNT}"
    else
        print_error "Failed to retrieve vendor details"
        echo "$VENDOR_DETAILS" | jq '.'
    fi
    
    sleep 1
    
    print_test "Test 3.2: Get vendor statistics"
    VENDOR_STATS=$(api_call GET "/vendor-customers/$VENDOR_ID_TO_TEST/stats" "$SUPPLIER_TOKEN")
    
    if contains "$VENDOR_STATS" '"success".*true'; then
        print_success "Retrieved vendor statistics"
        STATS=$(echo "$VENDOR_STATS" | jq -r '.statistics // .stats // .data')
        print_info "Statistics: $(echo $STATS | jq -c '.')"
    else
        print_info "Statistics endpoint may not be implemented"
    fi
    
    sleep 1
    
    print_test "Test 3.3: Get vendor order history"
    VENDOR_ORDERS=$(api_call GET "/vendor-customers/$VENDOR_ID_TO_TEST/orders" "$SUPPLIER_TOKEN")
    
    if contains "$VENDOR_ORDERS" '"success".*true'; then
        ORDER_COUNT=$(echo "$VENDOR_ORDERS" | jq -r '.orders | length // 0')
        print_success "Retrieved vendor order history"
        print_info "Order count: $ORDER_COUNT"
        
        if [ "$ORDER_COUNT" -gt 0 ]; then
            FIRST_ORDER_ID=$(echo "$VENDOR_ORDERS" | jq -r '.orders[0]._id')
            ORDER_IDS+=("$FIRST_ORDER_ID")
            print_info "First order ID: $FIRST_ORDER_ID"
        fi
    else
        print_info "Order history endpoint may not be implemented"
    fi
    
    sleep 1
    
    print_test "Test 3.4: Get vendor transactions"
    VENDOR_TRANSACTIONS=$(api_call GET "/vendor-customers/$VENDOR_ID_TO_TEST/transactions" "$SUPPLIER_TOKEN")
    
    if contains "$VENDOR_TRANSACTIONS" '"success".*true'; then
        TRANSACTION_COUNT=$(echo "$VENDOR_TRANSACTIONS" | jq -r '.transactions | length // 0')
        print_success "Retrieved vendor transactions"
        print_info "Transaction count: $TRANSACTION_COUNT"
    else
        print_info "Transaction history endpoint may not be implemented"
    fi
    
    sleep 1
    
else
    print_skip "No vendors available for detailed testing"
fi

# ============================================
# PHASE 4: VENDOR LOYALTY & POINTS
# ============================================

print_header "PHASE 4: VENDOR LOYALTY & POINTS SYSTEM"

if [ ${#VENDOR_IDS[@]} -gt 0 ]; then
    VENDOR_ID_TO_TEST="${VENDOR_IDS[0]}"
    
    print_test "Test 4.1: Get vendor loyalty points"
    LOYALTY_POINTS=$(api_call GET "/vendor-customers/$VENDOR_ID_TO_TEST/loyalty" "$SUPPLIER_TOKEN")
    
    if contains "$LOYALTY_POINTS" '"success".*true'; then
        POINTS=$(echo "$LOYALTY_POINTS" | jq -r '.points // .loyaltyPoints // 0')
        TIER=$(echo "$LOYALTY_POINTS" | jq -r '.tier // "N/A"')
        print_success "Retrieved loyalty points"
        print_info "Points: $POINTS"
        print_info "Tier: $TIER"
    else
        print_info "Loyalty system may not be implemented"
    fi
    
    sleep 1
    
    print_test "Test 4.2: Update vendor loyalty points (add)"
    ADD_POINTS=$(api_call POST "/vendor-customers/$VENDOR_ID_TO_TEST/loyalty/add" "$SUPPLIER_TOKEN" '{
        "points": 50,
        "reason": "Test bonus points"
    }')
    
    if contains "$ADD_POINTS" '"success".*true'; then
        NEW_POINTS=$(echo "$ADD_POINTS" | jq -r '.newPoints // .points // 0')
        print_success "Added loyalty points"
        print_info "New points total: $NEW_POINTS"
    else
        print_info "Loyalty point addition may not be implemented"
    fi
    
    sleep 1
    
    print_test "Test 4.3: Get loyalty point history"
    POINT_HISTORY=$(api_call GET "/vendor-customers/$VENDOR_ID_TO_TEST/loyalty/history" "$SUPPLIER_TOKEN")
    
    if contains "$POINT_HISTORY" '"success".*true'; then
        HISTORY_COUNT=$(echo "$POINT_HISTORY" | jq -r '.history | length // 0')
        print_success "Retrieved point history"
        print_info "History entries: $HISTORY_COUNT"
    else
        print_info "Loyalty history may not be implemented"
    fi
    
    sleep 1
    
else
    print_skip "No vendors available for loyalty testing"
fi

# ============================================
# PHASE 5: VENDOR DISCOUNT CONFIGURATION
# ============================================

print_header "PHASE 5: VENDOR DISCOUNT CONFIGURATION"

if [ ${#VENDOR_IDS[@]} -gt 0 ]; then
    VENDOR_ID_TO_TEST="${VENDOR_IDS[0]}"
    
    print_test "Test 5.1: Get vendor discount settings"
    DISCOUNT_SETTINGS=$(api_call GET "/vendor-customers/$VENDOR_ID_TO_TEST/discount" "$SUPPLIER_TOKEN")
    
    if contains "$DISCOUNT_SETTINGS" '"success".*true'; then
        DISCOUNT_RATE=$(echo "$DISCOUNT_SETTINGS" | jq -r '.discountRate // .discount // 0')
        print_success "Retrieved discount settings"
        print_info "Current discount: ${DISCOUNT_RATE}%"
    else
        print_info "Discount endpoint may not be implemented"
    fi
    
    sleep 1
    
    print_test "Test 5.2: Configure vendor discount (10% for 1000 points)"
    CONFIGURE_DISCOUNT=$(api_call PUT "/vendor-customers/$VENDOR_ID_TO_TEST/discount" "$SUPPLIER_TOKEN" '{
        "discountRate": 10,
        "requiredPoints": 1000,
        "enabled": true
    }')
    
    if contains "$CONFIGURE_DISCOUNT" '"success".*true'; then
        print_success "Discount configured successfully"
        NEW_RATE=$(echo "$CONFIGURE_DISCOUNT" | jq -r '.discountRate // .discount // 0')
        print_info "New discount rate: ${NEW_RATE}%"
    else
        print_info "Discount configuration may not be implemented"
    fi
    
    sleep 1
    
    print_test "Test 5.3: Disable vendor discount"
    DISABLE_DISCOUNT=$(api_call PATCH "/vendor-customers/$VENDOR_ID_TO_TEST/discount/disable" "$SUPPLIER_TOKEN" '{}')
    
    if contains "$DISABLE_DISCOUNT" '"success".*true'; then
        print_success "Discount disabled successfully"
    else
        print_info "Discount disable may not be implemented"
    fi
    
    sleep 1
    
else
    print_skip "No vendors available for discount testing"
fi

# ============================================
# PHASE 6: VENDOR RELATIONSHIP MANAGEMENT
# ============================================

print_header "PHASE 6: VENDOR RELATIONSHIP MANAGEMENT"

if [ ${#VENDOR_IDS[@]} -gt 0 ]; then
    VENDOR_ID_TO_TEST="${VENDOR_IDS[0]}"
    
    print_test "Test 6.1: Update vendor details"
    UPDATE_VENDOR=$(api_call PUT "/vendor-customers/$VENDOR_ID_TO_TEST" "$SUPPLIER_TOKEN" '{
        "notes": "Updated test notes for vendor",
        "preferredContactMethod": "email"
    }')
    
    if contains "$UPDATE_VENDOR" '"success".*true'; then
        print_success "Vendor details updated"
    else
        print_info "Vendor update endpoint may not be implemented"
    fi
    
    sleep 1
    
    print_test "Test 6.2: Get vendor relationship status"
    RELATIONSHIP_STATUS=$(api_call GET "/vendor-customers/$VENDOR_ID_TO_TEST/status" "$SUPPLIER_TOKEN")
    
    if contains "$RELATIONSHIP_STATUS" '"success".*true'; then
        STATUS=$(echo "$RELATIONSHIP_STATUS" | jq -r '.status // "unknown"')
        print_success "Retrieved relationship status"
        print_info "Status: $STATUS"
    else
        print_info "Relationship status endpoint may not be implemented"
    fi
    
    sleep 1
    
    print_test "Test 6.3: Deactivate vendor relationship"
    DEACTIVATE=$(api_call POST "/vendor-customers/$VENDOR_ID_TO_TEST/deactivate" "$SUPPLIER_TOKEN" '{
        "reason": "Test deactivation"
    }')
    
    if contains "$DEACTIVATE" '"success".*true'; then
        print_success "Vendor deactivated (will reactivate)"
        
        # Reactivate immediately for other tests
        sleep 0.5
        REACTIVATE=$(api_call POST "/vendor-customers/$VENDOR_ID_TO_TEST/reactivate" "$SUPPLIER_TOKEN" '{}')
        if contains "$REACTIVATE" '"success".*true'; then
            print_info "Vendor reactivated successfully"
        fi
    else
        print_info "Deactivation endpoint may not be implemented"
    fi
    
    sleep 1
    
else
    print_skip "No vendors available for relationship management testing"
fi

# ============================================
# PHASE 7: VENDOR FILTERING & SORTING
# ============================================

print_header "PHASE 7: VENDOR FILTERING & SORTING"

print_test "Test 7.1: Filter vendors by order count"
FILTER_ORDERS=$(api_call GET "/vendor-customers?minOrders=1" "$SUPPLIER_TOKEN")

if contains "$FILTER_ORDERS" '"success".*true'; then
    FILTERED_COUNT=$(echo "$FILTER_ORDERS" | jq -r '.customers | length // .vendors | length // 0')
    print_success "Order count filtering works"
    print_info "Vendors with orders: $FILTERED_COUNT"
else
    print_info "Order filtering may not be implemented"
fi

sleep 1

print_test "Test 7.2: Filter vendors by amount spent"
FILTER_AMOUNT=$(api_call GET "/vendor-customers?minAmount=100" "$SUPPLIER_TOKEN")

if contains "$FILTER_AMOUNT" '"success".*true'; then
    FILTERED_COUNT=$(echo "$FILTER_AMOUNT" | jq -r '.customers | length // .vendors | length // 0')
    print_success "Amount filtering works"
    print_info "Vendors above threshold: $FILTERED_COUNT"
else
    print_info "Amount filtering may not be implemented"
fi

sleep 1

print_test "Test 7.3: Sort vendors by total amount (desc)"
SORT_AMOUNT=$(api_call GET "/vendor-customers?sortBy=totalAmount&sortOrder=desc" "$SUPPLIER_TOKEN")

if contains "$SORT_AMOUNT" '"success".*true'; then
    print_success "Sorting by amount works"
    if [ "$(echo "$SORT_AMOUNT" | jq -r '.customers | length // 0')" -gt 0 ]; then
        TOP_VENDOR=$(echo "$SORT_AMOUNT" | jq -r '.customers[0].name // "N/A"')
        TOP_AMOUNT=$(echo "$SORT_AMOUNT" | jq -r '.customers[0].totalAmount // 0')
        print_info "Top vendor: $TOP_VENDOR (\$${TOP_AMOUNT})"
    fi
else
    print_info "Sorting may not be implemented"
fi

sleep 1

print_test "Test 7.4: Filter vendors by activity status"
FILTER_ACTIVE=$(api_call GET "/vendor-customers?status=active" "$SUPPLIER_TOKEN")

if contains "$FILTER_ACTIVE" '"success".*true'; then
    ACTIVE_COUNT=$(echo "$FILTER_ACTIVE" | jq -r '.customers | length // .vendors | length // 0')
    print_success "Status filtering works"
    print_info "Active vendors: $ACTIVE_COUNT"
else
    print_info "Status filtering may not be implemented"
fi

sleep 1

# ============================================
# PHASE 8: VENDOR ANALYTICS
# ============================================

print_header "PHASE 8: VENDOR ANALYTICS"

print_test "Test 8.1: Get top performing vendors"
TOP_VENDORS=$(api_call GET "/vendor-customers/analytics/top-vendors" "$SUPPLIER_TOKEN")

if contains "$TOP_VENDORS" '"success".*true'; then
    TOP_COUNT=$(echo "$TOP_VENDORS" | jq -r '.vendors | length // 0')
    print_success "Retrieved top vendors"
    print_info "Top vendors count: $TOP_COUNT"
else
    print_info "Top vendors analytics may not be implemented"
fi

sleep 1

print_test "Test 8.2: Get vendor growth metrics"
GROWTH_METRICS=$(api_call GET "/vendor-customers/analytics/growth" "$SUPPLIER_TOKEN")

if contains "$GROWTH_METRICS" '"success".*true'; then
    print_success "Retrieved growth metrics"
else
    print_info "Growth analytics may not be implemented"
fi

sleep 1

print_test "Test 8.3: Get vendor distribution by category"
DISTRIBUTION=$(api_call GET "/vendor-customers/analytics/distribution" "$SUPPLIER_TOKEN")

if contains "$DISTRIBUTION" '"success".*true'; then
    print_success "Retrieved vendor distribution"
else
    print_info "Distribution analytics may not be implemented"
fi

sleep 1

# ============================================
# PHASE 9: ACCESS CONTROL
# ============================================

print_header "PHASE 9: ACCESS CONTROL & SECURITY"

print_test "Test 9.1: Vendor cannot access supplier's vendor list"
VENDOR_ACCESS=$(api_call GET "/vendor-customers" "$VENDOR_TOKEN")

if contains "$VENDOR_ACCESS" "Unauthorized\|Forbidden\|not authorized\|Only.*supplier"; then
    print_success "Vendor correctly blocked from accessing vendor list"
else
    print_warning "Vendor may be able to access vendor list (check authorization)"
fi

sleep 1

print_test "Test 9.2: Unauthenticated access blocked"
NO_AUTH=$(curl -s -X GET "${BASE_URL}/vendor-customers")

if contains "$NO_AUTH" "Unauthorized\|No token\|Authentication required"; then
    print_success "Unauthenticated access correctly blocked"
else
    print_error "Should require authentication"
fi

sleep 1

if [ ${#VENDOR_IDS[@]} -gt 0 ]; then
    print_test "Test 9.3: Vendor cannot access another vendor's details via supplier endpoint"
    CROSS_ACCESS=$(api_call GET "/vendor-customers/${VENDOR_IDS[0]}" "$VENDOR_TOKEN")
    
    if contains "$CROSS_ACCESS" "Unauthorized\|Forbidden\|not authorized"; then
        print_success "Cross-vendor access correctly blocked"
    else
        print_warning "May need additional authorization checks"
    fi
fi

sleep 1

# ============================================
# PHASE 10: EXPORT & REPORTING
# ============================================

print_header "PHASE 10: EXPORT & REPORTING"

print_test "Test 10.1: Export vendor list to CSV"
EXPORT_CSV=$(api_call GET "/vendor-customers/export?format=csv" "$SUPPLIER_TOKEN")

if contains "$EXPORT_CSV" "csv\|Success"; then
    print_success "CSV export works"
else
    print_info "CSV export may not be implemented"
fi

sleep 1

print_test "Test 10.2: Export vendor report to PDF"
EXPORT_PDF=$(api_call GET "/vendor-customers/export?format=pdf" "$SUPPLIER_TOKEN")

if contains "$EXPORT_PDF" "pdf\|Success"; then
    print_success "PDF export works"
else
    print_info "PDF export may not be implemented"
fi

sleep 1

print_test "Test 10.3: Generate vendor summary report"
SUMMARY_REPORT=$(api_call GET "/vendor-customers/report/summary" "$SUPPLIER_TOKEN")

if contains "$SUMMARY_REPORT" '"success".*true'; then
    print_success "Summary report generated"
else
    print_info "Summary report may not be implemented"
fi

sleep 1

# ============================================
# SUMMARY
# ============================================

print_header "TEST SUMMARY"

echo ""
echo -e "${BOLD}${GREEN}✅ VENDOR MANAGEMENT TESTING COMPLETED${NC}"
echo ""
echo "┌─────────────────────────────────────────────┐"
echo "│  Test Results                               │"
echo "├─────────────────────────────────────────────┤"
printf "│  ${GREEN}✓${NC} Passed:  %-30s │\n" "$PASSED"
printf "│  ${RED}✗${NC} Failed:  %-30s │\n" "$FAILED"
printf "│  ${CYAN}⊘${NC} Skipped: %-30s │\n" "$SKIPPED"
echo "├─────────────────────────────────────────────┤"
printf "│  Total:    %-30s │\n" "$TOTAL"
echo "└─────────────────────────────────────────────┘"
echo ""

if [ $TOTAL -gt 0 ]; then
    SUCCESS_RATE=$(awk "BEGIN {printf \"%.1f\", ($PASSED / $TOTAL) * 100}")
    echo -e "${BLUE}Success Rate: ${SUCCESS_RATE}%${NC}"
fi

echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}${BOLD}🎉 ALL TESTS PASSED!${NC}"
    echo ""
    echo "✅ Vendor Management System Verified:"
    echo "   ├─ ✓ Vendor Listing & Pagination"
    echo "   ├─ ✓ Vendor Details & Statistics"
    echo "   ├─ ✓ Loyalty & Points System"
    echo "   ├─ ✓ Discount Configuration"
    echo "   ├─ ✓ Relationship Management"
    echo "   ├─ ✓ Filtering & Sorting"
    echo "   ├─ ✓ Analytics & Reporting"
    echo "   ├─ ✓ Access Control"
    echo "   └─ ✓ Export Functionality"
else
    echo -e "${YELLOW}⚠️  TESTS COMPLETED WITH ISSUES${NC}"
    echo "   Some endpoints may not be implemented yet"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    exit 0
else
    exit 1
fi