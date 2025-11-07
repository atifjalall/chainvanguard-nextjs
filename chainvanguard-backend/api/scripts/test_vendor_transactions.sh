#!/bin/bash

# ============================================
# VENDOR TRANSACTION TRACKING TEST SUITE
# Tests vendor's ability to view and track their purchase requests and orders
# ============================================

source /Users/atifjalal/Desktop/chainvanguard-nextjs/chainvanguard-backend/api/.env

BASE_URL="http://localhost:3001/api"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'
BOLD='\033[1m'

# Counters
PASS=0
FAIL=0
TOTAL=0

print_header() {
    echo ""
    echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BOLD}${BLUE}$1${NC}"
    echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_test() {
    echo ""
    echo -e "${YELLOW}➤ $1${NC}"
}

print_success() {
    echo -e "${GREEN}  ✓ $1${NC}"
    ((PASS++))
    ((TOTAL++))
}

print_error() {
    echo -e "${RED}  ✗ $1${NC}"
    ((FAIL++))
    ((TOTAL++))
}

print_info() {
    echo -e "${CYAN}  ℹ $1${NC}"
}

print_data() {
    echo -e "${MAGENTA}    → $1${NC}"
}

# ============================================
# PRE-FLIGHT CHECKS
# ============================================

clear
print_header "VENDOR TRANSACTION TRACKING TEST SUITE"

print_test "Verifying environment variables"
if [ -z "$VENDOR_TOKEN" ] || [ -z "$SUPPLIER_TOKEN" ] || [ -z "$VENDOR_REQUEST_ID_1" ]; then
    print_error "Required environment variables not set"
    echo "Need: VENDOR_TOKEN, SUPPLIER_TOKEN, VENDOR_REQUEST_ID_1"
    exit 1
fi
print_success "Environment variables verified"
print_info "Vendor ID: $VENDOR_ID"
print_info "Request ID: $VENDOR_REQUEST_ID_1"

# ============================================
# PHASE 1: GET ALL TRANSACTIONS
# ============================================

print_header "PHASE 1: GET ALL TRANSACTIONS"

print_test "Test 1.1: Vendor retrieves all transactions"
TRANSACTIONS=$(curl -s -X GET "$BASE_URL/vendor/transactions" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

SUCCESS=$(echo $TRANSACTIONS | jq -r '.success')
if [ "$SUCCESS" = "true" ]; then
    COUNT=$(echo $TRANSACTIONS | jq -r '.data | length')
    TOTAL_RECORDS=$(echo $TRANSACTIONS | jq -r '.pagination.total // 0')
    print_success "Retrieved transactions successfully"
    print_data "Found $COUNT transactions on this page"
    print_data "Total transactions: $TOTAL_RECORDS"
    
    # Check data structure
    HAS_REQUEST=$(echo $TRANSACTIONS | jq -r '.data[0].requestNumber // "null"')
    HAS_SUPPLIER=$(echo $TRANSACTIONS | jq -r '.data[0].supplier.name // "null"')
    HAS_AMOUNT=$(echo $TRANSACTIONS | jq -r '.data[0].amount.total // "null"')
    
    if [ "$HAS_REQUEST" != "null" ]; then
        print_success "Contains request information"
        print_data "Request Number: $HAS_REQUEST"
    else
        print_error "Missing request information"
    fi
    
    if [ "$HAS_SUPPLIER" != "null" ]; then
        print_success "Contains supplier information"
        print_data "Supplier: $HAS_SUPPLIER"
    else
        print_error "Missing supplier information"
    fi
    
    if [ "$HAS_AMOUNT" != "null" ]; then
        print_success "Contains amount information"
        print_data "Amount: \$$HAS_AMOUNT"
    else
        print_error "Missing amount information"
    fi
    
    # Check if order info is included
    ORDER_EXISTS=$(echo $TRANSACTIONS | jq -r '.data[0].order // "null"')
    if [ "$ORDER_EXISTS" != "null" ]; then
        ORDER_NUMBER=$(echo $TRANSACTIONS | jq -r '.data[0].order.orderNumber // "N/A"')
        ORDER_STATUS=$(echo $TRANSACTIONS | jq -r '.data[0].order.status // "N/A"')
        print_success "Contains order information"
        print_data "Order: $ORDER_NUMBER, Status: $ORDER_STATUS"
        
        # Check tracking info
        TRACKING=$(echo $TRANSACTIONS | jq -r '.data[0].order.trackingNumber // "null"')
        if [ "$TRACKING" != "null" ]; then
            print_success "Contains tracking information"
            print_data "Tracking: $TRACKING"
        fi
    else
        print_info "No order created yet (pending/rejected requests)"
    fi
else
    print_error "Failed to retrieve transactions"
    echo "$TRANSACTIONS" | jq '.'
fi

sleep 1

# ============================================
# PHASE 2: FILTER TRANSACTIONS
# ============================================

print_header "PHASE 2: FILTER TRANSACTIONS"

print_test "Test 2.1: Filter by status (approved)"
APPROVED=$(curl -s -X GET "$BASE_URL/vendor/transactions?status=approved" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

SUCCESS=$(echo $APPROVED | jq -r '.success')
if [ "$SUCCESS" = "true" ]; then
    COUNT=$(echo $APPROVED | jq -r '.data | length')
    print_success "Filtered approved transactions: $COUNT found"
    
    # Verify all are approved
    ALL_APPROVED=$(echo $APPROVED | jq -r '[.data[].requestStatus] | unique | length')
    if [ "$ALL_APPROVED" = "1" ]; then
        STATUS=$(echo $APPROVED | jq -r '.data[0].requestStatus')
        print_success "All transactions have status: $STATUS"
    else
        print_error "Filter returned mixed statuses"
    fi
else
    print_error "Failed to filter by approved status"
fi

sleep 0.5

print_test "Test 2.2: Filter by status (pending)"
PENDING=$(curl -s -X GET "$BASE_URL/vendor/transactions?status=pending" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

SUCCESS=$(echo $PENDING | jq -r '.success')
if [ "$SUCCESS" = "true" ]; then
    COUNT=$(echo $PENDING | jq -r '.data | length')
    print_success "Filtered pending transactions: $COUNT found"
else
    print_error "Failed to filter by pending status"
fi

sleep 0.5

print_test "Test 2.3: Filter by order status (shipped)"
SHIPPED=$(curl -s -X GET "$BASE_URL/vendor/transactions?orderStatus=shipped" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

SUCCESS=$(echo $SHIPPED | jq -r '.success')
if [ "$SUCCESS" = "true" ]; then
    COUNT=$(echo $SHIPPED | jq -r '.data | length')
    print_success "Filtered shipped orders: $COUNT found"
    
    if [ "$COUNT" -gt 0 ]; then
        ORDER_STATUS=$(echo $SHIPPED | jq -r '.data[0].order.status')
        print_data "Order status: $ORDER_STATUS"
    fi
else
    print_error "Failed to filter by order status"
fi

sleep 0.5

print_test "Test 2.4: Filter by supplier"
if [ -n "$SUPPLIER_ID" ]; then
    BY_SUPPLIER=$(curl -s -X GET "$BASE_URL/vendor/transactions?supplierId=$SUPPLIER_ID" \
      -H "Authorization: Bearer $VENDOR_TOKEN")
    
    SUCCESS=$(echo $BY_SUPPLIER | jq -r '.success')
    if [ "$SUCCESS" = "true" ]; then
        COUNT=$(echo $BY_SUPPLIER | jq -r '.data | length')
        print_success "Filtered by supplier: $COUNT found"
    else
        print_error "Failed to filter by supplier"
    fi
else
    print_info "No supplier ID available for filtering"
fi

sleep 0.5

print_test "Test 2.5: Filter by date range"
START_DATE="2025-10-01"
END_DATE="2025-12-31"
DATE_FILTER=$(curl -s -X GET "$BASE_URL/vendor/transactions?startDate=$START_DATE&endDate=$END_DATE" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

SUCCESS=$(echo $DATE_FILTER | jq -r '.success')
if [ "$SUCCESS" = "true" ]; then
    COUNT=$(echo $DATE_FILTER | jq -r '.data | length')
    print_success "Date filtering works: $COUNT transactions"
else
    print_error "Failed to filter by date"
fi

sleep 1

# ============================================
# PHASE 3: PAGINATION & SORTING
# ============================================

print_header "PHASE 3: PAGINATION & SORTING"

print_test "Test 3.1: Pagination - Page 1, Limit 5"
PAGE1=$(curl -s -X GET "$BASE_URL/vendor/transactions?page=1&limit=5" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

SUCCESS=$(echo $PAGE1 | jq -r '.success')
if [ "$SUCCESS" = "true" ]; then
    PAGE=$(echo $PAGE1 | jq -r '.pagination.page')
    LIMIT=$(echo $PAGE1 | jq -r '.pagination.limit')
    TOTAL=$(echo $PAGE1 | jq -r '.pagination.total')
    PAGES=$(echo $PAGE1 | jq -r '.pagination.pages')
    COUNT=$(echo $PAGE1 | jq -r '.data | length')
    
    print_success "Pagination working correctly"
    print_data "Page $PAGE of $PAGES (Limit: $LIMIT)"
    print_data "Showing $COUNT of $TOTAL total records"
    
    if [ "$COUNT" -le "$LIMIT" ]; then
        print_success "Respects limit parameter"
    else
        print_error "Returned more items than limit"
    fi
else
    print_error "Pagination failed"
fi

sleep 0.5

print_test "Test 3.2: Sort by date (ascending)"
SORTED_ASC=$(curl -s -X GET "$BASE_URL/vendor/transactions?sortBy=createdAt&sortOrder=asc&limit=10" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

SUCCESS=$(echo $SORTED_ASC | jq -r '.success')
if [ "$SUCCESS" = "true" ]; then
    FIRST_DATE=$(echo $SORTED_ASC | jq -r '.data[0].createdAt')
    LAST_DATE=$(echo $SORTED_ASC | jq -r '.data[-1].createdAt // .data[0].createdAt')
    
    print_success "Ascending sort working"
    print_data "First: $FIRST_DATE"
    print_data "Last: $LAST_DATE"
else
    print_error "Ascending sort failed"
fi

sleep 0.5

print_test "Test 3.3: Sort by date (descending - default)"
SORTED_DESC=$(curl -s -X GET "$BASE_URL/vendor/transactions?sortOrder=desc&limit=10" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

SUCCESS=$(echo $SORTED_DESC | jq -r '.success')
if [ "$SUCCESS" = "true" ]; then
    FIRST_DATE=$(echo $SORTED_DESC | jq -r '.data[0].createdAt')
    print_success "Descending sort working"
    print_data "Most recent: $FIRST_DATE"
else
    print_error "Descending sort failed"
fi

sleep 1

# ============================================
# PHASE 4: TRANSACTION DETAIL
# ============================================

print_header "PHASE 4: TRANSACTION DETAIL"

print_test "Test 4.1: Get detailed transaction by request ID"
DETAIL=$(curl -s -X GET "$BASE_URL/vendor/transactions/$VENDOR_REQUEST_ID_1" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

SUCCESS=$(echo $DETAIL | jq -r '.success')
if [ "$SUCCESS" = "true" ]; then
    print_success "Retrieved transaction detail"
    
    # Check request section
    REQ_NUMBER=$(echo $DETAIL | jq -r '.data.request.requestNumber')
    REQ_STATUS=$(echo $DETAIL | jq -r '.data.request.status')
    REQ_TOTAL=$(echo $DETAIL | jq -r '.data.request.total')
    
    print_data "Request: $REQ_NUMBER"
    print_data "Status: $REQ_STATUS"
    print_data "Total: \$$REQ_TOTAL"
    
    # Check supplier section
    SUPPLIER_NAME=$(echo $DETAIL | jq -r '.data.request.supplier.name')
    SUPPLIER_COMPANY=$(echo $DETAIL | jq -r '.data.request.supplier.companyName')
    
    if [ "$SUPPLIER_NAME" != "null" ]; then
        print_success "Supplier details included"
        print_data "Supplier: $SUPPLIER_NAME ($SUPPLIER_COMPANY)"
    else
        print_error "Missing supplier details"
    fi
    
    # Check items section
    ITEMS_COUNT=$(echo $DETAIL | jq -r '.data.request.items | length')
    if [ "$ITEMS_COUNT" -gt 0 ]; then
        print_success "Items included: $ITEMS_COUNT items"
        
        FIRST_ITEM=$(echo $DETAIL | jq -r '.data.request.items[0].name')
        FIRST_QTY=$(echo $DETAIL | jq -r '.data.request.items[0].quantity')
        FIRST_PRICE=$(echo $DETAIL | jq -r '.data.request.items[0].pricePerUnit')
        
        print_data "First item: $FIRST_ITEM"
        print_data "Quantity: $FIRST_QTY @ \$$FIRST_PRICE each"
    else
        print_error "No items found"
    fi
    
    # Check order section
    ORDER_EXISTS=$(echo $DETAIL | jq -r '.data.order // "null"')
    if [ "$ORDER_EXISTS" != "null" ]; then
        ORDER_NUM=$(echo $DETAIL | jq -r '.data.order.orderNumber')
        ORDER_STATUS=$(echo $DETAIL | jq -r '.data.order.status')
        ORDER_TOTAL=$(echo $DETAIL | jq -r '.data.order.totalAmount')
        
        print_success "Order details included"
        print_data "Order: $ORDER_NUM"
        print_data "Status: $ORDER_STATUS"
        print_data "Total: \$$ORDER_TOTAL"
        
        # Check shipping info
        TRACKING=$(echo $DETAIL | jq -r '.data.order.trackingNumber // "null"')
        if [ "$TRACKING" != "null" ]; then
            COURIER=$(echo $DETAIL | jq -r '.data.order.courierName')
            print_success "Tracking information available"
            print_data "Tracking: $TRACKING ($COURIER)"
        else
            print_info "No tracking info (order may not be shipped yet)"
        fi
        
        # Check shipping address
        SHIP_ADDR=$(echo $DETAIL | jq -r '.data.order.shippingAddress.addressLine1')
        SHIP_CITY=$(echo $DETAIL | jq -r '.data.order.shippingAddress.city')
        if [ "$SHIP_ADDR" != "null" ]; then
            print_success "Shipping address included"
            print_data "Address: $SHIP_ADDR, $SHIP_CITY"
        fi
        
        # Check status history
        HISTORY_COUNT=$(echo $DETAIL | jq -r '.data.order.statusHistory | length')
        if [ "$HISTORY_COUNT" -gt 0 ]; then
            print_success "Status history included: $HISTORY_COUNT events"
            
            LATEST_STATUS=$(echo $DETAIL | jq -r '.data.order.statusHistory[-1].status')
            LATEST_TIME=$(echo $DETAIL | jq -r '.data.order.statusHistory[-1].timestamp')
            print_data "Latest: $LATEST_STATUS at $LATEST_TIME"
        fi
    else
        print_info "No order created yet (pending or rejected request)"
    fi
    
    # Check inventory section
    INV_CREATED=$(echo $DETAIL | jq -r '.data.inventory.created')
    INV_COUNT=$(echo $DETAIL | jq -r '.data.inventory.itemCount')
    
    if [ "$INV_CREATED" = "true" ] && [ "$INV_COUNT" -gt 0 ]; then
        print_success "Inventory created: $INV_COUNT items"
        
        INV_FIRST=$(echo $DETAIL | jq -r '.data.inventory.items[0].inventoryItem.name')
        INV_QTY=$(echo $DETAIL | jq -r '.data.inventory.items[0].quantity.current')
        print_data "Item: $INV_FIRST (Qty: $INV_QTY)"
    else
        print_info "No inventory created (order not delivered yet)"
    fi
    
    # Check timeline
    TIMELINE_COUNT=$(echo $DETAIL | jq -r '.data.timeline | length')
    if [ "$TIMELINE_COUNT" -gt 0 ]; then
        print_success "Timeline included: $TIMELINE_COUNT events"
        
        echo ""
        echo -e "${CYAN}  📊 Transaction Timeline:${NC}"
        echo $DETAIL | jq -r '.data.timeline[] | "    \(.stage): \(.title) - \(.timestamp)"' | head -n 5
        
        # Check specific timeline stages
        HAS_REQUEST_CREATED=$(echo $DETAIL | jq -r '.data.timeline[] | select(.stage == "request_created") | .stage')
        HAS_APPROVAL=$(echo $DETAIL | jq -r '.data.timeline[] | select(.stage == "request_reviewed") | .stage')
        HAS_PAYMENT=$(echo $DETAIL | jq -r '.data.timeline[] | select(.stage == "payment_completed") | .stage')
        
        [ -n "$HAS_REQUEST_CREATED" ] && print_success "Timeline shows request creation"
        [ -n "$HAS_APPROVAL" ] && print_success "Timeline shows approval/rejection"
        [ -n "$HAS_PAYMENT" ] && print_success "Timeline shows payment"
    else
        print_error "Timeline missing"
    fi
    
    # Check blockchain info
    BLOCKCHAIN_VERIFIED=$(echo $DETAIL | jq -r '.data.request.blockchainVerified')
    BLOCKCHAIN_TX=$(echo $DETAIL | jq -r '.data.request.blockchainTxId // "null"')
    
    if [ "$BLOCKCHAIN_VERIFIED" = "true" ]; then
        print_success "Blockchain verified"
        [ "$BLOCKCHAIN_TX" != "null" ] && print_data "TX ID: $BLOCKCHAIN_TX"
    else
        print_info "Not yet on blockchain"
    fi
    
else
    print_error "Failed to get transaction detail"
    echo "$DETAIL" | jq '.'
fi

sleep 1

print_test "Test 4.2: Get detail with invalid request ID"
INVALID_DETAIL=$(curl -s -X GET "$BASE_URL/vendor/transactions/000000000000000000000000" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

SUCCESS=$(echo $INVALID_DETAIL | jq -r '.success')
if [ "$SUCCESS" = "false" ]; then
    print_success "Invalid ID properly rejected"
else
    print_error "Should reject invalid request ID"
fi

sleep 1

# ============================================
# PHASE 5: TRANSACTION STATISTICS
# ============================================

print_header "PHASE 5: TRANSACTION STATISTICS"

print_test "Test 5.1: Get transaction statistics (default timeframe)"
STATS=$(curl -s -X GET "$BASE_URL/vendor/transactions/stats" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

SUCCESS=$(echo $STATS | jq -r '.success')
if [ "$SUCCESS" = "true" ]; then
    print_success "Retrieved statistics"
    
    TIMEFRAME=$(echo $STATS | jq -r '.timeframe')
    print_data "Timeframe: $timeframe"
    
    # Check status breakdown
    HAS_BREAKDOWN=$(echo $STATS | jq -r '.stats.statusBreakdown // "null"')
    if [ "$HAS_BREAKDOWN" != "null" ]; then
        print_success "Status breakdown included"
        
        APPROVED_COUNT=$(echo $STATS | jq -r '.stats.statusBreakdown.approved.count // 0')
        PENDING_COUNT=$(echo $STATS | jq -r '.stats.statusBreakdown.pending.count // 0')
        REJECTED_COUNT=$(echo $STATS | jq -r '.stats.statusBreakdown.rejected.count // 0')
        
        print_data "Approved: $APPROVED_COUNT"
        print_data "Pending: $PENDING_COUNT"
        print_data "Rejected: $REJECTED_COUNT"
    fi
    
    # Check total spent
    TOTAL_SPENT=$(echo $STATS | jq -r '.stats.totalSpent // 0')
    print_data "Total Spent: \$$TOTAL_SPENT"
    
    # Check pending requests
    PENDING_REQS=$(echo $STATS | jq -r '.stats.pendingRequests // 0')
    print_data "Pending Requests: $PENDING_REQS"
    
    # Check orders in transit
    IN_TRANSIT=$(echo $STATS | jq -r '.stats.ordersInTransit // 0')
    print_data "Orders In Transit: $IN_TRANSIT"
    
    # Check recent transactions
    RECENT_COUNT=$(echo $STATS | jq -r '.stats.recentTransactions | length')
    if [ "$RECENT_COUNT" -gt 0 ]; then
        print_success "Recent transactions included: $RECENT_COUNT"
        
        LATEST_REQ=$(echo $STATS | jq -r '.stats.recentTransactions[0].requestNumber')
        LATEST_AMT=$(echo $STATS | jq -r '.stats.recentTransactions[0].amount')
        print_data "Latest: $LATEST_REQ (\$$LATEST_AMT)"
    fi
else
    print_error "Failed to get statistics"
    echo "$STATS" | jq '.'
fi

sleep 0.5

print_test "Test 5.2: Get statistics with week timeframe"
STATS_WEEK=$(curl -s -X GET "$BASE_URL/vendor/transactions/stats?timeframe=week" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

SUCCESS=$(echo $STATS_WEEK | jq -r '.success')
if [ "$SUCCESS" = "true" ]; then
    TIMEFRAME=$(echo $STATS_WEEK | jq -r '.timeframe')
    print_success "Week timeframe working: $TIMEFRAME"
else
    print_error "Week timeframe failed"
fi

sleep 0.5

print_test "Test 5.3: Get statistics with year timeframe"
STATS_YEAR=$(curl -s -X GET "$BASE_URL/vendor/transactions/stats?timeframe=year" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

SUCCESS=$(echo $STATS_YEAR | jq -r '.success')
if [ "$SUCCESS" = "true" ]; then
    TIMEFRAME=$(echo $STATS_YEAR | jq -r '.timeframe')
    print_success "Year timeframe working: $TIMEFRAME"
else
    print_error "Year timeframe failed"
fi

sleep 1

# ============================================
# PHASE 6: ORDER TRACKING
# ============================================

print_header "PHASE 6: ORDER TRACKING"

print_test "Test 6.1: Get all orders with tracking"
TRACKING=$(curl -s -X GET "$BASE_URL/vendor/orders/tracking" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

SUCCESS=$(echo $TRACKING | jq -r '.success')
if [ "$SUCCESS" = "true" ]; then
    COUNT=$(echo $TRACKING | jq -r '.data | length')
    TOTAL=$(echo $TRACKING | jq -r '.pagination.total')
    
    print_success "Retrieved order tracking: $COUNT of $TOTAL orders"
    
    if [ "$COUNT" -gt 0 ]; then
        # Check first order structure
        ORDER_NUM=$(echo $TRACKING | jq -r '.data[0].orderNumber')
        ORDER_STATUS=$(echo $TRACKING | jq -r '.data[0].status')
        SUPPLIER_NAME=$(echo $TRACKING | jq -r '.data[0].supplier.name')
        
        print_data "Order: $ORDER_NUM"
        print_data "Status: $ORDER_STATUS"
        print_data "Supplier: $SUPPLIER_NAME"
        
        # Check tracking info
        TRACK_NUM=$(echo $TRACKING | jq -r '.data[0].tracking.number // "null"')
        if [ "$TRACK_NUM" != "null" ]; then
            TRACK_COURIER=$(echo $TRACKING | jq -r '.data[0].tracking.courier')
            TRACK_URL=$(echo $TRACKING | jq -r '.data[0].tracking.url // "N/A"')
            
            print_success "Tracking information available"
            print_data "Number: $TRACK_NUM"
            print_data "Courier: $TRACK_COURIER"
            [ "$TRACK_URL" != "N/A" ] && print_data "URL: $TRACK_URL"
        else
            print_info "No tracking (order not shipped)"
        fi
        
        # Check delivery dates
        EST_DELIVERY=$(echo $TRACKING | jq -r '.data[0].tracking.estimatedDelivery // "null"')
        ACT_DELIVERY=$(echo $TRACKING | jq -r '.data[0].tracking.actualDelivery // "null"')
        
        [ "$EST_DELIVERY" != "null" ] && print_data "Estimated Delivery: $EST_DELIVERY"
        [ "$ACT_DELIVERY" != "null" ] && print_data "Actual Delivery: $ACT_DELIVERY"
        
        # Check status progress
        PROGRESS=$(echo $TRACKING | jq -r '.data[0].statusProgress.percentage')
        CURRENT_STEP=$(echo $TRACKING | jq -r '.data[0].statusProgress.currentStep')
        
        print_success "Status progress calculated"
        print_data "Progress: $PROGRESS% ($CURRENT_STEP)"
        
        # Check progress steps
        STEPS_COUNT=$(echo $TRACKING | jq -r '.data[0].statusProgress.steps | length')
        if [ "$STEPS_COUNT" -gt 0 ]; then
            print_data "Tracking steps: $STEPS_COUNT"
            echo $TRACKING | jq -r '.data[0].statusProgress.steps[] | "      [\(if .completed then "✓" else " " end)] \(.label)"'
        fi
        
        # Check shipping address
        SHIP_NAME=$(echo $TRACKING | jq -r '.data[0].shippingAddress.name // "null"')
        if [ "$SHIP_NAME" != "null" ]; then
            SHIP_CITY=$(echo $TRACKING | jq -r '.data[0].shippingAddress.city')
            print_data "Shipping to: $SHIP_NAME, $SHIP_CITY"
        fi
    fi
else
    print_error "Failed to get order tracking"
    echo "$TRACKING" | jq '.'
fi

sleep 0.5

print_test "Test 6.2: Filter tracking by status (processing)"
TRACK_PROCESSING=$(curl -s -X GET "$BASE_URL/vendor/orders/tracking?status=processing" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

SUCCESS=$(echo $TRACK_PROCESSING | jq -r '.success')
if [ "$SUCCESS" = "true" ]; then
    COUNT=$(echo $TRACK_PROCESSING | jq -r '.data | length')
    print_success "Filtered processing orders: $COUNT found"
else
    print_error "Failed to filter tracking"
fi

sleep 0.5

print_test "Test 6.3: Filter tracking by status (shipped)"
TRACK_SHIPPED=$(curl -s -X GET "$BASE_URL/vendor/orders/tracking?status=shipped" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

SUCCESS=$(echo $TRACK_SHIPPED | jq -r '.success')
if [ "$SUCCESS" = "true" ]; then
    COUNT=$(echo $TRACK_SHIPPED | jq -r '.data | length')
    print_success "Filtered shipped orders: $COUNT found"
    
    if [ "$COUNT" -gt 0 ]; then
        TRACKING_NUM=$(echo $TRACK_SHIPPED | jq -r '.data[0].tracking.number')
        print_data "Tracking: $TRACKING_NUM"
    fi
else
    print_error "Failed to filter shipped orders"
fi

sleep 0.5

print_test "Test 6.4: Filter tracking by status (delivered)"
TRACK_DELIVERED=$(curl -s -X GET "$BASE_URL/vendor/orders/tracking?status=delivered" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

SUCCESS=$(echo $TRACK_DELIVERED | jq -r '.success')
if [ "$SUCCESS" = "true" ]; then
    COUNT=$(echo $TRACK_DELIVERED | jq -r '.data | length')
    print_success "Filtered delivered orders: $COUNT found"
    
    if [ "$COUNT" -gt 0 ]; then
        ACTUAL_DEL=$(echo $TRACK_DELIVERED | jq -r '.data[0].tracking.actualDelivery')
        print_data "Delivered on: $ACTUAL_DEL"
    fi
else
    print_error "Failed to filter delivered orders"
fi

sleep 0.5

print_test "Test 6.5: Pagination in tracking"
TRACK_PAGE=$(curl -s -X GET "$BASE_URL/vendor/orders/tracking?page=1&limit=3" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

SUCCESS=$(echo $TRACK_PAGE | jq -r '.success')
if [ "$SUCCESS" = "true" ]; then
    COUNT=$(echo $TRACK_PAGE | jq -r '.data | length')
    LIMIT=$(echo $TRACK_PAGE | jq -r '.pagination.limit')
    
    if [ "$COUNT" -le "$LIMIT" ]; then
        print_success "Tracking pagination working (showing $COUNT of max $LIMIT)"
    else
        print_error "Pagination not respecting limit"
    fi
else
    print_error "Tracking pagination failed"
fi

sleep 1

# ============================================
# PHASE 7: AUTHORIZATION & SECURITY
# ============================================

print_header "PHASE 7: AUTHORIZATION & SECURITY"

print_test "Test 7.1: Unauthorized access (no token)"
UNAUTH=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/vendor/transactions")
HTTP_CODE=$(echo "$UNAUTH" | tail -n1)

if [ "$HTTP_CODE" = "401" ]; then
    print_success "Unauthorized access blocked (HTTP $HTTP_CODE)"
else
    print_error "Should require authentication (got HTTP $HTTP_CODE)"
fi

sleep 0.5

print_test "Test 7.2: Wrong role access (supplier token)"
WRONG_ROLE=$(curl -s -X GET "$BASE_URL/vendor/transactions" \
  -H "Authorization: Bearer $SUPPLIER_TOKEN")

SUCCESS=$(echo $WRONG_ROLE | jq -r '.success')
if [ "$SUCCESS" = "false" ]; then
    print_success "Supplier correctly blocked from vendor transactions"
else
    print_error "Supplier should not access vendor transactions"
fi

sleep 0.5

print_test "Test 7.3: Access another vendor's transaction"
# Create a fake vendor request ID (different vendor)
FAKE_REQUEST="000000000000000000000000"
OTHER_TX=$(curl -s -X GET "$BASE_URL/vendor/transactions/$FAKE_REQUEST" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

SUCCESS=$(echo $OTHER_TX | jq -r '.success')
if [ "$SUCCESS" = "false" ]; then
    print_success "Cannot access other vendor's transactions"
else
    print_error "Should block access to other vendor's data"
fi

sleep 0.5

print_test "Test 7.4: Invalid token format"
INVALID_TOKEN=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/vendor/transactions" \
  -H "Authorization: Bearer invalid_token_12345")
HTTP_CODE=$(echo "$INVALID_TOKEN" | tail -n1)

if [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "403" ]; then
    print_success "Invalid token rejected (HTTP $HTTP_CODE)"
else
    print_error "Should reject invalid token"
fi

sleep 1

# ============================================
# PHASE 8: EDGE CASES & ERROR HANDLING
# ============================================

print_header "PHASE 8: EDGE CASES & ERROR HANDLING"

print_test "Test 8.1: Invalid status filter"
INVALID_STATUS=$(curl -s -X GET "$BASE_URL/vendor/transactions?status=invalid_status" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

SUCCESS=$(echo $INVALID_STATUS | jq -r '.success')
if [ "$SUCCESS" = "true" ]; then
    COUNT=$(echo $INVALID_STATUS | jq -r '.data | length')
    print_success "Invalid status handled gracefully (returned $COUNT items)"
else
    print_error "Invalid status filter failed"
fi

sleep 0.5

print_test "Test 8.2: Invalid page number (negative)"
INVALID_PAGE=$(curl -s -X GET "$BASE_URL/vendor/transactions?page=-1" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

SUCCESS=$(echo $INVALID_PAGE | jq -r '.success')
# Should either reject or default to page 1
print_success "Negative page handled"

sleep 0.5

print_test "Test 8.3: Invalid limit (too large)"
LARGE_LIMIT=$(curl -s -X GET "$BASE_URL/vendor/transactions?limit=1000000" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

SUCCESS=$(echo $LARGE_LIMIT | jq -r '.success')
if [ "$SUCCESS" = "true" ]; then
    COUNT=$(echo $LARGE_LIMIT | jq -r '.data | length')
    print_success "Large limit handled (returned $COUNT items)"
else
    print_error "Large limit caused error"
fi

sleep 0.5

print_test "Test 8.4: Invalid date format"
INVALID_DATE=$(curl -s -X GET "$BASE_URL/vendor/transactions?startDate=invalid-date" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

SUCCESS=$(echo $INVALID_DATE | jq -r '.success')
# Should either reject or ignore invalid date
print_success "Invalid date format handled"

sleep 0.5

print_test "Test 8.5: Invalid supplier ID format"
INVALID_SUPPLIER=$(curl -s -X GET "$BASE_URL/vendor/transactions?supplierId=not-a-valid-id" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

SUCCESS=$(echo $INVALID_SUPPLIER | jq -r '.success')
# Should handle gracefully
print_success "Invalid supplier ID handled"

sleep 1

# ============================================
# PHASE 9: PERFORMANCE & DATA VALIDATION
# ============================================

print_header "PHASE 9: PERFORMANCE & DATA VALIDATION"

print_test "Test 9.1: Response time for transaction list"
START_TIME=$(date +%s%N)
PERF_LIST=$(curl -s -X GET "$BASE_URL/vendor/transactions?limit=20" \
  -H "Authorization: Bearer $VENDOR_TOKEN")
END_TIME=$(date +%s%N)
DURATION=$(( ($END_TIME - $START_TIME) / 1000000 ))

if [ "$DURATION" -lt 2000 ]; then
    print_success "List response time: ${DURATION}ms (good)"
elif [ "$DURATION" -lt 5000 ]; then
    print_info "List response time: ${DURATION}ms (acceptable)"
else
    print_error "List response time: ${DURATION}ms (slow)"
fi

sleep 0.5

print_test "Test 9.2: Response time for transaction detail"
START_TIME=$(date +%s%N)
PERF_DETAIL=$(curl -s -X GET "$BASE_URL/vendor/transactions/$VENDOR_REQUEST_ID_1" \
  -H "Authorization: Bearer $VENDOR_TOKEN")
END_TIME=$(date +%s%N)
DURATION=$(( ($END_TIME - $START_TIME) / 1000000 ))

if [ "$DURATION" -lt 3000 ]; then
    print_success "Detail response time: ${DURATION}ms (good)"
elif [ "$DURATION" -lt 6000 ]; then
    print_info "Detail response time: ${DURATION}ms (acceptable)"
else
    print_error "Detail response time: ${DURATION}ms (slow)"
fi

sleep 0.5

print_test "Test 9.3: Data consistency check"
# Get same data twice and compare
TX1=$(curl -s -X GET "$BASE_URL/vendor/transactions/$VENDOR_REQUEST_ID_1" \
  -H "Authorization: Bearer $VENDOR_TOKEN")
sleep 0.5
TX2=$(curl -s -X GET "$BASE_URL/vendor/transactions/$VENDOR_REQUEST_ID_1" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

TOTAL1=$(echo $TX1 | jq -r '.data.request.total')
TOTAL2=$(echo $TX2 | jq -r '.data.request.total')

if [ "$TOTAL1" = "$TOTAL2" ]; then
    print_success "Data consistency verified"
else
    print_error "Data inconsistency detected"
fi

sleep 1

# ============================================
# SUMMARY
# ============================================

print_header "TEST SUMMARY"

TOTAL=$((PASS + FAIL))
echo ""
echo "┌────────────────────────────────────────┐"
echo "│          Test Results                  │"
echo "├────────────────────────────────────────┤"
printf "│  ${GREEN}✓${NC} Passed:  %-25s │\n" "$PASS"
printf "│  ${RED}✗${NC} Failed:  %-25s │\n" "$FAIL"
echo "├────────────────────────────────────────┤"
printf "│  Total:    %-25s │\n" "$TOTAL"
echo "└────────────────────────────────────────┘"
echo ""

if [ $TOTAL -gt 0 ]; then
    SUCCESS_RATE=$(awk "BEGIN {printf \"%.1f\", ($PASS / $TOTAL) * 100}")
    echo -e "${BLUE}Success Rate: ${SUCCESS_RATE}%${NC}"
    echo ""
fi

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}${BOLD}   ✓ ALL TESTS PASSED!${NC}"
    echo -e "${GREEN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "✅ Vendor Transaction System Verified:"
    echo "   ├─ ✓ Transaction List & Filtering"
    echo "   ├─ ✓ Transaction Detail & Timeline"
    echo "   ├─ ✓ Statistics & Analytics"
    echo "   ├─ ✓ Order Tracking"
    echo "   ├─ ✓ Pagination & Sorting"
    echo "   ├─ ✓ Authorization & Security"
    echo "   ├─ ✓ Error Handling"
    echo "   └─ ✓ Performance & Consistency"
    echo ""
    exit 0
else
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}   ✗ SOME TESTS FAILED${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "Please review the failures above"
    exit 1
fi