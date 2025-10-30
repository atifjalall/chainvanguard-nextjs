#!/bin/bash

# ============================================
# ChainVanguard - Complete Product Testing
# Pakistan Textile Supply Chain
# ============================================

set -e

# Load environment variables from specific path
ENV_PATH="/Users/atifjalal/Desktop/chainvanguard-nextjs/chainvanguard-backend/api/.env"

if [ -f "$ENV_PATH" ]; then
    source "$ENV_PATH"
    echo "✅ Loaded .env from: $ENV_PATH"
else
    echo "❌ .env file not found at: $ENV_PATH"
    exit 1
fi

BASE_URL="${TEST_BASE_URL:-http://localhost:3001}"

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

# Product IDs for testing
SUPPLIER_PRODUCT_ID=""
VENDOR_PRODUCT_ID=""

echo "=========================================="
echo "🧪 ChainVanguard Product Testing"
echo "=========================================="
echo ""

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
# PRE-FLIGHT CHECKS
# ========================================
print_section "🔧 Pre-flight Checks"

# Check jq
if ! command -v jq &> /dev/null; then
    echo -e "${RED}❌ jq not installed. Install with: brew install jq${NC}"
    exit 1
fi

# Check server
SERVER_CHECK=$(curl -s ${BASE_URL}/health 2>/dev/null)
if contains "$SERVER_CHECK" "OK"; then
    print_result "Server Health" "PASS"
else
    print_result "Server Health" "FAIL"
    echo -e "${RED}Server not running at ${BASE_URL}${NC}"
    exit 1
fi

# Check credentials
if [ -z "$SUPPLIER_TOKEN" ]; then
    echo -e "${RED}❌ SUPPLIER_TOKEN not found in .env${NC}"
    echo "Please run auth tests first"
    exit 1
fi

if [ -z "$VENDOR_TOKEN" ]; then
    echo -e "${RED}❌ VENDOR_TOKEN not found in .env${NC}"
    echo "Please run auth tests first"
    exit 1
fi

echo -e "${BLUE}   Supplier Token: ${SUPPLIER_TOKEN:0:30}...${NC}"
echo -e "${BLUE}   Vendor Token: ${VENDOR_TOKEN:0:30}...${NC}"

sleep 1

# ========================================
# TEST 1: CREATE PRODUCTS
# ========================================
print_section "🆕 Test 1: Create Products"

# Test 1.1: Create Supplier Product (Premium Cotton Fabric)
echo "Test 1.1: Create Supplier Product - Premium Cotton Fabric"
SUPPLIER_PRODUCT=$(curl -s -X POST ${BASE_URL}/api/products \
  -H "Authorization: Bearer $SUPPLIER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Premium Cotton Fabric Roll - White",
    "description": "High-quality 100% cotton fabric from Faisalabad mills. Perfect for premium garments.",
    "category": "Fabric",
    "subcategory": "Cotton",
    "productType": "Raw Material",
    "brand": "Faisalabad Textile Mills",
    "price": 850.00,
    "quantity": 500,
    "minStockLevel": 50,
    "apparelDetails": {
      "size": "Standard Roll",
      "color": "White",
      "material": "100% Pure Cotton",
      "fabricWeight": "200 GSM",
      "fabricType": "Plain Weave",
      "pattern": "Solid"
    },
    "tags": ["cotton", "fabric", "premium", "faisalabad"],
    "season": "All Season",
    "isFeatured": true
  }')

echo "$SUPPLIER_PRODUCT" | jq '.'

if echo "$SUPPLIER_PRODUCT" | jq -e '.success == true' > /dev/null; then
    SUPPLIER_PRODUCT_ID=$(echo "$SUPPLIER_PRODUCT" | jq -r '.product._id')
    SUPPLIER_SKU=$(echo "$SUPPLIER_PRODUCT" | jq -r '.product.sku')
    print_result "Create Supplier Product" "PASS"
    echo -e "${BLUE}   Product ID: $SUPPLIER_PRODUCT_ID${NC}"
    echo -e "${BLUE}   SKU: $SUPPLIER_SKU${NC}"
    
    # Save to env
    if [ -n "$SUPPLIER_PRODUCT_ID" ]; then
        sed -i.bak "s|^PRODUCT_ID_1=.*|PRODUCT_ID_1=$SUPPLIER_PRODUCT_ID|" "$ENV_PATH"
        echo -e "${GREEN}   ✅ Saved PRODUCT_ID_1 to .env${NC}"
    fi
else
    print_result "Create Supplier Product" "FAIL"
    ERROR_MSG=$(echo "$SUPPLIER_PRODUCT" | jq -r '.message // .error // "Unknown error"')
    echo -e "${RED}   Error: $ERROR_MSG${NC}"
fi

sleep 2

# Test 1.2: Create Second Supplier Product (Denim Fabric)
echo ""
echo "Test 1.2: Create Second Supplier Product - Denim Fabric"
SUPPLIER_PRODUCT_2=$(curl -s -X POST ${BASE_URL}/api/products \
  -H "Authorization: Bearer $SUPPLIER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Premium Denim Fabric - Indigo Blue",
    "description": "Authentic denim fabric with classic indigo dye. Made in Faisalabad.",
    "category": "Fabric",
    "subcategory": "Denim",
    "productType": "Raw Material",
    "brand": "Faisalabad Textile Mills",
    "price": 1200.00,
    "quantity": 300,
    "minStockLevel": 30,
    "apparelDetails": {
      "size": "Standard Roll",
      "color": "Indigo Blue",
      "material": "98% Cotton, 2% Elastane",
      "fabricWeight": "12 oz",
      "fabricType": "Twill Weave",
      "pattern": "Denim"
    },
    "tags": ["denim", "fabric", "indigo", "faisalabad"],
    "season": "All Season"
  }')

if echo "$SUPPLIER_PRODUCT_2" | jq -e '.success == true' > /dev/null; then
    SUPPLIER_PRODUCT_ID_2=$(echo "$SUPPLIER_PRODUCT_2" | jq -r '.product._id')
    print_result "Create Second Supplier Product" "PASS"
    echo -e "${BLUE}   Product ID: $SUPPLIER_PRODUCT_ID_2${NC}"
    
    # Save to env
    if [ -n "$SUPPLIER_PRODUCT_ID_2" ]; then
        sed -i.bak "s|^PRODUCT_ID_2=.*|PRODUCT_ID_2=$SUPPLIER_PRODUCT_ID_2|" "$ENV_PATH"
        echo -e "${GREEN}   ✅ Saved PRODUCT_ID_2 to .env${NC}"
    fi
else
    print_result "Create Second Supplier Product" "FAIL"
    ERROR_MSG=$(echo "$SUPPLIER_PRODUCT_2" | jq -r '.message // .error // "Unknown error"')
    echo -e "${RED}   Error: $ERROR_MSG${NC}"
fi

sleep 2

# Test 1.3: Create Vendor Product (Fashion T-Shirt)
echo ""
echo "Test 1.3: Create Vendor Product - Fashion T-Shirt"
VENDOR_PRODUCT=$(curl -s -X POST ${BASE_URL}/api/products \
  -H "Authorization: Bearer $VENDOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Premium Cotton T-Shirt - Karachi Fashion",
    "description": "Stylish premium cotton t-shirt from Karachi Fashion Boutique",
    "category": "Men",
    "subcategory": "T-Shirts",
    "productType": "Casual",
    "brand": "Karachi Fashion",
    "price": 1499.00,
    "quantity": 200,
    "minStockLevel": 20,
    "apparelDetails": {
      "size": "M",
      "color": "Navy Blue",
      "material": "100% Cotton",
      "fit": "Regular Fit",
      "pattern": "Solid",
      "fabricType": "Jersey",
      "fabricWeight": "180 GSM",
      "neckline": "Crew Neck",
      "sleeveLength": "Short Sleeve"
    },
    "tags": ["tshirt", "cotton", "fashion", "karachi"],
    "season": "Summer",
    "isFeatured": true
  }')

if echo "$VENDOR_PRODUCT" | jq -e '.success == true' > /dev/null; then
    VENDOR_PRODUCT_ID=$(echo "$VENDOR_PRODUCT" | jq -r '.product._id')
    VENDOR_SKU=$(echo "$VENDOR_PRODUCT" | jq -r '.product.sku')
    print_result "Create Vendor Product" "PASS"
    echo -e "${BLUE}   Product ID: $VENDOR_PRODUCT_ID${NC}"
    echo -e "${BLUE}   SKU: $VENDOR_SKU${NC}"
else
    print_result "Create Vendor Product" "FAIL"
    ERROR_MSG=$(echo "$VENDOR_PRODUCT" | jq -r '.message // .error // "Unknown error"')
    echo -e "${RED}   Error: $ERROR_MSG${NC}"
fi

sleep 2

# Test 1.4: Create Product with Missing Fields (Should Fail)
echo ""
echo "Test 1.4: Create Product with Missing Fields (Should FAIL)"
INVALID_PRODUCT=$(curl -s -X POST ${BASE_URL}/api/products \
  -H "Authorization: Bearer $SUPPLIER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Incomplete Product",
    "price": 100
  }')

if echo "$INVALID_PRODUCT" | jq -e '.success == false' > /dev/null; then
    print_result "Reject Invalid Product" "PASS"
    echo -e "${BLUE}   Correctly rejected incomplete product${NC}"
else
    print_result "Reject Invalid Product" "FAIL"
fi

sleep 1

# ========================================
# TEST 2: READ OPERATIONS
# ========================================
print_section "🔍 Test 2: Read Operations"

# Test 2.1: Get All Products
echo "Test 2.1: Get All Products (Pagination)"
ALL_PRODUCTS=$(curl -s "${BASE_URL}/api/products?limit=20")

if echo "$ALL_PRODUCTS" | jq -e '.success == true' > /dev/null; then
    TOTAL=$(echo "$ALL_PRODUCTS" | jq -r '.pagination.total')
    print_result "Get All Products" "PASS"
    echo -e "${BLUE}   Total Products: $TOTAL${NC}"
else
    print_result "Get All Products" "FAIL"
fi

sleep 1

# Test 2.2: Get Product by ID
echo ""
echo "Test 2.2: Get Product by ID"
if [ -n "$SUPPLIER_PRODUCT_ID" ]; then
    GET_PRODUCT=$(curl -s "${BASE_URL}/api/products/${SUPPLIER_PRODUCT_ID}")
    
    if echo "$GET_PRODUCT" | jq -e '.success == true' > /dev/null; then
        PRODUCT_NAME=$(echo "$GET_PRODUCT" | jq -r '.product.name')
        PRODUCT_PRICE=$(echo "$GET_PRODUCT" | jq -r '.product.price')
        print_result "Get Product by ID" "PASS"
        echo -e "${BLUE}   Name: $PRODUCT_NAME${NC}"
        echo -e "${BLUE}   Price: Rs. $PRODUCT_PRICE${NC}"
    else
        print_result "Get Product by ID" "FAIL"
    fi
else
    print_result "Get Product by ID" "FAIL"
    echo -e "${YELLOW}   No product ID available${NC}"
fi

sleep 1

# Test 2.3: Search Products
echo ""
echo "Test 2.3: Search Products (Cotton)"
SEARCH=$(curl -s "${BASE_URL}/api/products/search?q=cotton")

if echo "$SEARCH" | jq -e '.success == true' > /dev/null; then
    SEARCH_TOTAL=$(echo "$SEARCH" | jq -r '.pagination.total')
    print_result "Search Products" "PASS"
    echo -e "${BLUE}   Found: $SEARCH_TOTAL products${NC}"
else
    print_result "Search Products" "FAIL"
fi

sleep 1

# Test 2.4: Filter by Category
echo ""
echo "Test 2.4: Filter by Category (Fabric)"
FILTER=$(curl -s "${BASE_URL}/api/products?category=Fabric")

if echo "$FILTER" | jq -e '.success == true' > /dev/null; then
    FILTER_TOTAL=$(echo "$FILTER" | jq -r '.pagination.total')
    print_result "Filter by Category" "PASS"
    echo -e "${BLUE}   Fabric Products: $FILTER_TOTAL${NC}"
else
    print_result "Filter by Category" "FAIL"
fi

sleep 1

# Test 2.5: Get Featured Products
echo ""
echo "Test 2.5: Get Featured Products"
FEATURED=$(curl -s "${BASE_URL}/api/products/featured?limit=10")

if echo "$FEATURED" | jq -e '.success == true' > /dev/null; then
    FEATURED_COUNT=$(echo "$FEATURED" | jq -r '.products | length')
    print_result "Get Featured Products" "PASS"
    echo -e "${BLUE}   Featured: $FEATURED_COUNT products${NC}"
else
    print_result "Get Featured Products" "FAIL"
fi

sleep 1

# Test 2.6: Get Products by Seller
echo ""
echo "Test 2.6: Get Products by Seller (Supplier)"
SELLER_PRODUCTS=$(curl -s "${BASE_URL}/api/products/by-seller/${SUPPLIER_USER_ID}")

if echo "$SELLER_PRODUCTS" | jq -e '.success == true' > /dev/null; then
    SELLER_TOTAL=$(echo "$SELLER_PRODUCTS" | jq -r '.pagination.total')
    print_result "Get Products by Seller" "PASS"
    echo -e "${BLUE}   Supplier's Products: $SELLER_TOTAL${NC}"
else
    print_result "Get Products by Seller" "FAIL"
fi

sleep 1

# ========================================
# TEST 3: UPDATE OPERATIONS
# ========================================
print_section "✏️  Test 3: Update Operations"

if [ -n "$SUPPLIER_PRODUCT_ID" ]; then
    # Test 3.1: Update Product Price and Stock
    echo "Test 3.1: Update Product (Price & Stock)"
    UPDATE=$(curl -s -X PUT "${BASE_URL}/api/products/${SUPPLIER_PRODUCT_ID}" \
      -H "Authorization: Bearer $SUPPLIER_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "price": 900.00,
        "quantity": 600,
        "isFeatured": true
      }')
    
    if echo "$UPDATE" | jq -e '.success == true' > /dev/null; then
        NEW_PRICE=$(echo "$UPDATE" | jq -r '.product.price')
        NEW_STOCK=$(echo "$UPDATE" | jq -r '.product.quantity')
        print_result "Update Product" "PASS"
        echo -e "${BLUE}   New Price: Rs. $NEW_PRICE${NC}"
        echo -e "${BLUE}   New Stock: $NEW_STOCK${NC}"
    else
        print_result "Update Product" "FAIL"
    fi
    
    sleep 2
    
    # Test 3.2: Update Stock Only
    echo ""
    echo "Test 3.2: Update Stock Only (PATCH)"
    STOCK_UPDATE=$(curl -s -X PATCH "${BASE_URL}/api/products/${SUPPLIER_PRODUCT_ID}/stock" \
      -H "Authorization: Bearer $SUPPLIER_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"quantity": 700}')
    
    if echo "$STOCK_UPDATE" | jq -e '.success == true' > /dev/null; then
        UPDATED_STOCK=$(echo "$STOCK_UPDATE" | jq -r '.product.quantity')
        print_result "Update Stock Only" "PASS"
        echo -e "${BLUE}   Updated Stock: $UPDATED_STOCK${NC}"
    else
        print_result "Update Stock Only" "FAIL"
    fi
    
    sleep 2
    
    # Test 3.3: Update Status
    echo ""
    echo "Test 3.3: Update Product Status"
    STATUS_UPDATE=$(curl -s -X PATCH "${BASE_URL}/api/products/${SUPPLIER_PRODUCT_ID}/status" \
      -H "Authorization: Bearer $SUPPLIER_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"status": "active"}')
    
    if echo "$STATUS_UPDATE" | jq -e '.success == true' > /dev/null; then
        print_result "Update Product Status" "PASS"
    else
        print_result "Update Product Status" "FAIL"
    fi
fi

sleep 1

# ========================================
# TEST 4: CATEGORY & METADATA
# ========================================
print_section "🏷️  Test 4: Categories & Metadata"

# Test 4.1: Get All Categories
echo "Test 4.1: Get All Categories"
CATEGORIES=$(curl -s "${BASE_URL}/api/categories")

if echo "$CATEGORIES" | jq -e '.success == true' > /dev/null; then
    CAT_COUNT=$(echo "$CATEGORIES" | jq -r '.data.categories | length')
    print_result "Get Categories" "PASS"
    echo -e "${BLUE}   Total Categories: $CAT_COUNT${NC}"
else
    print_result "Get Categories" "FAIL"
fi

sleep 1

# Test 4.2: Get Subcategories
echo ""
echo "Test 4.2: Get Subcategories (Men)"
SUBCATEGORIES=$(curl -s "${BASE_URL}/api/categories/Men/subcategories")

if echo "$SUBCATEGORIES" | jq -e '.success == true' > /dev/null; then
    SUB_COUNT=$(echo "$SUBCATEGORIES" | jq -r '.data.subcategories | length')
    print_result "Get Subcategories" "PASS"
    echo -e "${BLUE}   Men's Subcategories: $SUB_COUNT${NC}"
else
    print_result "Get Subcategories" "FAIL"
fi

sleep 1

# Test 4.3: Get Materials
echo ""
echo "Test 4.3: Get Available Materials"
MATERIALS=$(curl -s "${BASE_URL}/api/categories/options/materials")

if echo "$MATERIALS" | jq -e '.success == true' > /dev/null; then
    MAT_COUNT=$(echo "$MATERIALS" | jq -r '.data.materials | length')
    print_result "Get Materials" "PASS"
    echo -e "${BLUE}   Available Materials: $MAT_COUNT${NC}"
else
    print_result "Get Materials" "FAIL"
fi

sleep 1

# Test 4.4: Get Colors
echo ""
echo "Test 4.4: Get Available Colors"
COLORS=$(curl -s "${BASE_URL}/api/categories/options/colors")

if echo "$COLORS" | jq -e '.success == true' > /dev/null; then
    COLOR_COUNT=$(echo "$COLORS" | jq -r '.data.colors | length')
    print_result "Get Colors" "PASS"
    echo -e "${BLUE}   Available Colors: $COLOR_COUNT${NC}"
else
    print_result "Get Colors" "FAIL"
fi

sleep 1

# ========================================
# TEST 5: AUTHORIZATION & SECURITY
# ========================================
print_section "🔒 Test 5: Authorization & Security"

# Test 5.1: Unauthorized Create
echo "Test 5.1: Block Unauthorized Product Creation"
UNAUTH_CREATE=$(curl -s -X POST ${BASE_URL}/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Unauthorized Product",
    "price": 100
  }')

if echo "$UNAUTH_CREATE" | jq -e '.success == false' > /dev/null 2>&1 || \
   echo "$UNAUTH_CREATE" | grep -qi "unauthorized\|token\|401"; then
    print_result "Block Unauthorized Create" "PASS"
else
    print_result "Block Unauthorized Create" "FAIL"
fi

sleep 1

# Test 5.2: Cross-User Update (Should Fail)
echo ""
echo "Test 5.2: Block Cross-User Update"
if [ -n "$SUPPLIER_PRODUCT_ID" ]; then
    CROSS_UPDATE=$(curl -s -X PUT "${BASE_URL}/api/products/${SUPPLIER_PRODUCT_ID}" \
      -H "Authorization: Bearer $VENDOR_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"price": 1}')
    
    if echo "$CROSS_UPDATE" | jq -e '.success == false' > /dev/null 2>&1 || \
       echo "$CROSS_UPDATE" | grep -qi "unauthorized\|permission\|403"; then
        print_result "Block Cross-User Update" "PASS"
        echo -e "${BLUE}   Correctly denied vendor updating supplier's product${NC}"
    else
        print_result "Block Cross-User Update" "FAIL"
    fi
else
    print_result "Block Cross-User Update" "FAIL"
    echo -e "${YELLOW}   No product ID for testing${NC}"
fi

sleep 1

# Test 5.3: Customer Cannot Create Product
echo ""
echo "Test 5.3: Block Customer Product Creation"
CUSTOMER_CREATE=$(curl -s -X POST ${BASE_URL}/api/products \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Customer Product",
    "description": "Test",
    "category": "Men",
    "subcategory": "T-Shirts",
    "price": 100,
    "quantity": 10,
    "apparelDetails": {
      "size": "M",
      "color": "Blue",
      "material": "Cotton"
    }
  }')

if echo "$CUSTOMER_CREATE" | jq -e '.success == false' > /dev/null 2>&1 || \
   echo "$CUSTOMER_CREATE" | grep -qi "unauthorized\|denied\|403"; then
    print_result "Block Customer Create" "PASS"
else
    print_result "Block Customer Create" "FAIL"
fi

sleep 1

# ========================================
# TEST 6: VENDOR STORE
# ========================================
print_section "🏪 Test 6: Vendor Store Features"

# Test 6.1: Get Vendor Store Info
echo "Test 6.1: Get Vendor Store Information"
VENDOR_STORE=$(curl -s "${BASE_URL}/api/products/vendor/${VENDOR_USER_ID}/store")

if echo "$VENDOR_STORE" | jq -e '.success == true' > /dev/null; then
    STORE_NAME=$(echo "$VENDOR_STORE" | jq -r '.store.storeName // "N/A"')
    PRODUCT_COUNT=$(echo "$VENDOR_STORE" | jq -r '.store.productCount // 0')
    print_result "Get Vendor Store Info" "PASS"
    echo -e "${BLUE}   Store: $STORE_NAME${NC}"
    echo -e "${BLUE}   Products: $PRODUCT_COUNT${NC}"
else
    print_result "Get Vendor Store Info" "FAIL"
fi

sleep 1

# Test 6.2: Get Vendor Products
echo ""
echo "Test 6.2: Get Vendor Products"
VENDOR_PRODUCTS=$(curl -s "${BASE_URL}/api/products/vendor/${VENDOR_USER_ID}/products")

if echo "$VENDOR_PRODUCTS" | jq -e '.success == true' > /dev/null; then
    VENDOR_PROD_COUNT=$(echo "$VENDOR_PRODUCTS" | jq -r '.pagination.total')
    print_result "Get Vendor Products" "PASS"
    echo -e "${BLUE}   Vendor Products: $VENDOR_PROD_COUNT${NC}"
else
    print_result "Get Vendor Products" "FAIL"
fi

sleep 1

# Test 6.3: Get Vendor Categories
echo ""
echo "Test 6.3: Get Vendor Categories"
VENDOR_CATEGORIES=$(curl -s "${BASE_URL}/api/products/vendor/${VENDOR_USER_ID}/categories")

if echo "$VENDOR_CATEGORIES" | jq -e '.success == true' > /dev/null; then
    print_result "Get Vendor Categories" "PASS"
else
    print_result "Get Vendor Categories" "FAIL"
fi

sleep 1

# ========================================
# TEST 7: BLOCKCHAIN INTEGRATION
# ========================================
print_section "⛓️  Test 7: Blockchain Integration"

if [ -n "$SUPPLIER_PRODUCT_ID" ]; then
    echo "Test 7.1: Get Product Blockchain History"
    HISTORY=$(curl -s "${BASE_URL}/api/products/${SUPPLIER_PRODUCT_ID}/history")
    
    if echo "$HISTORY" | jq -e '.success == true' > /dev/null; then
        print_result "Get Blockchain History" "PASS"
        echo -e "${BLUE}   Product tracked on blockchain${NC}"
    else
        print_result "Get Blockchain History" "FAIL"
        echo -e "${YELLOW}   Note: Product may not be on blockchain yet${NC}"
    fi
else
    print_result "Get Blockchain History" "FAIL"
    echo -e "${YELLOW}   No product ID for testing${NC}"
fi

sleep 1

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
    echo "📦 Products Created:"
    [ -n "$SUPPLIER_PRODUCT_ID" ] && echo "  ✓ Supplier Product 1: $SUPPLIER_PRODUCT_ID"
    [ -n "$SUPPLIER_PRODUCT_ID_2" ] && echo "  ✓ Supplier Product 2: $SUPPLIER_PRODUCT_ID_2"
    [ -n "$VENDOR_PRODUCT_ID" ] && echo "  ✓ Vendor Product: $VENDOR_PRODUCT_ID"
    echo ""
    echo "💾 Product IDs saved to .env file"
    echo ""
    echo "✅ ChainVanguard Product System Ready!"
    echo ""
    exit 0
else
    echo -e "${RED}╔══════════════════════════════════╗${NC}"
    echo -e "${RED}║                                  ║${NC}"
    echo -e "${RED}║   ⚠️  SOME TESTS FAILED          ║${NC}"
    echo -e "${RED}║                                  ║${NC}"
    echo -e "${RED}╚══════════════════════════════════╝${NC}"
    echo ""
    echo "🔍 Troubleshooting:"
    echo "  1. Check if users are email verified"
    echo "  2. Check server logs for errors"
    echo "  3. Verify tokens in .env are valid"
    echo "  4. Check MongoDB connection"
    echo ""
    exit 1
fi