#!/bin/bash

# ============================================
# PRE-TEST SETUP - Complete Environment Prep
# ============================================
# Prepares the test environment:
# 1. Funds customer wallet
# 2. Clears cart
# 3. Verifies products exist
# ============================================

# Load environment variables
ENV_PATH="/Users/atifjalal/Desktop/chainvanguard-nextjs/chainvanguard-backend/api/.env"
if [ -f "$ENV_PATH" ]; then
    set -a
    source "$ENV_PATH"
    set +a
fi

BASE_URL="http://localhost:3001/api"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m'

echo ""
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   PRE-TEST ENVIRONMENT SETUP           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# ============================================
# STEP 1: VERIFY PRODUCTS EXIST
# ============================================
echo -e "${YELLOW}[1/3] Verifying Products...${NC}"

PRODUCTS=$(curl -s -X GET "$BASE_URL/customer/browse/products?limit=5")
PRODUCT_COUNT=$(echo "$PRODUCTS" | jq -r '.products | length // 0')

if [ "$PRODUCT_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✓ Found $PRODUCT_COUNT products${NC}"
    
    # Get first two product IDs
    PROD_1=$(echo "$PRODUCTS" | jq -r '.products[0].id // .products[0]._id // empty')
    PROD_2=$(echo "$PRODUCTS" | jq -r '.products[1].id // .products[1]._id // empty')
    
    if [ ! -z "$PROD_1" ]; then
        echo -e "${GREEN}  Product 1: $PROD_1${NC}"
    fi
    if [ ! -z "$PROD_2" ]; then
        echo -e "${GREEN}  Product 2: $PROD_2${NC}"
    fi
else
    echo -e "${RED}✗ No products found!${NC}"
    echo -e "${YELLOW}  Please run: ./test_products_complete.sh${NC}"
    exit 1
fi

echo ""

# ============================================
# STEP 2: CLEAR CART
# ============================================
echo -e "${YELLOW}[2/3] Clearing Shopping Cart...${NC}"

GET_CART=$(curl -s -X GET "$BASE_URL/cart" -H "Authorization: Bearer $CUSTOMER_TOKEN")
CART_ID=$(echo "$GET_CART" | jq -r '.data._id // .cart._id // empty')

if [ ! -z "$CART_ID" ]; then
    CART_ITEMS=$(echo "$GET_CART" | jq -r '.data.items[]?._id // .cart.items[]?._id // empty' 2>/dev/null)
    
    if [ ! -z "$CART_ITEMS" ]; then
        CLEARED=0
        echo "$CART_ITEMS" | while read ITEM_ID; do
            if [ ! -z "$ITEM_ID" ] && [ "$ITEM_ID" != "null" ]; then
                RESULT=$(curl -s -X DELETE "$BASE_URL/cart/items/$ITEM_ID" -H "Authorization: Bearer $CUSTOMER_TOKEN")
                SUCCESS=$(echo "$RESULT" | jq -r '.success // false')
                if [ "$SUCCESS" = "true" ]; then
                    ((CLEARED++))
                fi
            fi
        done
        echo -e "${GREEN}✓ Cart cleared${NC}"
    else
        echo -e "${GREEN}✓ Cart already empty${NC}"
    fi
else
    echo -e "${GREEN}✓ No cart exists${NC}"
fi

echo ""

# ============================================
# STEP 3: FUND CUSTOMER WALLET
# ============================================
echo -e "${YELLOW}[3/3] Setting Up Customer Wallet...${NC}"

WALLET_CHECK=$(curl -s -X GET "$BASE_URL/wallet/balance" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN")

CURRENT_BALANCE=$(echo "$WALLET_CHECK" | jq -r '.data.balance // 0')
echo -e "  Current Balance: ${MAGENTA}\$$CURRENT_BALANCE${NC}"

# Check if we need to add funds (less than $10,000)
NEEDS_FUNDS=$(awk -v bal="$CURRENT_BALANCE" 'BEGIN { print (bal < 10000) ? "yes" : "no" }')

if [ "$NEEDS_FUNDS" = "yes" ]; then
    echo -e "  ${YELLOW}Balance low, adding \$50,000...${NC}"
    
    ADD_FUNDS=$(curl -s -X POST "$BASE_URL/wallet/add-funds" \
      -H "Authorization: Bearer $CUSTOMER_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "amount": 50000,
        "paymentMethod": "Bank Transfer",
        "metadata": {
          "source": "Test Account",
          "reference": "TEST-SETUP-FUNDING"
        }
      }')
    
    SUCCESS=$(echo "$ADD_FUNDS" | jq -r '.success // false')
    NEW_BALANCE=$(echo "$ADD_FUNDS" | jq -r '.data.newBalance // 0')
    
    if [ "$SUCCESS" = "true" ]; then
        echo -e "${GREEN}✓ Funds added successfully${NC}"
        echo -e "  New Balance: ${MAGENTA}\$$NEW_BALANCE${NC}"
    else
        echo -e "${RED}✗ Failed to add funds${NC}"
        echo "$ADD_FUNDS" | jq '.'
        exit 1
    fi
else
    echo -e "${GREEN}✓ Wallet has sufficient balance${NC}"
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   ✅ SETUP COMPLETE                    ║${NC}"
echo -e "${GREEN}╠════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║   Products: Ready                      ║${NC}"
echo -e "${GREEN}║   Cart: Cleared                        ║${NC}"
echo -e "${GREEN}║   Wallet: Funded                       ║${NC}"
echo -e "${GREEN}║                                        ║${NC}"
echo -e "${GREEN}║   Ready to run tests!                  ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Run: ./test_customer_vendor_complete.sh${NC}"
echo ""