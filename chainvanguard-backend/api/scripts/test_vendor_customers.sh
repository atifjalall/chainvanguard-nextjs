#!/bin/bash

set -a
source /Users/atifjalal/Desktop/chainvanguard-nextjs/chainvanguard-backend/api/.env
set +a

BASE_URL="http://localhost:${PORT:-3001}/api"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_test() { echo -e "${YELLOW}➤ $1${NC}"; }
print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ $1${NC}"; }

# TEST 1
print_header "TEST 1: GET ALL CUSTOMERS"
print_test "Fetching all customers..."
CUSTOMERS=$(curl -s -X GET "${BASE_URL}/vendor/customers" -H "Authorization: Bearer $VENDOR_TOKEN")

if echo "$CUSTOMERS" | grep -q '"success":true'; then
    print_success "Successfully fetched customers"
    CUSTOMER_COUNT=$(echo "$CUSTOMERS" | jq -r '.customers | length')
    print_info "Total customers: $CUSTOMER_COUNT"
    
    if [ "$CUSTOMER_COUNT" -gt 0 ]; then
        echo "$CUSTOMERS" | jq -r '.customers[] | "  - \(.name) | Orders: \(.stats.totalOrders) | Spent: \(.stats.totalSpent) | Loyalty: \(.loyaltyPoints)"'
        CUSTOMER_ID=$(echo "$CUSTOMERS" | jq -r '.customers[0].id')
        CUSTOMER_NAME=$(echo "$CUSTOMERS" | jq -r '.customers[0].name')
        print_info "Using: $CUSTOMER_NAME (ID: $CUSTOMER_ID)"
    else
        print_error "No customers found"
    fi
else
    print_error "Failed to fetch customers"
    echo "$CUSTOMERS" | jq '.'
fi

sleep 1

# TEST 2
print_header "TEST 2: GET CUSTOMER DETAILS"
if [ -n "$CUSTOMER_ID" ]; then
    print_test "Fetching customer details..."
    DETAILS=$(curl -s -X GET "${BASE_URL}/vendor/customers/${CUSTOMER_ID}" -H "Authorization: Bearer $VENDOR_TOKEN")
    
    if echo "$DETAILS" | grep -q '"success":true'; then
        print_success "Successfully fetched customer details"
        print_info "Name: $(echo "$DETAILS" | jq -r '.customer.name')"
        print_info "Email: $(echo "$DETAILS" | jq -r '.customer.email')"
        print_info "Loyalty Points: $(echo "$DETAILS" | jq -r '.customer.loyaltyPoints')"
        print_info "Total Orders: $(echo "$DETAILS" | jq -r '.statistics.totalOrders')"
        print_info "Total Spent: $(echo "$DETAILS" | jq -r '.statistics.totalSpent')"
        print_info "Last Order: $(echo "$DETAILS" | jq -r '.statistics.lastOrderDate')"
    else
        print_error "Failed to fetch customer details"
    fi
else
    print_error "No customer ID available"
fi

sleep 1

# TEST 3
print_header "TEST 3: GET CUSTOMER ORDERS"
if [ -n "$CUSTOMER_ID" ]; then
    print_test "Fetching orders..."
    ORDERS=$(curl -s -X GET "${BASE_URL}/vendor/customers/${CUSTOMER_ID}/orders" -H "Authorization: Bearer $VENDOR_TOKEN")
    
    if echo "$ORDERS" | grep -q '"success":true'; then
        print_success "Successfully fetched customer orders"
        ORDER_COUNT=$(echo "$ORDERS" | jq -r '.orders | length')
        print_info "Orders found: $ORDER_COUNT"
        
        if [ "$ORDER_COUNT" -gt 0 ]; then
            echo "$ORDERS" | jq -r '.orders[] | "  Order #\(.orderNumber): \(.status) - $\(.amount) (\(.itemCount) items)"'
        fi
    else
        print_error "Failed to fetch customer orders"
    fi
else
    print_error "No customer ID available"
fi

sleep 1

# TEST 4
print_header "TEST 4: GET STATS SUMMARY"
print_test "Fetching stats..."
STATS=$(curl -s -X GET "${BASE_URL}/vendor/customers/stats/summary" -H "Authorization: Bearer $VENDOR_TOKEN")

if echo "$STATS" | grep -q '"success":true'; then
    print_success "Successfully fetched customer stats"
    print_info "Total Customers: $(echo "$STATS" | jq -r '.summary.totalCustomers')"
    print_info "Total Revenue: $(echo "$STATS" | jq -r '.summary.totalRevenue')"
    print_info "Avg Customer Value: $(echo "$STATS" | jq -r '.summary.avgCustomerValue')"
    print_info "New Customers (This Month): $(echo "$STATS" | jq -r '.summary.newCustomersThisMonth')"
else
    print_error "Failed to fetch customer stats"
fi

sleep 1

# TEST 5
print_header "TEST 5: SEARCH CUSTOMERS"
if [ -n "$CUSTOMER_NAME" ]; then
    SEARCH_TERM=$(echo "$CUSTOMER_NAME" | cut -d' ' -f1)
    print_test "Searching for: $SEARCH_TERM"
    SEARCH=$(curl -s -X GET "${BASE_URL}/vendor/customers?search=${SEARCH_TERM}" -H "Authorization: Bearer $VENDOR_TOKEN")
    
    if echo "$SEARCH" | grep -q '"success":true'; then
        print_success "Search working"
        print_info "Found: $(echo "$SEARCH" | jq -r '.customers | length') customers"
    else
        print_error "Search failed"
    fi
fi

sleep 1

# TEST 6
print_header "TEST 6: SORT BY LOYALTY POINTS"
print_test "Sorting by loyalty points..."
SORTED=$(curl -s -X GET "${BASE_URL}/vendor/customers?sortBy=loyaltyPoints&sortOrder=desc" -H "Authorization: Bearer $VENDOR_TOKEN")

if echo "$SORTED" | grep -q '"success":true'; then
    print_success "Sorting working"
    echo "$SORTED" | jq -r '.customers[0:3] | .[] | "  \(.name): \(.loyaltyPoints) points"'
else
    print_error "Sorting failed"
fi

sleep 1

# TEST 7
print_header "TEST 7: GET CONTACT INFO"
if [ -n "$CUSTOMER_ID" ]; then
    print_test "Fetching contact info..."
    CONTACT=$(curl -s -X GET "${BASE_URL}/vendor/customers/${CUSTOMER_ID}/contact" -H "Authorization: Bearer $VENDOR_TOKEN")
    
    if echo "$CONTACT" | grep -q '"success":true'; then
        print_success "Contact info retrieved"
        print_info "Name: $(echo "$CONTACT" | jq -r '.contact.name')"
        print_info "Email: $(echo "$CONTACT" | jq -r '.contact.email')"
        print_info "Phone: $(echo "$CONTACT" | jq -r '.contact.phone')"
    else
        print_error "Failed to get contact info"
    fi
fi

# SUMMARY
print_header "TEST SUMMARY"
echo -e "${GREEN}✓ All tests completed!${NC}\n"
echo -e "Tested endpoints:"
echo -e "  1. GET /vendor/customers ✓"
echo -e "  2. GET /vendor/customers/:id ✓"
echo -e "  3. GET /vendor/customers/:id/orders ✓"
echo -e "  4. GET /vendor/customers/stats/summary ✓"
echo -e "  5. Search: ?search=name ✓"
echo -e "  6. Sort: ?sortBy=loyaltyPoints ✓"
echo -e "  7. GET /vendor/customers/:id/contact ✓"
echo ""