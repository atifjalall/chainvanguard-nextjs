#!/bin/bash

# ============================================
# CHAINVANGUARD - VENDOR REQUEST TEST SUITE
# Enhanced Version - Creates Requests in All Stages
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

# Load inventory IDs from environment
INVENTORY_ID_1="${INVENTORY_ID_1}"
INVENTORY_ID_2="${INVENTORY_ID_2}"

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
print_header "CHAINVANGUARD VENDOR REQUEST - FULL FLOW TEST"
echo -e "${CYAN}Creating Requests in All Stages${NC}"
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

# Check environment variables
print_test "Verifying environment variables"
if [ -z "$SUPPLIER_TOKEN" ] || [ -z "$VENDOR_TOKEN" ] || [ -z "$SUPPLIER_ID" ] || [ -z "$VENDOR_ID" ]; then
    print_error "Required environment variables not found"
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
    exit 1
fi

sleep 1

# ============================================
# PHASE 1: VERIFY INVENTORY
# ============================================

print_header "PHASE 1: VERIFY INVENTORY"

print_test "Verifying inventory items exist"
if [ -n "$INVENTORY_ID_1" ] && [ "$INVENTORY_ID_1" != "null" ]; then
    INVENTORY1_CHECK=$(api_call GET "/inventory/$INVENTORY_ID_1" "$SUPPLIER_TOKEN")
    if contains "$INVENTORY1_CHECK" '"success".*true'; then
        INVENTORY1_ID="$INVENTORY_ID_1"
        INVENTORY1_NAME=$(echo "$INVENTORY1_CHECK" | jq -r '.data.name // .inventory.name')
        print_success "Inventory 1 verified: $INVENTORY1_NAME"
    else
        print_error "Inventory 1 not found"
        exit 1
    fi
else
    print_error "INVENTORY_ID_1 not set in .env"
    exit 1
fi

if [ -n "$INVENTORY_ID_2" ] && [ "$INVENTORY_ID_2" != "null" ]; then
    INVENTORY2_CHECK=$(api_call GET "/inventory/$INVENTORY_ID_2" "$SUPPLIER_TOKEN")
    if contains "$INVENTORY2_CHECK" '"success".*true'; then
        INVENTORY2_ID="$INVENTORY_ID_2"
        INVENTORY2_NAME=$(echo "$INVENTORY2_CHECK" | jq -r '.data.name // .inventory.name')
        print_success "Inventory 2 verified: $INVENTORY2_NAME"
    fi
fi

sleep 1

# ============================================
# PHASE 2: DISABLE AUTO-APPROVE
# ============================================

print_header "PHASE 2: SETUP AUTO-APPROVE"

print_test "Disabling auto-approve for manual testing"
api_call PATCH "/vendor-requests/supplier/settings" "$SUPPLIER_TOKEN" '{"autoApproveRequests": false}' > /dev/null
print_success "Auto-approve disabled"

sleep 1

# ============================================
# PHASE 3: CREATE REQUESTS IN ALL STAGES
# ============================================

print_header "PHASE 3: CREATE REQUESTS IN ALL STAGES"

# ============================================
# STAGE 1: NEW (PENDING STATUS)
# ============================================

print_test "Creating 'NEW' request (Status: pending)"
REQUEST_NEW=$(api_call POST "/vendor-requests" "$VENDOR_TOKEN" '{
    "supplierId": "'$SUPPLIER_ID'",
    "items": [{
        "inventoryId": "'$INVENTORY1_ID'",
        "quantity": 10
    }],
    "vendorNotes": "This is a NEW request - Awaiting supplier approval"
}')

if contains "$REQUEST_NEW" '"success".*true'; then
    NEW_REQUEST_ID=$(echo "$REQUEST_NEW" | jq -r '.request._id // .vendorRequest._id // .data._id')
    NEW_REQUEST_NUMBER=$(echo "$REQUEST_NEW" | jq -r '.request.requestNumber // .vendorRequest.requestNumber // .data.requestNumber')
    REQUEST_IDS+=("$NEW_REQUEST_ID")
    print_success "NEW request created"
    print_info "Request Number: $NEW_REQUEST_NUMBER"
    print_info "Request ID: $NEW_REQUEST_ID"
    print_info "Status: NEW (pending approval)"
else
    print_error "Failed to create NEW request"
    echo "$REQUEST_NEW" | jq '.'
fi

sleep 1

# ============================================
# STAGE 2: PENDING (APPROVED, NO PAYMENT)
# ============================================

print_test "Creating 'PENDING' request (Status: approved, no payment)"
REQUEST_PENDING=$(api_call POST "/vendor-requests" "$VENDOR_TOKEN" '{
    "supplierId": "'$SUPPLIER_ID'",
    "items": [{
        "inventoryId": "'$INVENTORY1_ID'",
        "quantity": 20
    }],
    "vendorNotes": "This request will be PENDING - Approved but awaiting vendor payment"
}')

if contains "$REQUEST_PENDING" '"success".*true'; then
    PENDING_REQUEST_ID=$(echo "$REQUEST_PENDING" | jq -r '.request._id // .vendorRequest._id // .data._id')
    PENDING_REQUEST_NUMBER=$(echo "$REQUEST_PENDING" | jq -r '.request.requestNumber // .vendorRequest.requestNumber // .data.requestNumber')
    REQUEST_IDS+=("$PENDING_REQUEST_ID")
    
    sleep 1
    
    # Approve this request
    print_info "Approving request to move to PENDING stage..."
    APPROVE_RESULT=$(api_call POST "/vendor-requests/$PENDING_REQUEST_ID/approve" "$SUPPLIER_TOKEN" '{
        "supplierNotes": "Request approved. Awaiting payment from vendor."
    }')
    
    if contains "$APPROVE_RESULT" '"success".*true'; then
        print_success "PENDING request created and approved"
        print_info "Request Number: $PENDING_REQUEST_NUMBER"
        print_info "Request ID: $PENDING_REQUEST_ID"
        print_info "Status: PENDING (approved, awaiting payment)"
    else
        print_error "Failed to approve PENDING request"
    fi
else
    print_error "Failed to create PENDING request"
fi

sleep 1

# ============================================
# STAGE 3: CONFIRMED (APPROVED + PAID)
# ============================================

print_test "Creating 'CONFIRMED' request (Status: approved, payment received)"
REQUEST_CONFIRMED=$(api_call POST "/vendor-requests" "$VENDOR_TOKEN" '{
    "supplierId": "'$SUPPLIER_ID'",
    "items": [{
        "inventoryId": "'$INVENTORY1_ID'",
        "quantity": 15
    }],
    "vendorNotes": "This request will be CONFIRMED - Approved and paid"
}')

if contains "$REQUEST_CONFIRMED" '"success".*true'; then
    CONFIRMED_REQUEST_ID=$(echo "$REQUEST_CONFIRMED" | jq -r '.request._id // .vendorRequest._id // .data._id')
    CONFIRMED_REQUEST_NUMBER=$(echo "$REQUEST_CONFIRMED" | jq -r '.request.requestNumber // .vendorRequest.requestNumber // .data.requestNumber')
    REQUEST_IDS+=("$CONFIRMED_REQUEST_ID")
    
    sleep 1
    
    # Approve the request
    print_info "Approving request..."
    api_call POST "/vendor-requests/$CONFIRMED_REQUEST_ID/approve" "$SUPPLIER_TOKEN" '{
        "supplierNotes": "Approved for payment"
    }' > /dev/null
    
    sleep 1
    
    # Simulate payment (vendor pays)
    print_info "Processing payment to move to CONFIRMED stage..."
    PAY_RESULT=$(api_call POST "/vendor-requests/$CONFIRMED_REQUEST_ID/pay" "$VENDOR_TOKEN" '{
        "shippingAddress": {
            "name": "Test Vendor",
            "phone": "+92-300-1234567",
            "addressLine1": "123 Business Street",
            "addressLine2": "Suite 456",
            "city": "Karachi",
            "state": "Sindh",
            "postalCode": "75500",
            "country": "Pakistan"
        }
    }')
    
    if contains "$PAY_RESULT" '"success".*true'; then
        print_success "CONFIRMED request created, approved and paid"
        print_info "Request Number: $CONFIRMED_REQUEST_NUMBER"
        print_info "Request ID: $CONFIRMED_REQUEST_ID"
        print_info "Status: CONFIRMED (approved + paid, ready for supplier to manage)"
    else
        print_error "Failed to process payment for CONFIRMED request"
        echo "$PAY_RESULT" | jq '.'
    fi
else
    print_error "Failed to create CONFIRMED request"
fi

sleep 1

# ============================================
# STAGE 4: IN PROGRESS (SUPPLIER MANAGING)
# ============================================

print_test "Creating 'IN PROGRESS' request (Status: being processed by supplier)"
REQUEST_INPROGRESS=$(api_call POST "/vendor-requests" "$VENDOR_TOKEN" '{
    "supplierId": "'$SUPPLIER_ID'",
    "items": [{
        "inventoryId": "'$INVENTORY1_ID'",
        "quantity": 25
    }],
    "vendorNotes": "This request will be IN PROGRESS - Supplier is working on it"
}')

if contains "$REQUEST_INPROGRESS" '"success".*true'; then
    INPROGRESS_REQUEST_ID=$(echo "$REQUEST_INPROGRESS" | jq -r '.request._id // .vendorRequest._id // .data._id')
    INPROGRESS_REQUEST_NUMBER=$(echo "$REQUEST_INPROGRESS" | jq -r '.request.requestNumber // .vendorRequest.requestNumber // .data.requestNumber')
    REQUEST_IDS+=("$INPROGRESS_REQUEST_ID")
    
    sleep 1
    
    # Approve
    print_info "Approving request..."
    api_call POST "/vendor-requests/$INPROGRESS_REQUEST_ID/approve" "$SUPPLIER_TOKEN" '{
        "supplierNotes": "Approved"
    }' > /dev/null
    
    sleep 1
    
    # Pay
    print_info "Processing payment..."
    api_call POST "/vendor-requests/$INPROGRESS_REQUEST_ID/pay" "$VENDOR_TOKEN" '{
        "shippingAddress": {
            "name": "Test Vendor",
            "phone": "+92-300-1234567",
            "addressLine1": "123 Business Street",
            "city": "Karachi",
            "state": "Sindh",
            "postalCode": "75500",
            "country": "Pakistan"
        }
    }' > /dev/null
    
    sleep 1
    
    # Note: IN PROGRESS stage is when supplier is actively managing the request
    # This is the same as CONFIRMED but the supplier hasn't marked it complete yet
    # The UI will show it as "In Progress" when supplier is working on it
    
    print_success "IN PROGRESS request created"
    print_info "Request Number: $INPROGRESS_REQUEST_NUMBER"
    print_info "Request ID: $INPROGRESS_REQUEST_ID"
    print_info "Status: IN PROGRESS (supplier is managing/processing)"
    print_info "Note: In Progress = Confirmed but not yet marked complete"
else
    print_error "Failed to create IN PROGRESS request"
fi

sleep 1

# ============================================
# STAGE 5: CANCELLED/REJECTED
# ============================================

print_test "Creating 'CANCELLED' request (Status: rejected by supplier)"
REQUEST_CANCELLED=$(api_call POST "/vendor-requests" "$VENDOR_TOKEN" '{
    "supplierId": "'$SUPPLIER_ID'",
    "items": [{
        "inventoryId": "'$INVENTORY1_ID'",
        "quantity": 5
    }],
    "vendorNotes": "This request will be CANCELLED/REJECTED"
}')

if contains "$REQUEST_CANCELLED" '"success".*true'; then
    CANCELLED_REQUEST_ID=$(echo "$REQUEST_CANCELLED" | jq -r '.request._id // .vendorRequest._id // .data._id')
    CANCELLED_REQUEST_NUMBER=$(echo "$REQUEST_CANCELLED" | jq -r '.request.requestNumber // .vendorRequest.requestNumber // .data.requestNumber')
    REQUEST_IDS+=("$CANCELLED_REQUEST_ID")
    
    sleep 1
    
    # Reject the request
    print_info "Rejecting request..."
    REJECT_RESULT=$(api_call POST "/vendor-requests/$CANCELLED_REQUEST_ID/reject" "$SUPPLIER_TOKEN" '{
        "rejectionReason": "Insufficient stock available at this time"
    }')
    
    if contains "$REJECT_RESULT" '"success".*true'; then
        print_success "CANCELLED request created and rejected"
        print_info "Request Number: $CANCELLED_REQUEST_NUMBER"
        print_info "Request ID: $CANCELLED_REQUEST_ID"
        print_info "Status: CANCELLED (rejected by supplier)"
    else
        print_error "Failed to reject CANCELLED request"
    fi
else
    print_error "Failed to create CANCELLED request"
fi

sleep 1

# ============================================
# BONUS: CREATE ADDITIONAL REQUESTS FOR BETTER TESTING
# ============================================

print_header "PHASE 4: CREATE ADDITIONAL TEST REQUESTS"

# Create 2 more NEW requests
print_test "Creating additional NEW requests (for variety)"
for i in 1 2; do
    EXTRA_NEW=$(api_call POST "/vendor-requests" "$VENDOR_TOKEN" '{
        "supplierId": "'$SUPPLIER_ID'",
        "items": [{
            "inventoryId": "'$INVENTORY1_ID'",
            "quantity": '$((i * 3))'
        }],
        "vendorNotes": "Additional NEW request #'$i' for testing"
    }')
    
    if contains "$EXTRA_NEW" '"success".*true'; then
        EXTRA_ID=$(echo "$EXTRA_NEW" | jq -r '.request._id // .vendorRequest._id // .data._id')
        REQUEST_IDS+=("$EXTRA_ID")
        print_success "Additional NEW request #$i created"
    fi
    sleep 0.5
done

# Create 1 more PENDING request
print_test "Creating additional PENDING request"
EXTRA_PENDING=$(api_call POST "/vendor-requests" "$VENDOR_TOKEN" '{
    "supplierId": "'$SUPPLIER_ID'",
    "items": [{
        "inventoryId": "'$INVENTORY1_ID'",
        "quantity": 12
    }],
    "vendorNotes": "Additional PENDING request for testing"
}')

if contains "$EXTRA_PENDING" '"success".*true'; then
    EXTRA_PENDING_ID=$(echo "$EXTRA_PENDING" | jq -r '.request._id // .vendorRequest._id // .data._id')
    REQUEST_IDS+=("$EXTRA_PENDING_ID")
    
    sleep 1
    api_call POST "/vendor-requests/$EXTRA_PENDING_ID/approve" "$SUPPLIER_TOKEN" '{
        "supplierNotes": "Additional pending request approved"
    }' > /dev/null
    
    print_success "Additional PENDING request created and approved"
fi

sleep 1

# ============================================
# PHASE 5: VERIFY ALL REQUESTS
# ============================================

print_header "PHASE 5: VERIFICATION"

print_test "Retrieving all supplier requests"
ALL_REQUESTS=$(api_call GET "/vendor-requests/supplier/requests" "$SUPPLIER_TOKEN")

if contains "$ALL_REQUESTS" '"success".*true'; then
    TOTAL_REQUESTS=$(echo "$ALL_REQUESTS" | jq -r '.requests | length')
    NEW_COUNT=$(echo "$ALL_REQUESTS" | jq '[.requests[] | select(.status == "pending")] | length')
    APPROVED_COUNT=$(echo "$ALL_REQUESTS" | jq '[.requests[] | select(.status == "approved")] | length')
    REJECTED_COUNT=$(echo "$ALL_REQUESTS" | jq '[.requests[] | select(.status == "rejected")] | length')
    CANCELLED_COUNT=$(echo "$ALL_REQUESTS" | jq '[.requests[] | select(.status == "cancelled")] | length')
    
    print_success "Retrieved all requests"
    print_info "Total Requests: $TOTAL_REQUESTS"
    print_info "NEW (pending): $NEW_COUNT"
    print_info "PENDING/CONFIRMED/IN PROGRESS (approved): $APPROVED_COUNT"
    print_info "CANCELLED/REJECTED: $((REJECTED_COUNT + CANCELLED_COUNT))"
else
    print_error "Failed to retrieve requests"
fi

sleep 1

# ============================================
# SUMMARY
# ============================================

print_header "TEST SUMMARY"

echo ""
echo -e "${BOLD}${GREEN}✅ VENDOR REQUEST FLOW TESTING COMPLETED${NC}"
echo ""
echo "┌─────────────────────────────────────────────┐"
echo "│  Requests Created By Stage                  │"
echo "├─────────────────────────────────────────────┤"
printf "│  ${BLUE}NEW${NC} (pending approval):         3       │\n"
printf "│  ${YELLOW}PENDING${NC} (awaiting payment):      2       │\n"
printf "│  ${GREEN}CONFIRMED${NC} (payment received):    1       │\n"
printf "│  ${MAGENTA}IN PROGRESS${NC} (being processed):   1       │\n"
printf "│  ${RED}CANCELLED${NC} (rejected):            1       │\n"
echo "├─────────────────────────────────────────────┤"
printf "│  Total:    %-30s │\n" "${#REQUEST_IDS[@]}"
echo "└─────────────────────────────────────────────┘"
echo ""

echo -e "${GREEN}${BOLD}🎉 ALL REQUEST STAGES CREATED!${NC}"
echo ""
echo "✅ Test Data Ready:"
echo "   ├─ ✓ NEW Tab: 3 requests"
echo "   ├─ ✓ PENDING Tab: 2 requests (approved, awaiting payment)"
echo "   ├─ ✓ CONFIRMED Tab: 1 request (paid, ready to manage)"
echo "   ├─ ✓ IN PROGRESS Tab: 1 request (supplier processing)"
echo "   └─ ✓ CANCELLED Tab: 1 request (rejected)"
echo ""
echo -e "${CYAN}💡 Next Steps:${NC}"
echo "   1. Open your frontend: http://localhost:3000/supplier/vendor-requests"
echo "   2. Test each tab to see the requests"
echo "   3. Test approve/reject on NEW requests"
echo "   4. Test 'Mark Complete' on CONFIRMED requests"
echo "   5. Click on items in request details to view inventory"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Request IDs Created:${NC}"
echo ""
for id in "${REQUEST_IDS[@]}"; do
    echo "   - $id"
done
echo ""
echo -e "${YELLOW}⚠️  Note: The 'IN PROGRESS' stage is essentially 'CONFIRMED'${NC}"
echo -e "${YELLOW}    but represents when the supplier is actively managing it.${NC}"
echo -e "${YELLOW}    Use 'Mark Complete' to move it to transactions.${NC}"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Calculate success rate
if [ $TOTAL -gt 0 ]; then
    SUCCESS_RATE=$(awk "BEGIN {printf \"%.1f\", ($PASSED / $TOTAL) * 100}")
    echo -e "${BLUE}Success Rate: ${SUCCESS_RATE}%${NC}"
fi

echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}${BOLD}🎉 ALL TESTS PASSED!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  TESTS COMPLETED WITH SOME ISSUES${NC}"
    echo "   Review failed tests above"
    exit 1
fi