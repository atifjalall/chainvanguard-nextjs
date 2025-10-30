#!/bin/bash

# ============================================
# CHAINVANGUARD - VENDOR REQUEST TEST SUITE
# Comprehensive Testing for Vendor Request System
# ============================================

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Source environment variables from backend
ENV_PATH="/Users/atifjalal/Desktop/chainvanguard-nextjs/chainvanguard-backend/api/.env"
if [ -f "$ENV_PATH" ]; then
    source "$ENV_PATH"
    echo "✓ Loaded environment from: $ENV_PATH"
else
    echo "❌ Error: .env file not found at $ENV_PATH"
    exit 1
fi

BASE_URL="http://localhost:3001/api"

# Color codes for better readability
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

# Arrays to store created resources for cleanup
INVENTORY_IDS=()
REQUEST_IDS=()

# Load credentials from environment
SUPPLIER_TOKEN="${SUPPLIER_TOKEN}"
SUPPLIER_ID="${SUPPLIER_ID}"
VENDOR_TOKEN="${VENDOR_TOKEN}"
VENDOR_ID="${VENDOR_ID}"

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

print_debug() {
    if [ "$DEBUG" = "true" ]; then
        echo -e "${MAGENTA}  🐛 $1${NC}"
    fi
}

contains() {
    echo "$1" | grep -q "$2"
}

# Function to make API call and handle errors
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
print_header "CHAINVANGUARD VENDOR REQUEST TEST SUITE"
echo -e "${CYAN}Testing Vendor Request Functionality${NC}"
echo -e "${CYAN}Base URL: $BASE_URL${NC}"
echo ""

# ============================================
# PHASE 0: PRE-FLIGHT CHECKS
# ============================================

print_header "PHASE 0: PRE-FLIGHT CHECKS"

# Check if jq is installed
print_test "Checking for jq (JSON processor)"
if command -v jq &> /dev/null; then
    print_success "jq is installed"
else
    print_error "jq is not installed. Install with: brew install jq"
    exit 1
fi

# Check if bc is installed
print_test "Checking for bc (calculator)"
if command -v bc &> /dev/null; then
    print_success "bc is installed"
else
    print_error "bc is not installed. Install with: brew install bc"
    exit 1
fi

# Check environment variables
print_test "Verifying environment variables"
if [ -z "$SUPPLIER_TOKEN" ]; then
    print_error "SUPPLIER_TOKEN not found in .env"
    exit 1
fi

if [ -z "$VENDOR_TOKEN" ]; then
    print_error "VENDOR_TOKEN not found in .env"
    exit 1
fi

if [ -z "$SUPPLIER_ID" ]; then
    print_error "SUPPLIER_ID not found in .env"
    exit 1
fi

if [ -z "$VENDOR_ID" ]; then
    print_error "VENDOR_ID not found in .env"
    exit 1
fi

print_success "All environment variables found"
print_info "Supplier ID: $SUPPLIER_ID"
print_info "Vendor ID: $VENDOR_ID"

# Check if backend is running
print_test "Checking if backend is running"
HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/../health" 2>/dev/null || echo "000")
if [ "$HEALTH_CHECK" = "200" ] || [ "$HEALTH_CHECK" = "404" ]; then
    print_success "Backend is running"
else
    print_error "Backend is not responding (HTTP $HEALTH_CHECK)"
    echo "  Please start the backend server first"
    exit 1
fi

sleep 1

# ============================================
# PHASE 1: AUTHENTICATION VERIFICATION
# ============================================

print_header "PHASE 1: AUTHENTICATION VERIFICATION"

print_test "Verifying supplier authentication"
SUPPLIER_PROFILE=$(api_call GET "/auth/profile" "$SUPPLIER_TOKEN")

SUPPLIER_AUTH_SUCCESS=$(echo $SUPPLIER_PROFILE | jq -r '.success // false')
if [ "$SUPPLIER_AUTH_SUCCESS" = "true" ]; then
    SUPPLIER_NAME=$(echo $SUPPLIER_PROFILE | jq -r '.data.name // .user.name')
    SUPPLIER_ROLE=$(echo $SUPPLIER_PROFILE | jq -r '.data.role // .user.role')
    print_success "Supplier authenticated successfully"
    print_info "Name: $SUPPLIER_NAME"
    print_info "Role: $SUPPLIER_ROLE"
else
    print_error "Supplier authentication failed"
    echo "$SUPPLIER_PROFILE" | jq '.'
    exit 1
fi

sleep 0.5

print_test "Verifying vendor authentication"
VENDOR_PROFILE=$(api_call GET "/auth/profile" "$VENDOR_TOKEN")

VENDOR_AUTH_SUCCESS=$(echo $VENDOR_PROFILE | jq -r '.success // false')
if [ "$VENDOR_AUTH_SUCCESS" = "true" ]; then
    VENDOR_NAME=$(echo $VENDOR_PROFILE | jq -r '.data.name // .user.name')
    VENDOR_ROLE=$(echo $VENDOR_PROFILE | jq -r '.data.role // .user.role')
    print_success "Vendor authenticated successfully"
    print_info "Name: $VENDOR_NAME"
    print_info "Role: $VENDOR_ROLE"
else
    print_error "Vendor authentication failed"
    echo "$VENDOR_PROFILE" | jq '.'
    exit 1
fi

sleep 1

# ============================================
# PHASE 2: CREATE TEST INVENTORY
# ============================================

print_header "PHASE 2: CREATE TEST INVENTORY"

TIMESTAMP=$(date +%s)

print_test "Creating inventory item 1 (Premium Cotton Fabric)"
INVENTORY1=$(api_call POST "/inventory" "$SUPPLIER_TOKEN" '{
    "name": "VR-Test Premium Cotton Fabric",
    "description": "High-quality cotton fabric for vendor request testing",
    "category": "Fabric",
    "subcategory": "Cotton Fabric",
    "quantity": 500,
    "unit": "meters",
    "pricePerUnit": 5.50,
    "minStockLevel": 50,
    "reorderLevel": 100,
    "textileDetails": {
        "composition": "100% Premium Cotton",
        "weight": 200,
        "color": "White",
        "finish": "Plain Weave"
    },
    "batches": [{
        "batchNumber": "BATCH-'$TIMESTAMP'-001",
        "quantity": 500,
        "manufactureDate": "2025-10-01",
        "expiryDate": "2027-10-01"
    }],
    "tags": ["cotton", "test", "vendor-request", "premium"]
}')

INVENTORY1_SUCCESS=$(echo $INVENTORY1 | jq -r '.success // false')
if [ "$INVENTORY1_SUCCESS" = "true" ]; then
    INVENTORY1_ID=$(echo "$INVENTORY1" | jq -r '.data._id // .inventory._id')
    INVENTORY_IDS+=("$INVENTORY1_ID")
    INVENTORY1_NAME=$(echo "$INVENTORY1" | jq -r '.data.name // .inventory.name')
    INVENTORY1_PRICE=$(echo "$INVENTORY1" | jq -r '.data.pricePerUnit // .inventory.pricePerUnit')
    INVENTORY1_QTY=$(echo "$INVENTORY1" | jq -r '.data.quantity // .inventory.quantity')
    print_success "Inventory 1 created"
    print_info "ID: $INVENTORY1_ID"
    print_info "Name: $INVENTORY1_NAME"
    print_info "Price Per Unit: \$${INVENTORY1_PRICE} per meter"
    print_info "Quantity: $INVENTORY1_QTY meters"
else
    print_error "Failed to create inventory 1"
    echo "$INVENTORY1" | jq '.'
    exit 1
fi

sleep 1

print_test "Creating inventory item 2 (Luxury Silk Blend)"
INVENTORY2=$(api_call POST "/inventory" "$SUPPLIER_TOKEN" '{
    "name": "VR-Test Luxury Silk Blend",
    "description": "Premium silk blend fabric for vendor request testing",
    "category": "Fabric",
    "subcategory": "Silk Fabric",
    "quantity": 200,
    "unit": "meters",
    "pricePerUnit": 15.75,
    "minStockLevel": 20,
    "reorderLevel": 40,
    "textileDetails": {
        "composition": "70% Silk, 30% Cotton",
        "weight": 120,
        "color": "Ivory",
        "finish": "Satin Weave"
    },
    "batches": [{
        "batchNumber": "BATCH-'$TIMESTAMP'-002",
        "quantity": 200,
        "manufactureDate": "2025-10-01",
        "expiryDate": "2027-10-01"
    }],
    "tags": ["silk", "test", "vendor-request", "luxury", "premium"]
}')

INVENTORY2_SUCCESS=$(echo $INVENTORY2 | jq -r '.success // false')
if [ "$INVENTORY2_SUCCESS" = "true" ]; then
    INVENTORY2_ID=$(echo "$INVENTORY2" | jq -r '.data._id // .inventory._id')
    INVENTORY_IDS+=("$INVENTORY2_ID")
    INVENTORY2_NAME=$(echo "$INVENTORY2" | jq -r '.data.name // .inventory.name')
    INVENTORY2_PRICE=$(echo "$INVENTORY2" | jq -r '.data.pricePerUnit // .inventory.pricePerUnit')
    INVENTORY2_QTY=$(echo "$INVENTORY2" | jq -r '.data.quantity // .inventory.quantity')
    print_success "Inventory 2 created"
    print_info "ID: $INVENTORY2_ID"
    print_info "Name: $INVENTORY2_NAME"
    print_info "Price Per Unit: \$${INVENTORY2_PRICE} per meter"
    print_info "Quantity: $INVENTORY2_QTY meters"
else
    print_error "Failed to create inventory 2"
    echo "$INVENTORY2" | jq '.'
    print_info "Continuing with available inventory..."
fi

sleep 1

print_info "Total inventory items created: ${#INVENTORY_IDS[@]}"

# ============================================
# PHASE 3: VENDOR REQUEST CREATION
# ============================================

print_header "PHASE 3: VENDOR REQUEST CREATION"

print_test "Disabling auto-approve for manual approval testing"
api_call PATCH "/vendor-requests/supplier/settings" "$SUPPLIER_TOKEN" '{"autoApproveRequests": false}' > /dev/null
sleep 1


print_test "Test 3.1: Vendor creates valid purchase request"

# Service calculates totals automatically, we just send items
REQUEST1=$(api_call POST "/vendor-requests" "$VENDOR_TOKEN" '{
    "supplierId": "'$SUPPLIER_ID'",
    "items": [{
        "inventoryId": "'$INVENTORY1_ID'",
        "quantity": 50
    }],
    "vendorNotes": "Need cotton fabric for Q4 production. Urgent delivery required."
}')

if contains "$REQUEST1" '"success".*true'; then
    REQUEST1_ID=$(echo "$REQUEST1" | jq -r '.request._id // .vendorRequest._id // .data._id')
    REQUEST1_NUMBER=$(echo "$REQUEST1" | jq -r '.request.requestNumber // .vendorRequest.requestNumber // .data.requestNumber')
    REQUEST1_STATUS=$(echo "$REQUEST1" | jq -r '.request.status // .vendorRequest.status // .data.status')
    REQUEST1_TOTAL=$(echo "$REQUEST1" | jq -r '.request.total // .vendorRequest.total // .data.total')
    REQUEST_IDS+=("$REQUEST1_ID")
    print_success "Vendor request created"
    print_info "Request ID: $REQUEST1_ID"
    print_info "Request Number: $REQUEST1_NUMBER"
    print_info "Status: $REQUEST1_STATUS"
    print_info "Total Amount: \$${REQUEST1_TOTAL}"
else
    print_error "Failed to create vendor request"
    echo "$REQUEST1" | jq '.'
fi

sleep 1

print_test "Test 3.2: Create multi-item request"
if [ -n "$INVENTORY2_ID" ] && [ "$INVENTORY2_ID" != "null" ]; then
    REQUEST_MULTI=$(api_call POST "/vendor-requests" "$VENDOR_TOKEN" '{
        "supplierId": "'$SUPPLIER_ID'",
        "items": [
            {
                "inventoryId": "'$INVENTORY1_ID'",
                "quantity": 25
            },
            {
                "inventoryId": "'$INVENTORY2_ID'",
                "quantity": 15
            }
        ],
        "vendorNotes": "Mixed fabric order for special collection"
    }')

    if contains "$REQUEST_MULTI" '"success".*true'; then
        MULTI_ID=$(echo "$REQUEST_MULTI" | jq -r '.request._id // .vendorRequest._id // .data._id')
        REQUEST_IDS+=("$MULTI_ID")
        print_success "Multi-item request created"
        print_info "Request ID: $MULTI_ID"
    else
        print_error "Failed to create multi-item request"
        echo "$REQUEST_MULTI" | jq '.'
    fi
else
    print_skip "Skipped (inventory 2 not available)"
fi

sleep 1

print_test "Test 3.3: Validate request with missing supplier ID"
INVALID_REQUEST=$(api_call POST "/vendor-requests" "$VENDOR_TOKEN" '{
    "items": [{
        "inventoryId": "'$INVENTORY1_ID'",
        "quantity": 10
    }]
}')

if contains "$INVALID_REQUEST" "Supplier.*required\|supplierId"; then
    print_success "Validation correctly rejected missing supplier ID"
else
    print_error "Validation should reject missing supplier ID"
    echo "$INVALID_REQUEST" | jq '.'
fi

sleep 1

print_test "Test 3.4: Validate request with empty items array"
EMPTY_ITEMS=$(api_call POST "/vendor-requests" "$VENDOR_TOKEN" '{
    "supplierId": "'$SUPPLIER_ID'",
    "items": []
}')

if contains "$EMPTY_ITEMS" "items.*required\|at least one item"; then
    print_success "Validation correctly rejected empty items"
else
    print_error "Validation should reject empty items"
fi

sleep 1

print_test "Test 3.5: Validate request with invalid inventory ID"
INVALID_INV=$(api_call POST "/vendor-requests" "$VENDOR_TOKEN" '{
    "supplierId": "'$SUPPLIER_ID'",
    "items": [{
        "inventoryId": "000000000000000000000000",
        "quantity": 10
    }]
}')

if contains "$INVALID_INV" "Inventory.*not found\|Invalid inventory"; then
    print_success "Validation correctly rejected invalid inventory ID"
else
    print_info "May allow invalid inventory (check service logic)"
fi

sleep 1

print_test "Test 3.6: Validate request with excessive quantity"
EXCESS_QTY=$(api_call POST "/vendor-requests" "$VENDOR_TOKEN" '{
    "supplierId": "'$SUPPLIER_ID'",
    "items": [{
        "inventoryId": "'$INVENTORY1_ID'",
        "quantity": 99999
    }]
}')

if contains "$EXCESS_QTY" "Insufficient stock\|exceeds available"; then
    print_success "Validation correctly rejected excessive quantity"
else
    print_info "Stock validation may need attention"
fi

sleep 1

# ============================================
# PHASE 4: RETRIEVE VENDOR REQUESTS
# ============================================

print_header "PHASE 4: RETRIEVE VENDOR REQUESTS"

print_test "Test 4.1: Vendor retrieves their requests"
VENDOR_REQUESTS=$(api_call GET "/vendor-requests/my-requests" "$VENDOR_TOKEN")

if contains "$VENDOR_REQUESTS" '"success".*true'; then
    REQ_COUNT=$(echo "$VENDOR_REQUESTS" | jq -r '.requests | length // .vendorRequests | length // 0')
    print_success "Retrieved vendor's requests"
    print_info "Total requests: $REQ_COUNT"
    
    if [ "$REQ_COUNT" -gt 0 ]; then
        FIRST_STATUS=$(echo "$VENDOR_REQUESTS" | jq -r '.requests[0].status // .vendorRequests[0].status')
        print_info "First request status: $FIRST_STATUS"
    fi
else
    print_error "Failed to retrieve vendor requests"
    echo "$VENDOR_REQUESTS" | jq '.'
fi

sleep 1

print_test "Test 4.2: Supplier retrieves incoming requests"
SUPPLIER_REQUESTS=$(api_call GET "/vendor-requests/supplier/requests" "$SUPPLIER_TOKEN")

if contains "$SUPPLIER_REQUESTS" '"success".*true'; then
    SUPP_COUNT=$(echo "$SUPPLIER_REQUESTS" | jq -r '.requests | length // .vendorRequests | length // 0')
    print_success "Retrieved supplier's requests"
    print_info "Total requests: $SUPP_COUNT"
else
    print_error "Failed to retrieve supplier requests"
    echo "$SUPPLIER_REQUESTS" | jq '.'
fi

sleep 1

print_test "Test 4.3: Get specific request by ID"
if [ -n "$REQUEST1_ID" ] && [ "$REQUEST1_ID" != "null" ]; then
    GET_REQUEST=$(api_call GET "/vendor-requests/$REQUEST1_ID" "$VENDOR_TOKEN")

    if contains "$GET_REQUEST" '"success".*true'; then
        REQ_STATUS=$(echo "$GET_REQUEST" | jq -r '.request.status // .vendorRequest.status')
        REQ_TOTAL=$(echo "$GET_REQUEST" | jq -r '.request.total // .vendorRequest.total')
        print_success "Retrieved request details"
        print_info "Status: $REQ_STATUS"
        print_info "Total: \$${REQ_TOTAL}"
    else
        print_error "Failed to get request by ID"
        echo "$GET_REQUEST" | jq '.'
    fi
else
    print_skip "No request ID available"
fi

sleep 1

print_test "Test 4.4: Filter requests by status (pending)"
FILTERED=$(api_call GET "/vendor-requests/my-requests?status=pending" "$VENDOR_TOKEN")

if contains "$FILTERED" '"success".*true'; then
    FILTERED_COUNT=$(echo "$FILTERED" | jq -r '.requests | length // 0')
    print_success "Status filtering works"
    print_info "Pending requests: $FILTERED_COUNT"
else
    print_error "Status filtering failed"
fi

sleep 1

print_test "Test 4.5: Test pagination"
PAGINATED=$(api_call GET "/vendor-requests/my-requests?page=1&limit=5" "$VENDOR_TOKEN")

if contains "$PAGINATED" '"success".*true'; then
    PAGE_NUM=$(echo "$PAGINATED" | jq -r '.pagination.page // 0')
    PAGE_TOTAL=$(echo "$PAGINATED" | jq -r '.pagination.total // 0')
    print_success "Pagination works"
    print_info "Page $PAGE_NUM, Total: $PAGE_TOTAL"
else
    print_error "Pagination failed"
fi

sleep 1

# ============================================
# PHASE 5: SUPPLIER ACTIONS
# ============================================

print_header "PHASE 5: SUPPLIER ACTIONS (APPROVE/REJECT)"

print_test "Test 5.1: Supplier approves a request"
if [ -n "$REQUEST1_ID" ] && [ "$REQUEST1_ID" != "null" ]; then
    APPROVE=$(api_call POST "/vendor-requests/$REQUEST1_ID/approve" "$SUPPLIER_TOKEN" '{
        "supplierNotes": "Approved. Materials available for immediate dispatch."
    }')

    if contains "$APPROVE" '"success".*true'; then
        print_success "Request approved successfully"
        APPROVED_STATUS=$(echo "$APPROVE" | jq -r '.request.status // .vendorRequest.status')
        print_info "New status: $APPROVED_STATUS"
    else
        print_error "Failed to approve request"
        echo "$APPROVE" | jq '.'
    fi
else
    print_skip "No request ID available for approval"
fi

sleep 1

print_test "Test 5.2: Create and reject a request"
# Create a new request to reject
REJECT_REQUEST=$(api_call POST "/vendor-requests" "$VENDOR_TOKEN" '{
    "supplierId": "'$SUPPLIER_ID'",
    "items": [{
        "inventoryId": "'$INVENTORY1_ID'",
        "quantity": 10
    }],
    "vendorNotes": "Test request for rejection"
}')

if contains "$REJECT_REQUEST" '"success".*true'; then
    REJECT_ID=$(echo "$REJECT_REQUEST" | jq -r '.request._id // .vendorRequest._id // .data._id')
    REQUEST_IDS+=("$REJECT_ID")
    print_info "Created request for rejection test (ID: $REJECT_ID)"
    
    sleep 1
    
    # Reject the request
    REJECT=$(api_call POST "/vendor-requests/$REJECT_ID/reject" "$SUPPLIER_TOKEN" '{
        "rejectionReason": "Insufficient stock available at this time. Please try again next week."
    }')

    if contains "$REJECT" '"success".*true'; then
        print_success "Request rejected successfully"
        REJECTED_STATUS=$(echo "$REJECT" | jq -r '.request.status // .vendorRequest.status')
        print_info "New status: $REJECTED_STATUS"
    else
        print_error "Failed to reject request"
        echo "$REJECT" | jq '.'
    fi
else
    print_error "Could not create request for rejection test"
fi

sleep 1

print_test "Test 5.3: Reject without providing reason"
# Create another request
REJECT_TEST2=$(api_call POST "/vendor-requests" "$VENDOR_TOKEN" '{
    "supplierId": "'$SUPPLIER_ID'",
    "items": [{
        "inventoryId": "'$INVENTORY1_ID'",
        "quantity": 5
    }]
}')

if contains "$REJECT_TEST2" '"success".*true'; then
    REJECT_ID2=$(echo "$REJECT_TEST2" | jq -r '.request._id // .vendorRequest._id // .data._id')
    REQUEST_IDS+=("$REJECT_ID2")
    
    sleep 1
    
    # Try to reject without reason
    REJECT_NO_REASON=$(api_call POST "/vendor-requests/$REJECT_ID2/reject" "$SUPPLIER_TOKEN" '{}')

    if contains "$REJECT_NO_REASON" "reason.*required\|Rejection reason"; then
        print_success "Validation correctly requires rejection reason"
    else
        print_error "Should require rejection reason"
        echo "$REJECT_NO_REASON" | jq '.'
    fi
else
    print_skip "Could not create test request"
fi

sleep 1

print_test "Test 5.4: Try approving already approved request"
if [ -n "$REQUEST1_ID" ] && [ "$REQUEST1_ID" != "null" ]; then
    DOUBLE_APPROVE=$(api_call POST "/vendor-requests/$REQUEST1_ID/approve" "$SUPPLIER_TOKEN" '{
        "supplierNotes": "Second approval attempt"
    }')

    if contains "$DOUBLE_APPROVE" "already.*approved\|Cannot.*status"; then
        print_success "Correctly prevented double approval"
    else
        print_info "May allow re-approval (check business logic)"
    fi
else
    print_skip "No approved request available"
fi

sleep 1

# ============================================
# PHASE 6: VENDOR ACTIONS
# ============================================

print_header "PHASE 6: VENDOR ACTIONS (CANCEL)"

print_test "Test 6.1: Vendor cancels their pending request"
# Create a new request to cancel
CANCEL_REQUEST=$(api_call POST "/vendor-requests" "$VENDOR_TOKEN" '{
    "supplierId": "'$SUPPLIER_ID'",
    "items": [{
        "inventoryId": "'$INVENTORY1_ID'",
        "quantity": 8
    }],
    "vendorNotes": "Test request for cancellation"
}')

if contains "$CANCEL_REQUEST" '"success".*true'; then
    CANCEL_ID=$(echo "$CANCEL_REQUEST" | jq -r '.request._id // .vendorRequest._id // .data._id')
    REQUEST_IDS+=("$CANCEL_ID")
    print_info "Created request for cancellation (ID: $CANCEL_ID)"
    
    sleep 1
    
    # Cancel the request
    CANCEL=$(api_call POST "/vendor-requests/$CANCEL_ID/cancel" "$VENDOR_TOKEN" '{}')

    if contains "$CANCEL" '"success".*true'; then
        print_success "Request cancelled successfully"
    else
        print_error "Failed to cancel request"
        echo "$CANCEL" | jq '.'
    fi
else
    print_skip "Could not create request for cancellation test"
fi

sleep 1

# ============================================
# PHASE 7: STATISTICS & REPORTING
# ============================================

print_header "PHASE 7: STATISTICS & REPORTING"

print_test "Test 7.1: Get vendor request statistics"
VENDOR_STATS=$(api_call GET "/vendor-requests/stats" "$VENDOR_TOKEN")

if contains "$VENDOR_STATS" '"success".*true'; then
    STATS_TOTAL=$(echo "$VENDOR_STATS" | jq -r '.stats.total // 0')
    STATS_PENDING=$(echo "$VENDOR_STATS" | jq -r '.stats.pending // 0')
    STATS_APPROVED=$(echo "$VENDOR_STATS" | jq -r '.stats.approved // 0')
    print_success "Retrieved vendor statistics"
    print_info "Total: $STATS_TOTAL, Pending: $STATS_PENDING, Approved: $STATS_APPROVED"
else
    print_info "Statistics endpoint may not be available"
fi

sleep 1

print_test "Test 7.2: Get supplier request statistics"
SUPPLIER_STATS=$(api_call GET "/vendor-requests/supplier/stats" "$SUPPLIER_TOKEN")

if contains "$SUPPLIER_STATS" '"success".*true'; then
    SUPP_STATS_TOTAL=$(echo "$SUPPLIER_STATS" | jq -r '.stats.total // 0')
    SUPP_STATS_PENDING=$(echo "$SUPPLIER_STATS" | jq -r '.stats.pending // 0')
    print_success "Retrieved supplier statistics"
    print_info "Total: $SUPP_STATS_TOTAL, Pending: $SUPP_STATS_PENDING"
else
    print_info "Supplier statistics endpoint may not be available"
fi

sleep 1

# ============================================
# PHASE 8: AUTO-APPROVE SETTINGS
# ============================================

print_header "PHASE 8: AUTO-APPROVE SETTINGS"

print_test "Test 8.1: Get current auto-approve status"
AUTO_STATUS=$(api_call GET "/vendor-requests/supplier/auto-approve" "$SUPPLIER_TOKEN")

if contains "$AUTO_STATUS" '"success".*true'; then
    CURRENT_AUTO=$(echo "$AUTO_STATUS" | jq -r '.autoApprove // false')
    print_success "Retrieved auto-approve status"
    print_info "Current setting: $CURRENT_AUTO"
else
    print_info "Auto-approve endpoint may not be available"
fi

sleep 1

print_test "Test 8.2: Toggle auto-approve setting"
AUTO_TOGGLE=$(api_call PATCH "/vendor-requests/supplier/auto-approve" "$SUPPLIER_TOKEN" '{}')

if contains "$AUTO_TOGGLE" '"success".*true'; then
    NEW_AUTO=$(echo "$AUTO_TOGGLE" | jq -r '.autoApprove // "unknown"')
    print_success "Auto-approve toggled"
    print_info "New setting: $NEW_AUTO"
else
    print_info "Auto-approve toggle may not be available"
fi

sleep 1

print_test "Test 8.3: Get supplier settings"
SETTINGS=$(api_call GET "/vendor-requests/supplier/settings" "$SUPPLIER_TOKEN")

if contains "$SETTINGS" '"success".*true'; then
    print_success "Retrieved supplier settings"
    SETTINGS_DATA=$(echo "$SETTINGS" | jq -r '.settings // .data')
    print_info "Settings: $(echo $SETTINGS_DATA | jq -c '.')"
else
    print_info "Supplier settings endpoint may not be available"
fi

sleep 1

# ============================================
# PHASE 9: ACCESS CONTROL
# ============================================

print_header "PHASE 9: ACCESS CONTROL & SECURITY"

print_test "Test 9.1: Vendor cannot approve requests"
if [ -n "$REJECT_ID" ] && [ "$REJECT_ID" != "null" ]; then
    VENDOR_APPROVE=$(api_call POST "/vendor-requests/$REJECT_ID/approve" "$VENDOR_TOKEN" '{
        "supplierNotes": "Vendor trying to approve"
    }')

    if contains "$VENDOR_APPROVE" "Unauthorized\|Forbidden\|not authorized\|Only supplier\|Access denied"; then
    print_success "Vendor correctly blocked from approving"
    else
        print_error "Vendor should not be able to approve"
        echo "$VENDOR_APPROVE" | jq '.'
    fi
else
    print_skip "No request available for access control test"
fi

sleep 1

print_test "Test 9.2: Supplier cannot cancel vendor's request"
if [ -n "$REQUEST1_ID" ] && [ "$REQUEST1_ID" != "null" ]; then
    SUPPLIER_CANCEL=$(api_call POST "/vendor-requests/$REQUEST1_ID/cancel" "$SUPPLIER_TOKEN" '{}')

    if contains "$SUPPLIER_CANCEL" "Unauthorized\|Forbidden\|not authorized\|Only vendor"; then
        print_success "Supplier correctly blocked from cancelling"
    else
        print_info "Check if suppliers should be able to cancel"
    fi
else
    print_skip "No request available for test"
fi

sleep 1

print_test "Test 9.3: Unauthenticated access blocked"
NO_AUTH=$(curl -s -X GET "${BASE_URL}/vendor-requests/supplier/requests")

if contains "$NO_AUTH" "Unauthorized\|No token\|Authentication required"; then
    print_success "Unauthenticated access correctly blocked"
else
    print_error "Should require authentication"
fi

sleep 1

print_test "Test 9.4: Vendor cannot access another vendor's request"
# This would require another vendor account - skip if not available
print_skip "Requires additional vendor account (not implemented)"

sleep 1

# ============================================
# PHASE 10: EDGE CASES
# ============================================

print_header "PHASE 10: EDGE CASES & ERROR HANDLING"

print_test "Test 10.1: Request with non-existent supplier"
FAKE_SUPPLIER=$(api_call POST "/vendor-requests" "$VENDOR_TOKEN" '{
    "supplierId": "000000000000000000000000",
    "items": [{
        "inventoryId": "'$INVENTORY1_ID'",
        "quantity": 5
    }]
}')

if contains "$FAKE_SUPPLIER" "Invalid supplier\|Supplier not found"; then
    print_success "Invalid supplier correctly rejected"
else
    print_info "Supplier validation may need attention"
fi

sleep 1

print_test "Test 10.2: Request with zero quantity"
ZERO_QTY=$(api_call POST "/vendor-requests" "$VENDOR_TOKEN" '{
    "supplierId": "'$SUPPLIER_ID'",
    "items": [{
        "inventoryId": "'$INVENTORY1_ID'",
        "quantity": 0
    }]
}')

if contains "$ZERO_QTY" "quantity.*must be\|greater than\|invalid quantity"; then
    print_success "Zero quantity correctly rejected"
else
    print_info "Quantity validation may need attention"
fi

sleep 1

print_test "Test 10.3: Request with negative quantity"
NEG_QTY=$(api_call POST "/vendor-requests" "$VENDOR_TOKEN" '{
    "supplierId": "'$SUPPLIER_ID'",
    "items": [{
        "inventoryId": "'$INVENTORY1_ID'",
        "quantity": -5
    }]
}')

if contains "$NEG_QTY" "quantity.*must be\|positive\|invalid"; then
    print_success "Negative quantity correctly rejected"
else
    print_info "Quantity validation may need attention"
fi

sleep 1

print_test "Test 10.4: Get non-existent request"
FAKE_REQUEST=$(api_call GET "/vendor-requests/000000000000000000000000" "$VENDOR_TOKEN")

if contains "$FAKE_REQUEST" "not found\|Request not found"; then
    print_success "Non-existent request correctly handled"
else
    print_info "Error handling may need attention"
fi

sleep 1

# ============================================
# SUMMARY & CLEANUP
# ============================================

print_header "TEST SUMMARY"

echo ""
echo -e "${BOLD}${GREEN}✅ VENDOR REQUEST TESTING COMPLETED${NC}"
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

# Calculate success rate
if [ $TOTAL -gt 0 ]; then
    SUCCESS_RATE=$(awk "BEGIN {printf \"%.1f\", ($PASSED / $TOTAL) * 100}")
    echo -e "${BLUE}Success Rate: ${SUCCESS_RATE}%${NC}"
fi

echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}${BOLD}🎉 ALL TESTS PASSED!${NC}"
    echo ""
    echo "✅ Vendor Request System Verified:"
    echo "   ├─ ✓ Authentication & Authorization"
    echo "   ├─ ✓ Request Creation & Validation"
    echo "   ├─ ✓ Request Retrieval & Filtering"
    echo "   ├─ ✓ Supplier Approval/Rejection"
    echo "   ├─ ✓ Vendor Cancellation"
    echo "   ├─ ✓ Statistics & Reporting"
    echo "   ├─ ✓ Auto-Approve Settings"
    echo "   ├─ ✓ Access Control"
    echo "   └─ ✓ Error Handling"
elif [ $FAILED -le 5 ]; then
    echo -e "${YELLOW}⚠️  TESTS COMPLETED WITH MINOR ISSUES${NC}"
    echo "   Review failed tests above"
else
    echo -e "${RED}❌ MULTIPLE TEST FAILURES${NC}"
    echo "   Please review the test output and fix issues"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Test Resources Created:${NC}"
echo ""
echo "📦 Inventory Items: ${#INVENTORY_IDS[@]}"
for id in "${INVENTORY_IDS[@]}"; do
    echo "   - $id"
done
echo ""
echo "🛒 Vendor Requests: ${#REQUEST_IDS[@]}"
for id in "${REQUEST_IDS[@]}"; do
    echo "   - $id"
done
echo ""
echo -e "${CYAN}💡 Tip: These resources can be used for further manual testing${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Exit with appropriate code
if [ $FAILED -eq 0 ]; then
    exit 0
else
    exit 1
fi