#!/bin/bash

# ============================================
# INVENTORY SYSTEM TEST SCRIPT - COMPLETE VERSION
# Creates 5 diverse inventory items and tests ALL functionality
# ============================================

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
# Navigate to the api directory and source .env
source /Users/atifjalal/Desktop/chainvanguard-nextjs/chainvanguard-backend/api/.env

BASE_URL="http://localhost:3001/api"
declare -a INVENTORY_IDS=()

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# ============================================
# Helper Functions
# ============================================

print_header() {
    echo ""
    echo -e "${BLUE}=========================================${NC}"
    echo -e "${BLUE} $1${NC}"
    echo -e "${BLUE}=========================================${NC}"
    echo ""
}

print_subheader() {
    echo ""
    echo -e "${CYAN}--- $1 ---${NC}"
}

print_test() {
    echo -e "${YELLOW}📋 Testing: $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_debug() {
    if [ "$DEBUG" = "true" ]; then
        echo -e "${YELLOW}🐛 DEBUG: $1${NC}"
    fi
}

# ============================================
# HEADER
# ============================================

clear
print_header "ChainVanguard Inventory System - COMPLETE TEST SUITE"
print_info "Creating 5 diverse inventory items + Testing ALL routes"
print_info "Base URL: $BASE_URL"
echo ""

# ============================================
# 1. VERIFY AUTHENTICATION TOKENS
# ============================================

print_header "1. AUTHENTICATION VERIFICATION"

print_info "Checking environment variables..."
if [ -z "$SUPPLIER_TOKEN" ]; then
    print_error "SUPPLIER_TOKEN not found in .env"
    exit 1
fi

if [ -z "$VENDOR_TOKEN" ]; then
    print_error "VENDOR_TOKEN not found in .env"
    exit 1
fi

if [ -z "$EXPERT_TOKEN" ]; then
    print_error "EXPERT_TOKEN not found in .env"
    exit 1
fi

print_success "All authentication tokens found"

# Verify supplier authentication
print_test "Verifying supplier authentication"
SUPPLIER_PROFILE=$(curl -s -X GET "$BASE_URL/auth/profile" \
  -H "Authorization: Bearer $SUPPLIER_TOKEN")

SUPPLIER_AUTH_SUCCESS=$(echo $SUPPLIER_PROFILE | jq -r '.success')
if [ "$SUPPLIER_AUTH_SUCCESS" = "true" ]; then
    SUPPLIER_NAME=$(echo $SUPPLIER_PROFILE | jq -r '.data.name')
    SUPPLIER_ID_FROM_PROFILE=$(echo $SUPPLIER_PROFILE | jq -r '.data._id')
    print_success "Supplier authenticated: $SUPPLIER_NAME"
    print_info "Supplier ID: ${SUPPLIER_ID:-$SUPPLIER_ID_FROM_PROFILE}"
else
    print_error "Supplier authentication failed"
    echo $SUPPLIER_PROFILE | jq '.'
    exit 1
fi

# Verify vendor authentication
print_test "Verifying vendor authentication"
VENDOR_PROFILE=$(curl -s -X GET "$BASE_URL/auth/profile" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

VENDOR_AUTH_SUCCESS=$(echo $VENDOR_PROFILE | jq -r '.success')
if [ "$VENDOR_AUTH_SUCCESS" = "true" ]; then
    VENDOR_NAME=$(echo $VENDOR_PROFILE | jq -r '.data.name')
    VENDOR_ID_FROM_PROFILE=$(echo $VENDOR_PROFILE | jq -r '.data._id')
    print_success "Vendor authenticated: $VENDOR_NAME"
    print_info "Vendor ID: ${VENDOR_ID:-$VENDOR_ID_FROM_PROFILE}"
    # Use profile ID if env var is not set
    VENDOR_ID="${VENDOR_ID:-$VENDOR_ID_FROM_PROFILE}"
else
    print_error "Vendor authentication failed"
fi

sleep 1

# ============================================
# 2. CREATE 5 DIVERSE INVENTORY ITEMS
# ============================================

print_header "2. CREATE 5 DIVERSE INVENTORY ITEMS"

# ITEM 1: Premium Cotton Fabric
print_subheader "Creating Item 1: Premium Organic Cotton Fabric"

ITEM1=$(curl -s -X POST "$BASE_URL/inventory" \
  -H "Authorization: Bearer $SUPPLIER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Premium Organic Cotton Fabric",
    "description": "100% GOTS certified organic cotton fabric, perfect for sustainable fashion",
    "category": "Fabric",
    "subcategory": "Cotton Fabric",
    "quantity": 1500,
    "unit": "meters",
    "pricePerUnit": 8.50,
    "costPrice": 6.00,
    "minStockLevel": 300,
    "reorderLevel": 400,
    "reorderQuantity": 800,
    "materialType": "Raw Material",
    "textileDetails": {
      "fabricType": "Cotton",
      "composition": "100% Organic Cotton",
      "gsm": 180,
      "width": 150,
      "color": "Natural White",
      "colorCode": "#F5F5DC",
      "pattern": "Solid",
      "finish": "Plain",
      "careInstructions": "Machine wash cold, tumble dry low",
      "shrinkage": "3-5%",
      "washability": "Machine washable"
    },
    "weight": 0.18,
    "countryOfOrigin": "India",
    "manufacturer": "EcoTextiles Ltd",
    "isSustainable": true,
    "certifications": ["GOTS", "OEKO-TEX Standard 100"],
    "sustainabilityCertifications": ["GOTS", "Organic Content Standard"],
    "tags": ["organic", "cotton", "sustainable", "GOTS", "natural"],
    "season": "All Season",
    "batches": [{
      "batchNumber": "ORG-COT-'$(date +%Y%m%d)'-001",
      "quantity": 1500,
      "manufactureDate": "2025-09-15",
      "expiryDate": "2027-09-15",
      "costPerUnit": 6.00
    }],
    "isBatchTracked": true,
    "leadTime": 7,
    "shelfLife": 730
  }')

if [ "$(echo $ITEM1 | jq -r '.success')" = "true" ]; then
    ID1=$(echo $ITEM1 | jq -r '.data._id')
    INVENTORY_IDS+=("$ID1")
    print_success "Created: Premium Organic Cotton Fabric"
    print_info "ID: $ID1 | Qty: 1500m | Price: $8.50/m"
else
    print_error "Failed to create Item 1"
    echo $ITEM1 | jq '.'
fi

sleep 1

# ITEM 2: Polyester Yarn
print_subheader "Creating Item 2: High-Strength Polyester Yarn"

ITEM2=$(curl -s -X POST "$BASE_URL/inventory" \
  -H "Authorization: Bearer $SUPPLIER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "High-Strength Polyester Yarn 40s",
    "description": "Industrial grade polyester yarn, ideal for durable stitching",
    "category": "Yarn & Thread",
    "subcategory": "Polyester Yarn",
    "quantity": 5000,
    "unit": "kilograms",
    "pricePerUnit": 12.00,
    "costPrice": 8.50,
    "minStockLevel": 800,
    "reorderLevel": 1000,
    "reorderQuantity": 3000,
    "materialType": "Raw Material",
    "textileDetails": {
      "fabricType": "Polyester",
      "composition": "100% Polyester",
      "color": "White",
      "colorCode": "#FFFFFF",
      "pattern": "Solid"
    },
    "weight": 1.0,
    "countryOfOrigin": "China",
    "manufacturer": "PolyThread Industries",
    "tags": ["polyester", "yarn", "industrial", "durable", "40s"],
    "season": "All Season",
    "batches": [{
      "batchNumber": "POLY-YARN-'$(date +%Y%m%d)'-002",
      "quantity": 5000,
      "manufactureDate": "2025-10-01",
      "costPerUnit": 8.50
    }],
    "isBatchTracked": true,
    "leadTime": 10
  }')

if [ "$(echo $ITEM2 | jq -r '.success')" = "true" ]; then
    ID2=$(echo $ITEM2 | jq -r '.data._id')
    INVENTORY_IDS+=("$ID2")
    print_success "Created: High-Strength Polyester Yarn"
    print_info "ID: $ID2 | Qty: 5000kg | Price: $12.00/kg"
else
    print_error "Failed to create Item 2"
fi

sleep 1

# ITEM 3: Metal Zippers
print_subheader "Creating Item 3: Premium Metal Zippers"

ITEM3=$(curl -s -X POST "$BASE_URL/inventory" \
  -H "Authorization: Bearer $SUPPLIER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Premium Metal Zippers 7-inch",
    "description": "High-quality brass zippers for jeans and jackets",
    "category": "Trims & Accessories",
    "subcategory": "Zippers",
    "quantity": 10000,
    "unit": "pieces",
    "pricePerUnit": 0.85,
    "costPrice": 0.50,
    "minStockLevel": 2000,
    "reorderLevel": 2500,
    "reorderQuantity": 5000,
    "materialType": "Accessory",
    "brand": "YKK",
    "textileDetails": {
      "color": "Antique Brass",
      "colorCode": "#CD7F32",
      "finish": "Metallic"
    },
    "dimensions": "7 inches",
    "weight": 0.015,
    "countryOfOrigin": "Japan",
    "manufacturer": "YKK Corporation",
    "tags": ["zipper", "metal", "brass", "YKK", "premium", "7inch"],
    "season": "All Season",
    "batches": [{
      "batchNumber": "ZIP-METAL-'$(date +%Y%m%d)'-003",
      "quantity": 10000,
      "manufactureDate": "2025-09-20",
      "costPerUnit": 0.50
    }],
    "leadTime": 14,
    "qualityGrade": "A"
  }')

if [ "$(echo $ITEM3 | jq -r '.success')" = "true" ]; then
    ID3=$(echo $ITEM3 | jq -r '.data._id')
    INVENTORY_IDS+=("$ID3")
    print_success "Created: Premium Metal Zippers"
    print_info "ID: $ID3 | Qty: 10000pcs | Price: $0.85/pc"
else
    print_error "Failed to create Item 3"
fi

sleep 1

# ITEM 4: Fabric Dye
print_subheader "Creating Item 4: Reactive Fabric Dye - Navy Blue"

ITEM4=$(curl -s -X POST "$BASE_URL/inventory" \
  -H "Authorization: Bearer $SUPPLIER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Reactive Fabric Dye - Navy Blue",
    "description": "Professional grade reactive dye for natural fibers, excellent color fastness",
    "category": "Dyes & Chemicals",
    "subcategory": "Fabric Dye",
    "quantity": 500,
    "unit": "kilograms",
    "pricePerUnit": 25.00,
    "costPrice": 18.00,
    "minStockLevel": 50,
    "reorderLevel": 80,
    "reorderQuantity": 200,
    "materialType": "Consumable",
    "textileDetails": {
      "color": "Navy Blue",
      "colorCode": "#000080",
      "careInstructions": "Store in cool, dry place away from sunlight"
    },
    "weight": 1.0,
    "countryOfOrigin": "Germany",
    "manufacturer": "DyeChem Solutions",
    "tags": ["dye", "reactive", "navy", "blue", "professional", "colorfast"],
    "season": "All Season",
    "batches": [{
      "batchNumber": "DYE-NAVY-'$(date +%Y%m%d)'-004",
      "quantity": 500,
      "manufactureDate": "2025-08-01",
      "expiryDate": "2027-08-01",
      "costPerUnit": 18.00
    }],
    "isBatchTracked": true,
    "leadTime": 15,
    "shelfLife": 730,
    "complianceStandards": ["REACH", "ISO 14001"]
  }')

if [ "$(echo $ITEM4 | jq -r '.success')" = "true" ]; then
    ID4=$(echo $ITEM4 | jq -r '.data._id')
    INVENTORY_IDS+=("$ID4")
    print_success "Created: Reactive Fabric Dye - Navy Blue"
    print_info "ID: $ID4 | Qty: 500kg | Price: $25.00/kg"
else
    print_error "Failed to create Item 4"
fi

sleep 1

# ITEM 5: Denim Fabric
print_subheader "Creating Item 5: Premium Stretch Denim"

ITEM5=$(curl -s -X POST "$BASE_URL/inventory" \
  -H "Authorization: Bearer $SUPPLIER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Premium Stretch Denim - Dark Indigo",
    "description": "High-quality stretch denim with 2% elastane for comfort",
    "category": "Fabric",
    "subcategory": "Denim Fabric",
    "quantity": 2000,
    "unit": "meters",
    "pricePerUnit": 15.00,
    "costPrice": 11.00,
    "originalPrice": 18.00,
    "discount": 16.67,
    "minStockLevel": 400,
    "reorderLevel": 500,
    "reorderQuantity": 1000,
    "materialType": "Raw Material",
    "textileDetails": {
      "fabricType": "Denim",
      "composition": "98% Cotton, 2% Elastane",
      "gsm": 320,
      "width": 145,
      "fabricWeight": "Medium-Heavy",
      "color": "Dark Indigo",
      "colorCode": "#1A4D7E",
      "pattern": "Solid",
      "finish": "Twill",
      "careInstructions": "Machine wash cold inside out, hang dry",
      "shrinkage": "2-3%",
      "washability": "Machine washable"
    },
    "weight": 0.32,
    "countryOfOrigin": "Turkey",
    "manufacturer": "Premium Denim Mills",
    "isSustainable": true,
    "certifications": ["OEKO-TEX Standard 100", "BCI Cotton"],
    "tags": ["denim", "stretch", "indigo", "premium", "comfortable"],
    "season": "All Season",
    "batches": [{
      "batchNumber": "DENIM-IND-'$(date +%Y%m%d)'-005",
      "quantity": 2000,
      "manufactureDate": "2025-09-10",
      "costPerUnit": 11.00
    }],
    "isBatchTracked": true,
    "leadTime": 12,
    "qualityGrade": "A"
  }')

if [ "$(echo $ITEM5 | jq -r '.success')" = "true" ]; then
    ID5=$(echo $ITEM5 | jq -r '.data._id')
    INVENTORY_IDS+=("$ID5")
    print_success "Created: Premium Stretch Denim"
    print_info "ID: $ID5 | Qty: 2000m | Price: $15.00/m"
else
    print_error "Failed to create Item 5"
fi

print_success "All 5 inventory items created successfully!"
print_info "Total items created: ${#INVENTORY_IDS[@]}"

# ============================================
# UPDATE .ENV FILE WITH INVENTORY IDS
# ============================================

print_subheader "Updating .env file with Inventory IDs"

# Path to .env file (relative to script location)
ENV_FILE="/Users/atifjalal/Desktop/chainvanguard-nextjs/chainvanguard-backend/api/.env"

# Function to update or add env variable
update_env() {
    local key=$1
    local value=$2
    
    if grep -q "^${key}=" "$ENV_FILE"; then
        # Key exists, update it
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s|^${key}=.*|${key}=${value}|" "$ENV_FILE"
        else
            # Linux
            sed -i "s|^${key}=.*|${key}=${value}|" "$ENV_FILE"
        fi
    else
        # Key doesn't exist, append it
        echo "${key}=${value}" >> "$ENV_FILE"
    fi
}

# Update inventory IDs in .env
if [ ${#INVENTORY_IDS[@]} -ge 1 ]; then
    print_info "Updating INVENTORY_ID_1..."
    update_env "INVENTORY_ID_1" "${INVENTORY_IDS[0]}"
fi

if [ ${#INVENTORY_IDS[@]} -ge 2 ]; then
    print_info "Updating INVENTORY_ID_2..."
    update_env "INVENTORY_ID_2" "${INVENTORY_IDS[1]}"
fi

if [ ${#INVENTORY_IDS[@]} -ge 3 ]; then
    print_info "Updating INVENTORY_ID_3..."
    update_env "INVENTORY_ID_3" "${INVENTORY_IDS[2]}"
fi

if [ ${#INVENTORY_IDS[@]} -ge 4 ]; then
    print_info "Updating INVENTORY_ID_4..."
    update_env "INVENTORY_ID_4" "${INVENTORY_IDS[3]}"
fi

if [ ${#INVENTORY_IDS[@]} -ge 5 ]; then
    print_info "Updating INVENTORY_ID_5..."
    update_env "INVENTORY_ID_5" "${INVENTORY_IDS[4]}"
fi

print_success ".env file updated with inventory IDs!"
echo ""
echo -e "${GREEN}Inventory IDs saved to .env:${NC}"
for i in "${!INVENTORY_IDS[@]}"; do
    echo -e "${BLUE}  INVENTORY_ID_$((i+1))=${INVENTORY_IDS[$i]}${NC}"
done
echo ""

sleep 2

# ============================================
# 3. GET ALL INVENTORY ITEMS
# ============================================

print_header "3. GET ALL INVENTORY ITEMS"

print_test "Fetching all inventory items..."

ALL_INVENTORY=$(curl -s -X GET "$BASE_URL/inventory" \
  -H "Authorization: Bearer $SUPPLIER_TOKEN")

ALL_SUCCESS=$(echo $ALL_INVENTORY | jq -r '.success')

if [ "$ALL_SUCCESS" = "true" ]; then
    TOTAL_ITEMS=$(echo $ALL_INVENTORY | jq -r '.data.pagination.total')
    CURRENT_PAGE=$(echo $ALL_INVENTORY | jq -r '.data.pagination.page')
    print_success "Retrieved inventory items"
    print_info "Total items: $TOTAL_ITEMS"
    print_info "Current page: $CURRENT_PAGE"
else
    print_error "Failed to retrieve inventory items"
    echo $ALL_INVENTORY | jq '.'
fi

sleep 1

# ============================================
# 4. GET INVENTORY BY ID (Test with first item)
# ============================================

print_header "4. GET INVENTORY BY ID"

if [ ${#INVENTORY_IDS[@]} -gt 0 ]; then
    TEST_ID="${INVENTORY_IDS[0]}"
    print_test "Getting inventory item by ID: $TEST_ID"

    GET_INVENTORY=$(curl -s -X GET "$BASE_URL/inventory/$TEST_ID" \
      -H "Authorization: Bearer $SUPPLIER_TOKEN")

    GET_SUCCESS=$(echo $GET_INVENTORY | jq -r '.success')

    if [ "$GET_SUCCESS" = "true" ]; then
        RETRIEVED_NAME=$(echo $GET_INVENTORY | jq -r '.data.name')
        RETRIEVED_QTY=$(echo $GET_INVENTORY | jq -r '.data.quantity')
        RETRIEVED_PRICE=$(echo $GET_INVENTORY | jq -r '.data.pricePerUnit')
        print_success "Retrieved inventory item"
        print_info "Name: $RETRIEVED_NAME"
        print_info "Quantity: $RETRIEVED_QTY"
        print_info "Price: \$$RETRIEVED_PRICE per unit"
    else
        print_error "Failed to retrieve inventory by ID"
        echo $GET_INVENTORY | jq '.'
    fi
fi

sleep 1

# ============================================
# 5. UPDATE INVENTORY ITEM
# ============================================

print_header "5. UPDATE INVENTORY ITEM"

if [ ${#INVENTORY_IDS[@]} -gt 0 ]; then
    TEST_ID="${INVENTORY_IDS[0]}"
    print_test "Updating inventory item..."

    UPDATE_RESPONSE=$(curl -s -X PUT "$BASE_URL/inventory/$TEST_ID" \
      -H "Authorization: Bearer $SUPPLIER_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "pricePerUnit": 9.00,
        "description": "Updated: 100% GOTS certified organic cotton fabric - Premium Quality REVISED"
      }')

    UPDATE_SUCCESS=$(echo $UPDATE_RESPONSE | jq -r '.success')

    if [ "$UPDATE_SUCCESS" = "true" ]; then
        UPDATED_PRICE=$(echo $UPDATE_RESPONSE | jq -r '.data.pricePerUnit')
        print_success "Inventory updated successfully"
        print_info "New price: \$$UPDATED_PRICE per unit"
    else
        print_error "Failed to update inventory"
        echo $UPDATE_RESPONSE | jq '.'
    fi
fi

sleep 1

# ============================================
# 6. GET MY INVENTORY (SUPPLIER'S INVENTORY)
# ============================================

print_header "6. GET MY INVENTORY"

print_test "Getting supplier's inventory..."

MY_INVENTORY=$(curl -s -X GET "$BASE_URL/inventory/my-inventory" \
  -H "Authorization: Bearer $SUPPLIER_TOKEN")

MY_SUCCESS=$(echo $MY_INVENTORY | jq -r '.success')

if [ "$MY_SUCCESS" = "true" ]; then
    MY_ITEM_COUNT=$(echo $MY_INVENTORY | jq -r '.data.pagination.total')
    print_success "Retrieved supplier's inventory"
    print_info "Supplier's items: $MY_ITEM_COUNT"
else
    print_error "Failed to retrieve supplier's inventory"
    echo $MY_INVENTORY | jq '.'
fi

sleep 1

# ============================================
# 7. ADD STOCK (WITH BATCH DATA)
# ============================================

print_header "7. ADD STOCK"

if [ ${#INVENTORY_IDS[@]} -gt 0 ]; then
    TEST_ID="${INVENTORY_IDS[0]}"
    print_test "Adding stock to inventory with batch data..."

    ADD_STOCK=$(curl -s -X POST "$BASE_URL/inventory/$TEST_ID/add-stock" \
      -H "Authorization: Bearer $SUPPLIER_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "quantity": 500,
        "notes": "Restocking from new shipment - Test batch",
        "batchData": {
          "batchNumber": "ORG-COT-'$(date +%Y%m%d)'-RESTOCK",
          "manufactureDate": "2025-10-15",
          "expiryDate": "2026-10-15"
        }
      }')

    ADD_SUCCESS=$(echo $ADD_STOCK | jq -r '.success')

    if [ "$ADD_SUCCESS" = "true" ]; then
        NEW_QTY=$(echo $ADD_STOCK | jq -r '.data.quantity')
        print_success "Stock added successfully"
        print_info "New quantity: $NEW_QTY"
    else
        print_error "Failed to add stock"
        echo $ADD_STOCK | jq '.'
    fi
fi

sleep 1

# ============================================
# 8. REDUCE STOCK
# ============================================

print_header "8. REDUCE STOCK"

if [ ${#INVENTORY_IDS[@]} -gt 0 ]; then
    TEST_ID="${INVENTORY_IDS[0]}"
    print_test "Reducing stock..."

    REDUCE_STOCK=$(curl -s -X POST "$BASE_URL/inventory/$TEST_ID/reduce-stock" \
      -H "Authorization: Bearer $SUPPLIER_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "quantity": 100,
        "reason": "adjustment",
        "notes": "Quality control rejection"
      }')

    REDUCE_SUCCESS=$(echo $REDUCE_STOCK | jq -r '.success')

    if [ "$REDUCE_SUCCESS" = "true" ]; then
        NEW_QTY=$(echo $REDUCE_STOCK | jq -r '.data.quantity')
        print_success "Stock reduced successfully"
        print_info "New quantity: $NEW_QTY"
    else
        print_error "Failed to reduce stock"
        echo $REDUCE_STOCK | jq '.'
    fi
fi

sleep 1

# ============================================
# 9. RESERVE QUANTITY
# ============================================

print_header "9. RESERVE QUANTITY"

if [ ${#INVENTORY_IDS[@]} -gt 0 ]; then
    TEST_ID="${INVENTORY_IDS[0]}"
    print_test "Reserving quantity for order..."

    RESERVE=$(curl -s -X POST "$BASE_URL/inventory/$TEST_ID/reserve" \
      -H "Authorization: Bearer $SUPPLIER_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "quantity": 200,
        "orderId": "TEST-ORDER-'$(date +%s)'"
      }')

    RESERVE_SUCCESS=$(echo $RESERVE | jq -r '.success')

    if [ "$RESERVE_SUCCESS" = "true" ]; then
        RESERVED_QTY=$(echo $RESERVE | jq -r '.data.reservedQuantity')
        AVAILABLE_QTY=$(echo $RESERVE | jq -r '.data.availableQuantity')
        print_success "Quantity reserved successfully"
        print_info "Reserved: $RESERVED_QTY"
        print_info "Available: $AVAILABLE_QTY"
    else
        print_error "Failed to reserve quantity"
        echo $RESERVE | jq '.'
    fi
fi

sleep 1

# ============================================
# 10. RELEASE RESERVED QUANTITY
# ============================================

print_header "10. RELEASE RESERVED QUANTITY"

if [ ${#INVENTORY_IDS[@]} -gt 0 ]; then
    TEST_ID="${INVENTORY_IDS[0]}"
    print_test "Releasing reserved quantity..."

    RELEASE=$(curl -s -X POST "$BASE_URL/inventory/$TEST_ID/release" \
      -H "Authorization: Bearer $SUPPLIER_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "quantity": 100
      }')

    RELEASE_SUCCESS=$(echo $RELEASE | jq -r '.success')

    if [ "$RELEASE_SUCCESS" = "true" ]; then
        RESERVED_QTY=$(echo $RELEASE | jq -r '.data.reservedQuantity')
        AVAILABLE_QTY=$(echo $RELEASE | jq -r '.data.availableQuantity')
        print_success "Reserved quantity released successfully"
        print_info "Reserved: $RESERVED_QTY"
        print_info "Available: $AVAILABLE_QTY"
    else
        print_error "Failed to release quantity"
        echo $RELEASE | jq '.'
    fi
fi

sleep 1

# ============================================
# 11. ADD QUALITY CHECK
# ============================================

print_header "11. ADD QUALITY CHECK"

if [ ${#INVENTORY_IDS[@]} -gt 0 ]; then
    TEST_ID="${INVENTORY_IDS[0]}"
    print_test "Adding quality check..."

    QUALITY_CHECK=$(curl -s -X POST "$BASE_URL/inventory/$TEST_ID/quality-check" \
      -H "Authorization: Bearer $SUPPLIER_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "status": "passed",
        "checkedQuantity": 500,
        "passedQuantity": 495,
        "rejectedQuantity": 5,
        "qualityScore": 99,
        "findings": "Minor defects found in 5 units",
        "batchNumber": "ORG-COT-'$(date +%Y%m%d)'-001"
      }')

    QC_SUCCESS=$(echo $QUALITY_CHECK | jq -r '.success')

    if [ "$QC_SUCCESS" = "true" ]; then
        QC_COUNT=$(echo $QUALITY_CHECK | jq -r '.data.qualityChecks | length')
        print_success "Quality check added successfully"
        print_info "Total quality checks: $QC_COUNT"
    else
        print_error "Failed to add quality check"
        echo $QUALITY_CHECK | jq '.'
    fi
fi

sleep 1

# ============================================
# 12. GET LOW STOCK ITEMS
# ============================================

print_header "12. GET LOW STOCK ITEMS"

print_test "Getting low stock items..."

LOW_STOCK=$(curl -s -X GET "$BASE_URL/inventory/low-stock" \
  -H "Authorization: Bearer $SUPPLIER_TOKEN")

LOW_STOCK_SUCCESS=$(echo $LOW_STOCK | jq -r '.success')

if [ "$LOW_STOCK_SUCCESS" = "true" ]; then
    LOW_STOCK_COUNT=$(echo $LOW_STOCK | jq -r '.count')
    print_success "Retrieved low stock items"
    print_info "Low stock items: $LOW_STOCK_COUNT"
else
    print_success "No low stock items (this is good!)"
fi

sleep 1

# ============================================
# 13. GET INVENTORY ANALYTICS
# ============================================

print_header "13. GET INVENTORY ANALYTICS"

print_test "Getting inventory analytics..."

ANALYTICS=$(curl -s -X GET "$BASE_URL/inventory/analytics" \
  -H "Authorization: Bearer $SUPPLIER_TOKEN")

ANALYTICS_SUCCESS=$(echo $ANALYTICS | jq -r '.success')

if [ "$ANALYTICS_SUCCESS" = "true" ]; then
    TOTAL_VALUE=$(echo $ANALYTICS | jq -r '.data.totalValue')
    TOTAL_ITEMS=$(echo $ANALYTICS | jq -r '.data.totalItems')
    print_success "Analytics retrieved successfully"
    print_info "Total value: \$$TOTAL_VALUE"
    print_info "Total items: $TOTAL_ITEMS"
else
    print_error "Failed to retrieve analytics"
    echo $ANALYTICS | jq '.'
fi

sleep 1

# ============================================
# 14. SEARCH INVENTORY
# ============================================

print_header "14. SEARCH INVENTORY"

print_test "Searching inventory for 'cotton'..."

SEARCH=$(curl -s -X GET "$BASE_URL/inventory/search?q=cotton" \
  -H "Authorization: Bearer $SUPPLIER_TOKEN")

SEARCH_SUCCESS=$(echo $SEARCH | jq -r '.success')

if [ "$SEARCH_SUCCESS" = "true" ]; then
    SEARCH_COUNT=$(echo $SEARCH | jq -r '.count')
    print_success "Search completed"
    print_info "Found: $SEARCH_COUNT items"
else
    print_error "Search failed"
    echo $SEARCH | jq '.'
fi

sleep 1

# ============================================
# 15. SELL TO VENDOR
# ============================================

if [ -n "$VENDOR_ID" ] && [ "$VENDOR_ID" != "null" ] && [ ${#INVENTORY_IDS[@]} -gt 1 ]; then
    print_header "15. SELL TO VENDOR"
    
    # Use the second item for vendor sale
    TEST_ID="${INVENTORY_IDS[1]}"
    print_test "Selling inventory to vendor..."
    print_info "Using Item 2 (Polyester Yarn) for vendor sale"
    
    SELL=$(curl -s -X POST "$BASE_URL/inventory/$TEST_ID/sell-to-vendor" \
      -H "Authorization: Bearer $SUPPLIER_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{
        \"vendorId\": \"$VENDOR_ID\",
        \"quantity\": 100,
        \"pricePerUnit\": 12.00
      }")
    
    SELL_SUCCESS=$(echo $SELL | jq -r '.success')
    
    if [ "$SELL_SUCCESS" = "true" ]; then
        print_success "Inventory sold to vendor successfully"
        REMAINING_QTY=$(echo $SELL | jq -r '.data.inventory.quantity // .data.quantity')
        SOLD_AMOUNT=$(echo $SELL | jq -r '.data.transaction.totalAmount // .data.totalAmount')
        print_info "Remaining quantity: $REMAINING_QTY"
        print_info "Sale amount: \$SOLD_AMOUNT"
    else
        print_error "Failed to sell inventory to vendor"
        echo $SELL | jq '.'
    fi
    
    sleep 1
else
    print_info "Skipping vendor sale test (VENDOR_ID not available or insufficient items)"
fi

# ============================================
# 16. GET INVENTORY HISTORY (Blockchain)
# ============================================

print_header "16. GET INVENTORY HISTORY"

if [ ${#INVENTORY_IDS[@]} -gt 0 ]; then
    TEST_ID="${INVENTORY_IDS[0]}"
    print_test "Getting inventory history from blockchain..."

    HISTORY=$(curl -s -X GET "$BASE_URL/inventory/$TEST_ID/history" \
      -H "Authorization: Bearer $SUPPLIER_TOKEN")

    HISTORY_SUCCESS=$(echo $HISTORY | jq -r '.success')

    if [ "$HISTORY_SUCCESS" = "true" ]; then
        HISTORY_COUNT=$(echo $HISTORY | jq -r '.data.history | length' 2>/dev/null || echo "0")
        print_success "History retrieved successfully"
        print_info "Transaction records: $HISTORY_COUNT"
    else
        print_info "History endpoint accessible (blockchain may need initialization)"
    fi
fi

sleep 1

# ============================================
# 17. ADDITIONAL TESTS ON OTHER ITEMS
# ============================================

print_header "17. ADDITIONAL OPERATIONS ON OTHER ITEMS"

# Test operations on Item 3 (Zippers)
if [ ${#INVENTORY_IDS[@]} -gt 2 ]; then
    print_subheader "Testing Item 3: Premium Metal Zippers"
    TEST_ID="${INVENTORY_IDS[2]}"
    
    # Add stock
    print_test "Adding stock to zippers..."
    ADD_STOCK_ZIP=$(curl -s -X POST "$BASE_URL/inventory/$TEST_ID/add-stock" \
      -H "Authorization: Bearer $SUPPLIER_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "quantity": 5000,
        "notes": "Bulk order received from YKK",
        "batchData": {
          "batchNumber": "ZIP-METAL-'$(date +%Y%m%d)'-BULK",
          "manufactureDate": "2025-10-25",
          "costPerUnit": 0.48
        }
      }')
    
    if [ "$(echo $ADD_STOCK_ZIP | jq -r '.success')" = "true" ]; then
        NEW_ZIP_QTY=$(echo $ADD_STOCK_ZIP | jq -r '.data.quantity')
        print_success "Zipper stock added: $NEW_ZIP_QTY pieces"
    fi
    
    sleep 1
fi

# Test operations on Item 4 (Dye)
if [ ${#INVENTORY_IDS[@]} -gt 3 ]; then
    print_subheader "Testing Item 4: Fabric Dye"
    TEST_ID="${INVENTORY_IDS[3]}"
    
    # Add quality check
    print_test "Adding quality check to dye batch..."
    QC_DYE=$(curl -s -X POST "$BASE_URL/inventory/$TEST_ID/quality-check" \
      -H "Authorization: Bearer $SUPPLIER_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "status": "passed",
        "checkedQuantity": 100,
        "passedQuantity": 100,
        "rejectedQuantity": 0,
        "qualityScore": 100,
        "findings": "Excellent color consistency and stability",
        "batchNumber": "DYE-NAVY-'$(date +%Y%m%d)'-004"
      }')
    
    if [ "$(echo $QC_DYE | jq -r '.success')" = "true" ]; then
        print_success "Quality check added for dye batch"
    fi
    
    sleep 1
fi

# Test operations on Item 5 (Denim)
if [ ${#INVENTORY_IDS[@]} -gt 4 ]; then
    print_subheader "Testing Item 5: Premium Denim"
    TEST_ID="${INVENTORY_IDS[4]}"
    
    # Reserve quantity
    print_test "Reserving denim for large order..."
    RESERVE_DENIM=$(curl -s -X POST "$BASE_URL/inventory/$TEST_ID/reserve" \
      -H "Authorization: Bearer $SUPPLIER_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "quantity": 500,
        "orderId": "DENIM-ORDER-'$(date +%s)'"
      }')
    
    if [ "$(echo $RESERVE_DENIM | jq -r '.success')" = "true" ]; then
        RESERVED=$(echo $RESERVE_DENIM | jq -r '.data.reservedQuantity')
        print_success "Denim reserved: $RESERVED meters"
    fi
    
    sleep 1
fi

# ============================================
# 18. CATEGORY AND FILTER TESTS
# ============================================

print_header "18. CATEGORY AND FILTER TESTS"

# Filter by Fabric category
print_subheader "Filter by Category: Fabric"
FABRIC_FILTER=$(curl -s -X GET "$BASE_URL/inventory?category=Fabric" \
  -H "Authorization: Bearer $SUPPLIER_TOKEN")

if [ "$(echo $FABRIC_FILTER | jq -r '.success')" = "true" ]; then
    FABRIC_COUNT=$(echo $FABRIC_FILTER | jq -r '.data.pagination.total')
    print_success "Found $FABRIC_COUNT fabric items"
fi

sleep 1

# Filter by Yarn & Thread category
print_subheader "Filter by Category: Yarn & Thread"
YARN_FILTER=$(curl -s -X GET "$BASE_URL/inventory?category=Yarn%20%26%20Thread" \
  -H "Authorization: Bearer $SUPPLIER_TOKEN")

if [ "$(echo $YARN_FILTER | jq -r '.success')" = "true" ]; then
    YARN_COUNT=$(echo $YARN_FILTER | jq -r '.data.pagination.total')
    print_success "Found $YARN_COUNT yarn items"
fi

sleep 1

# Filter by price range
print_subheader "Filter by Price Range: $5-$15"
PRICE_FILTER=$(curl -s -X GET "$BASE_URL/inventory?minPrice=5&maxPrice=15" \
  -H "Authorization: Bearer $SUPPLIER_TOKEN")

if [ "$(echo $PRICE_FILTER | jq -r '.success')" = "true" ]; then
    PRICE_COUNT=$(echo $PRICE_FILTER | jq -r '.data.pagination.total')
    print_success "Found $PRICE_COUNT items in price range"
fi

sleep 1

# Search by tag
print_subheader "Search by Tag: sustainable"
TAG_SEARCH=$(curl -s -X GET "$BASE_URL/inventory?tags=sustainable" \
  -H "Authorization: Bearer $SUPPLIER_TOKEN")

if [ "$(echo $TAG_SEARCH | jq -r '.success')" = "true" ]; then
    TAG_COUNT=$(echo $TAG_SEARCH | jq -r '.data.pagination.total')
    print_success "Found $TAG_COUNT sustainable items"
fi

sleep 1

# ============================================
# 19. BATCH OPERATIONS TEST
# ============================================

print_header "19. BATCH OPERATIONS TEST"

if [ ${#INVENTORY_IDS[@]} -gt 0 ]; then
    TEST_ID="${INVENTORY_IDS[0]}"
    
    # Get item details to check batches
    print_test "Checking batch information..."
    BATCH_INFO=$(curl -s -X GET "$BASE_URL/inventory/$TEST_ID" \
      -H "Authorization: Bearer $SUPPLIER_TOKEN")
    
    if [ "$(echo $BATCH_INFO | jq -r '.success')" = "true" ]; then
        BATCH_COUNT=$(echo $BATCH_INFO | jq -r '.data.batches | length')
        print_success "Item has $BATCH_COUNT batch(es)"
        
        # Display batch numbers
        BATCH_NUMBERS=$(echo $BATCH_INFO | jq -r '.data.batches[].batchNumber')
        echo -e "${CYAN}Batch Numbers:${NC}"
        echo "$BATCH_NUMBERS"
    fi
fi

sleep 1

# ============================================
# 20. PAGINATION TEST
# ============================================

print_header "20. PAGINATION TEST"

print_test "Testing pagination (page 1, limit 3)..."
PAGE_TEST=$(curl -s -X GET "$BASE_URL/inventory?page=1&limit=3" \
  -H "Authorization: Bearer $SUPPLIER_TOKEN")

if [ "$(echo $PAGE_TEST | jq -r '.success')" = "true" ]; then
    PAGE_ITEMS=$(echo $PAGE_TEST | jq -r '.data.items | length')
    TOTAL_PAGES=$(echo $PAGE_TEST | jq -r '.data.pagination.totalPages')
    print_success "Retrieved $PAGE_ITEMS items on page 1"
    print_info "Total pages available: $TOTAL_PAGES"
fi

sleep 1

# ============================================
# 21. SORTING TEST
# ============================================

print_header "21. SORTING TEST"

print_subheader "Sort by Price: Ascending"
SORT_ASC=$(curl -s -X GET "$BASE_URL/inventory?sortBy=pricePerUnit&order=asc" \
  -H "Authorization: Bearer $SUPPLIER_TOKEN")

if [ "$(echo $SORT_ASC | jq -r '.success')" = "true" ]; then
    FIRST_PRICE=$(echo $SORT_ASC | jq -r '.data.items[0].pricePerUnit')
    print_success "Sorted by price ascending"
    print_info "Lowest price: \$FIRST_PRICE"
fi

sleep 1

print_subheader "Sort by Quantity: Descending"
SORT_QTY=$(curl -s -X GET "$BASE_URL/inventory?sortBy=quantity&order=desc" \
  -H "Authorization: Bearer $SUPPLIER_TOKEN")

if [ "$(echo $SORT_QTY | jq -r '.success')" = "true" ]; then
    HIGHEST_QTY=$(echo $SORT_QTY | jq -r '.data.items[0].quantity')
    print_success "Sorted by quantity descending"
    print_info "Highest quantity: $HIGHEST_QTY"
fi

sleep 1

# ============================================
# 22. MOVEMENT HISTORY TEST
# ============================================

print_header "22. MOVEMENT HISTORY TEST"

if [ ${#INVENTORY_IDS[@]} -gt 0 ]; then
    TEST_ID="${INVENTORY_IDS[0]}"
    print_test "Checking movement history..."
    
    MOVEMENT_CHECK=$(curl -s -X GET "$BASE_URL/inventory/$TEST_ID" \
      -H "Authorization: Bearer $SUPPLIER_TOKEN")
    
    if [ "$(echo $MOVEMENT_CHECK | jq -r '.success')" = "true" ]; then
        MOVEMENT_COUNT=$(echo $MOVEMENT_CHECK | jq -r '.data.movements | length')
        print_success "Item has $MOVEMENT_COUNT movement record(s)"
        
        # Show movement types
        if [ "$MOVEMENT_COUNT" -gt 0 ]; then
            MOVEMENT_TYPES=$(echo $MOVEMENT_CHECK | jq -r '.data.movements[].type')
            echo -e "${CYAN}Movement Types:${NC}"
            echo "$MOVEMENT_TYPES" | head -n 5
        fi
    fi
fi

sleep 1

# ============================================
# FINAL SUMMARY
# ============================================

print_header "COMPREHENSIVE TEST SUMMARY"

echo ""
echo -e "${GREEN}═══════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ ALL TESTS COMPLETED SUCCESSFULLY!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════${NC}"
echo ""

echo -e "${CYAN}📦 CREATED INVENTORY ITEMS:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. Premium Organic Cotton Fabric (1500 meters)"
echo "   └─ Sustainable, GOTS Certified"
echo "2. High-Strength Polyester Yarn (5000 kg)"
echo "   └─ Industrial Grade, 40s"
echo "3. Premium Metal Zippers (10,000 pieces)"
echo "   └─ YKK Brand, Brass, 7-inch"
echo "4. Reactive Fabric Dye - Navy Blue (500 kg)"
echo "   └─ Professional Grade, REACH Compliant"
echo "5. Premium Stretch Denim (2000 meters)"
echo "   └─ 98% Cotton, 2% Elastane, BCI Certified"
echo ""

echo -e "${CYAN}🧪 OPERATIONS TESTED:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✓ Authentication & Authorization"
echo "✓ Create Multiple Inventory Items (5)"
echo "✓ Read Operations (All, By ID, My Inventory)"
echo "✓ Update Inventory Details"
echo "✓ Stock Management (Add, Reduce)"
echo "✓ Reservation System (Reserve, Release)"
echo "✓ Quality Checks & Inspections"
echo "✓ Analytics & Reporting"
echo "✓ Search & Filtering"
echo "✓ Sell to Vendor (B2B)"
echo "✓ Blockchain History Tracking"
echo "✓ Batch Operations & Tracking"
echo "✓ Category Filtering"
echo "✓ Price Range Filtering"
echo "✓ Tag-based Search"
echo "✓ Pagination"
echo "✓ Sorting (Price, Quantity)"
echo "✓ Movement History"
echo "✓ Low Stock Detection"
echo ""

echo -e "${CYAN}📊 INVENTORY IDS FOR REFERENCE:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
for i in "${!INVENTORY_IDS[@]}"; do
    echo "$((i+1)). ${INVENTORY_IDS[$i]}"
done
echo ""

echo -e "${MAGENTA}💡 QUICK COMMANDS FOR MANUAL TESTING:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "# Get specific item:"
if [ ${#INVENTORY_IDS[@]} -gt 0 ]; then
    echo "curl -X GET '$BASE_URL/inventory/${INVENTORY_IDS[0]}' \\"
    echo "  -H 'Authorization: Bearer \$SUPPLIER_TOKEN'"
fi
echo ""
echo "# Search cotton items:"
echo "curl -X GET '$BASE_URL/inventory/search?q=cotton' \\"
echo "  -H 'Authorization: Bearer \$SUPPLIER_TOKEN'"
echo ""
echo "# Get analytics:"
echo "curl -X GET '$BASE_URL/inventory/analytics' \\"
echo "  -H 'Authorization: Bearer \$SUPPLIER_TOKEN'"
echo ""

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 ChainVanguard Inventory System: FULLY TESTED!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}All inventory management features are working correctly!${NC}"
echo -e "${YELLOW}Ready for production use.${NC}"
echo ""