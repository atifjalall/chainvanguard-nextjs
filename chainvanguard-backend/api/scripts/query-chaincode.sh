#!/bin/bash

# Hyperledger Fabric Chaincode Query Script
# This script provides all available query functions for UserContract, ProductContract, and OrderContract

# Configuration
CHANNEL_NAME="supply-chain-channel"
ORDERER_CA="${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print section headers
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

# Function to print success
print_success() {
    echo -e "${GREEN}✅ $1${NC}\n"
}

# Function to print error
print_error() {
    echo -e "${RED}❌ $1${NC}\n"
}

# Function to print info
print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}\n"
}

# ===========================================
# USER CONTRACT QUERIES
# ===========================================

query_all_users() {
    print_header "USER: Get All Users"
    peer chaincode query \
        -C $CHANNEL_NAME \
        -n user \
        -c '{"function":"UserContract:getAllUsers","Args":[]}' \
        --tls \
        --cafile "$ORDERER_CA"
}

query_user_by_id() {
    local userId=$1
    print_header "USER: Get User by ID - $userId"
    peer chaincode query \
        -C $CHANNEL_NAME \
        -n user \
        -c "{\"function\":\"UserContract:getUser\",\"Args\":[\"$userId\"]}" \
        --tls \
        --cafile "$ORDERER_CA"
}

query_user_exists() {
    local userId=$1
    print_header "USER: Check if User Exists - $userId"
    peer chaincode query \
        -C $CHANNEL_NAME \
        -n user \
        -c "{\"function\":\"UserContract:userExists\",\"Args\":[\"$userId\"]}" \
        --tls \
        --cafile "$ORDERER_CA"
}

query_users_by_role() {
    local role=$1
    print_header "USER: Get Users by Role - $role"
    print_info "Valid roles: supplier, vendor, customer, expert"
    peer chaincode query \
        -C $CHANNEL_NAME \
        -n user \
        -c "{\"function\":\"UserContract:getUsersByRole\",\"Args\":[\"$role\"]}" \
        --tls \
        --cafile "$ORDERER_CA"
}

query_user_stats() {
    print_header "USER: Get User Statistics"
    peer chaincode query \
        -C $CHANNEL_NAME \
        -n user \
        -c '{"function":"UserContract:getUserStats","Args":[]}' \
        --tls \
        --cafile "$ORDERER_CA"
}

query_active_users_count() {
    print_header "USER: Get Active Users Count"
    peer chaincode query \
        -C $CHANNEL_NAME \
        -n user \
        -c '{"function":"UserContract:getActiveUsersCount","Args":[]}' \
        --tls \
        --cafile "$ORDERER_CA"
}

query_search_users() {
    local searchTerm=$1
    print_header "USER: Search Users - $searchTerm"
    peer chaincode query \
        -C $CHANNEL_NAME \
        -n user \
        -c "{\"function\":\"UserContract:searchUsers\",\"Args\":[\"$searchTerm\"]}" \
        --tls \
        --cafile "$ORDERER_CA"
}

query_users_by_date_range() {
    local startDate=$1
    local endDate=$2
    print_header "USER: Get Users by Date Range"
    print_info "Start: $startDate, End: $endDate"
    peer chaincode query \
        -C $CHANNEL_NAME \
        -n user \
        -c "{\"function\":\"UserContract:getUsersByDateRange\",\"Args\":[\"$startDate\",\"$endDate\"]}" \
        --tls \
        --cafile "$ORDERER_CA"
}

query_verify_user_by_wallet() {
    local walletAddress=$1
    print_header "USER: Verify User by Wallet Address - $walletAddress"
    peer chaincode query \
        -C $CHANNEL_NAME \
        -n user \
        -c "{\"function\":\"UserContract:verifyUserByWallet\",\"Args\":[\"$walletAddress\"]}" \
        --tls \
        --cafile "$ORDERER_CA"
}

query_user_history() {
    local userId=$1
    print_header "USER: Get User History - $userId"
    peer chaincode query \
        -C $CHANNEL_NAME \
        -n user \
        -c "{\"function\":\"UserContract:getUserHistory\",\"Args\":[\"$userId\"]}" \
        --tls \
        --cafile "$ORDERER_CA"
}

# ===========================================
# PRODUCT CONTRACT QUERIES
# ===========================================

query_all_products() {
    print_header "PRODUCT: Get All Products"
    peer chaincode query \
        -C $CHANNEL_NAME \
        -n product \
        -c '{"function":"ProductContract:getAllProducts","Args":[]}' \
        --tls \
        --cafile "$ORDERER_CA"
}

query_product_by_id() {
    local productId=$1
    print_header "PRODUCT: Get Product by ID - $productId"
    peer chaincode query \
        -C $CHANNEL_NAME \
        -n product \
        -c "{\"function\":\"ProductContract:readProduct\",\"Args\":[\"$productId\"]}" \
        --tls \
        --cafile "$ORDERER_CA"
}

query_product_exists() {
    local productId=$1
    print_header "PRODUCT: Check if Product Exists - $productId"
    peer chaincode query \
        -C $CHANNEL_NAME \
        -n product \
        -c "{\"function\":\"ProductContract:productExists\",\"Args\":[\"$productId\"]}" \
        --tls \
        --cafile "$ORDERER_CA"
}

query_products_by_seller() {
    local sellerId=$1
    print_header "PRODUCT: Get Products by Seller - $sellerId"
    peer chaincode query \
        -C $CHANNEL_NAME \
        -n product \
        -c "{\"function\":\"ProductContract:queryProductsBySeller\",\"Args\":[\"$sellerId\"]}" \
        --tls \
        --cafile "$ORDERER_CA"
}

query_products_by_category() {
    local category=$1
    print_header "PRODUCT: Get Products by Category - $category"
    peer chaincode query \
        -C $CHANNEL_NAME \
        -n product \
        -c "{\"function\":\"ProductContract:queryProductsByCategory\",\"Args\":[\"$category\"]}" \
        --tls \
        --cafile "$ORDERER_CA"
}

query_verified_products() {
    print_header "PRODUCT: Get Verified Products"
    peer chaincode query \
        -C $CHANNEL_NAME \
        -n product \
        -c '{"function":"ProductContract:queryVerifiedProducts","Args":[]}' \
        --tls \
        --cafile "$ORDERER_CA"
}

query_product_history() {
    local productId=$1
    print_header "PRODUCT: Get Product History - $productId"
    peer chaincode query \
        -C $CHANNEL_NAME \
        -n product \
        -c "{\"function\":\"ProductContract:getProductHistory\",\"Args\":[\"$productId\"]}" \
        --tls \
        --cafile "$ORDERER_CA"
}

# ===========================================
# ORDER CONTRACT QUERIES
# ===========================================

query_all_orders() {
    print_header "ORDER: Get All Orders"
    peer chaincode query \
        -C $CHANNEL_NAME \
        -n order \
        -c '{"function":"OrderContract:getAllOrders","Args":[]}' \
        --tls \
        --cafile "$ORDERER_CA"
}

query_order_by_id() {
    local orderId=$1
    print_header "ORDER: Get Order by ID - $orderId"
    peer chaincode query \
        -C $CHANNEL_NAME \
        -n order \
        -c "{\"function\":\"OrderContract:readOrder\",\"Args\":[\"$orderId\"]}" \
        --tls \
        --cafile "$ORDERER_CA"
}

query_order_exists() {
    local orderId=$1
    print_header "ORDER: Check if Order Exists - $orderId"
    peer chaincode query \
        -C $CHANNEL_NAME \
        -n order \
        -c "{\"function\":\"OrderContract:orderExists\",\"Args\":[\"$orderId\"]}" \
        --tls \
        --cafile "$ORDERER_CA"
}

query_orders_by_customer() {
    local customerId=$1
    print_header "ORDER: Get Orders by Customer - $customerId"
    peer chaincode query \
        -C $CHANNEL_NAME \
        -n order \
        -c "{\"function\":\"OrderContract:queryOrdersByCustomer\",\"Args\":[\"$customerId\"]}" \
        --tls \
        --cafile "$ORDERER_CA"
}

query_orders_by_seller() {
    local sellerId=$1
    print_header "ORDER: Get Orders by Seller - $sellerId"
    peer chaincode query \
        -C $CHANNEL_NAME \
        -n order \
        -c "{\"function\":\"OrderContract:queryOrdersBySeller\",\"Args\":[\"$sellerId\"]}" \
        --tls \
        --cafile "$ORDERER_CA"
}

query_orders_by_status() {
    local status=$1
    print_header "ORDER: Get Orders by Status - $status"
    print_info "Valid statuses: pending, confirmed, shipped, delivered, cancelled"
    peer chaincode query \
        -C $CHANNEL_NAME \
        -n order \
        -c "{\"function\":\"OrderContract:queryOrdersByStatus\",\"Args\":[\"$status\"]}" \
        --tls \
        --cafile "$ORDERER_CA"
}

query_order_history() {
    local orderId=$1
    print_header "ORDER: Get Order History - $orderId"
    peer chaincode query \
        -C $CHANNEL_NAME \
        -n order \
        -c "{\"function\":\"OrderContract:getOrderHistory\",\"Args\":[\"$orderId\"]}" \
        --tls \
        --cafile "$ORDERER_CA"
}

# ===========================================
# INTERACTIVE MENU
# ===========================================

show_menu() {
    clear
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║     Hyperledger Fabric Chaincode Query Tool              ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}USER CONTRACT QUERIES:${NC}"
    echo "  1)  Get All Users"
    echo "  2)  Get User by ID"
    echo "  3)  Check if User Exists"
    echo "  4)  Get Users by Role"
    echo "  5)  Get User Statistics"
    echo "  6)  Get Active Users Count"
    echo "  7)  Search Users"
    echo "  8)  Get Users by Date Range"
    echo "  9)  Verify User by Wallet"
    echo "  10) Get User History"
    echo ""
    echo -e "${YELLOW}PRODUCT CONTRACT QUERIES:${NC}"
    echo "  11) Get All Products"
    echo "  12) Get Product by ID"
    echo "  13) Check if Product Exists"
    echo "  14) Get Products by Seller"
    echo "  15) Get Products by Category"
    echo "  16) Get Verified Products"
    echo "  17) Get Product History"
    echo ""
    echo -e "${YELLOW}ORDER CONTRACT QUERIES:${NC}"
    echo "  18) Get All Orders"
    echo "  19) Get Order by ID"
    echo "  20) Check if Order Exists"
    echo "  21) Get Orders by Customer"
    echo "  22) Get Orders by Seller"
    echo "  23) Get Orders by Status"
    echo "  24) Get Order History"
    echo ""
    echo -e "${YELLOW}SPECIAL OPTIONS:${NC}"
    echo "  25) Run All Basic Queries (Get All)"
    echo "  26) Generate Query Examples File"
    echo ""
    echo "  0)  Exit"
    echo ""
    echo -n "Enter your choice: "
}

run_all_basic_queries() {
    print_header "Running All Basic Queries"
    
    query_all_users
    echo "---"
    
    query_user_stats
    echo "---"
    
    query_all_products
    echo "---"
    
    query_verified_products
    echo "---"
    
    query_all_orders
    echo "---"
    
    print_success "All basic queries completed!"
}

generate_examples_file() {
    local filename="query-examples.txt"
    print_header "Generating Query Examples File"
    
    cat > "$filename" << 'EOF'
# Hyperledger Fabric Chaincode Query Examples
# Generated by query-chaincode.sh

# ===========================================
# USER CONTRACT QUERIES
# ===========================================

# Get all users
peer chaincode query -C supply-chain-channel -n user \
  -c '{"function":"UserContract:getAllUsers","Args":[]}' \
  --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem"

# Get specific user
peer chaincode query -C supply-chain-channel -n user \
  -c '{"function":"UserContract:getUser","Args":["user123"]}' \
  --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem"

# Check if user exists
peer chaincode query -C supply-chain-channel -n user \
  -c '{"function":"UserContract:userExists","Args":["user123"]}' \
  --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem"

# Get users by role (supplier, vendor, customer, expert)
peer chaincode query -C supply-chain-channel -n user \
  -c '{"function":"UserContract:getUsersByRole","Args":["customer"]}' \
  --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem"

# Get user statistics
peer chaincode query -C supply-chain-channel -n user \
  -c '{"function":"UserContract:getUserStats","Args":[]}' \
  --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem"

# Get active users count
peer chaincode query -C supply-chain-channel -n user \
  -c '{"function":"UserContract:getActiveUsersCount","Args":[]}' \
  --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem"

# Search users by name/email
peer chaincode query -C supply-chain-channel -n user \
  -c '{"function":"UserContract:searchUsers","Args":["john"]}' \
  --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem"

# Get users by date range
peer chaincode query -C supply-chain-channel -n user \
  -c '{"function":"UserContract:getUsersByDateRange","Args":["2024-01-01","2024-12-31"]}' \
  --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem"

# Verify user by wallet address
peer chaincode query -C supply-chain-channel -n user \
  -c '{"function":"UserContract:verifyUserByWallet","Args":["0x1234567890abcdef"]}' \
  --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem"

# Get user history
peer chaincode query -C supply-chain-channel -n user \
  -c '{"function":"UserContract:getUserHistory","Args":["user123"]}' \
  --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem"

# ===========================================
# PRODUCT CONTRACT QUERIES
# ===========================================

# Get all products
peer chaincode query -C supply-chain-channel -n product \
  -c '{"function":"ProductContract:getAllProducts","Args":[]}' \
  --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem"

# Get specific product
peer chaincode query -C supply-chain-channel -n product \
  -c '{"function":"ProductContract:readProduct","Args":["product123"]}' \
  --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem"

# Check if product exists
peer chaincode query -C supply-chain-channel -n product \
  -c '{"function":"ProductContract:productExists","Args":["product123"]}' \
  --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem"

# Get products by seller
peer chaincode query -C supply-chain-channel -n product \
  -c '{"function":"ProductContract:queryProductsBySeller","Args":["seller123"]}' \
  --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem"

# Get products by category
peer chaincode query -C supply-chain-channel -n product \
  -c '{"function":"ProductContract:queryProductsByCategory","Args":["clothing"]}' \
  --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem"

# Get verified products
peer chaincode query -C supply-chain-channel -n product \
  -c '{"function":"ProductContract:queryVerifiedProducts","Args":[]}' \
  --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem"

# Get product history
peer chaincode query -C supply-chain-channel -n product \
  -c '{"function":"ProductContract:getProductHistory","Args":["product123"]}' \
  --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem"

# ===========================================
# ORDER CONTRACT QUERIES
# ===========================================

# Get all orders
peer chaincode query -C supply-chain-channel -n order \
  -c '{"function":"OrderContract:getAllOrders","Args":[]}' \
  --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem"

# Get specific order
peer chaincode query -C supply-chain-channel -n order \
  -c '{"function":"OrderContract:readOrder","Args":["order123"]}' \
  --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem"

# Check if order exists
peer chaincode query -C supply-chain-channel -n order \
  -c '{"function":"OrderContract:orderExists","Args":["order123"]}' \
  --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem"

# Get orders by customer
peer chaincode query -C supply-chain-channel -n order \
  -c '{"function":"OrderContract:queryOrdersByCustomer","Args":["customer123"]}' \
  --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem"

# Get orders by seller
peer chaincode query -C supply-chain-channel -n order \
  -c '{"function":"OrderContract:queryOrdersBySeller","Args":["seller123"]}' \
  --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem"

# Get orders by status
peer chaincode query -C supply-chain-channel -n order \
  -c '{"function":"OrderContract:queryOrdersByStatus","Args":["pending"]}' \
  --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem"

# Get order history
peer chaincode query -C supply-chain-channel -n order \
  -c '{"function":"OrderContract:getOrderHistory","Args":["order123"]}' \
  --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem"

# ===========================================
# TIPS
# ===========================================

# 1. Replace placeholder IDs (user123, product123, etc.) with actual IDs
# 2. Valid user roles: supplier, vendor, customer, expert
# 3. Valid order statuses: pending, confirmed, shipped, delivered, cancelled
# 4. For date ranges, use ISO format: YYYY-MM-DD
# 5. Wallet addresses should be Ethereum-style: 0x...
EOF

    print_success "Examples file generated: $filename"
}

# Main script execution
if [ $# -eq 0 ]; then
    # Interactive mode
    while true; do
        show_menu
        read choice
        
        case $choice in
            1) query_all_users ;;
            2) 
                echo -n "Enter User ID: "
                read userId
                query_user_by_id "$userId"
                ;;
            3)
                echo -n "Enter User ID: "
                read userId
                query_user_exists "$userId"
                ;;
            4)
                echo -n "Enter Role (supplier/vendor/customer/expert): "
                read role
                query_users_by_role "$role"
                ;;
            5) query_user_stats ;;
            6) query_active_users_count ;;
            7)
                echo -n "Enter Search Term: "
                read searchTerm
                query_search_users "$searchTerm"
                ;;
            8)
                echo -n "Enter Start Date (YYYY-MM-DD): "
                read startDate
                echo -n "Enter End Date (YYYY-MM-DD): "
                read endDate
                query_users_by_date_range "$startDate" "$endDate"
                ;;
            9)
                echo -n "Enter Wallet Address: "
                read wallet
                query_verify_user_by_wallet "$wallet"
                ;;
            10)
                echo -n "Enter User ID: "
                read userId
                query_user_history "$userId"
                ;;
            11) query_all_products ;;
            12)
                echo -n "Enter Product ID: "
                read productId
                query_product_by_id "$productId"
                ;;
            13)
                echo -n "Enter Product ID: "
                read productId
                query_product_exists "$productId"
                ;;
            14)
                echo -n "Enter Seller ID: "
                read sellerId
                query_products_by_seller "$sellerId"
                ;;
            15)
                echo -n "Enter Category: "
                read category
                query_products_by_category "$category"
                ;;
            16) query_verified_products ;;
            17)
                echo -n "Enter Product ID: "
                read productId
                query_product_history "$productId"
                ;;
            18) query_all_orders ;;
            19)
                echo -n "Enter Order ID: "
                read orderId
                query_order_by_id "$orderId"
                ;;
            20)
                echo -n "Enter Order ID: "
                read orderId
                query_order_exists "$orderId"
                ;;
            21)
                echo -n "Enter Customer ID: "
                read customerId
                query_orders_by_customer "$customerId"
                ;;
            22)
                echo -n "Enter Seller ID: "
                read sellerId
                query_orders_by_seller "$sellerId"
                ;;
            23)
                echo -n "Enter Status (pending/confirmed/shipped/delivered/cancelled): "
                read status
                query_orders_by_status "$status"
                ;;
            24)
                echo -n "Enter Order ID: "
                read orderId
                query_order_history "$orderId"
                ;;
            25) run_all_basic_queries ;;
            26) generate_examples_file ;;
            0)
                print_info "Exiting..."
                exit 0
                ;;
            *)
                print_error "Invalid choice. Please try again."
                ;;
        esac
        
        echo ""
        read -p "Press Enter to continue..."
    done
else
    # Command line mode - call function directly
    "$@"
fi