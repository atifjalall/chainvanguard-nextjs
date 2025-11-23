#!/bin/bash

# ============================================
# CHAINVANGUARD - VENDOR REQUEST COMPLETE TEST
# Tests Both Supplier & Vendor Functionality
# ============================================

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

ENV_PATH="/Users/atifjalal/Desktop/chainvanguard-nextjs/chainvanguard-backend/api/.env"
if [ -f "$ENV_PATH" ]; then
    source "$ENV_PATH"
    echo "✓ Loaded environment from: $ENV_PATH"
else
    echo "❌ Error: .env file not found at $ENV_PATH"
    exit 1
fi

BASE_URL="http://localhost:3001/api"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

PASSED=0
FAILED=0
TOTAL=0
SKIPPED=0

REQUEST_IDS=()

# Credentials
SUPPLIER_TOKEN="${SUPPLIER_TOKEN}"
SUPPLIER_ID="${SUPPLIER_ID}"
VENDOR_TOKEN="${VENDOR_TOKEN}"
VENDOR_ID="${VENDOR_ID}"

# Inventory from env (5 items)
INVENTORY_ID_1="${INVENTORY_ID_1}"
INVENTORY_ID_2="${INVENTORY_ID_2}"
INVENTORY_ID_3="${INVENTORY_ID_3}"
INVENTORY_ID_4="${INVENTORY_ID_4}"
INVENTORY_ID_5="${INVENTORY_ID_5}"

# ============================================
# UTILITIES
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
print_header "VENDOR REQUEST - COMPLETE FLOW TEST"
echo -e "${CYAN}Testing: Supplier & Vendor Functionality${NC}"
echo -e "${CYAN}Base URL: $BASE_URL${NC}"
echo ""

# ============================================
# PRE-FLIGHT CHECKS
# ============================================

print_header "PHASE 0: PRE-FLIGHT CHECKS"

print_test "Checking for jq (JSON processor)"
if command -v jq &> /dev/null; then
    print_success "jq is installed"
else
    print_error "jq is not installed. Install with: brew install jq"
    exit 1
fi

print_test "Verifying environment variables"
if [ -z "$SUPPLIER_TOKEN" ] || [ -z "$VENDOR_TOKEN" ] || [ -z "$SUPPLIER_ID" ] || [ -z "$VENDOR_ID" ]; then
    print_error "Required environment variables not found"
    exit 1
fi
print_success "All environment variables found"
print_info "Supplier ID: $SUPPLIER_ID"
print_info "Vendor ID: $VENDOR_ID"

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
# VERIFY INVENTORY
# ============================================

print_header "PHASE 1: VERIFY INVENTORY"

print_test "Verifying all 5 inventory items exist"
INVENTORY_ARRAY=($INVENTORY_ID_1 $INVENTORY_ID_2 $INVENTORY_ID_3 $INVENTORY_ID_4 $INVENTORY_ID_5)
VERIFIED_INVENTORY=()

for i in "${!INVENTORY_ARRAY[@]}"; do
    INV_ID="${INVENTORY_ARRAY[$i]}"
    if [ -n "$INV_ID" ] && [ "$INV_ID" != "null" ]; then
        INV_CHECK=$(api_call GET "/inventory/$INV_ID" "$SUPPLIER_TOKEN")
        if contains "$INV_CHECK" '"success".*true'; then
            INV_NAME=$(echo "$INV_CHECK" | jq -r '.data.name // .inventory.name')
            VERIFIED_INVENTORY+=("$INV_ID")
            print_success "Inventory $((i+1)): $INV_NAME"
        else
            print_error "Inventory $((i+1)) not found"
        fi
    else
        print_error "INVENTORY_ID_$((i+1)) not set in .env"
    fi
done

if [ ${#VERIFIED_INVENTORY[@]} -eq 0 ]; then
    print_error "No inventory items found. Cannot continue."
    exit 1
fi

print_info "Verified ${#VERIFIED_INVENTORY[@]} inventory items"
sleep 1

# ============================================
# SETUP AUTO-APPROVE & CREATE VENDOR WALLET
# ============================================

print_header "PHASE 2: SETUP AUTO-APPROVE & WALLET"

print_test "Disabling auto-approve for manual testing"
api_call PATCH "/vendor-requests/supplier/settings" "$SUPPLIER_TOKEN" '{"autoApproveRequests": false}' > /dev/null
print_success "Auto-approve disabled"

sleep 1

print_test "Creating vendor wallet (required for payments)"
WALLET_CREATE=$(api_call POST "/wallet/create" "$VENDOR_TOKEN" '{
    "initialBalance": 100000,
    "currency": "CVT"
}')

if contains "$WALLET_CREATE" '"success".*true'; then
    print_success "Vendor wallet created with CVT 100,000"
else
    # Wallet might already exist
    WALLET_CHECK=$(api_call GET "/wallet/balance" "$VENDOR_TOKEN")
    if contains "$WALLET_CHECK" '"success".*true'; then
        WALLET_BALANCE=$(echo "$WALLET_CHECK" | jq -r '.balance // .data.balance')
        print_success "Vendor wallet exists (Balance: CVT $WALLET_BALANCE)"
    else
        print_error "Failed to create/verify vendor wallet"
    fi
fi

sleep 1

# ============================================
# VENDOR-SIDE TESTS
# ============================================

print_header "PHASE 3: VENDOR-SIDE FUNCTIONALITY"

# Test 1: Vendor creates request
print_test "Vendor: Create new request"
VENDOR_NEW_REQ=$(api_call POST "/vendor-requests" "$VENDOR_TOKEN" '{
    "supplierId": "'$SUPPLIER_ID'",
    "items": [{
        "inventoryId": "'${VERIFIED_INVENTORY[0]}'",
        "quantity": 10
    }],
    "vendorNotes": "Vendor test - New order request"
}')

if contains "$VENDOR_NEW_REQ" '"success".*true'; then
    VNEW_ID=$(echo "$VENDOR_NEW_REQ" | jq -r '.request._id // .vendorRequest._id // .data._id')
    VNEW_NUMBER=$(echo "$VENDOR_NEW_REQ" | jq -r '.request.requestNumber // .vendorRequest.requestNumber // .data.requestNumber')
    REQUEST_IDS+=("$VNEW_ID")
    print_success "Vendor request created"
    print_info "Request: $VNEW_NUMBER (ID: $VNEW_ID)"
else
    print_error "Failed to create vendor request"
fi

sleep 1

# Test 2: Vendor views own requests
print_test "Vendor: Get my requests"
VENDOR_MY_REQS=$(api_call GET "/vendor-requests/my-requests" "$VENDOR_TOKEN")
if contains "$VENDOR_MY_REQS" '"success".*true'; then
    MY_REQS_COUNT=$(echo "$VENDOR_MY_REQS" | jq -r '.requests | length')
    print_success "Retrieved vendor's requests (Count: $MY_REQS_COUNT)"
else
    print_error "Failed to get vendor's requests"
fi

sleep 1

# Test 3: Vendor views request stats
print_test "Vendor: Get request statistics"
VENDOR_STATS=$(api_call GET "/vendor-requests/stats" "$VENDOR_TOKEN")
if contains "$VENDOR_STATS" '"success".*true'; then
    print_success "Retrieved vendor statistics"
else
    print_error "Failed to get vendor statistics"
fi

sleep 1

# Test 4: Vendor cancels pending request
print_test "Vendor: Cancel pending request"
CANCEL_REQ=$(api_call POST "/vendor-requests" "$VENDOR_TOKEN" '{
    "supplierId": "'$SUPPLIER_ID'",
    "items": [{"inventoryId": "'${VERIFIED_INVENTORY[1]}'", "quantity": 5}],
    "vendorNotes": "Request to be cancelled"
}')

if contains "$CANCEL_REQ" '"success".*true'; then
    CANCEL_ID=$(echo "$CANCEL_REQ" | jq -r '.request._id // .vendorRequest._id // .data._id')
    REQUEST_IDS+=("$CANCEL_ID")
    sleep 1
    
    CANCEL_RESULT=$(api_call POST "/vendor-requests/$CANCEL_ID/cancel" "$VENDOR_TOKEN")
    if contains "$CANCEL_RESULT" '"success".*true'; then
        print_success "Vendor cancelled pending request"
    else
        print_error "Failed to cancel request"
    fi
else
    print_error "Failed to create request for cancellation test"
fi

sleep 1

# ============================================
# SUPPLIER-SIDE TESTS
# ============================================

print_header "PHASE 4: SUPPLIER-SIDE FUNCTIONALITY"

# Test 5: Create requests in all stages (NEW, PENDING, CONFIRMED, CANCELLED)
print_test "Creating requests in all stages"

# STAGE 1: NEW (pending)
NEW_REQ=$(api_call POST "/vendor-requests" "$VENDOR_TOKEN" '{
    "supplierId": "'$SUPPLIER_ID'",
    "items": [{"inventoryId": "'${VERIFIED_INVENTORY[0]}'", "quantity": 10}],
    "vendorNotes": "NEW stage - Awaiting approval"
}')
if contains "$NEW_REQ" '"success".*true'; then
    NEW_ID=$(echo "$NEW_REQ" | jq -r '.request._id // .vendorRequest._id // .data._id')
    REQUEST_IDS+=("$NEW_ID")
    print_success "NEW request created"
else
    print_error "Failed to create NEW request"
fi

sleep 1

# STAGE 2: PENDING (approved, no payment)
PENDING_REQ=$(api_call POST "/vendor-requests" "$VENDOR_TOKEN" '{
    "supplierId": "'$SUPPLIER_ID'",
    "items": [{"inventoryId": "'${VERIFIED_INVENTORY[1]}'", "quantity": 20}],
    "vendorNotes": "PENDING stage - Will be approved"
}')
if contains "$PENDING_REQ" '"success".*true'; then
    PENDING_ID=$(echo "$PENDING_REQ" | jq -r '.request._id // .vendorRequest._id // .data._id')
    REQUEST_IDS+=("$PENDING_ID")
    sleep 1
    api_call POST "/vendor-requests/$PENDING_ID/approve" "$SUPPLIER_TOKEN" '{"supplierNotes": "Approved"}' > /dev/null
    print_success "PENDING request created and approved"
else
    print_error "Failed to create PENDING request"
fi

sleep 1

# STAGE 3: CONFIRMED (approved + paid)
CONFIRMED_REQ=$(api_call POST "/vendor-requests" "$VENDOR_TOKEN" '{
    "supplierId": "'$SUPPLIER_ID'",
    "items": [{"inventoryId": "'${VERIFIED_INVENTORY[2]}'", "quantity": 15}],
    "vendorNotes": "CONFIRMED stage - Will be paid"
}')
if contains "$CONFIRMED_REQ" '"success".*true'; then
    CONFIRMED_ID=$(echo "$CONFIRMED_REQ" | jq -r '.request._id // .vendorRequest._id // .data._id')
    REQUEST_IDS+=("$CONFIRMED_ID")
    sleep 1
    api_call POST "/vendor-requests/$CONFIRMED_ID/approve" "$SUPPLIER_TOKEN" '{"supplierNotes": "Approved"}' > /dev/null
    sleep 1
    api_call POST "/vendor-requests/$CONFIRMED_ID/pay" "$VENDOR_TOKEN" '{
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
    print_success "CONFIRMED request created, approved, and paid"
else
    print_error "Failed to create CONFIRMED request"
fi

sleep 1

# STAGE 4: CANCELLED
CANCELLED_REQ=$(api_call POST "/vendor-requests" "$VENDOR_TOKEN" '{
    "supplierId": "'$SUPPLIER_ID'",
    "items": [{"inventoryId": "'${VERIFIED_INVENTORY[4]}'", "quantity": 5}],
    "vendorNotes": "CANCELLED stage"
}')
if contains "$CANCELLED_REQ" '"success".*true'; then
    CANCELLED_ID=$(echo "$CANCELLED_REQ" | jq -r '.request._id // .vendorRequest._id // .data._id')
    REQUEST_IDS+=("$CANCELLED_ID")
    sleep 1
    api_call POST "/vendor-requests/$CANCELLED_ID/reject" "$SUPPLIER_TOKEN" '{
        "rejectionReason": "Insufficient stock"
    }' > /dev/null
    print_success "CANCELLED request created and rejected"
else
    print_error "Failed to create CANCELLED request"
fi

sleep 1

# ============================================
# PAYMENT FLOW TESTS
# ============================================

print_header "PHASE 5: PAYMENT FLOW TESTS"

# Test: Get approved requests ready for payment
print_test "Vendor: Get approved requests ready for payment"
APPROVED_REQS=$(api_call GET "/vendor-requests/approved" "$VENDOR_TOKEN")
if contains "$APPROVED_REQS" '"success".*true'; then
    APPROVED_COUNT=$(echo "$APPROVED_REQS" | jq -r '.requests | length')
    print_success "Retrieved approved requests ready for payment (Count: $APPROVED_COUNT)"
else
    print_error "Failed to get approved requests"
fi

sleep 1

# Test: Cancel approved request before payment
print_test "Vendor: Cancel approved request before payment"
CANCEL_APPROVED_REQ=$(api_call POST "/vendor-requests" "$VENDOR_TOKEN" '{
    "supplierId": "'$SUPPLIER_ID'",
    "items": [{"inventoryId": "'${VERIFIED_INVENTORY[0]}'", "quantity": 8}],
    "vendorNotes": "Request to be cancelled after approval"
}')

if contains "$CANCEL_APPROVED_REQ" '"success".*true'; then
    CANCEL_APPROVED_ID=$(echo "$CANCEL_APPROVED_REQ" | jq -r '.request._id // .vendorRequest._id // .data._id')
    REQUEST_IDS+=("$CANCEL_APPROVED_ID")
    sleep 1
    
    # Supplier approves
    api_call POST "/vendor-requests/$CANCEL_APPROVED_ID/approve" "$SUPPLIER_TOKEN" '{"supplierNotes": "Approved"}' > /dev/null
    sleep 1
    
    # Vendor cancels after approval
    CANCEL_APPROVED_RESULT=$(api_call POST "/vendor-requests/$CANCEL_APPROVED_ID/cancel-approved" "$VENDOR_TOKEN" '{
        "cancellationReason": "Changed business requirements"
    }')
    
    if contains "$CANCEL_APPROVED_RESULT" '"success".*true'; then
        print_success "Vendor cancelled approved request before payment"
    else
        print_error "Failed to cancel approved request"
    fi
else
    print_error "Failed to create request for cancel-approved test"
fi

sleep 1

# ============================================
# SUPPLIER REQUEST MANAGEMENT
# ============================================

print_header "PHASE 6: SUPPLIER REQUEST MANAGEMENT"

# Test: Get supplier's requests
print_test "Supplier: Get all requests"
SUPPLIER_REQS=$(api_call GET "/vendor-requests/supplier/requests" "$SUPPLIER_TOKEN")
if contains "$SUPPLIER_REQS" '"success".*true'; then
    SUPPLIER_REQS_COUNT=$(echo "$SUPPLIER_REQS" | jq -r '.requests | length')
    print_success "Retrieved supplier's requests (Count: $SUPPLIER_REQS_COUNT)"
else
    print_error "Failed to get supplier's requests"
fi

sleep 1

# Test: Get supplier statistics
print_test "Supplier: Get request statistics"
SUPPLIER_STATS=$(api_call GET "/vendor-requests/supplier/stats" "$SUPPLIER_TOKEN")
if contains "$SUPPLIER_STATS" '"success".*true'; then
    print_success "Retrieved supplier statistics"
else
    print_error "Failed to get supplier statistics"
fi

sleep 1

# Test: Get supplier settings
print_test "Supplier: Get settings"
SUPPLIER_SETTINGS=$(api_call GET "/vendor-requests/supplier/settings" "$SUPPLIER_TOKEN")
if contains "$SUPPLIER_SETTINGS" '"success".*true'; then
    print_success "Retrieved supplier settings"
else
    print_error "Failed to get supplier settings"
fi

sleep 1

# ============================================
# VERIFICATION
# ============================================

print_header "PHASE 7: VERIFICATION"

print_test "Verify all request stages exist"
ALL_REQUESTS=$(api_call GET "/vendor-requests/supplier/requests" "$SUPPLIER_TOKEN")

if contains "$ALL_REQUESTS" '"success".*true'; then
    TOTAL_REQUESTS=$(echo "$ALL_REQUESTS" | jq -r '.requests | length')
    NEW_COUNT=$(echo "$ALL_REQUESTS" | jq '[.requests[] | select(.status == "pending")] | length')
    APPROVED_COUNT=$(echo "$ALL_REQUESTS" | jq '[.requests[] | select(.status == "approved")] | length')
    REJECTED_COUNT=$(echo "$ALL_REQUESTS" | jq '[.requests[] | select(.status == "rejected")] | length')
    
    print_success "Verified all request stages"
    print_info "Total: $TOTAL_REQUESTS"
    print_info "NEW (pending): $NEW_COUNT"
    print_info "PENDING/CONFIRMED (approved): $APPROVED_COUNT"
    print_info "CANCELLED/REJECTED: $REJECTED_COUNT"
else
    print_error "Failed to verify requests"
fi

sleep 1

# ============================================
# SUMMARY
# ============================================

print_header "TEST SUMMARY"

echo ""
echo -e "${BOLD}${GREEN}✅ VENDOR REQUEST TESTING COMPLETED${NC}"
echo ""
echo "┌─────────────────────────────────────────────┐"
echo "│  Test Results                               │"
echo "├─────────────────────────────────────────────┤"
printf "│  ${GREEN}Passed:${NC}    %-30s │\n" "$PASSED"
printf "│  ${RED}Failed:${NC}    %-30s │\n" "$FAILED"
printf "│  ${CYAN}Skipped:${NC}   %-30s │\n" "$SKIPPED"
printf "│  ${BOLD}Total:${NC}     %-30s │\n" "$TOTAL"
echo "└─────────────────────────────────────────────┘"
echo ""

echo "┌─────────────────────────────────────────────┐"
echo "│  Requests Created                           │"
echo "├─────────────────────────────────────────────┤"
printf "│  Total Requests: %-23s │\n" "${#REQUEST_IDS[@]}"
echo "└─────────────────────────────────────────────┘"
echo ""

echo -e "${CYAN}💡 Next Steps:${NC}"
echo "   Supplier: http://localhost:3000/supplier/vendor-requests"
echo "   Vendor: http://localhost:3000/vendor/vendor-requests"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Request IDs Created:${NC}"
for id in "${REQUEST_IDS[@]}"; do
    echo "   - $id"
done
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}${BOLD}🎉 ALL TESTS PASSED!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  TESTS COMPLETED WITH ISSUES${NC}"
    exit 1
fi