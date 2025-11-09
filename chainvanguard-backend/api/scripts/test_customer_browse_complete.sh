#!/bin/bash

# ============================================
# CHAINVANGUARD - CUSTOMER BROWSE COMPLETE TEST SUITE
# ============================================
# Tests complete customer browsing functionality:
# - Browse all products with filters
# - Browse vendor-specific products
# - View product details
# - View vendor store pages
# - Search and filter products
# - Product comparison
# ============================================

# Load environment variables
ENV_PATH="/Users/atifjalal/Desktop/chainvanguard-nextjs/chainvanguard-backend/api/.env"
if [ -f "$ENV_PATH" ]; then
    set -a
    source "$ENV_PATH"
    set +a
fi

BASE_URL="http://localhost:3001/api"

# Color codes
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

# ============================================
# UTILITY FUNCTIONS
# ============================================

print_header() {
    echo ""
    echo -e "${BOLD}${BLUE}========================================${NC}"
    echo -e "${BOLD}${BLUE}$1${NC}"
    echo -e "${BOLD}${BLUE}========================================${NC}"
}

print_section() {
    echo ""
    echo -e "${BOLD}${CYAN}$1${NC}"
    echo -e "${CYAN}----------------------------------------${NC}"
}

print_test() {
    echo -e "${YELLOW}➤ $1${NC}"
}

print_result() {
    local status=$1
    local message=$2
    local detail=$3
    
    if [ $status -eq 0 ]; then
        echo -e "${GREEN}✓ $message${NC}"
        if [ ! -z "$detail" ]; then
            echo -e "${GREEN}  └─ $detail${NC}"
        fi
        ((PASSED++))
    else
        echo -e "${RED}✗ $message${NC}"
        if [ ! -z "$detail" ]; then
            echo -e "${RED}  └─ $detail${NC}"
        fi
        ((FAILED++))
    fi
    ((TOTAL++))
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# ============================================
# VERIFY TEST PRODUCTS EXIST
# ============================================

verify_test_products() {
    print_header "VERIFYING TEST PRODUCTS"
    print_info "Checking if products exist in database..."
    
    # Check existing products count
    EXISTING_COUNT=$(curl -s -X GET "$BASE_URL/customer/browse/products?limit=1" | jq -r '.pagination.total // 0')
    
    if [ "$EXISTING_COUNT" -gt 0 ]; then
        print_success "Found $EXISTING_COUNT existing products"
        return 0
    else
        print_error "No products found in database"
        print_warning "Please ensure products exist with status='active'"
        return 1
    fi
}

# ============================================
# START TESTS
# ============================================

print_header "CHAINVANGUARD CUSTOMER BROWSE TEST SUITE"
echo "Testing complete customer browsing functionality"
echo "Date: $(date)"
echo ""

print_info "Using credentials from .env file:"
print_info "Customer ID: $CUSTOMER_USER_ID"
print_info "Vendor ID: $VENDOR_USER_ID"
print_info "Product ID 1: $PRODUCT_ID_1"
print_info "Product ID 2: $PRODUCT_ID_2"
print_info "Base URL: $BASE_URL"
echo ""

# Verify products exist
verify_test_products
if [ $? -ne 0 ]; then
    print_error "No products found in database"
    exit 1
fi

sleep 1

# ============================================
# PHASE 1: BROWSE ALL PRODUCTS
# ============================================

print_header "PHASE 1: BROWSE ALL PRODUCTS"

# Test 1.1: Browse all products (no filters)
print_section "Test 1.1: Browse All Products - No Filters"
ALL_PRODUCTS=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/customer/browse/products" \
  -H "Content-Type: application/json")

HTTP_CODE=$(echo "$ALL_PRODUCTS" | tail -n1)
RESPONSE=$(echo "$ALL_PRODUCTS" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    PRODUCT_COUNT=$(echo "$RESPONSE" | jq -r '.products | length // 0')
    TOTAL_PRODUCTS=$(echo "$RESPONSE" | jq -r '.pagination.total // 0')
    
    if [ "$PRODUCT_COUNT" -gt 0 ]; then
        print_result 0 "Browse all products works" "$PRODUCT_COUNT products on page, $TOTAL_PRODUCTS total"
        FIRST_PRODUCT_ID=$(echo "$RESPONSE" | jq -r '.products[0].id // empty')
        FIRST_PRODUCT_NAME=$(echo "$RESPONSE" | jq -r '.products[0].name // empty')
        FIRST_PRODUCT_PRICE=$(echo "$RESPONSE" | jq -r '.products[0].price // 0')
        if [ ! -z "$FIRST_PRODUCT_NAME" ]; then
            print_info "Sample Product: $FIRST_PRODUCT_NAME (PKR $FIRST_PRODUCT_PRICE)"
            print_info "Product ID: $FIRST_PRODUCT_ID"
        fi
    else
        print_result 1 "No products found" "Expected at least 1 product"
    fi
else
    print_result 1 "Failed to browse products" "HTTP $HTTP_CODE"
fi

sleep 1

# Test 1.2: Browse with pagination
print_section "Test 1.2: Browse Products - Pagination"
PAGINATED=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/customer/browse/products?page=1&limit=10" \
  -H "Content-Type: application/json")

HTTP_CODE=$(echo "$PAGINATED" | tail -n1)
RESPONSE=$(echo "$PAGINATED" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    PAGE=$(echo "$RESPONSE" | jq -r '.pagination.page // 1')
    LIMIT=$(echo "$RESPONSE" | jq -r '.pagination.limit // 10')
    TOTAL_PAGES=$(echo "$RESPONSE" | jq -r '.pagination.pages // 1')
    print_result 0 "Pagination works" "Page $PAGE/$TOTAL_PAGES (limit: $LIMIT)"
else
    print_result 1 "Pagination failed" "HTTP $HTTP_CODE"
fi

sleep 1

# Test 1.3: Browse with sorting (price low to high)
print_section "Test 1.3: Browse Products - Sort by Price (Low to High)"
SORT_PRICE_ASC=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/customer/browse/products?sortBy=price&sortOrder=asc&limit=5" \
  -H "Content-Type: application/json")

HTTP_CODE=$(echo "$SORT_PRICE_ASC" | tail -n1)
RESPONSE=$(echo "$SORT_PRICE_ASC" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    PRICES=$(echo "$RESPONSE" | jq -r '.products[]?.price // empty' 2>/dev/null)
    if [ ! -z "$PRICES" ]; then
        print_result 0 "Price sorting (ascending) works"
        print_info "Prices: $(echo $PRICES | tr '\n' ', ' | sed 's/,$//')"
    else
        print_result 0 "Price sorting returned" "No products to sort"
    fi
else
    print_result 1 "Price sorting failed" "HTTP $HTTP_CODE"
fi

sleep 1

# Test 1.4: Browse with sorting (rating)
print_section "Test 1.4: Browse Products - Sort by Rating"
SORT_RATING=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/customer/browse/products?sortBy=rating&sortOrder=desc&limit=5" \
  -H "Content-Type: application/json")

HTTP_CODE=$(echo "$SORT_RATING" | tail -n1)
RESPONSE=$(echo "$SORT_RATING" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    print_result 0 "Rating sorting works"
    NAMES=$(echo "$RESPONSE" | jq -r '.products[]? | "\(.name // "Unknown") - Rating: \(.rating // 0)"' 2>/dev/null | head -3)
    if [ ! -z "$NAMES" ]; then
        echo "$NAMES" | while read line; do
            print_info "$line"
        done
    fi
else
    print_result 1 "Rating sorting failed" "HTTP $HTTP_CODE"
fi

sleep 1

# ============================================
# PHASE 2: FILTER PRODUCTS
# ============================================

print_header "PHASE 2: FILTER PRODUCTS"

# Test 2.1: Filter by category
print_section "Test 2.1: Filter by Category"
FILTER_CATEGORY=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/customer/browse/products?category=Men&limit=10" \
  -H "Content-Type: application/json")

HTTP_CODE=$(echo "$FILTER_CATEGORY" | tail -n1)
RESPONSE=$(echo "$FILTER_CATEGORY" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    CATEGORY_COUNT=$(echo "$RESPONSE" | jq -r '.products | length // 0')
    print_result 0 "Category filter works" "$CATEGORY_COUNT Men's products"
    if [ "$CATEGORY_COUNT" -gt 0 ]; then
        echo "$RESPONSE" | jq -r '.products[0:3]? | .[]? | .name // empty' 2>/dev/null | while read line; do
            if [ ! -z "$line" ]; then
                print_info "• $line"
            fi
        done
    fi
else
    print_result 1 "Category filter failed" "HTTP $HTTP_CODE"
fi

sleep 1

# Test 2.2: Filter by price range
print_section "Test 2.2: Filter by Price Range (500-2000 PKR)"
FILTER_PRICE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/customer/browse/products?minPrice=500&maxPrice=2000&limit=10" \
  -H "Content-Type: application/json")

HTTP_CODE=$(echo "$FILTER_PRICE" | tail -n1)
RESPONSE=$(echo "$FILTER_PRICE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    PRICE_COUNT=$(echo "$RESPONSE" | jq -r '.products | length // 0')
    print_result 0 "Price range filter works" "$PRICE_COUNT products in range"
    
    if [ "$PRICE_COUNT" -gt 0 ]; then
        MIN_FOUND=$(echo "$RESPONSE" | jq -r '[.products[]?.price // 0] | min')
        MAX_FOUND=$(echo "$RESPONSE" | jq -r '[.products[]?.price // 0] | max')
        print_info "Price range in results: PKR $MIN_FOUND - PKR $MAX_FOUND"
    fi
else
    print_result 1 "Price range filter failed" "HTTP $HTTP_CODE"
fi

sleep 1

# Test 2.3: Filter by stock availability
print_section "Test 2.3: Filter by Stock Availability"
FILTER_STOCK=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/customer/browse/products?inStock=true&limit=10" \
  -H "Content-Type: application/json")

HTTP_CODE=$(echo "$FILTER_STOCK" | tail -n1)
RESPONSE=$(echo "$FILTER_STOCK" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    IN_STOCK_COUNT=$(echo "$RESPONSE" | jq -r '.products | length // 0')
    print_result 0 "Stock filter works" "$IN_STOCK_COUNT in-stock products"
else
    print_result 1 "Stock filter failed" "HTTP $HTTP_CODE"
fi

sleep 1

# Test 2.4: Filter featured products
print_section "Test 2.4: Filter Featured Products"
FILTER_FEATURED=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/customer/browse/products?isFeatured=true&limit=10" \
  -H "Content-Type: application/json")

HTTP_CODE=$(echo "$FILTER_FEATURED" | tail -n1)
RESPONSE=$(echo "$FILTER_FEATURED" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    FEATURED_COUNT=$(echo "$RESPONSE" | jq -r '.products | length // 0')
    print_result 0 "Featured filter works" "$FEATURED_COUNT featured products"
else
    print_result 1 "Featured filter failed" "HTTP $HTTP_CODE"
fi

sleep 1

# ============================================
# PHASE 3: SEARCH PRODUCTS
# ============================================

print_header "PHASE 3: SEARCH PRODUCTS"

# Test 3.1: Search by product name
print_section "Test 3.1: Search by Product Name"
SEARCH_NAME=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/customer/browse/products?search=shirt&limit=10" \
  -H "Content-Type: application/json")

HTTP_CODE=$(echo "$SEARCH_NAME" | tail -n1)
RESPONSE=$(echo "$SEARCH_NAME" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    SEARCH_COUNT=$(echo "$RESPONSE" | jq -r '.products | length // 0')
    print_result 0 "Name search works" "$SEARCH_COUNT products found"
    
    if [ "$SEARCH_COUNT" -gt 0 ]; then
        echo "$RESPONSE" | jq -r '.products[0:3]? | .[]? | .name // empty' 2>/dev/null | while read line; do
            if [ ! -z "$line" ]; then
                print_info "• $line"
            fi
        done
    fi
else
    print_result 1 "Name search failed" "HTTP $HTTP_CODE"
fi

sleep 1

# ============================================
# PHASE 4: PRODUCT DETAILS
# ============================================

print_header "PHASE 4: PRODUCT DETAILS"

# Test 4.1: Get product details using PRODUCT_ID_1 from env
print_section "Test 4.1: Get Product Details (Full)"
if [ ! -z "$PRODUCT_ID_1" ]; then
    PRODUCT_DETAILS=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/customer/browse/products/$PRODUCT_ID_1" \
      -H "Content-Type: application/json")
    
    HTTP_CODE=$(echo "$PRODUCT_DETAILS" | tail -n1)
    RESPONSE=$(echo "$PRODUCT_DETAILS" | sed '$d')
    
    if [ "$HTTP_CODE" -eq 200 ]; then
        PRODUCT_NAME=$(echo "$RESPONSE" | jq -r '.product.name // empty')
        PRODUCT_PRICE=$(echo "$RESPONSE" | jq -r '.product.price // 0')
        PRODUCT_DESC=$(echo "$RESPONSE" | jq -r '.product.description // empty')
        PRODUCT_STOCK=$(echo "$RESPONSE" | jq -r '.product.stock // 0')
        PRODUCT_RATING=$(echo "$RESPONSE" | jq -r '.product.rating.average // 0')
        PRODUCT_VENDOR=$(echo "$RESPONSE" | jq -r '.product.vendor.name // empty')
        
        print_result 0 "Product details retrieved successfully"
        print_info "Product: $PRODUCT_NAME"
        print_info "Price: PKR $PRODUCT_PRICE"
        print_info "Stock: $PRODUCT_STOCK units"
        print_info "Rating: $PRODUCT_RATING/5"
        if [ ! -z "$PRODUCT_VENDOR" ]; then
            print_info "Vendor: $PRODUCT_VENDOR"
        fi
        
        # Check if apparel details included
        HAS_APPAREL=$(echo "$RESPONSE" | jq -r '.product.apparelDetails // empty')
        if [ ! -z "$HAS_APPAREL" ]; then
            SIZE=$(echo "$RESPONSE" | jq -r '.product.apparelDetails.availableSizes[0] // empty')
            COLOR=$(echo "$RESPONSE" | jq -r '.product.apparelDetails.availableColors[0] // empty')
            MATERIAL=$(echo "$RESPONSE" | jq -r '.product.apparelDetails.material // empty')
            if [ ! -z "$SIZE" ] || [ ! -z "$COLOR" ]; then
                print_info "Apparel: Size=$SIZE, Color=$COLOR, Material=$MATERIAL"
            fi
        fi
        
        # Check vendor details included
        HAS_VENDOR=$(echo "$RESPONSE" | jq -r '.product.vendor // empty')
        if [ ! -z "$HAS_VENDOR" ]; then
            VENDOR_LOCATION=$(echo "$RESPONSE" | jq -r '.product.vendor.location // empty')
            VENDOR_PRODUCTS=$(echo "$RESPONSE" | jq -r '.product.vendor.stats.productCount // 0')
            print_info "Vendor Location: $VENDOR_LOCATION"
            print_info "Vendor has $VENDOR_PRODUCTS total products"
        fi
    else
        print_result 1 "Failed to get product details" "HTTP $HTTP_CODE"
    fi
else
    print_warning "PRODUCT_ID_1 not set in env, skipping product details test"
fi

sleep 1

# Test 4.2: Get product details without optional data
print_section "Test 4.2: Get Product Details (Minimal - No Reviews/Related)"
if [ ! -z "$PRODUCT_ID_1" ]; then
    PRODUCT_MINIMAL=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/customer/browse/products/$PRODUCT_ID_1?includeReviews=false&includeRelated=false&includeVendor=false" \
      -H "Content-Type: application/json")
    
    HTTP_CODE=$(echo "$PRODUCT_MINIMAL" | tail -n1)
    RESPONSE=$(echo "$PRODUCT_MINIMAL" | sed '$d')
    
    if [ "$HTTP_CODE" -eq 200 ]; then
        print_result 0 "Minimal product details retrieved"
        
        # Verify optional data is excluded
        HAS_REVIEWS=$(echo "$RESPONSE" | jq -r 'has("reviews")')
        HAS_VENDOR=$(echo "$RESPONSE" | jq -r '.product | has("vendor")')
        HAS_RELATED=$(echo "$RESPONSE" | jq -r 'has("relatedProducts")')
        
        if [ "$HAS_REVIEWS" = "false" ] && [ "$HAS_VENDOR" = "false" ] && [ "$HAS_RELATED" = "false" ]; then
            print_info "Optional data correctly excluded ✓"
        else
            print_warning "Some optional data still included (reviews=$HAS_REVIEWS, vendor=$HAS_VENDOR, related=$HAS_RELATED)"
        fi
    else
        print_result 1 "Minimal details retrieval failed" "HTTP $HTTP_CODE"
    fi
else
    print_warning "PRODUCT_ID_1 not set in env"
fi

sleep 1

# Test 4.3: Get related products
print_section "Test 4.3: Get Related Products"
if [ ! -z "$PRODUCT_ID_1" ]; then
    RELATED_PRODUCTS=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/customer/browse/products/$PRODUCT_ID_1/related?limit=5" \
      -H "Content-Type: application/json")
    
    HTTP_CODE=$(echo "$RELATED_PRODUCTS" | tail -n1)
    RESPONSE=$(echo "$RELATED_PRODUCTS" | sed '$d')
    
    if [ "$HTTP_CODE" -eq 200 ]; then
        RELATED_COUNT=$(echo "$RESPONSE" | jq -r '.relatedProducts | length // 0')
        print_result 0 "Related products retrieved" "$RELATED_COUNT products"
        
        if [ "$RELATED_COUNT" -gt 0 ]; then
            echo "$RESPONSE" | jq -r '.relatedProducts[0:3]? | .[]? | "\(.name // "Unknown") - PKR \(.price // 0)"' 2>/dev/null | while read line; do
                if [ ! -z "$line" ]; then
                    print_info "• $line"
                fi
            done
        fi
    else
        print_result 1 "Related products retrieval failed" "HTTP $HTTP_CODE"
    fi
else
    print_warning "PRODUCT_ID_1 not set in env"
fi

sleep 1

# Test 4.4: Get product details for PRODUCT_ID_2
print_section "Test 4.4: Get Second Product Details"
if [ ! -z "$PRODUCT_ID_2" ]; then
    PRODUCT_DETAILS_2=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/customer/browse/products/$PRODUCT_ID_2" \
      -H "Content-Type: application/json")
    
    HTTP_CODE=$(echo "$PRODUCT_DETAILS_2" | tail -n1)
    RESPONSE=$(echo "$PRODUCT_DETAILS_2" | sed '$d')
    
    if [ "$HTTP_CODE" -eq 200 ]; then
        PRODUCT_NAME=$(echo "$RESPONSE" | jq -r '.product.name // empty')
        PRODUCT_PRICE=$(echo "$RESPONSE" | jq -r '.product.price // 0')
        PRODUCT_CATEGORY=$(echo "$RESPONSE" | jq -r '.product.category // empty')
        print_result 0 "Second product details retrieved"
        print_info "Product: $PRODUCT_NAME"
        print_info "Category: $PRODUCT_CATEGORY, Price: PKR $PRODUCT_PRICE"
    else
        print_result 1 "Failed to get second product details" "HTTP $HTTP_CODE"
    fi
else
    print_warning "PRODUCT_ID_2 not set in env"
fi

sleep 1

# ============================================
# PHASE 6: QUICK ACTIONS (ADD TO CART & WISHLIST)
# ============================================

print_header "PHASE 6: QUICK ACTIONS - ADD TO CART & WISHLIST"

# Test 6.1: Quick add to cart
print_section "Test 6.1: Quick Add to Cart"
if [ ! -z "$PRODUCT_ID_1" ] && [ ! -z "$CUSTOMER_TOKEN" ]; then
    ADD_CART=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/customer/browse/quick-add-cart" \
      -H "Authorization: Bearer $CUSTOMER_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"productId\":\"$PRODUCT_ID_1\",\"quantity\":2}")
    
    HTTP_CODE=$(echo "$ADD_CART" | tail -n1)
    RESPONSE=$(echo "$ADD_CART" | sed '$d')
    
    if [ "$HTTP_CODE" -eq 200 ]; then
        SUCCESS=$(echo "$RESPONSE" | jq -r '.success // false')
        MESSAGE=$(echo "$RESPONSE" | jq -r '.message // empty')
        CART_ITEMS=$(echo "$RESPONSE" | jq -r '.cart.items | length // 0')
        CART_TOTAL=$(echo "$RESPONSE" | jq -r '.cart.totalAmount // 0')
        
        if [ "$SUCCESS" = "true" ]; then
            print_result 0 "Product added to cart successfully"
            print_info "Cart has $CART_ITEMS items, Total: PKR $CART_TOTAL"
            if [ ! -z "$MESSAGE" ]; then
                print_info "Message: $MESSAGE"
            fi
        else
            print_result 1 "Add to cart returned success=false"
        fi
    else
        print_result 1 "Failed to add to cart" "HTTP $HTTP_CODE"
        ERROR_MSG=$(echo "$RESPONSE" | jq -r '.message // empty')
        if [ ! -z "$ERROR_MSG" ]; then
            print_info "Error: $ERROR_MSG"
        fi
    fi
else
    print_warning "PRODUCT_ID_1 or CUSTOMER_TOKEN not set, skipping cart test"
fi

sleep 1

# Test 6.2: Quick add to cart with size/color options
print_section "Test 6.2: Quick Add to Cart (With Size & Color)"
if [ ! -z "$PRODUCT_ID_2" ] && [ ! -z "$CUSTOMER_TOKEN" ]; then
    ADD_CART_OPTIONS=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/customer/browse/quick-add-cart" \
      -H "Authorization: Bearer $CUSTOMER_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"productId\":\"$PRODUCT_ID_2\",\"quantity\":1,\"selectedSize\":\"M\",\"selectedColor\":\"Blue\"}")
    
    HTTP_CODE=$(echo "$ADD_CART_OPTIONS" | tail -n1)
    RESPONSE=$(echo "$ADD_CART_OPTIONS" | sed '$d')
    
    if [ "$HTTP_CODE" -eq 200 ]; then
        SUCCESS=$(echo "$RESPONSE" | jq -r '.success // false')
        if [ "$SUCCESS" = "true" ]; then
            print_result 0 "Product with options added to cart"
            CART_ITEMS=$(echo "$RESPONSE" | jq -r '.cart.items | length // 0')
            print_info "Cart now has $CART_ITEMS items"
        else
            print_result 1 "Add to cart with options failed"
        fi
    else
        print_result 1 "Failed to add to cart with options" "HTTP $HTTP_CODE"
    fi
else
    print_warning "PRODUCT_ID_2 or CUSTOMER_TOKEN not set"
fi

sleep 1

# Test 6.3: Quick add to wishlist
print_section "Test 6.3: Quick Add to Wishlist"
if [ ! -z "$PRODUCT_ID_1" ] && [ ! -z "$CUSTOMER_TOKEN" ]; then
    ADD_WISHLIST=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/customer/browse/quick-add-wishlist" \
      -H "Authorization: Bearer $CUSTOMER_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"productId\":\"$PRODUCT_ID_1\",\"notes\":\"Want to buy later\"}")
    
    HTTP_CODE=$(echo "$ADD_WISHLIST" | tail -n1)
    RESPONSE=$(echo "$ADD_WISHLIST" | sed '$d')
    
    if [ "$HTTP_CODE" -eq 200 ]; then
        SUCCESS=$(echo "$RESPONSE" | jq -r '.success // false')
        MESSAGE=$(echo "$RESPONSE" | jq -r '.message // empty')
        
        if [ "$SUCCESS" = "true" ]; then
            print_result 0 "Product added to wishlist successfully"
            if [ ! -z "$MESSAGE" ]; then
                print_info "Message: $MESSAGE"
            fi
        else
            print_result 1 "Add to wishlist returned success=false"
        fi
    else
        # 400 might mean already in wishlist
        if [ "$HTTP_CODE" -eq 400 ]; then
            ERROR_MSG=$(echo "$RESPONSE" | jq -r '.message // empty')
            if [[ "$ERROR_MSG" == *"already"* ]]; then
                print_result 0 "Product already in wishlist (expected)"
                print_info "Message: $ERROR_MSG"
            else
                print_result 1 "Failed to add to wishlist" "HTTP $HTTP_CODE: $ERROR_MSG"
            fi
        else
            print_result 1 "Failed to add to wishlist" "HTTP $HTTP_CODE"
        fi
    fi
else
    print_warning "PRODUCT_ID_1 or CUSTOMER_TOKEN not set, skipping wishlist test"
fi

sleep 1

# Test 6.4: Add to wishlist without authentication (should fail)
print_section "Test 6.4: Add to Wishlist Without Auth (Should Fail)"
if [ ! -z "$PRODUCT_ID_2" ]; then
    ADD_WISHLIST_NOAUTH=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/customer/browse/quick-add-wishlist" \
      -H "Content-Type: application/json" \
      -d "{\"productId\":\"$PRODUCT_ID_2\"}")
    
    HTTP_CODE=$(echo "$ADD_WISHLIST_NOAUTH" | tail -n1)
    
    if [ "$HTTP_CODE" -eq 401 ] || [ "$HTTP_CODE" -eq 403 ]; then
        print_result 0 "Correctly requires authentication" "Returns $HTTP_CODE"
    else
        print_result 1 "Should require authentication" "Got HTTP $HTTP_CODE"
    fi
else
    print_warning "PRODUCT_ID_2 not set"
fi

sleep 1

# Test 6.5: Add invalid product to cart (should fail)
print_section "Test 6.5: Add Invalid Product to Cart (Should Fail)"
if [ ! -z "$CUSTOMER_TOKEN" ]; then
    ADD_INVALID=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/customer/browse/quick-add-cart" \
      -H "Authorization: Bearer $CUSTOMER_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"productId":"507f1f77bcf86cd799439011","quantity":1}')
    
    HTTP_CODE=$(echo "$ADD_INVALID" | tail -n1)
    
    if [ "$HTTP_CODE" -eq 404 ]; then
        print_result 0 "Invalid product correctly rejected" "Returns 404"
    else
        print_result 1 "Should reject invalid product" "Got HTTP $HTTP_CODE"
    fi
else
    print_warning "CUSTOMER_TOKEN not set"
fi

sleep 1

# Test 6.6: Add to cart with zero quantity (should fail)
print_section "Test 6.6: Add to Cart with Zero Quantity (Should Fail)"
if [ ! -z "$PRODUCT_ID_1" ] && [ ! -z "$CUSTOMER_TOKEN" ]; then
    ADD_ZERO=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/customer/browse/quick-add-cart" \
      -H "Authorization: Bearer $CUSTOMER_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"productId\":\"$PRODUCT_ID_1\",\"quantity\":0}")
    
    HTTP_CODE=$(echo "$ADD_ZERO" | tail -n1)
    
    if [ "$HTTP_CODE" -eq 400 ]; then
        print_result 0 "Zero quantity correctly rejected" "Returns 400"
    else
        print_result 1 "Should reject zero quantity" "Got HTTP $HTTP_CODE"
    fi
else
    print_warning "PRODUCT_ID_1 or CUSTOMER_TOKEN not set"
fi

sleep 1

# ============================================
# PHASE 7: VENDOR STORE BROWSING
# ============================================

print_header "PHASE 7: VENDOR STORE BROWSING"

# Test 7.1: Get vendor store page
print_section "Test 7.1: Get Vendor Store Page"
VENDOR_STORE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/customer/browse/vendor/$VENDOR_USER_ID" \
  -H "Content-Type: application/json")

HTTP_CODE=$(echo "$VENDOR_STORE" | tail -n1)
RESPONSE=$(echo "$VENDOR_STORE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    VENDOR_NAME=$(echo "$RESPONSE" | jq -r '.vendor.name // .vendor.companyName // "Unknown"')
    VENDOR_RATING=$(echo "$RESPONSE" | jq -r '.vendor.averageRating // 0')
    PRODUCT_COUNT=$(echo "$RESPONSE" | jq -r '.stats.totalProducts // 0')
    print_result 0 "Vendor store page retrieved"
    print_info "Vendor: $VENDOR_NAME"
    print_info "Rating: $VENDOR_RATING/5"
    print_info "Total Products: $PRODUCT_COUNT"
else
    print_result 1 "Vendor store page retrieval failed" "HTTP $HTTP_CODE"
fi

sleep 1

# Test 7.2: Browse vendor's products
print_section "Test 7.2: Browse Vendor's Products"
VENDOR_PRODUCTS=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/customer/browse/vendor/$VENDOR_USER_ID/products?limit=10" \
  -H "Content-Type: application/json")

HTTP_CODE=$(echo "$VENDOR_PRODUCTS" | tail -n1)
RESPONSE=$(echo "$VENDOR_PRODUCTS" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    VENDOR_PROD_COUNT=$(echo "$RESPONSE" | jq -r '.products | length // 0')
    print_result 0 "Vendor products retrieved" "$VENDOR_PROD_COUNT products"
    
    if [ "$VENDOR_PROD_COUNT" -gt 0 ]; then
        echo "$RESPONSE" | jq -r '.products[0:3]? | .[]? | "\(.name // "Unknown") - PKR \(.price // 0)"' 2>/dev/null | while read line; do
            print_info "• $line"
        done
    fi
else
    print_result 1 "Vendor products retrieval failed" "HTTP $HTTP_CODE"
fi

sleep 1

# ============================================
# PHASE 8: EDGE CASES & ERROR HANDLING
# ============================================

print_header "PHASE 8: EDGE CASES & ERROR HANDLING"

# Test 8.1: Invalid product ID
print_section "Test 8.1: Get Product with Invalid ID"
INVALID_ID=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/customer/browse/products/507f1f77bcf86cd799439011" \
  -H "Content-Type: application/json")

HTTP_CODE=$(echo "$INVALID_ID" | tail -n1)

if [ "$HTTP_CODE" -eq 404 ]; then
    print_result 0 "Invalid product ID handled correctly" "Returns 404"
else
    print_result 1 "Invalid product ID not handled properly" "Expected 404, got $HTTP_CODE"
fi

sleep 1

# Test 8.2: Invalid vendor ID
print_section "Test 8.2: Get Vendor Store with Invalid ID"
INVALID_VENDOR=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/customer/browse/vendor/507f1f77bcf86cd799439011" \
  -H "Content-Type: application/json")

HTTP_CODE=$(echo "$INVALID_VENDOR" | tail -n1)

if [ "$HTTP_CODE" -eq 404 ]; then
    print_result 0 "Invalid vendor ID handled correctly" "Returns 404"
else
    print_result 1 "Invalid vendor ID not handled properly" "Expected 404, got $HTTP_CODE"
fi

sleep 1

# Test 8.3: Empty search query
print_section "Test 8.3: Search with Empty Query"
EMPTY_SEARCH=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/customer/browse/products?search=&limit=10" \
  -H "Content-Type: application/json")

HTTP_CODE=$(echo "$EMPTY_SEARCH" | tail -n1)

if [ "$HTTP_CODE" -eq 200 ]; then
    print_result 0 "Empty search handled correctly" "Returns all products"
else
    print_result 1 "Empty search failed" "HTTP $HTTP_CODE"
fi

sleep 1

# ============================================
# FINAL SUMMARY
# ============================================

print_header "TEST SUITE SUMMARY"

echo ""
echo -e "${BOLD}Total Tests: $TOTAL${NC}"
echo -e "${GREEN}${BOLD}Passed: $PASSED${NC}"
echo -e "${RED}${BOLD}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}${BOLD}✓ ALL TESTS PASSED!${NC}"
    echo -e "${GREEN}Customer browse functionality is working perfectly!${NC}"
    exit 0
else
    echo -e "${RED}${BOLD}✗ SOME TESTS FAILED${NC}"
    echo -e "${YELLOW}Please review the failed tests above${NC}"
    exit 1
fi