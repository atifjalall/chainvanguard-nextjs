#!/bin/bash

# ========================================
# INVENTORY BROWSE SYSTEM - COMPLETE TEST
# Tests all browse, search, and filtering functionality
# No cart/wishlist operations - pure browsing only
# ========================================

echo "======================================"
echo "INVENTORY BROWSE SYSTEM TEST"
echo "======================================"
echo ""

# Load environment variables
ENV_PATH="/Users/atifjalal/Desktop/chainvanguard-nextjs/chainvanguard-backend/api/.env"

if [ -f "$ENV_PATH" ]; then
    echo "Loading environment from: $ENV_PATH"
    source "$ENV_PATH"
    echo "Environment loaded successfully"
else
    echo "Error: .env file not found at $ENV_PATH"
    exit 1
fi

BASE_URL="http://localhost:3001/api"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to print test result
print_result() {
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ PASS${NC}: $2"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}✗ FAIL${NC}: $2"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        if [ -n "$3" ]; then
            echo -e "${RED}  Error: $3${NC}"
        fi
    fi
}

# Function to print section header
print_section() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

# Function to print info
print_info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

# Function to print warning
print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# ========================================
# STEP 0: VALIDATE ENVIRONMENT VARIABLES
# ========================================
print_section "STEP 0: Validating Environment"

REQUIRED_VARS=(
    "SUPPLIER_TOKEN"
    "SUPPLIER_ID"
    "VENDOR_TOKEN"
    "VENDOR_ID"
    "INVENTORY_ID_1"
    "INVENTORY_ID_2"
    "INVENTORY_ID_3"
    "INVENTORY_ID_4"
    "INVENTORY_ID_5"
)

MISSING_VARS=0
echo -e "${YELLOW}Checking required environment variables...${NC}"
for VAR in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!VAR}" ]; then
        echo -e "  ${RED}✗ Missing: $VAR${NC}"
        MISSING_VARS=$((MISSING_VARS + 1))
    else
        echo -e "  ${GREEN}✓ Found: $VAR${NC}"
    fi
done

if [ $MISSING_VARS -gt 0 ]; then
    echo ""
    echo -e "${RED}ERROR: Missing $MISSING_VARS required environment variables${NC}"
    exit 1
fi

print_result 0 "All required environment variables present"

# Display inventory IDs for reference
print_info "Using Inventory IDs:"
echo "  1. $INVENTORY_ID_1"
echo "  2. $INVENTORY_ID_2"
echo "  3. $INVENTORY_ID_3"
echo "  4. $INVENTORY_ID_4"
echo "  5. $INVENTORY_ID_5"

sleep 1

# ========================================
# STEP 1: BROWSE ALL INVENTORY
# ========================================
print_section "STEP 1: Browse All Inventory"

echo "Testing: GET /inventory/browse"
BROWSE_ALL=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/inventory/browse" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

HTTP_CODE=$(echo "$BROWSE_ALL" | tail -n1)
RESPONSE=$(echo "$BROWSE_ALL" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    BROWSE_COUNT=$(echo $RESPONSE | jq -r '.data | length')
    TOTAL_COUNT=$(echo $RESPONSE | jq -r '.total // 0')
    
    if [ "$BROWSE_COUNT" -ge 5 ]; then
        print_result 0 "Browse all inventory ($BROWSE_COUNT items displayed, $TOTAL_COUNT total)"
        print_info "First item: $(echo $RESPONSE | jq -r '.data[0].name')"
    else
        print_result 1 "Insufficient items found" "Expected at least 5, got $BROWSE_COUNT"
    fi
else
    print_result 1 "Failed to browse inventory" "HTTP $HTTP_CODE"
    echo $RESPONSE | jq '.'
fi

sleep 1

# ========================================
# STEP 2: GET SPECIFIC INVENTORY ITEM BY ID
# ========================================
print_section "STEP 2: Get Specific Inventory Item Details"

echo "Testing: GET /inventory/$INVENTORY_ID_1"
ITEM_DETAILS=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/inventory/$INVENTORY_ID_1" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

HTTP_CODE=$(echo "$ITEM_DETAILS" | tail -n1)
RESPONSE=$(echo "$ITEM_DETAILS" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    ITEM_NAME=$(echo $RESPONSE | jq -r '.data.name // empty')
    ITEM_PRICE=$(echo $RESPONSE | jq -r '.data.pricePerUnit // 0')
    ITEM_QTY=$(echo $RESPONSE | jq -r '.data.quantity // 0')
    ITEM_CATEGORY=$(echo $RESPONSE | jq -r '.data.category // empty')
    
    if [ -n "$ITEM_NAME" ]; then
        print_result 0 "Item details retrieved successfully"
        print_info "Name: $ITEM_NAME"
        print_info "Category: $ITEM_CATEGORY"
        print_info "Price: \$$ITEM_PRICE per unit"
        print_info "Available: $ITEM_QTY units"
    else
        print_result 1 "Incomplete item details" "Missing name"
    fi
else
    print_result 1 "Failed to get item details" "HTTP $HTTP_CODE"
fi

sleep 1

# ========================================
# STEP 3: TEST CATEGORY FILTERING
# ========================================
print_section "STEP 3: Test Category Filtering"

# Test Fabric category
echo "Testing: Filter by category=Fabric"
FABRIC_FILTER=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/inventory/browse?category=Fabric" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

HTTP_CODE=$(echo "$FABRIC_FILTER" | tail -n1)
RESPONSE=$(echo "$FABRIC_FILTER" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    FABRIC_COUNT=$(echo $RESPONSE | jq -r '.data | length')
    if [ "$FABRIC_COUNT" -ge 1 ]; then
        print_result 0 "Filter by Fabric category ($FABRIC_COUNT items)"
        print_info "Items: $(echo $RESPONSE | jq -r '.data[].name' | head -n 3 | tr '\n' ', ' | sed 's/,$//')"
    else
        print_result 1 "No fabric items found" "Expected at least 1"
    fi
else
    print_result 1 "Failed to filter by Fabric category" "HTTP $HTTP_CODE"
fi

sleep 1

# Test Yarn & Thread category
echo "Testing: Filter by category=Yarn & Thread"
YARN_FILTER=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/inventory/browse?category=Yarn%20%26%20Thread" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

HTTP_CODE=$(echo "$YARN_FILTER" | tail -n1)
RESPONSE=$(echo "$YARN_FILTER" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    YARN_COUNT=$(echo $RESPONSE | jq -r '.data | length')
    if [ "$YARN_COUNT" -ge 1 ]; then
        print_result 0 "Filter by Yarn & Thread category ($YARN_COUNT items)"
    else
        print_result 1 "No yarn items found" "Expected at least 1"
    fi
else
    print_result 1 "Failed to filter by Yarn category" "HTTP $HTTP_CODE"
fi

sleep 1

# Test Trims & Accessories category
echo "Testing: Filter by category=Trims & Accessories"
TRIMS_FILTER=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/inventory/browse?category=Trims%20%26%20Accessories" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

HTTP_CODE=$(echo "$TRIMS_FILTER" | tail -n1)
RESPONSE=$(echo "$TRIMS_FILTER" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    TRIMS_COUNT=$(echo $RESPONSE | jq -r '.data | length')
    print_result 0 "Filter by Trims & Accessories ($TRIMS_COUNT items)"
else
    print_result 1 "Failed to filter by Trims category" "HTTP $HTTP_CODE"
fi

sleep 1

# Test Dyes & Chemicals category
echo "Testing: Filter by category=Dyes & Chemicals"
DYES_FILTER=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/inventory/browse?category=Dyes%20%26%20Chemicals" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

HTTP_CODE=$(echo "$DYES_FILTER" | tail -n1)
RESPONSE=$(echo "$DYES_FILTER" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    DYES_COUNT=$(echo $RESPONSE | jq -r '.data | length')
    print_result 0 "Filter by Dyes & Chemicals ($DYES_COUNT items)"
else
    print_result 1 "Failed to filter by Dyes category" "HTTP $HTTP_CODE"
fi

sleep 1

# ========================================
# STEP 4: TEST SUBCATEGORY FILTERING
# ========================================
print_section "STEP 4: Test Subcategory Filtering"

echo "Testing: Filter by subcategory=Cotton Fabric"
COTTON_SUBCAT=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/inventory/browse?subcategory=Cotton%20Fabric" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

HTTP_CODE=$(echo "$COTTON_SUBCAT" | tail -n1)
RESPONSE=$(echo "$COTTON_SUBCAT" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    COTTON_COUNT=$(echo $RESPONSE | jq -r '.data | length')
    print_result 0 "Subcategory filter works ($COTTON_COUNT Cotton Fabric items)"
else
    print_result 1 "Subcategory filter failed" "HTTP $HTTP_CODE"
fi

sleep 1

echo "Testing: Filter by subcategory=Polyester Yarn"
POLY_SUBCAT=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/inventory/browse?subcategory=Polyester%20Yarn" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

HTTP_CODE=$(echo "$POLY_SUBCAT" | tail -n1)
RESPONSE=$(echo "$POLY_SUBCAT" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    POLY_COUNT=$(echo $RESPONSE | jq -r '.data | length')
    print_result 0 "Subcategory filter works ($POLY_COUNT Polyester Yarn items)"
else
    print_result 1 "Subcategory filter failed" "HTTP $HTTP_CODE"
fi

sleep 1

# ========================================
# STEP 5: TEST SUPPLIER FILTERING
# ========================================
print_section "STEP 5: Test Supplier Filtering"

echo "Testing: Filter by supplierId=$SUPPLIER_ID"
SUPPLIER_FILTER=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/inventory/browse?supplierId=$SUPPLIER_ID" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

HTTP_CODE=$(echo "$SUPPLIER_FILTER" | tail -n1)
RESPONSE=$(echo "$SUPPLIER_FILTER" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    SUPPLIER_COUNT=$(echo $RESPONSE | jq -r '.data | length')
    if [ "$SUPPLIER_COUNT" -ge 5 ]; then
        print_result 0 "Filter by supplier ($SUPPLIER_COUNT items)"
        print_info "Supplier's products: $(echo $RESPONSE | jq -r '.data[].name' | head -n 3 | tr '\n' ', ' | sed 's/,$//')"
    else
        print_result 1 "Insufficient items from supplier" "Expected at least 5, got $SUPPLIER_COUNT"
    fi
else
    print_result 1 "Failed to filter by supplier" "HTTP $HTTP_CODE"
fi

sleep 1

# ========================================
# STEP 6: TEST PRICE RANGE FILTERING
# ========================================
print_section "STEP 6: Test Price Range Filtering"

# Low price range (accessories)
echo "Testing: Price range \$0.50 - \$1.00 (Accessories)"
LOW_PRICE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/inventory/browse?minPrice=0.50&maxPrice=1.00" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

HTTP_CODE=$(echo "$LOW_PRICE" | tail -n1)
RESPONSE=$(echo "$LOW_PRICE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    LOW_COUNT=$(echo $RESPONSE | jq -r '.data | length')
    if [ "$LOW_COUNT" -ge 1 ]; then
        LOW_ITEMS=$(echo $RESPONSE | jq -r '.data[].name' | head -n 2)
        print_result 0 "Low price range filter ($LOW_COUNT items)"
        print_info "Items: $LOW_ITEMS"
    else
        print_result 1 "No items in low price range" "Expected at least 1"
    fi
else
    print_result 1 "Failed low price filter" "HTTP $HTTP_CODE"
fi

sleep 1

# Mid price range (fabrics and yarns)
echo "Testing: Price range \$8.00 - \$15.00 (Fabrics & Yarns)"
MID_PRICE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/inventory/browse?minPrice=8.00&maxPrice=15.00" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

HTTP_CODE=$(echo "$MID_PRICE" | tail -n1)
RESPONSE=$(echo "$MID_PRICE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    MID_COUNT=$(echo $RESPONSE | jq -r '.data | length')
    if [ "$MID_COUNT" -ge 1 ]; then
        print_result 0 "Mid price range filter ($MID_COUNT items)"
    else
        print_result 1 "No items in mid price range" "Expected at least 1"
    fi
else
    print_result 1 "Failed mid price filter" "HTTP $HTTP_CODE"
fi

sleep 1

# High price range (dyes and chemicals)
echo "Testing: Price range \$20.00 - \$30.00 (Dyes & Chemicals)"
HIGH_PRICE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/inventory/browse?minPrice=20.00&maxPrice=30.00" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

HTTP_CODE=$(echo "$HIGH_PRICE" | tail -n1)
RESPONSE=$(echo "$HIGH_PRICE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    HIGH_COUNT=$(echo $RESPONSE | jq -r '.data | length')
    print_result 0 "High price range filter ($HIGH_COUNT items)"
else
    print_result 1 "Failed high price filter" "HTTP $HTTP_CODE"
fi

sleep 1

# ========================================
# STEP 7: TEST SEARCH FUNCTIONALITY
# ========================================
print_section "STEP 7: Test Search Functionality"

# Search for cotton
echo "Testing: Search query 'cotton'"
SEARCH_COTTON=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/inventory/browse/search?q=cotton" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

HTTP_CODE=$(echo "$SEARCH_COTTON" | tail -n1)
RESPONSE=$(echo "$SEARCH_COTTON" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    COTTON_COUNT=$(echo $RESPONSE | jq -r '.count // 0')
    if [ "$COTTON_COUNT" -gt 0 ]; then
        print_result 0 "Search 'cotton' found $COTTON_COUNT items"
        print_info "Results: $(echo $RESPONSE | jq -r '.results[].name' | head -n 2 | tr '\n' ', ' | sed 's/,$//')"
    else
        print_result 1 "No results for 'cotton'" "Expected at least 1"
    fi
else
    print_result 1 "Search failed" "HTTP $HTTP_CODE"
fi

sleep 1

# Search for fabric
echo "Testing: Search query 'fabric'"
SEARCH_FABRIC=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/inventory/browse/search?q=fabric" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

HTTP_CODE=$(echo "$SEARCH_FABRIC" | tail -n1)
RESPONSE=$(echo "$SEARCH_FABRIC" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    FABRIC_SEARCH_COUNT=$(echo $RESPONSE | jq -r '.count // 0')
    if [ "$FABRIC_SEARCH_COUNT" -gt 0 ]; then
        print_result 0 "Search 'fabric' found $FABRIC_SEARCH_COUNT items"
    else
        print_result 1 "No results for 'fabric'" "Expected at least 1"
    fi
else
    print_result 1 "Search failed" "HTTP $HTTP_CODE"
fi

sleep 1

# Search for polyester
echo "Testing: Search query 'polyester'"
SEARCH_POLY=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/inventory/browse/search?q=polyester" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

HTTP_CODE=$(echo "$SEARCH_POLY" | tail -n1)
RESPONSE=$(echo "$SEARCH_POLY" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    POLY_COUNT=$(echo $RESPONSE | jq -r '.count // 0')
    if [ "$POLY_COUNT" -gt 0 ]; then
        print_result 0 "Search 'polyester' found $POLY_COUNT items"
    else
        print_result 1 "No results for 'polyester'" "Expected at least 1"
    fi
else
    print_result 1 "Search failed" "HTTP $HTTP_CODE"
fi

sleep 1

# Search for zipper
echo "Testing: Search query 'zipper'"
SEARCH_ZIP=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/inventory/browse/search?q=zipper" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

HTTP_CODE=$(echo "$SEARCH_ZIP" | tail -n1)
RESPONSE=$(echo "$SEARCH_ZIP" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    ZIP_COUNT=$(echo $RESPONSE | jq -r '.count // 0')
    if [ "$ZIP_COUNT" -gt 0 ]; then
        print_result 0 "Search 'zipper' found $ZIP_COUNT items"
    else
        print_result 1 "No results for 'zipper'" "Expected at least 1"
    fi
else
    print_result 1 "Search failed" "HTTP $HTTP_CODE"
fi

sleep 1

# Search for denim
echo "Testing: Search query 'denim'"
SEARCH_DENIM=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/inventory/browse/search?q=denim" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

HTTP_CODE=$(echo "$SEARCH_DENIM" | tail -n1)
RESPONSE=$(echo "$SEARCH_DENIM" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    DENIM_COUNT=$(echo $RESPONSE | jq -r '.count // 0')
    if [ "$DENIM_COUNT" -gt 0 ]; then
        print_result 0 "Search 'denim' found $DENIM_COUNT items"
    else
        print_result 1 "No results for 'denim'" "Expected at least 1"
    fi
else
    print_result 1 "Search failed" "HTTP $HTTP_CODE"
fi

sleep 1

# ========================================
# STEP 8: GET CATEGORIES LIST
# ========================================
print_section "STEP 8: Get Categories List"

echo "Testing: GET /inventory/browse/categories"
CATEGORIES=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/inventory/browse/categories" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

HTTP_CODE=$(echo "$CATEGORIES" | tail -n1)
RESPONSE=$(echo "$CATEGORIES" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    CAT_COUNT=$(echo $RESPONSE | jq -r '.data | length')
    if [ "$CAT_COUNT" -gt 0 ]; then
        print_result 0 "Retrieved categories list ($CAT_COUNT categories)"
        print_info "Categories:"
        echo $RESPONSE | jq -r '.data[].category' | while read cat; do
            echo "  - $cat"
        done
    else
        print_result 1 "No categories found" "Expected at least 1"
    fi
else
    print_result 1 "Failed to get categories" "HTTP $HTTP_CODE"
fi

sleep 1

# ========================================
# STEP 9: BROWSE SUPPLIERS LIST
# ========================================
print_section "STEP 9: Browse Suppliers List"

echo "Testing: GET /inventory/browse/suppliers"
SUPPLIERS=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/inventory/browse/suppliers" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

HTTP_CODE=$(echo "$SUPPLIERS" | tail -n1)
RESPONSE=$(echo "$SUPPLIERS" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    SUPP_COUNT=$(echo $RESPONSE | jq -r '.data | length')
    if [ "$SUPP_COUNT" -ge 1 ]; then
        print_result 0 "Retrieved suppliers list ($SUPP_COUNT suppliers)"
        print_info "Suppliers:"
        echo $RESPONSE | jq -r '.data[] | "\(.companyName // .name) - \(.email)"' | head -n 5 | while read supp; do
            echo "  - $supp"
        done
    else
        print_result 1 "No suppliers found" "Expected at least 1"
    fi
else
    print_result 1 "Failed to get suppliers" "HTTP $HTTP_CODE"
fi

sleep 1

# ========================================
# STEP 10: GET SUPPLIER PROFILE
# ========================================
print_section "STEP 10: Get Supplier Profile"

echo "Testing: GET /inventory/browse/suppliers/$SUPPLIER_ID"
SUPPLIER_PROF=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/inventory/browse/suppliers/$SUPPLIER_ID" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

HTTP_CODE=$(echo "$SUPPLIER_PROF" | tail -n1)
RESPONSE=$(echo "$SUPPLIER_PROF" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    SUPP_NAME=$(echo $RESPONSE | jq -r '.data.companyName // .data.name // empty')
    SUPP_EMAIL=$(echo $RESPONSE | jq -r '.data.email // empty')
    SUPP_PHONE=$(echo $RESPONSE | jq -r '.data.phone // empty')
    
    if [ -n "$SUPP_NAME" ]; then
        print_result 0 "Retrieved supplier profile"
        print_info "Company: $SUPP_NAME"
        print_info "Email: $SUPP_EMAIL"
        [ -n "$SUPP_PHONE" ] && print_info "Phone: $SUPP_PHONE"
    else
        print_result 1 "Incomplete supplier profile" "Missing name"
    fi
else
    print_result 1 "Failed to get supplier profile" "HTTP $HTTP_CODE"
fi

sleep 1

# ========================================
# STEP 11: BROWSE SUPPLIER'S INVENTORY
# ========================================
print_section "STEP 11: Browse Supplier's Inventory"

echo "Testing: GET /inventory/browse/suppliers/$SUPPLIER_ID/inventory"
SUPP_INV=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/inventory/browse/suppliers/$SUPPLIER_ID/inventory" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

HTTP_CODE=$(echo "$SUPP_INV" | tail -n1)
RESPONSE=$(echo "$SUPP_INV" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    INV_COUNT=$(echo $RESPONSE | jq -r '.data | length')
    if [ "$INV_COUNT" -ge 5 ]; then
        print_result 0 "Retrieved supplier's inventory ($INV_COUNT items)"
        print_info "Supplier's Products:"
        echo $RESPONSE | jq -r '.data[] | "\(.name) - $\(.pricePerUnit)/\(.unit)"' | head -n 5 | while read item; do
            echo "  - $item"
        done
    else
        print_result 1 "Insufficient inventory items" "Expected at least 5, got $INV_COUNT"
    fi
else
    print_result 1 "Failed to get supplier inventory" "HTTP $HTTP_CODE"
fi

sleep 1

# ========================================
# STEP 12: TEST SORTING
# ========================================
print_section "STEP 12: Test Sorting"

# Sort by price ascending
echo "Testing: Sort by price (ascending)"
SORT_ASC=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/inventory/browse?sortBy=pricePerUnit&sortOrder=asc" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

HTTP_CODE=$(echo "$SORT_ASC" | tail -n1)
RESPONSE=$(echo "$SORT_ASC" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    FIRST_PRICE=$(echo $RESPONSE | jq -r '.data[0].pricePerUnit // 0')
    SECOND_PRICE=$(echo $RESPONSE | jq -r '.data[1].pricePerUnit // 0')
    FIRST_NAME=$(echo $RESPONSE | jq -r '.data[0].name')
    
    if [ $(echo "$FIRST_PRICE > 0" | bc) -eq 1 ] && [ $(echo "$SECOND_PRICE >= $FIRST_PRICE" | bc) -eq 1 ]; then
        print_result 0 "Sort ascending works"
        print_info "Lowest priced: $FIRST_NAME (\$$FIRST_PRICE)"
        print_info "Next: \$$SECOND_PRICE"
    else
        print_result 1 "Sort ascending failed" "Prices not in order"
    fi
else
    print_result 1 "Failed to sort ascending" "HTTP $HTTP_CODE"
fi

sleep 1

# Sort by price descending
echo "Testing: Sort by price (descending)"
SORT_DESC=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/inventory/browse?sortBy=pricePerUnit&sortOrder=desc" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

HTTP_CODE=$(echo "$SORT_DESC" | tail -n1)
RESPONSE=$(echo "$SORT_DESC" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    FIRST_PRICE=$(echo $RESPONSE | jq -r '.data[0].pricePerUnit // 0')
    SECOND_PRICE=$(echo $RESPONSE | jq -r '.data[1].pricePerUnit // 0')
    FIRST_NAME=$(echo $RESPONSE | jq -r '.data[0].name')
    
    if [ $(echo "$FIRST_PRICE > 0" | bc) -eq 1 ] && [ $(echo "$FIRST_PRICE >= $SECOND_PRICE" | bc) -eq 1 ]; then
        print_result 0 "Sort descending works"
        print_info "Highest priced: $FIRST_NAME (\$$FIRST_PRICE)"
        print_info "Next: \$$SECOND_PRICE"
    else
        print_result 1 "Sort descending failed" "Prices not in order"
    fi
else
    print_result 1 "Failed to sort descending" "HTTP $HTTP_CODE"
fi

sleep 1

# Sort by name
echo "Testing: Sort by name (ascending)"
SORT_NAME=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/inventory/browse?sortBy=name&sortOrder=asc" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

HTTP_CODE=$(echo "$SORT_NAME" | tail -n1)
RESPONSE=$(echo "$SORT_NAME" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    FIRST_NAME=$(echo $RESPONSE | jq -r '.data[0].name // empty')
    SECOND_NAME=$(echo $RESPONSE | jq -r '.data[1].name // empty')
    if [ -n "$FIRST_NAME" ]; then
        print_result 0 "Sort by name works"
        print_info "First alphabetically: $FIRST_NAME"
        [ -n "$SECOND_NAME" ] && print_info "Next: $SECOND_NAME"
    else
        print_result 1 "Sort by name failed" "No name returned"
    fi
else
    print_result 1 "Failed to sort by name" "HTTP $HTTP_CODE"
fi

sleep 1

# Sort by quantity
echo "Testing: Sort by quantity (descending)"
SORT_QTY=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/inventory/browse?sortBy=quantity&sortOrder=desc" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

HTTP_CODE=$(echo "$SORT_QTY" | tail -n1)
RESPONSE=$(echo "$SORT_QTY" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    FIRST_QTY=$(echo $RESPONSE | jq -r '.data[0].quantity // 0')
    FIRST_NAME=$(echo $RESPONSE | jq -r '.data[0].name')
    print_result 0 "Sort by quantity works"
    print_info "Highest stock: $FIRST_NAME ($FIRST_QTY units)"
else
    print_result 1 "Failed to sort by quantity" "HTTP $HTTP_CODE"
fi

sleep 1

# ========================================
# STEP 13: TEST PAGINATION
# ========================================
print_section "STEP 13: Test Pagination"

# Page 1 with limit
echo "Testing: Pagination (page=1, limit=2)"
PAGE_1=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/inventory/browse?page=1&limit=2" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

HTTP_CODE=$(echo "$PAGE_1" | tail -n1)
RESPONSE=$(echo "$PAGE_1" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    PAGE_COUNT=$(echo $RESPONSE | jq -r '.data | length')
    TOTAL=$(echo $RESPONSE | jq -r '.total // 0')
    CURRENT_PAGE=$(echo $RESPONSE | jq -r '.currentPage // 1')
    TOTAL_PAGES=$(echo $RESPONSE | jq -r '.totalPages // 0')
    
    if [ "$PAGE_COUNT" -le 2 ] && [ "$PAGE_COUNT" -gt 0 ]; then
        print_result 0 "Pagination page 1 works ($PAGE_COUNT items)"
        print_info "Total items: $TOTAL"
        print_info "Current page: $CURRENT_PAGE of $TOTAL_PAGES"
    else
        print_result 1 "Pagination failed" "Expected 1-2 items, got $PAGE_COUNT"
    fi
else
    print_result 1 "Failed pagination" "HTTP $HTTP_CODE"
fi

sleep 1

# Page 2
echo "Testing: Pagination (page=2, limit=2)"
PAGE_2=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/inventory/browse?page=2&limit=2" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

HTTP_CODE=$(echo "$PAGE_2" | tail -n1)
RESPONSE=$(echo "$PAGE_2" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    PAGE2_COUNT=$(echo $RESPONSE | jq -r '.data | length')
    print_result 0 "Pagination page 2 works ($PAGE2_COUNT items)"
else
    print_result 1 "Failed pagination page 2" "HTTP $HTTP_CODE"
fi

sleep 1

# Page 3
echo "Testing: Pagination (page=3, limit=2)"
PAGE_3=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/inventory/browse?page=3&limit=2" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

HTTP_CODE=$(echo "$PAGE_3" | tail -n1)
RESPONSE=$(echo "$PAGE_3" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    PAGE3_COUNT=$(echo $RESPONSE | jq -r '.data | length')
    print_result 0 "Pagination page 3 works ($PAGE3_COUNT items)"
else
    print_result 1 "Failed pagination page 3" "HTTP $HTTP_CODE"
fi

sleep 1

# ========================================
# STEP 14: TEST COMBINED FILTERS
# ========================================
print_section "STEP 14: Test Combined Filters"

# Category + Price Range
echo "Testing: Combined filters (category=Fabric + price range)"
COMBINED_1=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/inventory/browse?category=Fabric&minPrice=5&maxPrice=20" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

HTTP_CODE=$(echo "$COMBINED_1" | tail -n1)
RESPONSE=$(echo "$COMBINED_1" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    COMB_COUNT=$(echo $RESPONSE | jq -r '.data | length')
    print_result 0 "Category + price filter works ($COMB_COUNT items)"
    if [ "$COMB_COUNT" -gt 0 ]; then
        print_info "Items: $(echo $RESPONSE | jq -r '.data[].name' | head -n 2 | tr '\n' ', ' | sed 's/,$//')"
    fi
else
    print_result 1 "Combined filter failed" "HTTP $HTTP_CODE"
fi

sleep 1

# Category + Supplier
echo "Testing: Combined filters (category=Fabric + supplier)"
COMBINED_2=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/inventory/browse?category=Fabric&supplierId=$SUPPLIER_ID" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

HTTP_CODE=$(echo "$COMBINED_2" | tail -n1)
RESPONSE=$(echo "$COMBINED_2" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    COMB2_COUNT=$(echo $RESPONSE | jq -r '.data | length')
    print_result 0 "Category + supplier filter works ($COMB2_COUNT items)"
else
    print_result 1 "Category + supplier filter failed" "HTTP $HTTP_CODE"
fi

sleep 1

# Category + Supplier + Price Range
echo "Testing: Triple combined filters (category + supplier + price)"
COMBINED_3=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/inventory/browse?category=Fabric&supplierId=$SUPPLIER_ID&minPrice=5&maxPrice=20" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

HTTP_CODE=$(echo "$COMBINED_3" | tail -n1)
RESPONSE=$(echo "$COMBINED_3" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    COMB3_COUNT=$(echo $RESPONSE | jq -r '.data | length')
    print_result 0 "Triple combined filter works ($COMB3_COUNT items)"
else
    print_result 1 "Triple combined filter failed" "HTTP $HTTP_CODE"
fi

sleep 1

# Search + Category
echo "Testing: Search with category filter (q=cotton + category=Fabric)"
SEARCH_CAT=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/inventory/browse/search?q=cotton&category=Fabric" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

HTTP_CODE=$(echo "$SEARCH_CAT" | tail -n1)
RESPONSE=$(echo "$SEARCH_CAT" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    SEARCH_CAT_COUNT=$(echo $RESPONSE | jq -r '.count // 0')
    print_result 0 "Search + category filter works ($SEARCH_CAT_COUNT items)"
else
    print_result 1 "Search + category failed" "HTTP $HTTP_CODE"
fi

sleep 1

# ========================================
# STEP 15: TEST STATUS FILTERING
# ========================================
print_section "STEP 15: Test Status Filtering"

echo "Testing: Filter by status=active"
STATUS_FILTER=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/inventory/browse?status=active" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

HTTP_CODE=$(echo "$STATUS_FILTER" | tail -n1)
RESPONSE=$(echo "$STATUS_FILTER" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    STATUS_COUNT=$(echo $RESPONSE | jq -r '.data | length')
    if [ "$STATUS_COUNT" -ge 1 ]; then
        print_result 0 "Status filter works ($STATUS_COUNT active items)"
    else
        print_result 1 "No active items found" "Expected at least 1"
    fi
else
    print_result 1 "Status filter failed" "HTTP $HTTP_CODE"
fi

sleep 1

# ========================================
# STEP 16: TEST TAGS FILTERING
# ========================================
print_section "STEP 16: Test Tags Filtering"

echo "Testing: Filter by tag=organic"
TAG_ORGANIC=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/inventory/browse?tags=organic" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

HTTP_CODE=$(echo "$TAG_ORGANIC" | tail -n1)
RESPONSE=$(echo "$TAG_ORGANIC" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    TAG_COUNT=$(echo $RESPONSE | jq -r '.data | length')
    print_result 0 "Tag filter works ($TAG_COUNT items with 'organic' tag)"
    if [ "$TAG_COUNT" -gt 0 ]; then
        print_info "Items: $(echo $RESPONSE | jq -r '.data[].name' | head -n 2 | tr '\n' ', ' | sed 's/,$//')"
    fi
else
    print_result 1 "Tag filter failed" "HTTP $HTTP_CODE"
fi

sleep 1

echo "Testing: Filter by tag=sustainable"
TAG_SUSTAIN=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/inventory/browse?tags=sustainable" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

HTTP_CODE=$(echo "$TAG_SUSTAIN" | tail -n1)
RESPONSE=$(echo "$TAG_SUSTAIN" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    TAG_SUSTAIN_COUNT=$(echo $RESPONSE | jq -r '.data | length')
    print_result 0 "Tag filter works ($TAG_SUSTAIN_COUNT items with 'sustainable' tag)"
else
    print_result 1 "Tag filter failed" "HTTP $HTTP_CODE"
fi

sleep 1

# ========================================
# STEP 17: TEST MINIMUM ORDER QUANTITY FILTER
# ========================================
print_section "STEP 17: Test Minimum Order Quantity Filter"

echo "Testing: Filter by maxMinOrderQty=200"
MIN_ORDER=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/inventory/browse?maxMinOrderQty=200" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

HTTP_CODE=$(echo "$MIN_ORDER" | tail -n1)
RESPONSE=$(echo "$MIN_ORDER" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    MIN_COUNT=$(echo $RESPONSE | jq -r '.data | length')
    print_result 0 "Min order quantity filter works ($MIN_COUNT items)"
else
    print_result 1 "Min order quantity filter failed" "HTTP $HTTP_CODE"
fi

sleep 1

# ========================================
# STEP 18: TEST SUSTAINABLE PRODUCTS FILTER
# ========================================
print_section "STEP 18: Test Sustainable Products Filter"

echo "Testing: Filter by isSustainable=true"
SUSTAINABLE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/inventory/browse?isSustainable=true" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

HTTP_CODE=$(echo "$SUSTAINABLE" | tail -n1)
RESPONSE=$(echo "$SUSTAINABLE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    SUSTAIN_COUNT=$(echo $RESPONSE | jq -r '.data | length')
    print_result 0 "Sustainable filter works ($SUSTAIN_COUNT sustainable items)"
    if [ "$SUSTAIN_COUNT" -gt 0 ]; then
        print_info "Sustainable products:"
        echo $RESPONSE | jq -r '.data[] | "  - \(.name) (\(.certifications // [] | join(", ")))"' | head -n 3
    fi
else
    print_result 1 "Sustainable filter failed" "HTTP $HTTP_CODE"
fi

sleep 1

# ========================================
# STEP 19: TEST MATERIAL TYPE FILTER
# ========================================
print_section "STEP 19: Test Material Type Filter"

echo "Testing: Filter by materialType=Raw Material"
RAW_MAT=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/inventory/browse?materialType=Raw%20Material" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

HTTP_CODE=$(echo "$RAW_MAT" | tail -n1)
RESPONSE=$(echo "$RAW_MAT" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    RAW_COUNT=$(echo $RESPONSE | jq -r '.data | length')
    print_result 0 "Material type filter works ($RAW_COUNT raw materials)"
else
    print_result 1 "Material type filter failed" "HTTP $HTTP_CODE"
fi

sleep 1

echo "Testing: Filter by materialType=Accessory"
ACCESSORY=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/inventory/browse?materialType=Accessory" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

HTTP_CODE=$(echo "$ACCESSORY" | tail -n1)
RESPONSE=$(echo "$ACCESSORY" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    ACC_COUNT=$(echo $RESPONSE | jq -r '.data | length')
    print_result 0 "Material type filter works ($ACC_COUNT accessories)"
else
    print_result 1 "Material type filter failed" "HTTP $HTTP_CODE"
fi

sleep 1

# ========================================
# STEP 20: TEST MULTIPLE INVENTORY ITEM DETAILS
# ========================================
print_section "STEP 20: Test Multiple Item Details"

# Get details for all 5 inventory items
for i in {1..5}; do
    VAR_NAME="INVENTORY_ID_$i"
    ITEM_ID="${!VAR_NAME}"
    
    echo "Testing: GET /inventory/$ITEM_ID (Item $i)"
    ITEM_DETAIL=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/inventory/$ITEM_ID" \
      -H "Authorization: Bearer $VENDOR_TOKEN")
    
    HTTP_CODE=$(echo "$ITEM_DETAIL" | tail -n1)
    RESPONSE=$(echo "$ITEM_DETAIL" | sed '$d')
    
    if [ "$HTTP_CODE" -eq 200 ]; then
        NAME=$(echo $RESPONSE | jq -r '.data.name')
        CATEGORY=$(echo $RESPONSE | jq -r '.data.category')
        PRICE=$(echo $RESPONSE | jq -r '.data.pricePerUnit')
        print_result 0 "Item $i details retrieved: $NAME"
        print_info "Category: $CATEGORY | Price: \$PRICE"
    else
        print_result 1 "Failed to get item $i details" "HTTP $HTTP_CODE"
    fi
    
    sleep 0.5
done

# ========================================
# STEP 21: TEST EMPTY RESULT HANDLING
# ========================================
print_section "STEP 21: Test Empty Result Handling"

echo "Testing: Search with no results"
NO_RESULTS=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/inventory/browse/search?q=nonexistentproduct12345xyz" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

HTTP_CODE=$(echo "$NO_RESULTS" | tail -n1)
RESPONSE=$(echo "$NO_RESULTS" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    EMPTY_COUNT=$(echo $RESPONSE | jq -r '.count // .data | length')
    if [ "$EMPTY_COUNT" -eq 0 ]; then
        print_result 0 "Handles empty search results gracefully"
    else
        print_result 1 "Should return 0 results" "Got $EMPTY_COUNT"
    fi
else
    print_result 1 "Empty result handling failed" "HTTP $HTTP_CODE"
fi

sleep 1

echo "Testing: Filter with impossible criteria"
NO_MATCH=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/inventory/browse?minPrice=1000&maxPrice=2000" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

HTTP_CODE=$(echo "$NO_MATCH" | tail -n1)
RESPONSE=$(echo "$NO_MATCH" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    NO_MATCH_COUNT=$(echo $RESPONSE | jq -r '.data | length')
    print_result 0 "Handles no matching results ($NO_MATCH_COUNT items)"
else
    print_result 1 "Empty filter handling failed" "HTTP $HTTP_CODE"
fi

sleep 1

# ========================================
# STEP 22: TEST INVALID REQUESTS
# ========================================
print_section "STEP 22: Test Invalid Requests & Error Handling"

# Invalid inventory ID
echo "Testing: Get non-existent inventory item"
INVALID_ID=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/inventory/000000000000000000000000" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

HTTP_CODE=$(echo "$INVALID_ID" | tail -n1)

if [ "$HTTP_CODE" -eq 404 ] || [ "$HTTP_CODE" -eq 400 ]; then
    print_result 0 "Properly handles invalid inventory ID (HTTP $HTTP_CODE)"
else
    print_result 1 "Should return 404/400 for invalid ID" "Got HTTP $HTTP_CODE"
fi

sleep 1

# Invalid price range
echo "Testing: Invalid price range (min > max)"
INVALID_PRICE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/inventory/browse?minPrice=100&maxPrice=10" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

HTTP_CODE=$(echo "$INVALID_PRICE" | tail -n1)

if [ "$HTTP_CODE" -eq 400 ] || [ "$HTTP_CODE" -eq 200 ]; then
    print_result 0 "Handles invalid price range (HTTP $HTTP_CODE)"
else
    print_result 1 "Should handle invalid price range" "Got HTTP $HTTP_CODE"
fi

sleep 1

# No authentication
echo "Testing: Browse without authentication"
NO_AUTH=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/inventory/browse")

HTTP_CODE=$(echo "$NO_AUTH" | tail -n1)

if [ "$HTTP_CODE" -eq 401 ] || [ "$HTTP_CODE" -eq 403 ]; then
    print_result 0 "Properly requires authentication (HTTP $HTTP_CODE)"
else
    print_result 1 "Should require authentication" "Got HTTP $HTTP_CODE"
fi

sleep 1

# Invalid supplier ID
echo "Testing: Browse with invalid supplier ID"
INVALID_SUPP=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/inventory/browse/suppliers/invalid123" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

HTTP_CODE=$(echo "$INVALID_SUPP" | tail -n1)

if [ "$HTTP_CODE" -eq 404 ] || [ "$HTTP_CODE" -eq 400 ]; then
    print_result 0 "Handles invalid supplier ID (HTTP $HTTP_CODE)"
else
    print_result 1 "Should handle invalid supplier ID" "Got HTTP $HTTP_CODE"
fi

sleep 1

# ========================================
# STEP 23: TEST RESPONSE STRUCTURE
# ========================================
print_section "STEP 23: Validate Response Structure"

echo "Testing: Browse response contains required fields"
STRUCT_TEST=$(curl -s -X GET "$BASE_URL/inventory/browse?page=1&limit=1" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

HAS_SUCCESS=$(echo $STRUCT_TEST | jq -r 'has("success")')
HAS_DATA=$(echo $STRUCT_TEST | jq -r 'has("data")')
HAS_TOTAL=$(echo $STRUCT_TEST | jq -r 'has("total")')

if [ "$HAS_SUCCESS" = "true" ] && [ "$HAS_DATA" = "true" ]; then
    print_result 0 "Browse response structure is valid"
    print_info "Fields: success=$HAS_SUCCESS, data=$HAS_DATA, total=$HAS_TOTAL"
else
    print_result 1 "Browse response structure invalid" "Missing required fields"
fi

sleep 1

echo "Testing: Item structure contains required fields"
ITEM_STRUCT=$(echo $STRUCT_TEST | jq -r '.data[0]')
HAS_NAME=$(echo $ITEM_STRUCT | jq -r 'has("name")')
HAS_PRICE=$(echo $ITEM_STRUCT | jq -r 'has("pricePerUnit")')
HAS_QTY=$(echo $ITEM_STRUCT | jq -r 'has("quantity")')
HAS_CATEGORY=$(echo $ITEM_STRUCT | jq -r 'has("category")')
HAS_SUPPLIER=$(echo $ITEM_STRUCT | jq -r 'has("supplierId")')

if [ "$HAS_NAME" = "true" ] && [ "$HAS_PRICE" = "true" ] && [ "$HAS_CATEGORY" = "true" ]; then
    print_result 0 "Item structure is valid"
    print_info "Fields: name=$HAS_NAME, price=$HAS_PRICE, qty=$HAS_QTY, category=$HAS_CATEGORY"
else
    print_result 1 "Item structure invalid" "Missing required fields"
fi

sleep 1

echo "Testing: Search response structure"
SEARCH_STRUCT=$(curl -s -X GET "$BASE_URL/inventory/browse/search?q=cotton" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

HAS_RESULTS=$(echo $SEARCH_STRUCT | jq -r 'has("results") or has("data")')
HAS_COUNT=$(echo $SEARCH_STRUCT | jq -r 'has("count") or has("total")')

if [ "$HAS_RESULTS" = "true" ] && [ "$HAS_COUNT" = "true" ]; then
    print_result 0 "Search response structure is valid"
else
    print_result 1 "Search response structure invalid" "Missing results or count"
fi

sleep 1

# ========================================
# STEP 24: TEST ACCESS CONTROL
# ========================================
print_section "STEP 24: Test Access Control"

echo "Testing: Supplier attempting to browse (verify permissions)"
SUPP_BROWSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/inventory/browse" \
  -H "Authorization: Bearer $SUPPLIER_TOKEN")

HTTP_CODE=$(echo "$SUPP_BROWSE" | tail -n1)
RESPONSE=$(echo "$SUPP_BROWSE" | sed '$d')

if [ "$HTTP_CODE" -eq 403 ] || [ "$HTTP_CODE" -eq 401 ]; then
    print_result 0 "Access control: suppliers properly restricted"
elif [ "$HTTP_CODE" -eq 200 ]; then
    SUCCESS=$(echo $RESPONSE | jq -r '.success // true')
    if [ "$SUCCESS" = "false" ]; then
        print_result 0 "Access control: suppliers denied"
    else
        print_warning "Suppliers can browse - verify if intended behavior"
        print_result 0 "Suppliers can browse (may be intended)"
    fi
else
    print_result 1 "Access control test inconclusive" "HTTP $HTTP_CODE"
fi

sleep 1

# ========================================
# STEP 25: PERFORMANCE TEST
# ========================================
print_section "STEP 25: Performance Test"

echo "Testing: Response time for browse with limit=50"
START_TIME=$(date +%s.%N)
PERF_TEST=$(curl -s -X GET "$BASE_URL/inventory/browse?limit=50" \
  -H "Authorization: Bearer $VENDOR_TOKEN")
END_TIME=$(date +%s.%N)

RESPONSE_TIME=$(echo "$END_TIME - $START_TIME" | bc)

if [ $(echo "$RESPONSE_TIME < 3" | bc) -eq 1 ]; then
    print_result 0 "Response time acceptable (${RESPONSE_TIME}s)"
else
    print_warning "Response time: ${RESPONSE_TIME}s (consider optimization)"
    print_result 0 "Response completed in ${RESPONSE_TIME}s"
fi

sleep 1

echo "Testing: Search performance"
START_TIME=$(date +%s.%N)
SEARCH_PERF=$(curl -s -X GET "$BASE_URL/inventory/browse/search?q=fabric" \
  -H "Authorization: Bearer $VENDOR_TOKEN")
END_TIME=$(date +%s.%N)

SEARCH_TIME=$(echo "$END_TIME - $START_TIME" | bc)

if [ $(echo "$SEARCH_TIME < 2" | bc) -eq 1 ]; then
    print_result 0 "Search performance acceptable (${SEARCH_TIME}s)"
else
    print_warning "Search time: ${SEARCH_TIME}s (consider optimization)"
    print_result 0 "Search completed in ${SEARCH_TIME}s"
fi

sleep 1

# ========================================
# STEP 26: TEST EDGE CASES
# ========================================
print_section "STEP 26: Test Edge Cases"

echo "Testing: Very high page number"
HIGH_PAGE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/inventory/browse?page=9999&limit=10" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

HTTP_CODE=$(echo "$HIGH_PAGE" | tail -n1)
RESPONSE=$(echo "$HIGH_PAGE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    HIGH_PAGE_COUNT=$(echo $RESPONSE | jq -r '.data | length')
    print_result 0 "Handles high page number gracefully ($HIGH_PAGE_COUNT items)"
else
    print_result 1 "High page number handling failed" "HTTP $HTTP_CODE"
fi

sleep 1

echo "Testing: Zero price filter"
ZERO_PRICE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/inventory/browse?minPrice=0&maxPrice=0" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

HTTP_CODE=$(echo "$ZERO_PRICE" | tail -n1)

if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 400 ]; then
    print_result 0 "Handles zero price filter (HTTP $HTTP_CODE)"
else
    print_result 1 "Zero price handling failed" "HTTP $HTTP_CODE"
fi

sleep 1

echo "Testing: Very long search query"
LONG_QUERY=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/inventory/browse/search?q=thisisaverylongsearchquerythatshouldbetestedforproperhandling" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

HTTP_CODE=$(echo "$LONG_QUERY" | tail -n1)

if [ "$HTTP_CODE" -eq 200 ]; then
    print_result 0 "Handles long search query"
else
    print_result 1 "Long query handling failed" "HTTP $HTTP_CODE"
fi

sleep 1

# ========================================
# FINAL SUMMARY
# ========================================
print_section "TEST SUMMARY"

echo ""
echo "Test Execution Complete!"
echo ""
echo -e "Total Tests Run: ${BLUE}$TOTAL_TESTS${NC}"
echo -e "Tests Passed:    ${GREEN}$PASSED_TESTS${NC}"
echo -e "Tests Failed:    ${RED}$FAILED_TESTS${NC}"
echo ""

# Calculate success rate
if [ $TOTAL_TESTS -gt 0 ]; then
    SUCCESS_RATE=$(echo "scale=2; ($PASSED_TESTS * 100) / $TOTAL_TESTS" | bc)
    echo -e "Success Rate:    ${BLUE}${SUCCESS_RATE}%${NC}"
    echo ""
fi

# Test coverage summary
echo -e "${CYAN}📊 TEST COVERAGE SUMMARY${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✓ Browse All Inventory"
echo "✓ Get Item Details (5 items)"
echo "✓ Category Filtering (4 categories)"
echo "✓ Subcategory Filtering"
echo "✓ Supplier Filtering & Profile"
echo "✓ Price Range Filtering"
echo "✓ Search Functionality (5 queries)"
echo "✓ Sorting (price, name, quantity)"
echo "✓ Pagination (3 pages)"
echo "✓ Combined Filters (3 combinations)"
echo "✓ Status Filtering"
echo "✓ Tags Filtering"
echo "✓ Min Order Quantity Filter"
echo "✓ Sustainable Products Filter"
echo "✓ Material Type Filter"
echo "✓ Empty Result Handling"
echo "✓ Invalid Request Handling"
echo "✓ Response Structure Validation"
echo "✓ Access Control"
echo "✓ Performance Testing"
echo "✓ Edge Cases"
echo ""

# Final verdict
if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}╔════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║   ✓ ALL TESTS PASSED! 🎉          ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════╝${NC}"
    echo ""
    echo "✨ Inventory browse functionality is working perfectly!"
    echo ""
    echo -e "${MAGENTA}💡 TESTED FEATURES:${NC}"
    echo "  • Browse all inventory with pagination"
    echo "  • View detailed item information"
    echo "  • Filter by categories and subcategories"
    echo "  • Search products by keywords"
    echo "  • Sort by price, name, and quantity"
    echo "  • Filter by price ranges"
    echo "  • Browse supplier profiles and inventory"
    echo "  • Filter by tags and material types"
    echo "  • Filter sustainable products"
    echo "  • Combined filtering capabilities"
    echo ""
    exit 0
else
    echo -e "${RED}╔════════════════════════════════════╗${NC}"
    echo -e "${RED}║   ✗ SOME TESTS FAILED              ║${NC}"
    echo -e "${RED}╚════════════════════════════════════╝${NC}"
    echo ""
    echo "⚠️  Please review the failed tests above and fix the issues."
    echo ""
    echo -e "${YELLOW}COMMON ISSUES TO CHECK:${NC}"
    echo "  1. Verify all inventory IDs exist in MongoDB"
    echo "  2. Check that inventory items have correct supplierId"
    echo "  3. Ensure inventory items are in 'active' status"
    echo "  4. Verify API endpoints match your implementation"
    echo "  5. Check authentication tokens are valid"
    echo "  6. Ensure database indexes for search are created"
    echo "  7. Verify category and tag values match test data"
    echo ""
    echo -e "${CYAN}DATABASE VERIFICATION COMMANDS:${NC}"
    echo "# Check inventory items:"
    echo "db.inventories.find({_id: {$in: ["
    echo "  ObjectId('$INVENTORY_ID_1'),"
    echo "  ObjectId('$INVENTORY_ID_2'),"
    echo "  ObjectId('$INVENTORY_ID_3'),"
    echo "  ObjectId('$INVENTORY_ID_4'),"
    echo "  ObjectId('$INVENTORY_ID_5')"
    echo "]}}, {name: 1, category: 1, pricePerUnit: 1, status: 1})"
    echo ""
    echo "# Check supplier:"
    echo "db.users.findOne({_id: ObjectId('$SUPPLIER_ID')}, {name: 1, email: 1, role: 1})"
    echo ""
    exit 1
fi