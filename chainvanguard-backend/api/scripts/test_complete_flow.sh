#!/bin/bash

# ============================================
# ChainVanguard - Complete Flow Test
# Single script to test entire product lifecycle
# ============================================

echo "🚀 ChainVanguard - Complete Product Flow Test"
echo "=============================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Base URL
BASE_URL="http://localhost:3001"

# Test Users (Pre-verified)
SUPPLIER_EMAIL="ravian.supplier@test.com"
SUPPLIER_ADDRESS="0xb4965c2c56c8788df29081a7db0c1544d0eee1a0"
SUPPLIER_PASSWORD="NewSupplier2024!Recovered"

VENDOR_EMAIL="ravian.vendor@test.com"
VENDOR_ADDRESS="0x6fb7076f5bce2d7300dc6ae20ded7f18dc6dd907"
VENDOR_PASSWORD="NewVendor2024!Changed"

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Storage
SUPPLIER_TOKEN=""
VENDOR_TOKEN=""
SUPPLIER_PRODUCT_ID=""
VENDOR_PRODUCT_ID=""

# Function to print test result
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

# Function to print section header
print_section() {
    echo ""
    echo "=============================================="
    echo -e "${CYAN}$1${NC}"
    echo "=============================================="
    echo ""
}

# Function to check if response contains string
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

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo -e "${RED}❌ jq is not installed${NC}"
    echo "Install with: brew install jq (Mac) or apt-get install jq (Linux)"
    exit 1
fi

# Check if server is running
SERVER_CHECK=$(curl -s ${BASE_URL}/health 2>/dev/null)
if echo "$SERVER_CHECK" | grep -q "OK"; then
    print_result "Server Health Check" "PASS"
else
    print_result "Server Health Check" "FAIL"
    echo -e "${RED}Server not running at ${BASE_URL}${NC}"
    echo "Start with: npm run dev"
    exit 1
fi

sleep 1

# ========================================
# AUTHENTICATION
# ========================================
print_section "🔐 Authentication & Login"

# Login as Supplier
echo "Logging in as Supplier..."
SUPPLIER_LOGIN=$(curl -s -X POST ${BASE_URL}/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{
    \"address\": \"$SUPPLIER_ADDRESS\",
    \"password\": \"$SUPPLIER_PASSWORD\"
  }")

SUPPLIER_TOKEN=$(echo "$SUPPLIER_LOGIN" | jq -r '.data.token // .token // empty')

if [ -n "$SUPPLIER_TOKEN" ] && [ "$SUPPLIER_TOKEN" != "null" ]; then
    print_result "Supplier Login" "PASS"
    echo -e "${BLUE}   Email: $SUPPLIER_EMAIL${NC}"
    echo -e "${BLUE}   Token: ${SUPPLIER_TOKEN:0:40}...${NC}"
else
    print_result "Supplier Login" "FAIL"
    echo -e "${RED}Response: $SUPPLIER_LOGIN${NC}"
    exit 1
fi

sleep 1

# Login as Vendor
echo ""
echo "Logging in as Vendor..."
VENDOR_LOGIN=$(curl -s -X POST ${BASE_URL}/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{
    \"address\": \"$VENDOR_ADDRESS\",
    \"password\": \"$VENDOR_PASSWORD\"
  }")

VENDOR_TOKEN=$(echo "$VENDOR_LOGIN" | jq -r '.data.token // .token // empty')

if [ -n "$VENDOR_TOKEN" ] && [ "$VENDOR_TOKEN" != "null" ]; then
    print_result "Vendor Login" "PASS"
    echo -e "${BLUE}   Email: $VENDOR_EMAIL${NC}"
    echo -e "${BLUE}   Token: ${VENDOR_TOKEN:0:40}...${NC}"
else
    print_result "Vendor Login" "FAIL"
    echo -e "${YELLOW}Continuing with Supplier only...${NC}"
fi

sleep 1

# ========================================
# GET USER PROFILES
# ========================================
print_section "👤 User Profile Verification"

# Get Supplier Profile
SUPPLIER_PROFILE=$(curl -s -X GET ${BASE_URL}/api/auth/profile \
  -H "Authorization: Bearer $SUPPLIER_TOKEN")

if echo "$SUPPLIER_PROFILE" | grep -q "ravian Smith"; then
    print_result "Get Supplier Profile" "PASS"
    IS_VERIFIED=$(echo "$SUPPLIER_PROFILE" | jq -r '.data.isVerified')
    echo -e "${BLUE}   Name: $(echo "$SUPPLIER_PROFILE" | jq -r '.data.name')${NC}"
    echo -e "${BLUE}   Role: $(echo "$SUPPLIER_PROFILE" | jq -r '.data.role')${NC}"
    echo -e "${BLUE}   Verified: $IS_VERIFIED${NC}"
else
    print_result "Get Supplier Profile" "FAIL"
fi

sleep 1

# ========================================
# CATEGORY API TESTS
# ========================================
print_section "📂 Category API Tests"

# Get All Categories
CATEGORIES=$(curl -s -X GET ${BASE_URL}/api/categories)
if echo "$CATEGORIES" | grep -q "Men"; then
    print_result "Get Categories" "PASS"
    echo -e "${BLUE}   Categories: $(echo "$CATEGORIES" | jq -r '.data.categories | length')${NC}"
else
    print_result "Get Categories" "FAIL"
fi

sleep 1

# Get Subcategories
SUBCATEGORIES=$(curl -s -X GET ${BASE_URL}/api/categories/Men/subcategories)
if echo "$SUBCATEGORIES" | grep -q "T-Shirts"; then
    print_result "Get Subcategories" "PASS"
else
    print_result "Get Subcategories" "FAIL"
fi

sleep 1

# ========================================
# CREATE PRODUCTS
# ========================================
print_section "📦 Product Creation Tests"

# Create Product 1 (Supplier - T-Shirt)
echo "Creating Product 1: Premium T-Shirt (Supplier)..."
CREATE_PRODUCT_1=$(curl -s -X POST ${BASE_URL}/api/products \
  -H "Authorization: Bearer $SUPPLIER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Premium Organic T-Shirt - Navy Blue",
    "description": "High-quality organic cotton t-shirt with premium finish. Eco-friendly and sustainable.",
    "category": "Men",
    "subcategory": "T-Shirts",
    "productType": "Casual",
    "brand": "EcoWear Premium",
    "price": 34.99,
    "currency": "USD",
    "costPrice": 15.00,
    "wholesalePrice": 25.00,
    "quantity": 750,
    "minStockLevel": 75,
    "apparelDetails": {
      "size": "L",
      "color": "Navy Blue",
      "material": "100% Organic Cotton",
      "fit": "Regular Fit",
      "pattern": "Solid",
      "fabricType": "Premium Jersey",
      "fabricWeight": "200 GSM",
      "neckline": "V-Neck",
      "sleeveLength": "Short Sleeve",
      "careInstructions": "Machine wash cold, tumble dry low",
      "washingTemperature": "30°C",
      "ironingInstructions": "Medium heat",
      "dryCleanOnly": false,
      "measurements": {
        "chest": 108,
        "length": 74,
        "shoulder": 48,
        "unit": "cm"
      }
    },
    "manufacturingDetails": {
      "manufacturerName": "Premium Textiles India",
      "batchNumber": "BATCH-2025-001",
      "productionCountry": "India",
      "productionFacility": "Factory B, Mumbai"
    },
    "sustainability": {
      "isOrganic": true,
      "isFairTrade": true,
      "isRecycled": false,
      "isCarbonNeutral": true
    },
    "tags": ["premium", "organic", "navy", "cotton", "sustainable"],
    "season": "All Season",
    "isFeatured": true
  }')

if echo "$CREATE_PRODUCT_1" | grep -q "success"; then
    SUPPLIER_PRODUCT_ID=$(echo "$CREATE_PRODUCT_1" | jq -r '.product._id')
    print_result "Create Product 1 (Supplier)" "PASS"
    echo -e "${BLUE}   ID: $SUPPLIER_PRODUCT_ID${NC}"
    echo -e "${BLUE}   SKU: $(echo "$CREATE_PRODUCT_1" | jq -r '.product.sku')${NC}"
    echo -e "${BLUE}   Name: $(echo "$CREATE_PRODUCT_1" | jq -r '.product.name')${NC}"
    echo -e "${BLUE}   Price: $$(echo "$CREATE_PRODUCT_1" | jq -r '.product.price')${NC}"
else
    print_result "Create Product 1 (Supplier)" "FAIL"
    echo -e "${YELLOW}Response:${NC}"
    echo "$CREATE_PRODUCT_1" | jq '.'
fi

sleep 1

# Create Product 2 (Supplier - Jeans)
echo ""
echo "Creating Product 2: Designer Jeans (Supplier)..."
CREATE_PRODUCT_2=$(curl -s -X POST ${BASE_URL}/api/products \
  -H "Authorization: Bearer $SUPPLIER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Designer Slim Fit Jeans - Dark Wash",
    "description": "Premium designer jeans with perfect fit. Modern style with classic appeal.",
    "category": "Men",
    "subcategory": "Jeans",
    "productType": "Casual",
    "brand": "DenimLux",
    "price": 89.99,
    "currency": "USD",
    "costPrice": 35.00,
    "wholesalePrice": 65.00,
    "quantity": 400,
    "minStockLevel": 40,
    "apparelDetails": {
      "size": "32",
      "color": "Dark Indigo",
      "material": "98% Cotton, 2% Elastane",
      "fit": "Slim Fit",
      "pattern": "Solid",
      "careInstructions": "Machine wash cold, do not bleach"
    },
    "tags": ["designer", "jeans", "slim-fit", "premium"],
    "season": "All Season"
  }')

PRODUCT_2_ID=$(echo "$CREATE_PRODUCT_2" | jq -r '.product._id')

if echo "$CREATE_PRODUCT_2" | grep -q "success"; then
    print_result "Create Product 2 (Supplier)" "PASS"
    echo -e "${BLUE}   ID: $PRODUCT_2_ID${NC}"
    echo -e "${BLUE}   SKU: $(echo "$CREATE_PRODUCT_2" | jq -r '.product.sku')${NC}"
else
    print_result "Create Product 2 (Supplier)" "FAIL"
fi

sleep 1

# Create Product 3 (Vendor - if token available)
if [ -n "$VENDOR_TOKEN" ] && [ "$VENDOR_TOKEN" != "null" ]; then
    echo ""
    echo "Creating Product 3: Fashion Hoodie (Vendor)..."
    CREATE_PRODUCT_3=$(curl -s -X POST ${BASE_URL}/api/products \
      -H "Authorization: Bearer $VENDOR_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "name": "Urban Fashion Hoodie - Charcoal Gray",
        "description": "Trendy hoodie with modern design. Perfect for casual streetwear.",
        "category": "Unisex",
        "subcategory": "Hoodies",
        "productType": "Casual",
        "brand": "UrbanStyle",
        "price": 54.99,
        "quantity": 300,
        "apparelDetails": {
          "size": "M",
          "color": "Charcoal Gray",
          "material": "80% Cotton, 20% Polyester",
          "fit": "Regular Fit",
          "pattern": "Solid"
        },
        "tags": ["hoodie", "urban", "fashion", "streetwear"],
        "season": "Fall/Winter"
      }')
    
    if echo "$CREATE_PRODUCT_3" | grep -q "success"; then
        VENDOR_PRODUCT_ID=$(echo "$CREATE_PRODUCT_3" | jq -r '.product._id')
        print_result "Create Product 3 (Vendor)" "PASS"
        echo -e "${BLUE}   ID: $VENDOR_PRODUCT_ID${NC}"
        echo -e "${BLUE}   SKU: $(echo "$CREATE_PRODUCT_3" | jq -r '.product.sku')${NC}"
    else
        print_result "Create Product 3 (Vendor)" "FAIL"
    fi
fi

sleep 1

# ========================================
# READ PRODUCTS
# ========================================
print_section "🔍 Product Retrieval Tests"

# Get All Products
ALL_PRODUCTS=$(curl -s -X GET "${BASE_URL}/api/products?limit=20")
if echo "$ALL_PRODUCTS" | grep -q "pagination"; then
    TOTAL=$(echo "$ALL_PRODUCTS" | jq -r '.pagination.total')
    print_result "Get All Products" "PASS"
    echo -e "${BLUE}   Total Products: $TOTAL${NC}"
else
    print_result "Get All Products" "FAIL"
fi

sleep 1

# Get Product by ID
if [ -n "$SUPPLIER_PRODUCT_ID" ]; then
    PRODUCT_DETAIL=$(curl -s -X GET "${BASE_URL}/api/products/${SUPPLIER_PRODUCT_ID}")
    if echo "$PRODUCT_DETAIL" | grep -q "Premium Organic"; then
        print_result "Get Product by ID" "PASS"
        echo -e "${BLUE}   Name: $(echo "$PRODUCT_DETAIL" | jq -r '.product.name')${NC}"
        echo -e "${BLUE}   Price: $$(echo "$PRODUCT_DETAIL" | jq -r '.product.price')${NC}"
        echo -e "${BLUE}   Stock: $(echo "$PRODUCT_DETAIL" | jq -r '.product.quantity')${NC}"
    else
        print_result "Get Product by ID" "FAIL"
    fi
fi

sleep 1

# Search Products
SEARCH_RESULTS=$(curl -s -X GET "${BASE_URL}/api/products/search?q=organic")
if echo "$SEARCH_RESULTS" | grep -q "success"; then
    SEARCH_COUNT=$(echo "$SEARCH_RESULTS" | jq -r '.pagination.total')
    print_result "Search Products" "PASS"
    echo -e "${BLUE}   Results for 'organic': $SEARCH_COUNT${NC}"
else
    print_result "Search Products" "FAIL"
fi

sleep 1

# Filter by Category
FILTER_RESULTS=$(curl -s -X GET "${BASE_URL}/api/products?category=Men&limit=10")
if echo "$FILTER_RESULTS" | grep -q "success"; then
    FILTER_COUNT=$(echo "$FILTER_RESULTS" | jq -r '.pagination.total')
    print_result "Filter by Category" "PASS"
    echo -e "${BLUE}   Men's Products: $FILTER_COUNT${NC}"
else
    print_result "Filter by Category" "FAIL"
fi

sleep 1

# Get Featured Products
FEATURED=$(curl -s -X GET "${BASE_URL}/api/products/featured?limit=5")
if echo "$FEATURED" | grep -q "success"; then
    FEATURED_COUNT=$(echo "$FEATURED" | jq -r '.products | length')
    print_result "Get Featured Products" "PASS"
    echo -e "${BLUE}   Featured: $FEATURED_COUNT${NC}"
else
    print_result "Get Featured Products" "FAIL"
fi

sleep 1

# Get Products by Category Endpoint
BY_CATEGORY=$(curl -s -X GET "${BASE_URL}/api/products/by-category/Men")
if echo "$BY_CATEGORY" | grep -q "success"; then
    print_result "Get Products by Category" "PASS"
else
    print_result "Get Products by Category" "FAIL"
fi

sleep 1

# ========================================
# UPDATE PRODUCTS
# ========================================
print_section "✏️  Product Update Tests"

if [ -n "$SUPPLIER_PRODUCT_ID" ]; then
    # Update Product Price & Stock
    echo "Updating Product: Price and Stock..."
    UPDATE_PRODUCT=$(curl -s -X PUT "${BASE_URL}/api/products/${SUPPLIER_PRODUCT_ID}" \
      -H "Authorization: Bearer $SUPPLIER_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "price": 31.99,
        "quantity": 800,
        "isFeatured": true
      }')
    
    if echo "$UPDATE_PRODUCT" | grep -q "success"; then
        print_result "Update Product" "PASS"
        echo -e "${BLUE}   New Price: $$(echo "$UPDATE_PRODUCT" | jq -r '.product.price')${NC}"
        echo -e "${BLUE}   New Stock: $(echo "$UPDATE_PRODUCT" | jq -r '.product.quantity')${NC}"
    else
        print_result "Update Product" "FAIL"
    fi
    
    sleep 1
    
    # Update Stock Only
    echo ""
    echo "Updating Stock Quantity..."
    UPDATE_STOCK=$(curl -s -X PATCH "${BASE_URL}/api/products/${SUPPLIER_PRODUCT_ID}/stock" \
      -H "Authorization: Bearer $SUPPLIER_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"quantity": 900}')
    
    if echo "$UPDATE_STOCK" | grep -q "success"; then
        print_result "Update Stock" "PASS"
        echo -e "${BLUE}   New Stock: $(echo "$UPDATE_STOCK" | jq -r '.product.quantity')${NC}"
    else
        print_result "Update Stock" "FAIL"
    fi
    
    sleep 1
    
    # Update Status
    echo ""
    echo "Updating Product Status..."
    UPDATE_STATUS=$(curl -s -X PATCH "${BASE_URL}/api/products/${SUPPLIER_PRODUCT_ID}/status" \
      -H "Authorization: Bearer $SUPPLIER_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"status": "active"}')
    
    if echo "$UPDATE_STATUS" | grep -q "success"; then
        print_result "Update Status" "PASS"
    else
        print_result "Update Status" "FAIL"
    fi
fi

sleep 1

# ========================================
# BLOCKCHAIN TESTS
# ========================================
print_section "⛓️  Blockchain Integration Tests"

if [ -n "$SUPPLIER_PRODUCT_ID" ]; then
    # Get Product History
    HISTORY=$(curl -s -X GET "${BASE_URL}/api/products/${SUPPLIER_PRODUCT_ID}/history")
    
    if echo "$HISTORY" | grep -q "success"; then
        print_result "Get Product History" "PASS"
        BLOCKCHAIN_VERIFIED=$(echo "$HISTORY" | jq -r '.success')
        echo -e "${BLUE}   Blockchain Status: $BLOCKCHAIN_VERIFIED${NC}"
    else
        print_result "Get Product History" "FAIL"
        echo -e "${YELLOW}   Note: Product may not be on blockchain yet${NC}"
    fi
fi

sleep 1

# ========================================
# RELATED PRODUCTS
# ========================================
print_section "🔗 Related Products Tests"

if [ -n "$SUPPLIER_PRODUCT_ID" ]; then
    RELATED=$(curl -s -X GET "${BASE_URL}/api/products/${SUPPLIER_PRODUCT_ID}/related?limit=3")
    
    if echo "$RELATED" | grep -q "success"; then
        RELATED_COUNT=$(echo "$RELATED" | jq -r '.products | length')
        print_result "Get Related Products" "PASS"
        echo -e "${BLUE}   Related Products: $RELATED_COUNT${NC}"
    else
        print_result "Get Related Products" "FAIL"
    fi
fi

sleep 1

# ========================================
# AUTHORIZATION TESTS
# ========================================
print_section "🔒 Authorization Tests"

# Try to update without token (should fail)
UNAUTHORIZED_UPDATE=$(curl -s -X PUT "${BASE_URL}/api/products/${SUPPLIER_PRODUCT_ID}" \
  -H "Content-Type: application/json" \
  -d '{"price": 1.00}')

if echo "$UNAUTHORIZED_UPDATE" | grep -q "Unauthorized\|token"; then
    print_result "Unauthorized Update Blocked" "PASS"
else
    print_result "Unauthorized Update Blocked" "FAIL"
fi

sleep 1

# Try to create product without auth (should fail)
UNAUTHORIZED_CREATE=$(curl -s -X POST ${BASE_URL}/api/products \
  -H "Content-Type: application/json" \
  -d '{"name": "Test", "price": 10}')

if echo "$UNAUTHORIZED_CREATE" | grep -q "Unauthorized\|token"; then
    print_result "Unauthorized Create Blocked" "PASS"
else
    print_result "Unauthorized Create Blocked" "FAIL"
fi

sleep 1

# ========================================
# STATISTICS
# ========================================
print_section "📊 Product Statistics"

if [ -n "$SUPPLIER_TOKEN" ]; then
    STATS=$(curl -s -X GET "${BASE_URL}/api/products/stats/overview" \
      -H "Authorization: Bearer $SUPPLIER_TOKEN")
    
    if echo "$STATS" | grep -q "success"; then
        print_result "Get Product Stats" "PASS"
        echo -e "${BLUE}   Total Products: $(echo "$STATS" | jq -r '.stats.totalProducts // 0')${NC}"
        echo -e "${BLUE}   Active Products: $(echo "$STATS" | jq -r '.stats.activeProducts // 0')${NC}"
    else
        print_result "Get Product Stats" "FAIL"
    fi
fi

sleep 1

# ========================================
# FINAL SUMMARY
# ========================================
print_section "📊 TEST SUMMARY"

echo -e "${BLUE}Total Tests Run: $TOTAL_TESTS${NC}"
echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
echo -e "${RED}Failed: $FAILED_TESTS${NC}"
echo ""

# Calculate percentage
if [ $TOTAL_TESTS -gt 0 ]; then
    PERCENTAGE=$((PASSED_TESTS * 100 / TOTAL_TESTS))
    echo -e "${CYAN}Success Rate: ${PERCENTAGE}%${NC}"
fi

echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                        ║${NC}"
    echo -e "${GREEN}║   🎉 ALL TESTS PASSED! 🎉             ║${NC}"
    echo -e "${GREEN}║                                        ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
    echo ""
    echo "=============================================="
    echo "📝 Products Created:"
    echo "=============================================="
    echo ""
    
    if [ -n "$SUPPLIER_PRODUCT_ID" ]; then
        echo "1. Premium Organic T-Shirt (Supplier)"
        echo "   ID: $SUPPLIER_PRODUCT_ID"
        echo "   Price: \$31.99"
        echo "   Stock: 900 units"
        echo ""
    fi
    
    if [ -n "$PRODUCT_2_ID" ]; then
        echo "2. Designer Slim Fit Jeans (Supplier)"
        echo "   ID: $PRODUCT_2_ID"
        echo "   Price: \$89.99"
        echo "   Stock: 400 units"
        echo ""
    fi
    
    if [ -n "$VENDOR_PRODUCT_ID" ]; then
        echo "3. Urban Fashion Hoodie (Vendor)"
        echo "   ID: $VENDOR_PRODUCT_ID"
        echo "   Price: \$54.99"
        echo "   Stock: 300 units"
        echo ""
    fi
    
    echo "=============================================="
    echo "✅ ChainVanguard API is fully functional!"
    echo "=============================================="
    echo ""
    exit 0
else
    echo -e "${RED}╔════════════════════════════════════════╗${NC}"
    echo -e "${RED}║                                        ║${NC}"
    echo -e "${RED}║   ⚠️  SOME TESTS FAILED                ║${NC}"
    echo -e "${RED}║                                        ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════╝${NC}"
    echo ""
    echo "Review the failed tests above for details."
    echo ""
    exit 1
fi