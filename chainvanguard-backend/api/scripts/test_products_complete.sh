#!/bin/bash

# ============================================
# ChainVanguard - Simple Product Test Script
# ============================================
# Your credentials are already filled in!
# ============================================

# ========================================
# 📝 YOUR CREDENTIALS (Pre-filled)
# ========================================

# User Addresses & Passwords
SUPPLIER_ADDRESS="0xd5398936ba17de944cfbbbb57446d22e58cef0fb"
SUPPLIER_PASSWORD="NewSupplier2024!Recovered"

VENDOR_ADDRESS="0x342de0c217f980d4927163990c88fa664a1ef1e6"
VENDOR_PASSWORD="NewVendor2024!Changed"

# Existing Product ID (for update tests)
EXISTING_PRODUCT_ID="68f55a1296b64adc37231b15"

# API Base URL
BASE_URL="http://localhost:3001"

# ========================================
# NO NEED TO EDIT BELOW THIS LINE
# ========================================

echo "🧪 ChainVanguard Product Testing"
echo "================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Storage
SUPPLIER_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGY1NThjYTk2YjY0YWRjMzcyMzFhZDkiLCJ3YWxsZXRBZGRyZXNzIjoiMHhkNTM5ODkzNmJhMTdkZTk0NGNmYmJiYjU3NDQ2ZDIyZTU4Y2VmMGZiIiwicm9sZSI6InN1cHBsaWVyIiwiaWF0IjoxNzYwOTA5Nzg1LCJleHAiOjE3NjE1MTQ1ODV9.XORhnhHsAdbMsso8ae3Xe1DldAs3r-lfz9ZqgW6PU40"
VENDOR_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGY1NThjYzk2YjY0YWRjMzcyMzFhZGIiLCJ3YWxsZXRBZGRyZXNzIjoiMHgzNDJkZTBjMjE3Zjk4MGQ0OTI3MTYzOTkwYzg4ZmE2NjRhMWVmMWU2Iiwicm9sZSI6InZlbmRvciIsImlhdCI6MTc2MDkwOTg5NCwiZXhwIjoxNzYxNTE0Njk0fQ.PgRoZxDjtX8tLn_UkSPeMQgKOQLLCdDcV4SfEDNfbeQ"
NEW_PRODUCT_ID="68f55a1296b64adc37231b15"
NEW_PRODUCT_ID_2="68f55a1296b64adc37231b15"

# Functions
print_result() {
    local test_name=$1
    local result=$2
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if [ "$result" = "PASS" ]; then
        echo -e "${GREEN}✅ PASS${NC} - $test_name"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}❌ FAIL${NC} - $test_name"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

print_section() {
    echo ""
    echo "=========================================="
    echo -e "${CYAN}$1${NC}"
    echo "=========================================="
    echo ""
}

contains() {
    if echo "$1" | grep -q "$2"; then
        return 0
    else
        return 1
    fi
}

# ========================================
# PRE-FLIGHT CHECK
# ========================================
print_section "🔧 Pre-flight Checks"

SERVER_CHECK=$(curl -s ${BASE_URL}/health 2>/dev/null)
if contains "$SERVER_CHECK" "OK"; then
    print_result "Server Health" "PASS"
else
    print_result "Server Health" "FAIL"
    echo -e "${RED}Server not running at ${BASE_URL}${NC}"
    echo "Start with: npm run dev"
    exit 1
fi

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}⚠️  jq not found. Install with: brew install jq${NC}"
    exit 1
fi

# ========================================
# LOGIN
# ========================================
print_section "🔐 Authentication"

echo "Logging in as Supplier..."
SUPPLIER_LOGIN=$(curl -s -X POST ${BASE_URL}/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{
    \"address\": \"$SUPPLIER_ADDRESS\",
    \"password\": \"$SUPPLIER_PASSWORD\"
  }")

SUPPLIER_TOKEN=$(echo "$SUPPLIER_LOGIN" | jq -r '.data.token // .token // empty' 2>/dev/null)

if [ -n "$SUPPLIER_TOKEN" ] && [ "$SUPPLIER_TOKEN" != "null" ]; then
    print_result "Supplier Login" "PASS"
    echo -e "${BLUE}   Address: $SUPPLIER_ADDRESS${NC}"
    echo -e "${BLUE}   Token: ${SUPPLIER_TOKEN:0:40}...${NC}"
else
    print_result "Supplier Login" "FAIL"
    echo -e "${RED}Response:${NC}"
    echo "$SUPPLIER_LOGIN" | jq '.'
    exit 1
fi

echo ""
echo "Logging in as Vendor..."
VENDOR_LOGIN=$(curl -s -X POST ${BASE_URL}/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{
    \"address\": \"$VENDOR_ADDRESS\",
    \"password\": \"$VENDOR_PASSWORD\"
  }")

VENDOR_TOKEN=$(echo "$VENDOR_LOGIN" | jq -r '.data.token // .token // empty' 2>/dev/null)

if [ -n "$VENDOR_TOKEN" ] && [ "$VENDOR_TOKEN" != "null" ]; then
    print_result "Vendor Login" "PASS"
    echo -e "${BLUE}   Address: $VENDOR_ADDRESS${NC}"
else
    print_result "Vendor Login" "FAIL"
    echo -e "${YELLOW}Continuing with Supplier only...${NC}"
fi

# ========================================
# TEST EXISTING PRODUCT
# ========================================
print_section "📦 Testing Existing Product"

echo "Getting product: $EXISTING_PRODUCT_ID"
EXISTING=$(curl -s "${BASE_URL}/api/products/${EXISTING_PRODUCT_ID}")

if contains "$EXISTING" "success"; then
    print_result "Get Existing Product" "PASS"
    PROD_NAME=$(echo "$EXISTING" | jq -r '.product.name' 2>/dev/null)
    PROD_PRICE=$(echo "$EXISTING" | jq -r '.product.price' 2>/dev/null)
    PROD_STOCK=$(echo "$EXISTING" | jq -r '.product.quantity' 2>/dev/null)
    echo -e "${BLUE}   Name: $PROD_NAME${NC}"
    echo -e "${BLUE}   Price: \$$PROD_PRICE${NC}"
    echo -e "${BLUE}   Stock: $PROD_STOCK${NC}"
else
    print_result "Get Existing Product" "FAIL"
fi

# ========================================
# CREATE NEW PRODUCTS
# ========================================
print_section "🆕 Creating New Products"

echo "1. Creating Premium T-Shirt..."
CREATE_1=$(curl -s -X POST ${BASE_URL}/api/products \
  -H "Authorization: Bearer $SUPPLIER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Premium Cotton T-Shirt - Gray",
    "description": "Comfortable premium cotton t-shirt",
    "category": "Men",
    "subcategory": "T-Shirts",
    "productType": "Casual",
    "brand": "PremiumWear",
    "price": 34.99,
    "quantity": 400,
    "minStockLevel": 40,
    "apparelDetails": {
      "size": "L",
      "color": "Gray",
      "material": "100% Cotton",
      "fit": "Regular Fit",
      "pattern": "Solid",
      "fabricType": "Jersey",
      "fabricWeight": "180 GSM",
      "neckline": "Crew Neck",
      "sleeveLength": "Short Sleeve"
    },
    "tags": ["premium", "cotton", "gray"],
    "season": "All Season"
  }')

if contains "$CREATE_1" "success"; then
    NEW_PRODUCT_ID=$(echo "$CREATE_1" | jq -r '.product._id' 2>/dev/null)
    NEW_SKU=$(echo "$CREATE_1" | jq -r '.product.sku' 2>/dev/null)
    print_result "Create Premium T-Shirt" "PASS"
    echo -e "${BLUE}   ID: $NEW_PRODUCT_ID${NC}"
    echo -e "${BLUE}   SKU: $NEW_SKU${NC}"
else
    print_result "Create Premium T-Shirt" "FAIL"
    echo -e "${YELLOW}Response:${NC}"
    echo "$CREATE_1" | jq '.'
fi

echo ""
echo "2. Creating Denim Jeans..."
CREATE_2=$(curl -s -X POST ${BASE_URL}/api/products \
  -H "Authorization: Bearer $SUPPLIER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Slim Fit Denim Jeans - Dark Blue",
    "description": "Modern slim fit jeans",
    "category": "Men",
    "subcategory": "Jeans",
    "productType": "Casual",
    "brand": "DenimPro",
    "price": 64.99,
    "quantity": 250,
    "apparelDetails": {
      "size": "32",
      "color": "Dark Blue",
      "material": "98% Cotton, 2% Elastane",
      "fit": "Slim Fit",
      "pattern": "Solid"
    },
    "tags": ["denim", "jeans", "slim"],
    "season": "All Season"
  }')

if contains "$CREATE_2" "success"; then
    NEW_PRODUCT_ID_2=$(echo "$CREATE_2" | jq -r '.product._id' 2>/dev/null)
    print_result "Create Denim Jeans" "PASS"
    echo -e "${BLUE}   ID: $NEW_PRODUCT_ID_2${NC}"
else
    print_result "Create Denim Jeans" "FAIL"
fi

# Vendor Product
if [ -n "$VENDOR_TOKEN" ] && [ "$VENDOR_TOKEN" != "null" ]; then
    echo ""
    echo "3. Creating Vendor Product (Hoodie)..."
    CREATE_3=$(curl -s -X POST ${BASE_URL}/api/products \
      -H "Authorization: Bearer $VENDOR_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "name": "Casual Hoodie - Charcoal",
        "description": "Comfortable casual hoodie",
        "category": "Unisex",
        "subcategory": "Hoodies",
        "productType": "Casual",
        "price": 49.99,
        "quantity": 180,
        "apparelDetails": {
          "size": "M",
          "color": "Charcoal",
          "material": "Cotton Blend",
          "fit": "Regular Fit",
          "pattern": "Solid"
        },
        "tags": ["hoodie", "casual"],
        "season": "All Season"
      }')
    
    if contains "$CREATE_3" "success"; then
        print_result "Create Hoodie (Vendor)" "PASS"
    else
        print_result "Create Hoodie (Vendor)" "FAIL"
    fi
fi

# ========================================
# READ OPERATIONS
# ========================================
print_section "🔍 Product Retrieval"

# Get All
echo "Getting all products..."
ALL=$(curl -s "${BASE_URL}/api/products?limit=20")
if contains "$ALL" "pagination"; then
    TOTAL=$(echo "$ALL" | jq -r '.pagination.total' 2>/dev/null)
    print_result "Get All Products" "PASS"
    echo -e "${BLUE}   Total Products: $TOTAL${NC}"
else
    print_result "Get All Products" "FAIL"
fi

# Get by ID
if [ -n "$NEW_PRODUCT_ID" ]; then
    echo ""
    echo "Getting product by ID..."
    GET_ONE=$(curl -s "${BASE_URL}/api/products/${NEW_PRODUCT_ID}")
    if contains "$GET_ONE" "Premium Cotton"; then
        print_result "Get Product by ID" "PASS"
    else
        print_result "Get Product by ID" "FAIL"
    fi
fi

# Search
echo ""
echo "Searching for 'cotton'..."
SEARCH=$(curl -s "${BASE_URL}/api/products/search?q=cotton")
if contains "$SEARCH" "success"; then
    SEARCH_COUNT=$(echo "$SEARCH" | jq -r '.pagination.total' 2>/dev/null)
    print_result "Search Products" "PASS"
    echo -e "${BLUE}   Results: $SEARCH_COUNT${NC}"
else
    print_result "Search Products" "FAIL"
fi

# Filter by Category
echo ""
echo "Filtering by category (Men)..."
FILTER=$(curl -s "${BASE_URL}/api/products?category=Men&limit=10")
if contains "$FILTER" "success"; then
    FILTER_COUNT=$(echo "$FILTER" | jq -r '.pagination.total' 2>/dev/null)
    print_result "Filter by Category" "PASS"
    echo -e "${BLUE}   Men's Products: $FILTER_COUNT${NC}"
else
    print_result "Filter by Category" "FAIL"
fi

# Featured Products
echo ""
echo "Getting featured products..."
FEATURED=$(curl -s "${BASE_URL}/api/products/featured?limit=5")
if contains "$FEATURED" "success"; then
    print_result "Get Featured Products" "PASS"
else
    print_result "Get Featured Products" "FAIL"
fi

# ========================================
# UPDATE OPERATIONS
# ========================================
print_section "✏️  Product Updates"

if [ -n "$NEW_PRODUCT_ID" ]; then
    echo "Updating product price and stock..."
    UPDATE=$(curl -s -X PUT "${BASE_URL}/api/products/${NEW_PRODUCT_ID}" \
      -H "Authorization: Bearer $SUPPLIER_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "price": 29.99,
        "quantity": 500,
        "isFeatured": true
      }')
    
    if contains "$UPDATE" "success"; then
        NEW_PRICE=$(echo "$UPDATE" | jq -r '.product.price' 2>/dev/null)
        NEW_STOCK=$(echo "$UPDATE" | jq -r '.product.quantity' 2>/dev/null)
        print_result "Update Product" "PASS"
        echo -e "${BLUE}   New Price: \$$NEW_PRICE${NC}"
        echo -e "${BLUE}   New Stock: $NEW_STOCK${NC}"
    else
        print_result "Update Product" "FAIL"
    fi
    
    echo ""
    echo "Updating stock only..."
    STOCK=$(curl -s -X PATCH "${BASE_URL}/api/products/${NEW_PRODUCT_ID}/stock" \
      -H "Authorization: Bearer $SUPPLIER_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"quantity": 600}')
    
    if contains "$STOCK" "success"; then
        print_result "Update Stock Only" "PASS"
    else
        print_result "Update Stock Only" "FAIL"
    fi
fi

# ========================================
# CATEGORY TESTS
# ========================================
print_section "🏷️  Categories"

CATS=$(curl -s "${BASE_URL}/api/categories")
if contains "$CATS" "Men"; then
    CAT_COUNT=$(echo "$CATS" | jq -r '.data.categories | length' 2>/dev/null)
    print_result "Get Categories" "PASS"
    echo -e "${BLUE}   Categories: $CAT_COUNT${NC}"
else
    print_result "Get Categories" "FAIL"
fi

SUBS=$(curl -s "${BASE_URL}/api/categories/Men/subcategories")
if contains "$SUBS" "T-Shirts"; then
    print_result "Get Subcategories" "PASS"
else
    print_result "Get Subcategories" "FAIL"
fi

MATERIALS=$(curl -s "${BASE_URL}/api/categories/options/materials")
if contains "$MATERIALS" "Cotton"; then
    print_result "Get Materials" "PASS"
else
    print_result "Get Materials" "FAIL"
fi

# ========================================
# AUTHORIZATION
# ========================================
print_section "🔒 Authorization Tests"

# Test unauthorized access
UNAUTH=$(curl -s -X PUT "${BASE_URL}/api/products/${NEW_PRODUCT_ID}" \
  -H "Content-Type: application/json" \
  -d '{"price": 1}')

if contains "$UNAUTH" "Unauthorized\|token\|401"; then
    print_result "Block Unauthorized Update" "PASS"
else
    print_result "Block Unauthorized Update" "FAIL"
fi

# Test unauthorized create
UNAUTH_CREATE=$(curl -s -X POST ${BASE_URL}/api/products \
  -H "Content-Type: application/json" \
  -d '{"name": "Test", "price": 10}')

if contains "$UNAUTH_CREATE" "Unauthorized\|token\|401"; then
    print_result "Block Unauthorized Create" "PASS"
else
    print_result "Block Unauthorized Create" "FAIL"
fi

# ========================================
# BLOCKCHAIN STATUS
# ========================================
print_section "⛓️  Blockchain Status"

if [ -n "$NEW_PRODUCT_ID" ]; then
    HISTORY=$(curl -s "${BASE_URL}/api/products/${NEW_PRODUCT_ID}/history")
    
    if contains "$HISTORY" "success"; then
        VERIFIED=$(echo "$HISTORY" | jq -r '.success' 2>/dev/null)
        print_result "Get Product History" "PASS"
        echo -e "${BLUE}   Blockchain Verified: $VERIFIED${NC}"
    else
        print_result "Get Product History" "FAIL"
        echo -e "${YELLOW}   Note: Product not on blockchain yet${NC}"
    fi
fi

# ========================================
# SUMMARY
# ========================================
print_section "📊 Test Summary"

PERCENTAGE=$((PASSED_TESTS * 100 / TOTAL_TESTS))

echo -e "${BLUE}Total Tests:    $TOTAL_TESTS${NC}"
echo -e "${GREEN}Passed:         $PASSED_TESTS${NC}"
echo -e "${RED}Failed:         $FAILED_TESTS${NC}"
echo -e "${CYAN}Success Rate:   ${PERCENTAGE}%${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}╔══════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                  ║${NC}"
    echo -e "${GREEN}║    🎉 ALL TESTS PASSED! 🎉       ║${NC}"
    echo -e "${GREEN}║                                  ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════╝${NC}"
    echo ""
    echo "Products in Database:"
    [ -n "$EXISTING_PRODUCT_ID" ] && echo "  ✓ Existing: $EXISTING_PRODUCT_ID"
    [ -n "$NEW_PRODUCT_ID" ] && echo "  ✓ T-Shirt: $NEW_PRODUCT_ID"
    [ -n "$NEW_PRODUCT_ID_2" ] && echo "  ✓ Jeans: $NEW_PRODUCT_ID_2"
    echo ""
    echo "✅ ChainVanguard Product API is fully functional!"
    echo ""
else
    echo -e "${RED}╔══════════════════════════════════╗${NC}"
    echo -e "${RED}║                                  ║${NC}"
    echo -e "${RED}║   ⚠️  SOME TESTS FAILED          ║${NC}"
    echo -e "${RED}║                                  ║${NC}"
    echo -e "${RED}╚══════════════════════════════════╝${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "  1. Check server logs for errors"
    echo "  2. Verify MongoDB is running"
    echo "  3. Check credentials in script"
    echo ""
fi

exit $([ $FAILED_TESTS -eq 0 ] && echo 0 || echo 1)