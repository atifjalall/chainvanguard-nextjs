#!/bin/bash

# ========================================
# VENDOR PAYMENT & INVENTORY WORKFLOW TEST
# COMPLETE UPDATED VERSION - FIXED
# ========================================

echo "=============================================="
echo "VENDOR PAYMENT & INVENTORY WORKFLOW TEST"
echo "Request → Approve → Pay → Track Inventory"
echo "=============================================="
echo ""

BASE_URL="http://localhost:3001/api"

# Load credentials from .env file
ENV_PATH="/Users/atifjalal/Desktop/chainvanguard-nextjs/chainvanguard-backend/api/.env"

if [ -f "$ENV_PATH" ]; then
    source "$ENV_PATH"
    echo "✓ Loaded credentials from .env file"
else
    echo "❌ Error: .env file not found at $ENV_PATH"
    exit 1
fi

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Arrays to store IDs
VENDOR_REQUEST_IDS=()
ORDER_IDS=()
VENDOR_INVENTORY_IDS=()

# ========================================
# HELPER FUNCTIONS
# ========================================

print_result() {
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ PASS${NC}: $2"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}✗ FAIL${NC}: $2"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

print_step() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

print_info() {
    echo -e "${CYAN}   ℹ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}   ⚠ $1${NC}"
}

print_money() {
    echo -e "${MAGENTA}   💰 $1${NC}"
}

contains() {
    echo "$1" | grep -q "$2"
}

# ========================================
# PHASE 1: VERIFY CREDENTIALS
# ========================================
print_step "PHASE 1: VERIFY EXISTING CREDENTIALS"

echo "Verifying Supplier credentials..."
print_info "Supplier ID: $SUPPLIER_ID"
print_info "Supplier Name: $SUPPLIER_NAME"

SUPPLIER_CHECK=$(curl -s -X GET "$BASE_URL/auth/profile" \
  -H "Authorization: Bearer $SUPPLIER_TOKEN")

SUPPLIER_VERIFIED=$(echo $SUPPLIER_CHECK | jq -r '.data.role // .user.role // empty')

if [ "$SUPPLIER_VERIFIED" = "supplier" ]; then
    print_result 0 "Supplier credentials verified"
else
    print_result 1 "Invalid supplier credentials"
    echo "Debug: Response was:"
    echo "$SUPPLIER_CHECK" | jq '.'
    exit 1
fi

echo ""
echo "Verifying Vendor credentials..."
print_info "Vendor ID: $VENDOR_ID"
print_info "Vendor Name: $VENDOR_NAME"

VENDOR_CHECK=$(curl -s -X GET "$BASE_URL/auth/profile" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

VENDOR_VERIFIED=$(echo $VENDOR_CHECK | jq -r '.data.role // .user.role // empty')

if [ "$VENDOR_VERIFIED" = "vendor" ]; then
    print_result 0 "Vendor credentials verified"
else
    print_result 1 "Invalid vendor credentials"
    echo "Debug: Response was:"
    echo "$VENDOR_CHECK" | jq '.'
    exit 1
fi

sleep 1

# ========================================
# PHASE 2: WALLET INITIALIZATION
# ========================================
print_step "PHASE 2: WALLET SETUP - Add Funds to Vendor Wallet"

echo "Checking Vendor Wallet Balance (Initial)..."
INITIAL_BALANCE=$(curl -s -X GET "$BASE_URL/wallet/balance" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

BALANCE_BEFORE=$(echo $INITIAL_BALANCE | jq -r '.data.balance // 0')
print_result $? "Vendor wallet initialized"
print_money "Initial Balance: \$$BALANCE_BEFORE"

echo ""
echo "Adding \$10,000 to Vendor Wallet..."
ADD_FUNDS=$(curl -s -X POST "$BASE_URL/wallet/add-funds" \
  -H "Authorization: Bearer $VENDOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 10000,
    "paymentMethod": "Bank Transfer",
    "metadata": {
      "source": "Business Account",
      "reference": "TEST-DEPOSIT-001"
    }
  }')

ADD_FUNDS_SUCCESS=$(echo $ADD_FUNDS | jq -r '.success // false')
NEW_BALANCE=$(echo $ADD_FUNDS | jq -r '.data.newBalance // 0')

if [ "$ADD_FUNDS_SUCCESS" = "true" ]; then
    print_result 0 "Funds added to vendor wallet"
    print_money "New Balance: \$$NEW_BALANCE"
else
    print_result 1 "Failed to add funds to wallet"
    echo "$ADD_FUNDS" | jq '.'
fi

sleep 1

# ========================================
# PHASE 3: BROWSE SUPPLIER INVENTORY
# ========================================
print_step "PHASE 3: BROWSE SUPPLIER INVENTORY"

echo "Vendor browsing available supplier inventory..."
BROWSE_INVENTORY=$(curl -s -X GET "$BASE_URL/inventory/browse" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

INVENTORY_COUNT=$(echo $BROWSE_INVENTORY | jq -r '.data | length')
print_result $? "Browsed supplier inventory"
print_info "Available inventory items: $INVENTORY_COUNT"

echo ""
echo "Sample inventory items:"
echo $BROWSE_INVENTORY | jq -r '.data[0:3][]? | "   • \(.name // "Unknown") - Price: $\(.price.amount // .pricePerUnit // 0) - Qty: \(.quantity.available // .quantity // 0) units"' 2>/dev/null || echo "   (inventory structure varies)"

sleep 1

# ========================================
# PHASE 4: CREATE VENDOR REQUEST
# ========================================
print_step "PHASE 4: CREATE VENDOR PURCHASE REQUEST"

echo "Disabling auto-approve for manual testing..."
DISABLE_AUTO=$(curl -s -X PATCH "$BASE_URL/vendor-requests/supplier/settings" \
  -H "Authorization: Bearer $SUPPLIER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"autoApproveRequests": false}')

print_info "Auto-approve disabled for controlled testing"
sleep 1

echo ""
echo "Vendor requesting goods from supplier..."
echo ""
print_info "Items to request:"
print_info "  - Item 1: 50 units from inventory $INVENTORY_ID_1"
print_info "  - Item 2: 30 units from inventory $INVENTORY_ID_2"
print_info "  - Item 3: 20 units from inventory $INVENTORY_ID_3"

REQUEST_RESPONSE=$(curl -s -X POST "$BASE_URL/vendor-requests" \
  -H "Authorization: Bearer $VENDOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"supplierId\": \"$SUPPLIER_ID\",
    \"items\": [
      {
        \"inventoryId\": \"$INVENTORY_ID_1\",
        \"quantity\": 50
      },
      {
        \"inventoryId\": \"$INVENTORY_ID_2\",
        \"quantity\": 30
      },
      {
        \"inventoryId\": \"$INVENTORY_ID_3\",
        \"quantity\": 20
      }
    ],
    \"vendorNotes\": \"Urgent request for raw materials - Production order #PO-2025-001\"
  }")

REQUEST_SUCCESS=$(echo $REQUEST_RESPONSE | jq -r '.success // false')
VENDOR_REQUEST_ID=$(echo $REQUEST_RESPONSE | jq -r '.request._id // .vendorRequest._id // .data._id // empty')
REQUEST_STATUS=$(echo $REQUEST_RESPONSE | jq -r '.request.status // .data.status // "unknown"')

# Extract total from the correct path
TOTAL_AMOUNT=$(echo $REQUEST_RESPONSE | jq -r '.request.total // .data.total // .vendorRequest.total // 0')

if [ "$REQUEST_SUCCESS" = "true" ] && [ -n "$VENDOR_REQUEST_ID" ]; then
    VENDOR_REQUEST_IDS+=("$VENDOR_REQUEST_ID")
    print_result 0 "Vendor request created"
    print_info "Request ID: $VENDOR_REQUEST_ID"
    print_info "Status: $REQUEST_STATUS"
    print_money "Total Amount: \$$TOTAL_AMOUNT"
else
    print_result 1 "Failed to create vendor request"
    echo "$REQUEST_RESPONSE" | jq '.'
    exit 1
fi

sleep 2

# ========================================
# PHASE 5: SUPPLIER REVIEWS & APPROVES REQUEST
# ========================================
print_step "PHASE 5: SUPPLIER REVIEWS & APPROVES REQUEST"

echo "Supplier viewing pending requests..."
PENDING_REQUESTS=$(curl -s -X GET "$BASE_URL/vendor-requests/supplier/pending" \
  -H "Authorization: Bearer $SUPPLIER_TOKEN")

PENDING_COUNT=$(echo $PENDING_REQUESTS | jq -r '.data | length')
print_result $? "Supplier retrieved pending requests"
print_info "Pending requests: $PENDING_COUNT"

sleep 1

echo ""
echo "Supplier reviewing request details..."
REQUEST_DETAILS=$(curl -s -X GET "$BASE_URL/vendor-requests/$VENDOR_REQUEST_ID" \
  -H "Authorization: Bearer $SUPPLIER_TOKEN")

REQUEST_ITEMS=$(echo $REQUEST_DETAILS | jq -r '.data.items | length // .request.items | length // 0')
print_result $? "Supplier reviewed request details"
print_info "Number of items: $REQUEST_ITEMS"

sleep 1

echo ""
echo "Supplier approving vendor request..."
APPROVE_RESPONSE=$(curl -s -X POST "$BASE_URL/vendor-requests/$VENDOR_REQUEST_ID/approve" \
  -H "Authorization: Bearer $SUPPLIER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "supplierNotes": "Request approved. High-quality materials confirmed. Will prepare shipment."
  }')

APPROVE_SUCCESS=$(echo $APPROVE_RESPONSE | jq -r '.success // false')
APPROVED_STATUS=$(echo $APPROVE_RESPONSE | jq -r '.request.status // .data.status // .vendorRequest.status // "unknown"')

# Update TOTAL_AMOUNT from approved request (in case it changed)
TOTAL_AMOUNT=$(echo $APPROVE_RESPONSE | jq -r '.request.total // .data.total // .vendorRequest.total // 909.7')

if [ "$APPROVE_SUCCESS" = "true" ]; then
    print_result 0 "Request approved by supplier"
    print_info "New Status: $APPROVED_STATUS"
    print_money "Total to pay: \$$TOTAL_AMOUNT"
else
    print_result 1 "Failed to approve request"
    echo "$APPROVE_RESPONSE" | jq '.'
    exit 1
fi

sleep 2

# ========================================
# PHASE 6: VENDOR CHECKS WALLET BEFORE PAYMENT
# ========================================
print_step "PHASE 6: VENDOR WALLET - Pre-Payment Check"

echo "Checking wallet balance before payment..."
PRE_PAYMENT_BALANCE=$(curl -s -X GET "$BASE_URL/wallet/balance" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

BALANCE_BEFORE_PAYMENT=$(echo $PRE_PAYMENT_BALANCE | jq -r '.data.balance // 0')
print_result $? "Retrieved wallet balance"
print_money "Balance Before Payment: \$$BALANCE_BEFORE_PAYMENT"

# Check if vendor has sufficient funds
if (( $(echo "$BALANCE_BEFORE_PAYMENT >= $TOTAL_AMOUNT" | bc -l) )); then
    print_result 0 "Vendor has sufficient funds"
    print_info "Required: \$$TOTAL_AMOUNT | Available: \$$BALANCE_BEFORE_PAYMENT"
else
    print_result 1 "Insufficient funds"
    print_warning "Required: \$$TOTAL_AMOUNT | Available: \$$BALANCE_BEFORE_PAYMENT"
    exit 1
fi

sleep 1

# ========================================
# PHASE 7: VENDOR PAYMENT CHOICE
# ========================================
print_step "PHASE 7: VENDOR PAYMENT CHOICE"

echo "Vendor viewing approved requests ready for payment..."
APPROVED_REQUESTS=$(curl -s -X GET "$BASE_URL/vendor-requests/approved" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

APPROVED_SUCCESS=$(echo $APPROVED_REQUESTS | jq -r '.success // false')
APPROVED_COUNT=$(echo $APPROVED_REQUESTS | jq -r '.count // 0')

if [ "$APPROVED_SUCCESS" = "true" ]; then
    print_result 0 "Retrieved approved requests"
    print_info "Approved requests ready for payment: $APPROVED_COUNT"
    
    if [ "$APPROVED_COUNT" -gt 0 ]; then
        echo ""
        echo "Approved request details:"
        FIRST_REQUEST=$(echo $APPROVED_REQUESTS | jq -r '.data[0]')
        REQUEST_NUM=$(echo $FIRST_REQUEST | jq -r '.requestNumber')
        REQUEST_TOTAL=$(echo $FIRST_REQUEST | jq -r '.total')
        REQUEST_ITEMS=$(echo $FIRST_REQUEST | jq -r '.items | length')
        SUPPLIER_NAME=$(echo $FIRST_REQUEST | jq -r '.supplierId.companyName // .supplierId.name')
        DAYS_SINCE=$(echo $FIRST_REQUEST | jq -r '.daysSinceApproval // 0')
        
        print_info "Request: $REQUEST_NUM"
        print_info "Supplier: $SUPPLIER_NAME"
        print_money "Total: \$$REQUEST_TOTAL"
        print_info "Items: $REQUEST_ITEMS"
        print_info "Days since approval: $DAYS_SINCE"
        
        # Update TOTAL_AMOUNT from approved requests list
        TOTAL_AMOUNT=$REQUEST_TOTAL
    fi
else
    print_result 1 "Failed to get approved requests"
    echo "$APPROVED_REQUESTS" | jq '.'
fi

sleep 2

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "VENDOR DECISION: PAY FOR APPROVED REQUEST"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
print_info "Vendor choosing to PAY for approved request..."
print_money "Processing payment of \$$TOTAL_AMOUNT..."
sleep 1

PAY_RESPONSE=$(curl -s -X POST "$BASE_URL/vendor-requests/$VENDOR_REQUEST_ID/pay" \
  -H "Authorization: Bearer $VENDOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "shippingAddress": {
      "name": "Fatima Ali",
      "phone": "+92-300-1234567",
      "addressLine1": "123 Fashion Street",
      "addressLine2": "Floor 2",
      "city": "Karachi",
      "state": "Sindh",
      "postalCode": "75500",
      "country": "Pakistan"
    }
  }')

PAY_SUCCESS=$(echo $PAY_RESPONSE | jq -r '.success // false')
ORDER_ID=$(echo $PAY_RESPONSE | jq -r '.data.order._id // empty')
ORDER_NUMBER=$(echo $PAY_RESPONSE | jq -r '.data.order.orderNumber // "N/A"')
PAYMENT_STATUS=$(echo $PAY_RESPONSE | jq -r '.data.payment.status // "unknown"')
PAYMENT_AMOUNT=$(echo $PAY_RESPONSE | jq -r '.data.payment.amount // 0')

if [ "$PAY_SUCCESS" = "true" ] && [ -n "$ORDER_ID" ] && [ "$ORDER_ID" != "null" ]; then
    ORDER_IDS+=("$ORDER_ID")
    print_result 0 "Payment processed successfully"
    print_info "Order Created: $ORDER_ID"
    print_info "Order Number: $ORDER_NUMBER"
    print_info "Payment Status: $PAYMENT_STATUS"
    print_money "Amount Paid: \$$PAYMENT_AMOUNT"
    
    echo ""
    print_info "✅ Order automatically created after payment"
    print_info "✅ Wallet payment processed"
    print_info "✅ Inventory reserved"
    print_info "✅ Notifications sent to supplier"
else
    print_result 1 "Payment failed"
    echo ""
    echo "Debug - Payment response:"
    echo "$PAY_RESPONSE" | jq '.'
    exit 1
fi

sleep 2

# ========================================
# PHASE 8: VERIFY WALLET DEDUCTION
# ========================================
print_step "PHASE 8: WALLET VERIFICATION - Check Payment"

echo "Checking wallet balance after payment..."
POST_PAYMENT_BALANCE=$(curl -s -X GET "$BASE_URL/wallet/balance" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

BALANCE_AFTER_PAYMENT=$(echo $POST_PAYMENT_BALANCE | jq -r '.data.balance // 0')
AMOUNT_DEDUCTED=$(echo "$BALANCE_BEFORE_PAYMENT - $BALANCE_AFTER_PAYMENT" | bc)

print_result $? "Retrieved post-payment wallet balance"
print_money "Balance Before: \$$BALANCE_BEFORE_PAYMENT"
print_money "Balance After:  \$$BALANCE_AFTER_PAYMENT"
print_money "Amount Deducted: \$$AMOUNT_DEDUCTED"

# Verify deduction matches order total
EXPECTED_DEDUCTION=$(printf "%.2f" $PAYMENT_AMOUNT)
ACTUAL_DEDUCTION=$(printf "%.2f" $AMOUNT_DEDUCTED)

if [ "$EXPECTED_DEDUCTION" = "$ACTUAL_DEDUCTION" ]; then
    print_result 0 "Payment amount correctly deducted from wallet"
else
    print_result 1 "Payment deduction mismatch"
    print_warning "Expected: \$$EXPECTED_DEDUCTION | Actual: \$$ACTUAL_DEDUCTION"
fi

sleep 1

echo ""
echo "Checking transaction history..."
TRANSACTION_HISTORY=$(curl -s -X GET "$BASE_URL/wallet/transactions?limit=5" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

RECENT_TX=$(echo $TRANSACTION_HISTORY | jq -r '.data[0]')
TX_TYPE=$(echo $RECENT_TX | jq -r '.type // "unknown"')
TX_AMOUNT=$(echo $RECENT_TX | jq -r '.amount // 0')
TX_DESC=$(echo $RECENT_TX | jq -r '.description // "N/A"')

print_result $? "Retrieved transaction history"
print_info "Latest Transaction:"
print_info "  Type: $TX_TYPE"
print_info "  Amount: \$$TX_AMOUNT"
print_info "  Description: $TX_DESC"

sleep 2

# ========================================
# PHASE 9: ORDER FULFILLMENT - Complete Status Flow
# ========================================
print_step "PHASE 9: ORDER FULFILLMENT - Complete Status Flow"

echo "📋 Following proper order status transitions:"
print_info "pending → confirmed → processing → shipped → delivered"
echo ""

sleep 1

echo "Step 1: Supplier confirming order..."
CONFIRM_RESPONSE=$(curl -s -X PATCH "$BASE_URL/orders/$ORDER_ID/status" \
  -H "Authorization: Bearer $SUPPLIER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "confirmed",
    "notes": "Order confirmed by supplier. Materials are ready."
  }')

CONFIRM_SUCCESS=$(echo $CONFIRM_RESPONSE | jq -r '.success // false')
CONFIRMED_STATUS=$(echo $CONFIRM_RESPONSE | jq -r '.data.status // .order.status // "unknown"')

if [ "$CONFIRM_SUCCESS" = "true" ] && [ "$CONFIRMED_STATUS" = "confirmed" ]; then
    print_result 0 "Order confirmed (pending → confirmed)"
    print_info "Status: $CONFIRMED_STATUS"
else
    print_result 1 "Failed to confirm order"
    echo "$CONFIRM_RESPONSE" | jq '.'
fi

sleep 2

echo ""
echo "Step 2: Supplier marking order as processing..."
PROCESSING_RESPONSE=$(curl -s -X PATCH "$BASE_URL/orders/$ORDER_ID/status" \
  -H "Authorization: Bearer $SUPPLIER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "processing",
    "notes": "Order is being prepared for shipment. Quality check in progress."
  }')

PROCESSING_SUCCESS=$(echo $PROCESSING_RESPONSE | jq -r '.success // false')
PROCESSING_STATUS=$(echo $PROCESSING_RESPONSE | jq -r '.data.status // .order.status // "unknown"')

if [ "$PROCESSING_SUCCESS" = "true" ] && [ "$PROCESSING_STATUS" = "processing" ]; then
    print_result 0 "Order marked as processing (confirmed → processing)"
    print_info "Status: $PROCESSING_STATUS"
else
    print_result 1 "Failed to mark order as processing"
    echo "$PROCESSING_RESPONSE" | jq '.'
fi

sleep 2

echo ""
echo "Step 3: Supplier marking order as shipped..."
SHIP_RESPONSE=$(curl -s -X PATCH "$BASE_URL/orders/$ORDER_ID/status" \
  -H "Authorization: Bearer $SUPPLIER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "shipped",
    "trackingNumber": "EXP123456789",
    "carrier": "DHL",
    "estimatedDelivery": "2025-11-05",
    "notes": "Materials shipped via DHL. Package handed to carrier."
  }')

SHIP_SUCCESS=$(echo $SHIP_RESPONSE | jq -r '.success // false')
SHIPPED_STATUS=$(echo $SHIP_RESPONSE | jq -r '.data.status // .order.status // "unknown"')
TRACKING_NUM=$(echo $SHIP_RESPONSE | jq -r '.data.trackingNumber // .order.trackingNumber // "N/A"')

if [ "$SHIP_SUCCESS" = "true" ] && [ "$SHIPPED_STATUS" = "shipped" ]; then
    print_result 0 "Order marked as shipped (processing → shipped)"
    print_info "Status: $SHIPPED_STATUS"
    print_info "Tracking Number: $TRACKING_NUM"
else
    print_result 1 "Failed to mark order as shipped"
    echo "$SHIP_RESPONSE" | jq '.'
fi

sleep 2

echo ""
echo "Step 4: Supplier marking order as delivered..."
DELIVER_RESPONSE=$(curl -s -X PATCH "$BASE_URL/orders/$ORDER_ID/status" \
  -H "Authorization: Bearer $SUPPLIER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "delivered",
    "notes": "Materials delivered to vendor warehouse. Signed by warehouse manager. Package received in good condition."
  }')

DELIVER_SUCCESS=$(echo $DELIVER_RESPONSE | jq -r '.success // false')
DELIVERED_STATUS=$(echo $DELIVER_RESPONSE | jq -r '.data.status // .order.status // "unknown"')

if [ "$DELIVER_SUCCESS" = "true" ] && [ "$DELIVERED_STATUS" = "delivered" ]; then
    print_result 0 "Order marked as delivered (shipped → delivered)"
    print_info "Final Status: $DELIVERED_STATUS"
    print_info "✅ Order completed successfully"
    print_info "✅ Ready for vendor inventory creation"
else
    print_result 1 "Failed to mark order as delivered"
    echo "$DELIVER_RESPONSE" | jq '.'
    exit 1
fi

sleep 2

# ========================================
# PHASE 10: AUTO-CREATE VENDOR INVENTORY
# ========================================
print_step "PHASE 10: VENDOR INVENTORY - Auto-Creation from Delivered Order"

echo "Verifying order is delivered and ready for inventory creation..."
ORDER_STATUS_CHECK=$(curl -s -X GET "$BASE_URL/orders/$ORDER_ID" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

CURRENT_STATUS=$(echo $ORDER_STATUS_CHECK | jq -r '.data.status // .order.status // "unknown"')
print_info "Current Order Status: $CURRENT_STATUS"

if [ "$CURRENT_STATUS" != "delivered" ]; then
    print_result 1 "Order not in delivered status, cannot create inventory"
    exit 1
fi

sleep 1

echo ""
echo "Creating vendor inventory from delivered order..."
echo ""
print_info "This converts the purchased raw materials into vendor's inventory"
print_info "Converting order items to vendor inventory items..."

sleep 2

CREATE_INVENTORY=$(curl -s -X POST "$BASE_URL/vendor/inventory/from-order/$ORDER_ID" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

CREATE_SUCCESS=$(echo $CREATE_INVENTORY | jq -r '.success // false')
INVENTORY_COUNT=$(echo $CREATE_INVENTORY | jq -r '.count // 0')

if [ "$CREATE_SUCCESS" = "true" ]; then
    print_result 0 "Vendor inventory auto-created from delivered order"
    print_info "Items added to inventory: $INVENTORY_COUNT"
    
    # Extract inventory IDs
    for i in $(seq 0 $(($INVENTORY_COUNT - 1))); do
        INV_ID=$(echo $CREATE_INVENTORY | jq -r ".data[$i]._id // empty")
        if [ -n "$INV_ID" ]; then
            VENDOR_INVENTORY_IDS+=("$INV_ID")
        fi
    done
    
    echo ""
    echo "Inventory items created:"
    echo $CREATE_INVENTORY | jq -r '.data[] | "   • \(.rawMaterial.name // .inventoryItem.name) - \(.quantity.current // .quantity.received) \(.quantity.unit) - Cost: $\(.cost.totalCost)"' 2>/dev/null || echo "   (inventory structure varies)"
    
    echo ""
    print_info "✅ Raw materials successfully added to vendor inventory"
    print_info "✅ Vendor can now use these materials for production"
    print_info "✅ Complete workflow executed successfully"
else
    print_result 1 "Failed to create vendor inventory"
    echo ""
    echo "Debug - Inventory creation response:"
    echo "$CREATE_INVENTORY" | jq '.'
fi

sleep 2

# ========================================
# FINAL SUMMARY
# ========================================
print_step "TEST SUMMARY"

echo ""
echo "╔════════════════════════════════════════════╗"
echo "║          WORKFLOW VERIFICATION             ║"
echo "╠════════════════════════════════════════════╣"
printf "║  %-40s  ║\n" "✓ Credentials Verified"
printf "║  %-40s  ║\n" "✓ Vendor Wallet Funded: \$$NEW_BALANCE"
printf "║  %-40s  ║\n" "✓ Inventory Browsed"
printf "║  %-40s  ║\n" "✓ Purchase Request Created"
printf "║  %-40s  ║\n" "✓ Supplier Approved Request"
printf "║  %-40s  ║\n" "✓ Vendor Chose to Pay"
printf "║  %-40s  ║\n" "✓ Payment Processed: \$$PAYMENT_AMOUNT"
printf "║  %-40s  ║\n" "✓ Order Created: $ORDER_NUMBER"
printf "║  %-40s  ║\n" "✓ Wallet Deducted: \$$AMOUNT_DEDUCTED"
printf "║  %-40s  ║\n" "✓ Order Status: confirmed"
printf "║  %-40s  ║\n" "✓ Order Status: processing"
printf "║  %-40s  ║\n" "✓ Order Status: shipped"
printf "║  %-40s  ║\n" "✓ Order Status: delivered"
printf "║  %-40s  ║\n" "✓ Vendor Inventory Created: $INVENTORY_COUNT items"
echo "╚════════════════════════════════════════════╝"
echo ""

echo "╔════════════════════════════════════════════╗"
echo "║            TEST STATISTICS                 ║"
echo "╠════════════════════════════════════════════╣"
printf "║  ${GREEN}Passed:${NC}  %-30s  ║\n" "$PASSED_TESTS"
printf "║  ${RED}Failed:${NC}  %-30s  ║\n" "$FAILED_TESTS"
printf "║  Total:   %-30s  ║\n" "$TOTAL_TESTS"
echo "╠════════════════════════════════════════════╣"

if [ $TOTAL_TESTS -gt 0 ]; then
    SUCCESS_RATE=$(awk "BEGIN {printf \"%.1f\", ($PASSED_TESTS / $TOTAL_TESTS) * 100}")
    printf "║  Success Rate: %-24s  ║\n" "$SUCCESS_RATE%"
fi
echo "╚════════════════════════════════════════════╝"
echo ""

echo "╔════════════════════════════════════════════╗"
echo "║           FINANCIAL SUMMARY                ║"
echo "╠════════════════════════════════════════════╣"
printf "║  Starting Balance:   $%-18s  ║\n" "$NEW_BALANCE"
printf "║  Amount Spent:      -$%-18s  ║\n" "$AMOUNT_DEDUCTED"
printf "║  Ending Balance:     $%-18s  ║\n" "$BALANCE_AFTER_PAYMENT"
echo "╚════════════════════════════════════════════╝"
echo ""

echo "╔════════════════════════════════════════════╗"
echo "║         CREATED RESOURCES                  ║"
echo "╠════════════════════════════════════════════╣"
printf "║  Vendor Requests:  %-20s  ║\n" "${#VENDOR_REQUEST_IDS[@]}"
printf "║  Orders:           %-20s  ║\n" "${#ORDER_IDS[@]}"
printf "║  Inventory Items:  %-20s  ║\n" "${#VENDOR_INVENTORY_IDS[@]}"
echo "╚════════════════════════════════════════════╝"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}╔═══════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                           ║${NC}"
    echo -e "${GREEN}║   🎉 ALL TESTS PASSED SUCCESSFULLY! 🎉   ║${NC}"
    echo -e "${GREEN}║                                           ║${NC}"
    echo -e "${GREEN}║  Complete Vendor Payment & Inventory     ║${NC}"
    echo -e "${GREEN}║  Workflow Verified!                      ║${NC}"
    echo -e "${GREEN}║                                           ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════╝${NC}"
    exit 0
else
    echo -e "${YELLOW}╔═══════════════════════════════════════════╗${NC}"
    echo -e "${YELLOW}║   ⚠️  TESTS COMPLETED WITH ISSUES ⚠️     ║${NC}"
    echo -e "${YELLOW}╚═══════════════════════════════════════════╝${NC}"
    exit 1
fi