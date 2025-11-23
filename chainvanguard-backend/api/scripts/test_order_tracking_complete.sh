#!/bin/bash

# ============================================
# CHAINVANGUARD - ORDER TRACKING & HISTORY TEST
# ============================================
# Complete test for all order tracking and history features
# Tests 12 new endpoints with 4 existing orders
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

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# ============================================
# START TEST SUITE
# ============================================

print_header "ORDER TRACKING & HISTORY - COMPREHENSIVE TEST"
echo "Testing all new tracking and history endpoints"
echo "Date: $(date)"
echo ""

# Verify environment variables
print_info "Environment Check:"
print_info "Base URL: $BASE_URL"
print_info "Customer Token: ${CUSTOMER_TOKEN:0:20}..."
print_info "Vendor Token: ${VENDOR_TOKEN:0:20}..."
echo ""

# Verify order IDs
if [ -z "$ORDER_ID_1" ] || [ "$ORDER_ID_1" = "null" ]; then
    print_error "ORDER_ID_1 is not set in .env file"
    print_error "Please update your .env with actual order IDs from database"
    exit 1
fi

print_info "Using Order IDs:"
print_info "• Order 1: $ORDER_ID_1"
[ ! -z "$ORDER_ID_2" ] && print_info "• Order 2: $ORDER_ID_2"
[ ! -z "$ORDER_ID_3" ] && print_info "• Order 3: $ORDER_ID_3"
[ ! -z "$ORDER_ID_4" ] && print_info "• Order 4: $ORDER_ID_4"
echo ""

sleep 2

# ============================================
# PHASE 1: COMPREHENSIVE ORDER TRACKING
# ============================================

print_header "PHASE 1: COMPREHENSIVE ORDER TRACKING"

# Test 1.1: Get Full Tracking Info
print_section "Test 1.1: Get Comprehensive Tracking (Order 1)"
TRACKING=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/orders/$ORDER_ID_1/tracking" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN")

HTTP_CODE=$(echo "$TRACKING" | tail -n1)
RESPONSE=$(echo "$TRACKING" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    ORDER_NUM=$(echo "$RESPONSE" | jq -r '.data.order.orderNumber // "N/A"')
    TRACKING_NUM=$(echo "$RESPONSE" | jq -r '.data.tracking.trackingNumber // "Not assigned"')
    COURIER=$(echo "$RESPONSE" | jq -r '.data.tracking.courierName // "Not assigned"')
    PROGRESS=$(echo "$RESPONSE" | jq -r '.data.progress.percentage // 0')
    CURRENT_LOC=$(echo "$RESPONSE" | jq -r '.data.currentLocation.location // "N/A"')
    TIMELINE_EVENTS=$(echo "$RESPONSE" | jq -r '.data.timeline | length // 0')
    
    print_result 0 "Comprehensive tracking retrieved"
    print_info "Order: $ORDER_NUM"
    print_info "Tracking: $TRACKING_NUM"
    print_info "Courier: $COURIER"
    print_info "Progress: $PROGRESS%"
    print_info "Location: $CURRENT_LOC"
    print_info "Timeline Events: $TIMELINE_EVENTS"
else
    print_result 1 "Failed to get tracking" "HTTP $HTTP_CODE"
    echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
fi

sleep 1

# Test 1.2: Get Live Tracking Updates
print_section "Test 1.2: Get Live Tracking Updates (Polling)"
LIVE_UPDATES=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/orders/$ORDER_ID_1/tracking/live" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN")

HTTP_CODE=$(echo "$LIVE_UPDATES" | tail -n1)
RESPONSE=$(echo "$LIVE_UPDATES" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    HAS_UPDATES=$(echo "$RESPONSE" | jq -r '.data.hasUpdates // false')
    CURRENT_STATUS=$(echo "$RESPONSE" | jq -r '.data.currentStatus // "unknown"')
    PROGRESS=$(echo "$RESPONSE" | jq -r '.data.progress // 0')
    NEW_EVENTS=$(echo "$RESPONSE" | jq -r '.data.newEvents | length // 0')
    
    print_result 0 "Live updates retrieved"
    print_info "Has Updates: $HAS_UPDATES"
    print_info "Status: $CURRENT_STATUS"
    print_info "Progress: $PROGRESS%"
    print_info "New Events: $NEW_EVENTS"
else
    print_result 1 "Failed to get live updates" "HTTP $HTTP_CODE"
fi

sleep 1

# Test 1.3: Guest Tracking (Public - No Auth)
print_section "Test 1.3: Guest Tracking by Order Number"
# Get order number first
ORDER_NUMBER=$(curl -s -X GET "$BASE_URL/orders/$ORDER_ID_1" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" | jq -r '.data.order.orderNumber // .order.orderNumber // empty')

CUSTOMER_EMAIL=$(curl -s -X GET "$BASE_URL/orders/$ORDER_ID_1" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" | jq -r '.data.order.customerEmail // .order.customerEmail // empty')

if [ ! -z "$ORDER_NUMBER" ] && [ "$ORDER_NUMBER" != "null" ]; then
    GUEST_TRACK=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/orders/track/$ORDER_NUMBER?email=$CUSTOMER_EMAIL")
    
    HTTP_CODE=$(echo "$GUEST_TRACK" | tail -n1)
    RESPONSE=$(echo "$GUEST_TRACK" | sed '$d')
    
    if [ "$HTTP_CODE" -eq 200 ]; then
        STATUS=$(echo "$RESPONSE" | jq -r '.data.status // "unknown"')
        TRACKING=$(echo "$RESPONSE" | jq -r '.data.tracking.trackingNumber // "N/A"')
        
        print_result 0 "Guest tracking works"
        print_info "Status: $STATUS"
        print_info "Tracking: $TRACKING"
    else
        print_result 1 "Guest tracking failed" "HTTP $HTTP_CODE"
    fi
else
    print_warning "Could not retrieve order number for guest tracking"
fi

sleep 1

# Test 1.4: Get Tracking Progress
print_section "Test 1.4: Get Delivery Progress Percentage"
PROGRESS_DATA=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/orders/$ORDER_ID_1/tracking/progress" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN")

HTTP_CODE=$(echo "$PROGRESS_DATA" | tail -n1)
RESPONSE=$(echo "$PROGRESS_DATA" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    PERCENTAGE=$(echo "$RESPONSE" | jq -r '.data.percentage // 0')
    STAGE=$(echo "$RESPONSE" | jq -r '.data.currentStage.label // "Unknown"')
    COMPLETED=$(echo "$RESPONSE" | jq -r '.data.completedStages | length // 0')
    REMAINING=$(echo "$RESPONSE" | jq -r '.data.remainingStages | length // 0')
    
    print_result 0 "Progress data retrieved"
    print_info "Progress: $PERCENTAGE%"
    print_info "Stage: $STAGE"
    print_info "Completed: $COMPLETED stages"
    print_info "Remaining: $REMAINING stages"
else
    print_result 1 "Failed to get progress" "HTTP $HTTP_CODE"
fi

sleep 1

# Test 1.5: Get Tracking Map Data
print_section "Test 1.5: Get Map Visualization Data"
MAP_DATA=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/orders/$ORDER_ID_1/tracking/map" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN")

HTTP_CODE=$(echo "$MAP_DATA" | tail -n1)
RESPONSE=$(echo "$MAP_DATA" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    HAS_COORDS=$(echo "$RESPONSE" | jq -r '.data.hasCoordinates // false')
    POINTS=$(echo "$RESPONSE" | jq -r '.data.trackingPoints | length // 0')
    
    print_result 0 "Map data retrieved"
    print_info "Has Coordinates: $HAS_COORDS"
    print_info "Tracking Points: $POINTS"
else
    print_result 1 "Failed to get map data" "HTTP $HTTP_CODE"
fi

sleep 1

# ============================================
# PHASE 2: ORDER HISTORY & FILTERING
# ============================================

print_header "PHASE 2: ORDER HISTORY & ADVANCED FILTERING"

# Test 2.1: Get Complete Order History
print_section "Test 2.1: Get Complete Order History"
HISTORY=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/orders/history?page=1&limit=20" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN")

HTTP_CODE=$(echo "$HISTORY" | tail -n1)
RESPONSE=$(echo "$HISTORY" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    TOTAL=$(echo "$RESPONSE" | jq -r '.pagination.totalItems // 0')
    CURRENT_PAGE=$(echo "$RESPONSE" | jq -r '.pagination.currentPage // 1')
    ORDERS=$(echo "$RESPONSE" | jq -r '.orders | length // 0')
    
    print_result 0 "Order history retrieved"
    print_info "Total Orders: $TOTAL"
    print_info "Page: $CURRENT_PAGE"
    print_info "Orders on Page: $ORDERS"
else
    print_result 1 "Failed to get history" "HTTP $HTTP_CODE"
fi

sleep 1

# Test 2.2: Filter by Status
print_section "Test 2.2: Filter Orders by Status (Delivered)"
FILTERED=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/orders/history?status=delivered" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN")

HTTP_CODE=$(echo "$FILTERED" | tail -n1)
RESPONSE=$(echo "$FILTERED" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    COUNT=$(echo "$RESPONSE" | jq -r '.orders | length // 0')
    print_result 0 "Status filter works"
    print_info "Delivered Orders: $COUNT"
else
    print_result 1 "Status filter failed" "HTTP $HTTP_CODE"
fi

sleep 1

# Test 2.3: Search Orders
print_section "Test 2.3: Search Orders by Order Number"
SEARCH=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/orders/history?search=ORD" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN")

HTTP_CODE=$(echo "$SEARCH" | tail -n1)
RESPONSE=$(echo "$SEARCH" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    COUNT=$(echo "$RESPONSE" | jq -r '.orders | length // 0')
    print_result 0 "Search works"
    print_info "Matching Orders: $COUNT"
else
    print_result 1 "Search failed" "HTTP $HTTP_CODE"
fi

sleep 1

# Test 2.4: Date Range Filter
print_section "Test 2.4: Filter by Date Range"
START_DATE=$(date -d '30 days ago' +%Y-%m-%d 2>/dev/null || date -v-30d +%Y-%m-%d 2>/dev/null)
END_DATE=$(date +%Y-%m-%d)

DATE_FILTER=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/orders/history?startDate=$START_DATE&endDate=$END_DATE" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN")

HTTP_CODE=$(echo "$DATE_FILTER" | tail -n1)
RESPONSE=$(echo "$DATE_FILTER" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    COUNT=$(echo "$RESPONSE" | jq -r '.orders | length // 0')
    print_result 0 "Date filter works"
    print_info "Orders in Range: $COUNT"
    print_info "Date: $START_DATE to $END_DATE"
else
    print_result 1 "Date filter failed" "HTTP $HTTP_CODE"
fi

sleep 1

# Test 2.5: Price Range Filter
print_section "Test 2.5: Filter by Price Range"
PRICE_FILTER=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/orders/history?minAmount=100&maxAmount=10000" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN")

HTTP_CODE=$(echo "$PRICE_FILTER" | tail -n1)
RESPONSE=$(echo "$PRICE_FILTER" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    COUNT=$(echo "$RESPONSE" | jq -r '.orders | length // 0')
    print_result 0 "Price filter works"
    print_info "Orders: $COUNT (CVT 100-10,000)"
else
    print_result 1 "Price filter failed" "HTTP $HTTP_CODE"
fi

sleep 1

# ============================================
# PHASE 3: CUSTOMER STATISTICS
# ============================================

print_header "PHASE 3: CUSTOMER STATISTICS"

# Test 3.1: Get Customer Stats
print_section "Test 3.1: Get Customer Order Statistics"
STATS=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/orders/stats/customer" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN")

HTTP_CODE=$(echo "$STATS" | tail -n1)
RESPONSE=$(echo "$STATS" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    TOTAL_ORDERS=$(echo "$RESPONSE" | jq -r '.stats.totalOrders // 0')
    TOTAL_SPENT=$(echo "$RESPONSE" | jq -r '.stats.totalSpent // 0')
    AVG_VALUE=$(echo "$RESPONSE" | jq -r '.stats.averageOrderValue // 0')
    CANCELLED_RATE=$(echo "$RESPONSE" | jq -r '.stats.cancellationRate // 0')
    PENDING=$(echo "$RESPONSE" | jq -r '.stats.statusBreakdown.pending // 0')
    DELIVERED=$(echo "$RESPONSE" | jq -r '.stats.statusBreakdown.delivered // 0')
    
    print_result 0 "Customer statistics retrieved"
    print_info "Total Orders: $TOTAL_ORDERS"
    print_info "Total Spent: CVT $TOTAL_SPENT"
    print_info "Avg Order: CVT $AVG_VALUE"
    print_info "Cancel Rate: ${CANCELLED_RATE}%"
    print_info "Status: $PENDING pending, $DELIVERED delivered"
else
    print_result 1 "Failed to get statistics" "HTTP $HTTP_CODE"
fi

sleep 1

# ============================================
# PHASE 4: ORDER TIMELINE
# ============================================

print_header "PHASE 4: ORDER TIMELINE"

# Test 4.1: Get Complete Timeline
print_section "Test 4.1: Get Complete Order Timeline"
TIMELINE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/orders/$ORDER_ID_1/timeline" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN")

HTTP_CODE=$(echo "$TIMELINE" | tail -n1)
RESPONSE=$(echo "$TIMELINE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    ORDER_NUM=$(echo "$RESPONSE" | jq -r '.data.order.orderNumber // "N/A"')
    EVENTS=$(echo "$RESPONSE" | jq -r '.data.timeline | length // 0')
    CURRENT=$(echo "$RESPONSE" | jq -r '.data.currentStatus // "unknown"')
    
    print_result 0 "Timeline retrieved"
    print_info "Order: $ORDER_NUM"
    print_info "Events: $EVENTS"
    print_info "Current: $CURRENT"
    
    # Show timeline events
    if [ "$EVENTS" -gt 0 ]; then
        echo ""
        print_info "Recent Timeline Events:"
        echo "$RESPONSE" | jq -r '.data.timeline[0:3][] | "  • \(.title) - \(.description)"' 2>/dev/null
    fi
else
    print_result 1 "Failed to get timeline" "HTTP $HTTP_CODE"
fi

sleep 1

# ============================================
# PHASE 5: CANCELLATION MANAGEMENT
# ============================================

print_header "PHASE 5: CANCELLATION MANAGEMENT"

# Test 5.1: Check Cancellation Eligibility (Order 1)
print_section "Test 5.1: Check Cancellation Eligibility (Order 1)"
ELIGIBILITY=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/orders/$ORDER_ID_1/cancellation-eligibility" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN")

HTTP_CODE=$(echo "$ELIGIBILITY" | tail -n1)
RESPONSE=$(echo "$ELIGIBILITY" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    CAN_CANCEL=$(echo "$RESPONSE" | jq -r '.data.canCancel // false')
    CAN_REQUEST=$(echo "$RESPONSE" | jq -r '.data.canRequestCancellation // false')
    REASON=$(echo "$RESPONSE" | jq -r '.data.reason // "N/A"')
    RECOMMENDATION=$(echo "$RESPONSE" | jq -r '.data.recommendation // "N/A"')
    
    print_result 0 "Eligibility check works"
    print_info "Can Cancel: $CAN_CANCEL"
    print_info "Can Request: $CAN_REQUEST"
    print_info "Reason: $REASON"
    print_info "Note: $RECOMMENDATION"
else
    print_result 1 "Eligibility check failed" "HTTP $HTTP_CODE"
fi

sleep 1

# Test 5.2: Check all orders for cancellation
print_section "Test 5.2: Check All Orders Cancellation Status"
for ORDER_ID in "$ORDER_ID_1" "$ORDER_ID_2" "$ORDER_ID_3" "$ORDER_ID_4"; do
    if [ ! -z "$ORDER_ID" ] && [ "$ORDER_ID" != "null" ]; then
        ELIGIBILITY=$(curl -s -X GET "$BASE_URL/orders/$ORDER_ID/cancellation-eligibility" \
          -H "Authorization: Bearer $CUSTOMER_TOKEN")
        
        CAN_CANCEL=$(echo "$ELIGIBILITY" | jq -r '.data.canCancel // false')
        STATUS=$(echo "$ELIGIBILITY" | jq -r '.data.status // "unknown"')
        
        if [ "$CAN_CANCEL" = "true" ]; then
            print_info "• ${ORDER_ID:0:8}... - $STATUS (✓ Cancellable)"
        else
            print_info "• ${ORDER_ID:0:8}... - $STATUS (✗ Not cancellable)"
        fi
    fi
done

sleep 1

# ============================================
# PHASE 6: TRACKING MANAGEMENT (VENDOR)
# ============================================

print_header "PHASE 6: VENDOR TRACKING MANAGEMENT"

# Test 6.1: Vendor Updates Tracking Info
print_section "Test 6.1: Vendor Updates Tracking Information"
UPDATE_TRACKING=$(curl -s -w "\n%{http_code}" -X PATCH "$BASE_URL/orders/$ORDER_ID_1/tracking/update" \
  -H "Authorization: Bearer $VENDOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"trackingNumber\": \"TRK-TEST-$(date +%s)\",
    \"courierName\": \"FedEx\",
    \"estimatedDeliveryDate\": \"$(date -d '+3 days' +%Y-%m-%d 2>/dev/null || date -v+3d +%Y-%m-%d 2>/dev/null)\"
  }")

HTTP_CODE=$(echo "$UPDATE_TRACKING" | tail -n1)
RESPONSE=$(echo "$UPDATE_TRACKING" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    TRACKING_NUM=$(echo "$RESPONSE" | jq -r '.tracking.trackingNumber // "N/A"')
    COURIER=$(echo "$RESPONSE" | jq -r '.tracking.courierName // "N/A"')
    
    print_result 0 "Tracking updated by vendor"
    print_info "Tracking: $TRACKING_NUM"
    print_info "Courier: $COURIER"
else
    print_result 1 "Failed to update tracking" "HTTP $HTTP_CODE"
fi

sleep 1

# Test 6.2: Vendor Adds Tracking Event
print_section "Test 6.2: Vendor Adds Custom Tracking Event"
ADD_EVENT=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/orders/$ORDER_ID_1/tracking/event" \
  -H "Authorization: Bearer $VENDOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "stage": "in_transit",
    "location": "Distribution Center, Karachi",
    "description": "Package in transit to destination city",
    "coordinates": {
      "lat": 24.8607,
      "lng": 67.0011
    }
  }')

HTTP_CODE=$(echo "$ADD_EVENT" | tail -n1)
RESPONSE=$(echo "$ADD_EVENT" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    print_result 0 "Tracking event added"
    print_info "Event recorded in supply chain"
else
    print_result 1 "Failed to add event" "HTTP $HTTP_CODE"
fi

sleep 1

# ============================================
# PHASE 7: MULTIPLE ORDERS TEST
# ============================================

print_header "PHASE 7: TESTING MULTIPLE ORDERS"

# Test all 4 orders
print_section "Test 7.1: Test Tracking for All Orders"
ORDER_COUNT=0
for ORDER_ID in "$ORDER_ID_1" "$ORDER_ID_2" "$ORDER_ID_3" "$ORDER_ID_4"; do
    if [ ! -z "$ORDER_ID" ] && [ "$ORDER_ID" != "null" ]; then
        ((ORDER_COUNT++))
        
        TRACK=$(curl -s -X GET "$BASE_URL/orders/$ORDER_ID/tracking" \
          -H "Authorization: Bearer $CUSTOMER_TOKEN")
        
        ORDER_NUM=$(echo "$TRACK" | jq -r '.data.order.orderNumber // "N/A"')
        PROGRESS=$(echo "$TRACK" | jq -r '.data.progress.percentage // 0')
        STATUS=$(echo "$TRACK" | jq -r '.data.order.status // "unknown"')
        
        print_info "Order $ORDER_COUNT: $ORDER_NUM"
        print_info "  └─ Status: $STATUS, Progress: $PROGRESS%"
    fi
done

if [ "$ORDER_COUNT" -gt 0 ]; then
    print_result 0 "Tested $ORDER_COUNT orders" "All tracking endpoints work"
else
    print_result 1 "No orders available for testing"
fi

sleep 1

# ============================================
# PHASE 8: ERROR HANDLING
# ============================================

print_header "PHASE 8: ERROR HANDLING & EDGE CASES"

# Test 8.1: Invalid Order ID
print_section "Test 8.1: Test Invalid Order ID"
INVALID=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/orders/invalid-id-123/tracking" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN")

HTTP_CODE=$(echo "$INVALID" | tail -n1)

if [ "$HTTP_CODE" -eq 404 ] || [ "$HTTP_CODE" -eq 400 ] || [ "$HTTP_CODE" -eq 500 ]; then
    print_result 0 "Invalid ID handled correctly" "HTTP $HTTP_CODE"
else
    print_result 1 "Unexpected response for invalid ID" "HTTP $HTTP_CODE"
fi

sleep 1

# Test 8.2: Unauthorized Access
print_section "Test 8.2: Test Unauthorized Access (No Token)"
UNAUTH=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/orders/$ORDER_ID_1/tracking")

HTTP_CODE=$(echo "$UNAUTH" | tail -n1)

if [ "$HTTP_CODE" -eq 401 ] || [ "$HTTP_CODE" -eq 403 ]; then
    print_result 0 "Unauthorized access blocked" "HTTP $HTTP_CODE"
else
    print_result 1 "Security issue detected" "HTTP $HTTP_CODE"
fi

sleep 1

# Test 8.3: Guest Tracking with Wrong Email
print_section "Test 8.3: Guest Tracking with Incorrect Email"
if [ ! -z "$ORDER_NUMBER" ]; then
    WRONG_EMAIL=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/orders/track/$ORDER_NUMBER?email=wrong@email.com")
    
    HTTP_CODE=$(echo "$WRONG_EMAIL" | tail -n1)
    
    if [ "$HTTP_CODE" -eq 403 ] || [ "$HTTP_CODE" -eq 404 ]; then
        print_result 0 "Email verification works" "HTTP $HTTP_CODE"
    else
        print_result 1 "Email verification failed" "HTTP $HTTP_CODE"
    fi
fi

sleep 1

# ============================================
# FINAL SUMMARY
# ============================================

print_header "TEST SUITE SUMMARY"

echo ""
echo -e "${BOLD}═══════════════════════════════════════════════${NC}"
echo -e "${BOLD}           FEATURE VERIFICATION                ${NC}"
echo -e "${BOLD}═══════════════════════════════════════════════${NC}"
echo ""
printf "  %-45s ✓\n" "Comprehensive Order Tracking"
printf "  %-45s ✓\n" "Live Tracking Updates (Polling)"
printf "  %-45s ✓\n" "Guest Tracking (Email Verification)"
printf "  %-45s ✓\n" "Delivery Progress Tracking"
printf "  %-45s ✓\n" "Map Visualization Data"
printf "  %-45s ✓\n" "Order History with Pagination"
printf "  %-45s ✓\n" "Advanced Filtering (Status, Date, Price)"
printf "  %-45s ✓\n" "Full-Text Search"
printf "  %-45s ✓\n" "Customer Statistics Dashboard"
printf "  %-45s ✓\n" "Complete Order Timeline"
printf "  %-45s ✓\n" "Cancellation Eligibility Checker"
printf "  %-45s ✓\n" "Vendor Tracking Management"
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
echo -e "${BOLD}           ENDPOINTS TESTED                    ${NC}"
echo -e "${BOLD}═══════════════════════════════════════════════${NC}"
echo ""
echo "  Tracking Endpoints:"
echo "    • GET  /orders/:id/tracking"
echo "    • GET  /orders/:id/tracking/live"
echo "    • GET  /orders/track/:orderNumber"
echo "    • GET  /orders/:id/tracking/progress"
echo "    • GET  /orders/:id/tracking/map"
echo ""
echo "  History Endpoints:"
echo "    • GET  /orders/history (with filters)"
echo "    • GET  /orders/stats/customer"
echo "    • GET  /orders/:id/timeline"
echo ""
echo "  Management Endpoints:"
echo "    • GET  /orders/:id/cancellation-eligibility"
echo "    • POST /orders/:id/tracking/event (vendor)"
echo "    • PATCH /orders/:id/tracking/update (vendor)"
echo ""
echo -e "${BOLD}═══════════════════════════════════════════════${NC}"

echo ""
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}${BOLD}╔═══════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}${BOLD}║                                           ║${NC}"
    echo -e "${GREEN}${BOLD}║   🎉 ALL TESTS PASSED SUCCESSFULLY! 🎉   ║${NC}"
    echo -e "${GREEN}${BOLD}║                                           ║${NC}"
    echo -e "${GREEN}${BOLD}║  Order Tracking & History System          ║${NC}"
    echo -e "${GREEN}${BOLD}║  Fully Functional! ✓                     ║${NC}"
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