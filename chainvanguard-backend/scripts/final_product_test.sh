#!/bin/bash

# ============================================
# ChainVanguard - VALIDATED Product Catalog
# 50 products - NO validation errors
# ============================================

set -e

ENV_PATH="/Users/saratariq/Desktop/chainvanguard-nextjs/chainvanguard-backend/api/.env"

if [ -f "$ENV_PATH" ]; then
    source "$ENV_PATH"
else
    echo "❌ .env file not found"
    exit 1
fi

BASE_URL="${TEST_BASE_URL:-http://localhost:3001}"

GREEN='\033[0;32m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

if [ -z "$VENDOR_TOKEN" ]; then
    echo -e "${RED}❌ VENDOR_TOKEN not found${NC}"
    exit 1
fi

TOTAL=0
SUCCESS=0
FAILED=0

create_product() {
    TOTAL=$((TOTAL + 1))
    
    local response=$(curl -s -X POST ${BASE_URL}/api/products \
      -H "Authorization: Bearer $VENDOR_TOKEN" \
      -H "Content-Type: application/json" \
      -d "$1")
    
    if echo "$response" | jq -e '.success == true' > /dev/null 2>&1; then
        SUCCESS=$((SUCCESS + 1))
        local name=$(echo "$1" | jq -r '.name')
        echo -e "${GREEN}✓${NC} $TOTAL/50 | $name"
    else
        FAILED=$((FAILED + 1))
        local error=$(echo "$response" | jq -r '.message // "Error"')
        local name=$(echo "$1" | jq -r '.name')
        echo -e "${RED}✗${NC} $TOTAL/50 | $name - $error"
    fi
    sleep 0.5
}

echo "=========================================="
echo "🚀 Creating Product Catalog"
echo "=========================================="

# MEN - 13 products
echo -e "\n${CYAN}MEN (13)${NC}"

# 1. Men > T-Shirts
create_product '{
  "name": "Premium Organic Cotton T-Shirt",
  "description": "Premium organic cotton crew neck t-shirt. Soft, breathable, and sustainable.",
  "category": "Men",
  "subcategory": "T-Shirts",
  "productType": "Casual",
  "brand": "ChainVanguard",
  "apparelDetails": {
    "size": "M",
    "fit": "Regular Fit",
    "color": "Navy Blue",
    "pattern": "Solid",
    "material": "100% Organic Cotton",
    "fabricType": "Cotton",
    "fabricWeight": "180 GSM",
    "neckline": "Crew Neck",
    "sleeveLength": "Short Sleeve",
    "careInstructions": "Machine wash cold, tumble dry low"
  },
  "price": 1499,
  "costPrice": 899,
  "quantity": 200,
  "minStockLevel": 30,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Textiles",
  "season": "All Season",
  "tags": ["cotton", "organic", "tshirt"],
  "isFeatured": true,
  "isSustainable": true,
  "freeShipping": true
}'

# 2. Men > Shirts
create_product '{
  "name": "Classic Oxford Formal Shirt",
  "description": "Professional oxford weave formal shirt in premium cotton.",
  "category": "Men",
  "subcategory": "Shirts",
  "productType": "Formal",
  "brand": "ChainVanguard",
  "apparelDetails": {
    "size": "L",
    "fit": "Slim Fit",
    "color": "White",
    "pattern": "Solid",
    "material": "100% Cotton",
    "fabricType": "Cotton",
    "fabricWeight": "140 GSM",
    "neckline": "Collar",
    "sleeveLength": "Long Sleeve",
    "careInstructions": "Machine wash warm, iron medium"
  },
  "price": 2999,
  "costPrice": 1799,
  "quantity": 150,
  "minStockLevel": 25,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Textiles",
  "season": "All Season",
  "tags": ["formal", "shirt", "cotton"],
  "isFeatured": true,
  "freeShipping": true
}'

# 3. Men > Hoodies
create_product '{
  "name": "Fleece Pullover Hoodie",
  "description": "Comfortable fleece hoodie with kangaroo pocket.",
  "category": "Men",
  "subcategory": "Hoodies",
  "productType": "Casual",
  "brand": "ChainVanguard",
  "apparelDetails": {
    "size": "M",
    "fit": "Regular Fit",
    "color": "Grey",
    "pattern": "Solid",
    "material": "80% Cotton 20% Polyester",
    "fabricType": "Fleece",
    "fabricWeight": "320 GSM",
    "neckline": "Crew Neck",
    "sleeveLength": "Long Sleeve",
    "careInstructions": "Machine wash cold, tumble dry low"
  },
  "price": 3499,
  "costPrice": 2099,
  "quantity": 180,
  "minStockLevel": 30,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Textiles",
  "season": "Autumn",
  "tags": ["hoodie", "fleece", "casual"],
  "freeShipping": true
}'

# 4. Men > Sweaters
create_product '{
  "name": "Merino Wool V-Neck Sweater",
  "description": "Luxurious merino wool sweater with classic v-neck.",
  "category": "Men",
  "subcategory": "Sweaters",
  "productType": "Casual",
  "brand": "ChainVanguard",
  "apparelDetails": {
    "size": "L",
    "fit": "Regular Fit",
    "color": "Charcoal Grey",
    "pattern": "Solid",
    "material": "100% Merino Wool",
    "fabricType": "Wool",
    "fabricWeight": "280 GSM",
    "neckline": "V-Neck",
    "sleeveLength": "Long Sleeve",
    "careInstructions": "Hand wash cold or dry clean"
  },
  "price": 5999,
  "costPrice": 3599,
  "quantity": 100,
  "minStockLevel": 15,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Textiles",
  "season": "Winter",
  "tags": ["sweater", "wool", "merino"],
  "isFeatured": true,
  "freeShipping": true
}'

# 5. Men > Jackets
create_product '{
  "name": "Classic Denim Trucker Jacket",
  "description": "Iconic denim jacket with authentic indigo wash.",
  "category": "Men",
  "subcategory": "Jackets",
  "productType": "Casual",
  "brand": "ChainVanguard",
  "apparelDetails": {
    "size": "M",
    "fit": "Regular Fit",
    "color": "Dark Indigo",
    "pattern": "Solid",
    "material": "100% Cotton Denim",
    "fabricType": "Denim",
    "fabricWeight": "380 GSM",
    "neckline": "Collar",
    "sleeveLength": "Long Sleeve",
    "careInstructions": "Machine wash cold separately"
  },
  "price": 5499,
  "costPrice": 3299,
  "quantity": 120,
  "minStockLevel": 20,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Textiles",
  "season": "Spring",
  "tags": ["jacket", "denim", "trucker"],
  "isFeatured": true,
  "freeShipping": true
}'

# 6. Men > Coats
create_product '{
  "name": "Wool Blend Overcoat",
  "description": "Premium wool blend overcoat for cold weather.",
  "category": "Men",
  "subcategory": "Coats",
  "productType": "Formal",
  "brand": "ChainVanguard",
  "apparelDetails": {
    "size": "L",
    "fit": "Regular Fit",
    "color": "Charcoal",
    "pattern": "Solid",
    "material": "70% Wool 30% Polyester",
    "fabricType": "Wool",
    "fabricWeight": "450 GSM",
    "neckline": "Collar",
    "sleeveLength": "Long Sleeve",
    "careInstructions": "Dry clean only"
  },
  "price": 15999,
  "costPrice": 9599,
  "quantity": 60,
  "minStockLevel": 10,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Textiles",
  "season": "Winter",
  "tags": ["coat", "wool", "formal"],
  "isFeatured": true,
  "freeShipping": true
}'

# 7. Men > Jeans
create_product '{
  "name": "Slim Fit Stretch Denim Jeans",
  "description": "Comfortable stretch denim in slim fit.",
  "category": "Men",
  "subcategory": "Jeans",
  "productType": "Casual",
  "brand": "ChainVanguard",
  "apparelDetails": {
    "size": "M",
    "fit": "Slim Fit",
    "color": "Dark Blue",
    "pattern": "Solid",
    "material": "98% Cotton 2% Elastane",
    "fabricType": "Denim",
    "fabricWeight": "340 GSM",
    "neckline": "Crew Neck",
    "sleeveLength": "Short Sleeve",
    "careInstructions": "Machine wash cold inside out"
  },
  "price": 4299,
  "costPrice": 2579,
  "quantity": 150,
  "minStockLevel": 25,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Textiles",
  "season": "All Season",
  "tags": ["jeans", "denim", "slim-fit"],
  "freeShipping": true
}'

# 8. Men > Trousers
create_product '{
  "name": "Tailored Dress Trousers",
  "description": "Professional dress trousers with wrinkle resistance.",
  "category": "Men",
  "subcategory": "Trousers",
  "productType": "Formal",
  "brand": "ChainVanguard",
  "apparelDetails": {
    "size": "M",
    "fit": "Slim Fit",
    "color": "Navy",
    "pattern": "Solid",
    "material": "65% Polyester 35% Cotton",
    "fabricType": "Polyester",
    "fabricWeight": "240 GSM",
    "neckline": "Crew Neck",
    "sleeveLength": "Short Sleeve",
    "careInstructions": "Machine wash warm"
  },
  "price": 3799,
  "costPrice": 2279,
  "quantity": 140,
  "minStockLevel": 20,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Textiles",
  "season": "All Season",
  "tags": ["trousers", "formal", "business"],
  "isFeatured": true,
  "freeShipping": true
}'

# 9. Men > Shorts
create_product '{
  "name": "Athletic Performance Shorts",
  "description": "Moisture-wicking athletic shorts for sports.",
  "category": "Men",
  "subcategory": "Shorts",
  "productType": "Sports",
  "brand": "ChainVanguard",
  "apparelDetails": {
    "size": "M",
    "fit": "Regular Fit",
    "color": "Black",
    "pattern": "Solid",
    "material": "100% Polyester",
    "fabricType": "Polyester",
    "fabricWeight": "150 GSM",
    "neckline": "Crew Neck",
    "sleeveLength": "Short Sleeve",
    "careInstructions": "Machine wash cold"
  },
  "price": 2199,
  "costPrice": 1319,
  "quantity": 160,
  "minStockLevel": 25,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Textiles",
  "season": "Summer",
  "tags": ["shorts", "athletic", "sports"],
  "freeShipping": true
}'

# 10. Men > Suits
create_product '{
  "name": "Two-Piece Business Suit",
  "description": "Professional wool blend business suit.",
  "category": "Men",
  "subcategory": "Suits",
  "productType": "Formal",
  "brand": "ChainVanguard",
  "apparelDetails": {
    "size": "M",
    "fit": "Slim Fit",
    "color": "Charcoal Grey",
    "pattern": "Solid",
    "material": "65% Wool 35% Polyester",
    "fabricType": "Wool",
    "fabricWeight": "320 GSM",
    "neckline": "Collar",
    "sleeveLength": "Long Sleeve",
    "careInstructions": "Dry clean only"
  },
  "price": 18999,
  "costPrice": 11399,
  "quantity": 50,
  "minStockLevel": 8,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Textiles",
  "season": "All Season",
  "tags": ["suit", "formal", "business"],
  "isFeatured": true,
  "freeShipping": true
}'

# 11. Men > Activewear
create_product '{
  "name": "Performance Training Set",
  "description": "Complete athletic training set with moisture-wicking fabric.",
  "category": "Men",
  "subcategory": "Activewear",
  "productType": "Sports",
  "brand": "ChainVanguard",
  "apparelDetails": {
    "size": "M",
    "fit": "Athletic Fit",
    "color": "Navy Grey",
    "pattern": "Solid",
    "material": "88% Polyester 12% Spandex",
    "fabricType": "Polyester",
    "fabricWeight": "180 GSM",
    "neckline": "Crew Neck",
    "sleeveLength": "Short Sleeve",
    "careInstructions": "Machine wash cold"
  },
  "price": 3999,
  "costPrice": 2399,
  "quantity": 130,
  "minStockLevel": 20,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Textiles",
  "season": "All Season",
  "tags": ["activewear", "sports", "training"],
  "freeShipping": true
}'

# 12. Men > Sleepwear
create_product '{
  "name": "Cotton Pajama Set",
  "description": "Comfortable cotton pajama set for sleep.",
  "category": "Men",
  "subcategory": "Sleepwear",
  "productType": "Casual",
  "brand": "ChainVanguard",
  "apparelDetails": {
    "size": "L",
    "fit": "Loose Fit",
    "color": "Navy Stripe",
    "pattern": "Striped",
    "material": "100% Cotton",
    "fabricType": "Cotton",
    "fabricWeight": "160 GSM",
    "neckline": "Collar",
    "sleeveLength": "Long Sleeve",
    "careInstructions": "Machine wash warm"
  },
  "price": 3299,
  "costPrice": 1979,
  "quantity": 110,
  "minStockLevel": 18,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Textiles",
  "season": "All Season",
  "tags": ["pajamas", "sleepwear", "cotton"],
  "freeShipping": true
}'

# 13. Men > Underwear
create_product '{
  "name": "Cotton Boxer Briefs 3-Pack",
  "description": "Premium cotton boxer briefs pack.",
  "category": "Men",
  "subcategory": "Underwear",
  "productType": "Casual",
  "brand": "ChainVanguard",
  "apparelDetails": {
    "size": "M",
    "fit": "Regular Fit",
    "color": "Assorted",
    "pattern": "Solid",
    "material": "95% Cotton 5% Elastane",
    "fabricType": "Cotton",
    "fabricWeight": "200 GSM",
    "neckline": "Crew Neck",
    "sleeveLength": "Short Sleeve",
    "careInstructions": "Machine wash warm"
  },
  "price": 1799,
  "costPrice": 1079,
  "quantity": 250,
  "minStockLevel": 40,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Textiles",
  "season": "All Season",
  "tags": ["underwear", "boxer-briefs", "cotton"],
  "freeShipping": true
}'

# WOMEN - 18 products
echo -e "\n${CYAN}WOMEN (18)${NC}"

# 14. Women > T-Shirts
create_product '{
  "name": "Soft Cotton V-Neck Tee",
  "description": "Feminine v-neck tee in soft cotton.",
  "category": "Women",
  "subcategory": "T-Shirts",
  "productType": "Casual",
  "brand": "ChainVanguard",
  "apparelDetails": {
    "size": "M",
    "fit": "Regular Fit",
    "color": "Dusty Rose",
    "pattern": "Solid",
    "material": "100% Cotton",
    "fabricType": "Jersey",
    "fabricWeight": "160 GSM",
    "neckline": "V-Neck",
    "sleeveLength": "Short Sleeve",
    "careInstructions": "Machine wash cold"
  },
  "price": 1399,
  "costPrice": 839,
  "quantity": 200,
  "minStockLevel": 30,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Textiles",
  "season": "All Season",
  "tags": ["tshirt", "cotton", "vneck"],
  "isFeatured": true,
  "freeShipping": true
}'

# 15. Women > Blouses
create_product '{
  "name": "Silk-Blend Professional Blouse",
  "description": "Elegant silk blend blouse for professional wear.",
  "category": "Women",
  "subcategory": "Blouses",
  "productType": "Formal",
  "brand": "ChainVanguard",
  "apparelDetails": {
    "size": "M",
    "fit": "Regular Fit",
    "color": "Ivory",
    "pattern": "Solid",
    "material": "70% Silk 30% Polyester",
    "fabricType": "Silk",
    "fabricWeight": "120 GSM",
    "neckline": "Collar",
    "sleeveLength": "Long Sleeve",
    "careInstructions": "Hand wash cold or dry clean"
  },
  "price": 3999,
  "costPrice": 2399,
  "quantity": 120,
  "minStockLevel": 18,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Textiles",
  "season": "All Season",
  "tags": ["blouse", "silk", "formal"],
  "isFeatured": true,
  "freeShipping": true
}'

# 16. Women > Shirts
create_product '{
  "name": "Classic Button-Down Shirt",
  "description": "Versatile cotton button-down shirt.",
  "category": "Women",
  "subcategory": "Shirts",
  "productType": "Casual",
  "brand": "ChainVanguard",
  "apparelDetails": {
    "size": "M",
    "fit": "Loose Fit",
    "color": "White",
    "pattern": "Solid",
    "material": "100% Cotton",
    "fabricType": "Cotton",
    "fabricWeight": "140 GSM",
    "neckline": "Collar",
    "sleeveLength": "Long Sleeve",
    "careInstructions": "Machine wash warm"
  },
  "price": 2299,
  "costPrice": 1379,
  "quantity": 150,
  "minStockLevel": 22,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Textiles",
  "season": "All Season",
  "tags": ["shirt", "cotton", "casual"],
  "freeShipping": true
}'

# 17. Women > Sweaters
create_product '{
  "name": "Cashmere-Blend Crewneck Sweater",
  "description": "Luxurious cashmere blend sweater.",
  "category": "Women",
  "subcategory": "Sweaters",
  "productType": "Casual",
  "brand": "ChainVanguard",
  "apparelDetails": {
    "size": "M",
    "fit": "Regular Fit",
    "color": "Camel",
    "pattern": "Solid",
    "material": "30% Cashmere 70% Wool",
    "fabricType": "Wool",
    "fabricWeight": "260 GSM",
    "neckline": "Crew Neck",
    "sleeveLength": "Long Sleeve",
    "careInstructions": "Hand wash cold"
  },
  "price": 6999,
  "costPrice": 4199,
  "quantity": 90,
  "minStockLevel": 12,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Textiles",
  "season": "Winter",
  "tags": ["sweater", "cashmere", "wool"],
  "isFeatured": true,
  "freeShipping": true
}'

# 18. Women > Hoodies
create_product '{
  "name": "Fleece Zip-Up Hoodie",
  "description": "Comfortable zip-up hoodie with fleece lining.",
  "category": "Women",
  "subcategory": "Hoodies",
  "productType": "Casual",
  "brand": "ChainVanguard",
  "apparelDetails": {
    "size": "M",
    "fit": "Regular Fit",
    "color": "Sage Green",
    "pattern": "Solid",
    "material": "80% Cotton 20% Polyester",
    "fabricType": "Fleece",
    "fabricWeight": "300 GSM",
    "neckline": "Crew Neck",
    "sleeveLength": "Long Sleeve",
    "careInstructions": "Machine wash cold"
  },
  "price": 2999,
  "costPrice": 1799,
  "quantity": 170,
  "minStockLevel": 25,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Textiles",
  "season": "Autumn",
  "tags": ["hoodie", "fleece", "casual"],
  "freeShipping": true
}'

# 19. Women > Jackets
create_product '{
  "name": "Cropped Denim Jacket",
  "description": "Classic cropped denim jacket with stretch.",
  "category": "Women",
  "subcategory": "Jackets",
  "productType": "Casual",
  "brand": "ChainVanguard",
  "apparelDetails": {
    "size": "M",
    "fit": "Regular Fit",
    "color": "Light Blue",
    "pattern": "Solid",
    "material": "98% Cotton 2% Elastane",
    "fabricType": "Denim",
    "fabricWeight": "320 GSM",
    "neckline": "Collar",
    "sleeveLength": "Long Sleeve",
    "careInstructions": "Machine wash cold separately"
  },
  "price": 4499,
  "costPrice": 2699,
  "quantity": 130,
  "minStockLevel": 20,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Textiles",
  "season": "Spring",
  "tags": ["jacket", "denim", "cropped"],
  "isFeatured": true,
  "freeShipping": true
}'

# 20. Women > Coats
create_product '{
  "name": "Belted Wool-Blend Wrap Coat",
  "description": "Elegant wrap coat in wool blend.",
  "category": "Women",
  "subcategory": "Coats",
  "productType": "Formal",
  "brand": "ChainVanguard",
  "apparelDetails": {
    "size": "M",
    "fit": "Regular Fit",
    "color": "Burgundy",
    "pattern": "Solid",
    "material": "60% Wool 40% Polyester",
    "fabricType": "Wool",
    "fabricWeight": "420 GSM",
    "neckline": "Crew Neck",
    "sleeveLength": "Long Sleeve",
    "careInstructions": "Dry clean only"
  },
  "price": 13999,
  "costPrice": 8399,
  "quantity": 70,
  "minStockLevel": 10,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Textiles",
  "season": "Winter",
  "tags": ["coat", "wool", "wrap"],
  "isFeatured": true,
  "freeShipping": true
}'

# 21. Women > Jeans
create_product '{
  "name": "High-Rise Skinny Jeans",
  "description": "Comfortable high-rise skinny jeans with stretch.",
  "category": "Women",
  "subcategory": "Jeans",
  "productType": "Casual",
  "brand": "ChainVanguard",
  "apparelDetails": {
    "size": "M",
    "fit": "Slim Fit",
    "color": "Dark Indigo",
    "pattern": "Solid",
    "material": "92% Cotton 6% Polyester 2% Elastane",
    "fabricType": "Denim",
    "fabricWeight": "320 GSM",
    "neckline": "Crew Neck",
    "sleeveLength": "Short Sleeve",
    "careInstructions": "Machine wash cold inside out"
  },
  "price": 3499,
  "costPrice": 2099,
  "quantity": 180,
  "minStockLevel": 28,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Textiles",
  "season": "All Season",
  "tags": ["jeans", "skinny", "high-rise"],
  "freeShipping": true
}'

# 22. Women > Trousers
create_product '{
  "name": "Wide-Leg Palazzo Trousers",
  "description": "Flowy wide-leg palazzo trousers.",
  "category": "Women",
  "subcategory": "Trousers",
  "productType": "Casual",
  "brand": "ChainVanguard",
  "apparelDetails": {
    "size": "M",
    "fit": "Loose Fit",
    "color": "Black",
    "pattern": "Solid",
    "material": "95% Polyester 5% Spandex",
    "fabricType": "Polyester",
    "fabricWeight": "220 GSM",
    "neckline": "Crew Neck",
    "sleeveLength": "Short Sleeve",
    "careInstructions": "Machine wash cold"
  },
  "price": 3199,
  "costPrice": 1919,
  "quantity": 140,
  "minStockLevel": 20,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Textiles",
  "season": "All Season",
  "tags": ["trousers", "palazzo", "wide-leg"],
  "isFeatured": true,
  "freeShipping": true
}'

# 23. Women > Shorts
create_product '{
  "name": "High-Waisted Denim Shorts",
  "description": "Casual high-waisted denim shorts.",
  "category": "Women",
  "subcategory": "Shorts",
  "productType": "Casual",
  "brand": "ChainVanguard",
  "apparelDetails": {
    "size": "M",
    "fit": "Regular Fit",
    "color": "Medium Blue",
    "pattern": "Solid",
    "material": "99% Cotton 1% Elastane",
    "fabricType": "Denim",
    "fabricWeight": "300 GSM",
    "neckline": "Crew Neck",
    "sleeveLength": "Short Sleeve",
    "careInstructions": "Machine wash cold"
  },
  "price": 2199,
  "costPrice": 1319,
  "quantity": 160,
  "minStockLevel": 24,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Textiles",
  "season": "Summer",
  "tags": ["shorts", "denim", "high-waisted"],
  "freeShipping": true
}'

# 24. Women > Skirts
create_product '{
  "name": "Pleated Midi Skirt",
  "description": "Feminine pleated midi skirt in chiffon.",
  "category": "Women",
  "subcategory": "Skirts",
  "productType": "Casual",
  "brand": "ChainVanguard",
  "apparelDetails": {
    "size": "M",
    "fit": "Regular Fit",
    "color": "Blush Pink",
    "pattern": "Solid",
    "material": "100% Polyester",
    "fabricType": "Chiffon",
    "fabricWeight": "140 GSM",
    "neckline": "Crew Neck",
    "sleeveLength": "Short Sleeve",
    "careInstructions": "Hand wash cold"
  },
  "price": 2799,
  "costPrice": 1679,
  "quantity": 120,
  "minStockLevel": 18,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Textiles",
  "season": "Spring",
  "tags": ["skirt", "pleated", "midi"],
  "isFeatured": true,
  "freeShipping": true
}'

# 25. Women > Dresses
create_product '{
  "name": "Floral Wrap Maxi Dress",
  "description": "Beautiful floral wrap dress in maxi length.",
  "category": "Women",
  "subcategory": "Dresses",
  "productType": "Party",
  "brand": "ChainVanguard",
  "apparelDetails": {
    "size": "M",
    "fit": "Regular Fit",
    "color": "Floral Multi",
    "pattern": "Floral",
    "material": "100% Rayon",
    "fabricType": "Cotton",
    "fabricWeight": "160 GSM",
    "neckline": "V-Neck",
    "sleeveLength": "3/4 Sleeve",
    "careInstructions": "Machine wash cold"
  },
  "price": 4499,
  "costPrice": 2699,
  "quantity": 110,
  "minStockLevel": 16,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Textiles",
  "season": "Summer",
  "tags": ["dress", "maxi", "floral"],
  "isFeatured": true,
  "freeShipping": true
}'

# 26. Women > Jumpsuits
create_product '{
  "name": "Wide-Leg Belted Jumpsuit",
  "description": "Elegant wide-leg jumpsuit with belt.",
  "category": "Women",
  "subcategory": "Jumpsuits",
  "productType": "Casual",
  "brand": "ChainVanguard",
  "apparelDetails": {
    "size": "M",
    "fit": "Regular Fit",
    "color": "Navy",
    "pattern": "Solid",
    "material": "95% Polyester 5% Spandex",
    "fabricType": "Polyester",
    "fabricWeight": "240 GSM",
    "neckline": "V-Neck",
    "sleeveLength": "Sleeveless",
    "careInstructions": "Machine wash cold"
  },
  "price": 4299,
  "costPrice": 2579,
  "quantity": 100,
  "minStockLevel": 14,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Textiles",
  "season": "All Season",
  "tags": ["jumpsuit", "wide-leg", "elegant"],
  "freeShipping": true
}'

# 27. Women > Suits
create_product '{
  "name": "Tailored Blazer Suit",
  "description": "Professional two-piece blazer suit.",
  "category": "Women",
  "subcategory": "Suits",
  "productType": "Formal",
  "brand": "ChainVanguard",
  "apparelDetails": {
    "size": "M",
    "fit": "Slim Fit",
    "color": "Black",
    "pattern": "Solid",
    "material": "65% Polyester 35% Wool",
    "fabricType": "Wool",
    "fabricWeight": "300 GSM",
    "neckline": "Collar",
    "sleeveLength": "Long Sleeve",
    "careInstructions": "Dry clean only"
  },
  "price": 12999,
  "costPrice": 7799,
  "quantity": 70,
  "minStockLevel": 10,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Textiles",
  "season": "All Season",
  "tags": ["suit", "blazer", "formal"],
  "isFeatured": true,
  "freeShipping": true
}'

# 28. Women > Activewear
create_product '{
  "name": "Seamless Workout Set",
  "description": "High-performance seamless workout set.",
  "category": "Women",
  "subcategory": "Activewear",
  "productType": "Sports",
  "brand": "ChainVanguard",
  "apparelDetails": {
    "size": "M",
    "fit": "Slim Fit",
    "color": "Charcoal Pink",
    "pattern": "Solid",
    "material": "92% Nylon 8% Spandex",
    "fabricType": "Polyester",
    "fabricWeight": "240 GSM",
    "neckline": "Crew Neck",
    "sleeveLength": "Sleeveless",
    "careInstructions": "Machine wash cold"
  },
  "price": 3999,
  "costPrice": 2399,
  "quantity": 150,
  "minStockLevel": 22,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Textiles",
  "season": "All Season",
  "tags": ["activewear", "workout", "seamless"],
  "freeShipping": true
}'

# 29. Women > Sleepwear
create_product '{
  "name": "Satin Pajama Set",
  "description": "Luxurious satin pajama set.",
  "category": "Women",
  "subcategory": "Sleepwear",
  "productType": "Casual",
  "brand": "ChainVanguard",
  "apparelDetails": {
    "size": "M",
    "fit": "Regular Fit",
    "color": "Champagne",
    "pattern": "Solid",
    "material": "100% Polyester Satin",
    "fabricType": "Satin",
    "fabricWeight": "140 GSM",
    "neckline": "Collar",
    "sleeveLength": "Long Sleeve",
    "careInstructions": "Machine wash cold delicate"
  },
  "price": 3499,
  "costPrice": 2099,
  "quantity": 120,
  "minStockLevel": 18,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Textiles",
  "season": "All Season",
  "tags": ["pajamas", "satin", "sleepwear"],
  "freeShipping": true
}'

# 30. Women > Swimwear
create_product '{
  "name": "High-Waist Two-Piece Swimsuit",
  "description": "Retro-style high-waist swimsuit.",
  "category": "Women",
  "subcategory": "Swimwear",
  "productType": "Sports",
  "brand": "ChainVanguard",
  "apparelDetails": {
    "size": "M",
    "fit": "Regular Fit",
    "color": "Tropical Print",
    "pattern": "Printed",
    "material": "82% Nylon 18% Spandex",
    "fabricType": "Polyester",
    "fabricWeight": "200 GSM",
    "neckline": "Crew Neck",
    "sleeveLength": "Sleeveless",
    "careInstructions": "Rinse after use, hand wash cold"
  },
  "price": 3299,
  "costPrice": 1979,
  "quantity": 130,
  "minStockLevel": 20,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Textiles",
  "season": "Summer",
  "tags": ["swimsuit", "two-piece", "high-waist"],
  "freeShipping": true
}'

# 31. Women > Underwear
create_product '{
  "name": "Seamless Comfort Briefs 5-Pack",
  "description": "Seamless underwear briefs pack.",
  "category": "Women",
  "subcategory": "Underwear",
  "productType": "Casual",
  "brand": "ChainVanguard",
  "apparelDetails": {
    "size": "M",
    "fit": "Regular Fit",
    "color": "Nude Assorted",
    "pattern": "Solid",
    "material": "92% Nylon 8% Spandex",
    "fabricType": "Cotton",
    "fabricWeight": "140 GSM",
    "neckline": "Crew Neck",
    "sleeveLength": "Short Sleeve",
    "careInstructions": "Machine wash warm"
  },
  "price": 1999,
  "costPrice": 1199,
  "quantity": 250,
  "minStockLevel": 38,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Textiles",
  "season": "All Season",
  "tags": ["underwear", "seamless", "briefs"],
  "freeShipping": true
}'

# KIDS - 13 products
echo -e "\n${CYAN}KIDS (13)${NC}"

# 32. Kids > T-Shirts
create_product '{
  "name": "Kids Graphic Cotton Tee",
  "description": "Fun graphic tee for kids.",
  "category": "Kids",
  "subcategory": "T-Shirts",
  "productType": "Casual",
  "brand": "ChainVanguard",
  "apparelDetails": {
    "size": "8",
    "fit": "Regular Fit",
    "color": "Blue",
    "pattern": "Printed",
    "material": "100% Cotton",
    "fabricType": "Jersey",
    "fabricWeight": "160 GSM",
    "neckline": "Crew Neck",
    "sleeveLength": "Short Sleeve",
    "careInstructions": "Machine wash cold"
  },
  "price": 999,
  "costPrice": 599,
  "quantity": 200,
  "minStockLevel": 30,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Textiles",
  "season": "All Season",
  "tags": ["kids", "tshirt", "graphic"],
  "freeShipping": true
}'

# 33. Kids > Shirts
create_product '{
  "name": "Kids Button-Down Shirt",
  "description": "Classic button-down shirt for kids.",
  "category": "Kids",
  "subcategory": "Shirts",
  "productType": "Casual",
  "brand": "ChainVanguard",
  "apparelDetails": {
    "size": "8",
    "fit": "Regular Fit",
    "color": "Light Blue",
    "pattern": "Solid",
    "material": "100% Cotton",
    "fabricType": "Cotton",
    "fabricWeight": "140 GSM",
    "neckline": "Collar",
    "sleeveLength": "Long Sleeve",
    "careInstructions": "Machine wash cold"
  },
  "price": 1499,
  "costPrice": 899,
  "quantity": 140,
  "minStockLevel": 22,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Textiles",
  "season": "All Season",
  "tags": ["kids", "shirt", "button-down"],
  "freeShipping": true
}'

# 34. Kids > Sweaters
create_product '{
  "name": "Kids Pullover Sweater",
  "description": "Cozy pullover sweater for kids.",
  "category": "Kids",
  "subcategory": "Sweaters",
  "productType": "Casual",
  "brand": "ChainVanguard",
  "apparelDetails": {
    "size": "8",
    "fit": "Regular Fit",
    "color": "Grey",
    "pattern": "Solid",
    "material": "60% Cotton 40% Acrylic",
    "fabricType": "Cotton",
    "fabricWeight": "260 GSM",
    "neckline": "Crew Neck",
    "sleeveLength": "Long Sleeve",
    "careInstructions": "Machine wash cold"
  },
  "price": 1899,
  "costPrice": 1139,
  "quantity": 130,
  "minStockLevel": 20,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Textiles",
  "season": "Winter",
  "tags": ["kids", "sweater", "warm"],
  "freeShipping": true
}'

# 35. Kids > Hoodies
create_product '{
  "name": "Kids Zip-Up Hoodie",
  "description": "Comfortable zip-up hoodie for kids.",
  "category": "Kids",
  "subcategory": "Hoodies",
  "productType": "Casual",
  "brand": "ChainVanguard",
  "apparelDetails": {
    "size": "8",
    "fit": "Regular Fit",
    "color": "Red",
    "pattern": "Solid",
    "material": "80% Cotton 20% Polyester",
    "fabricType": "Fleece",
    "fabricWeight": "280 GSM",
    "neckline": "Crew Neck",
    "sleeveLength": "Long Sleeve",
    "careInstructions": "Machine wash cold"
  },
  "price": 1999,
  "costPrice": 1199,
  "quantity": 160,
  "minStockLevel": 24,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Textiles",
  "season": "Autumn",
  "tags": ["kids", "hoodie", "fleece"],
  "freeShipping": true
}'

# 36. Kids > Jackets
create_product '{
  "name": "Kids Windbreaker Jacket",
  "description": "Water-resistant windbreaker for kids.",
  "category": "Kids",
  "subcategory": "Jackets",
  "productType": "Sports",
  "brand": "ChainVanguard",
  "apparelDetails": {
    "size": "8",
    "fit": "Regular Fit",
    "color": "Green",
    "pattern": "Solid",
    "material": "100% Polyester",
    "fabricType": "Polyester",
    "fabricWeight": "180 GSM",
    "neckline": "Crew Neck",
    "sleeveLength": "Long Sleeve",
    "careInstructions": "Machine wash cold"
  },
  "price": 2499,
  "costPrice": 1499,
  "quantity": 120,
  "minStockLevel": 18,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Textiles",
  "season": "Spring",
  "tags": ["kids", "jacket", "windbreaker"],
  "freeShipping": true
}'

# 37. Kids > Coats
create_product '{
  "name": "Kids Warm Puffer Coat",
  "description": "Insulated puffer coat for winter.",
  "category": "Kids",
  "subcategory": "Coats",
  "productType": "Casual",
  "brand": "ChainVanguard",
  "apparelDetails": {
    "size": "8",
    "fit": "Regular Fit",
    "color": "Navy",
    "pattern": "Solid",
    "material": "100% Polyester",
    "fabricType": "Polyester",
    "fabricWeight": "200 GSM",
    "neckline": "Crew Neck",
    "sleeveLength": "Long Sleeve",
    "careInstructions": "Machine wash cold"
  },
  "price": 3999,
  "costPrice": 2399,
  "quantity": 100,
  "minStockLevel": 15,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Textiles",
  "season": "Winter",
  "tags": ["kids", "coat", "puffer"],
  "isFeatured": true,
  "freeShipping": true
}'

# 38. Kids > Jeans
create_product '{
  "name": "Kids Adjustable-Waist Jeans",
  "description": "Durable jeans with adjustable waist.",
  "category": "Kids",
  "subcategory": "Jeans",
  "productType": "Casual",
  "brand": "ChainVanguard",
  "apparelDetails": {
    "size": "8",
    "fit": "Regular Fit",
    "color": "Dark Blue",
    "pattern": "Solid",
    "material": "100% Cotton Denim",
    "fabricType": "Denim",
    "fabricWeight": "300 GSM",
    "neckline": "Crew Neck",
    "sleeveLength": "Short Sleeve",
    "careInstructions": "Machine wash cold"
  },
  "price": 1999,
  "costPrice": 1199,
  "quantity": 150,
  "minStockLevel": 22,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Textiles",
  "season": "All Season",
  "tags": ["kids", "jeans", "denim"],
  "freeShipping": true
}'

# 39. Kids > Trousers
create_product '{
  "name": "Kids School Trousers",
  "description": "Smart school uniform trousers.",
  "category": "Kids",
  "subcategory": "Trousers",
  "productType": "School",
  "brand": "ChainVanguard",
  "apparelDetails": {
    "size": "8",
    "fit": "Regular Fit",
    "color": "Navy",
    "pattern": "Solid",
    "material": "65% Polyester 35% Cotton",
    "fabricType": "Cotton",
    "fabricWeight": "220 GSM",
    "neckline": "Crew Neck",
    "sleeveLength": "Short Sleeve",
    "careInstructions": "Machine wash warm"
  },
  "price": 1699,
  "costPrice": 1019,
  "quantity": 140,
  "minStockLevel": 20,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Textiles",
  "season": "All Season",
  "tags": ["kids", "trousers", "school"],
  "freeShipping": true
}'

# 40. Kids > Shorts
create_product '{
  "name": "Kids Athletic Shorts",
  "description": "Performance athletic shorts for kids.",
  "category": "Kids",
  "subcategory": "Shorts",
  "productType": "Sports",
  "brand": "ChainVanguard",
  "apparelDetails": {
    "size": "8",
    "fit": "Regular Fit",
    "color": "Black",
    "pattern": "Solid",
    "material": "100% Polyester",
    "fabricType": "Polyester",
    "fabricWeight": "140 GSM",
    "neckline": "Crew Neck",
    "sleeveLength": "Short Sleeve",
    "careInstructions": "Machine wash cold"
  },
  "price": 1299,
  "costPrice": 779,
  "quantity": 170,
  "minStockLevel": 26,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Textiles",
  "season": "Summer",
  "tags": ["kids", "shorts", "athletic"],
  "freeShipping": true
}'

# 41. Kids > Dresses
create_product '{
  "name": "Kids Party Dress",
  "description": "Special occasion party dress.",
  "category": "Kids",
  "subcategory": "Dresses",
  "productType": "Party",
  "brand": "ChainVanguard",
  "apparelDetails": {
    "size": "8",
    "fit": "Regular Fit",
    "color": "Pink",
    "pattern": "Solid",
    "material": "100% Polyester",
    "fabricType": "Polyester",
    "fabricWeight": "180 GSM",
    "neckline": "Round Neck",
    "sleeveLength": "Short Sleeve",
    "careInstructions": "Machine wash cold delicate"
  },
  "price": 2499,
  "costPrice": 1499,
  "quantity": 100,
  "minStockLevel": 15,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Textiles",
  "season": "All Season",
  "tags": ["kids", "dress", "party"],
  "isFeatured": true,
  "freeShipping": true
}'

# 42. Kids > Activewear
create_product '{
  "name": "Kids Sports Training Set",
  "description": "Complete sports training set.",
  "category": "Kids",
  "subcategory": "Activewear",
  "productType": "Sports",
  "brand": "ChainVanguard",
  "apparelDetails": {
    "size": "8",
    "fit": "Regular Fit",
    "color": "Blue White",
    "pattern": "Solid",
    "material": "100% Polyester",
    "fabricType": "Polyester",
    "fabricWeight": "160 GSM",
    "neckline": "Crew Neck",
    "sleeveLength": "Short Sleeve",
    "careInstructions": "Machine wash cold"
  },
  "price": 1899,
  "costPrice": 1139,
  "quantity": 150,
  "minStockLevel": 22,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Textiles",
  "season": "All Season",
  "tags": ["kids", "activewear", "sports"],
  "freeShipping": true
}'

# 43. Kids > Sleepwear
create_product '{
  "name": "Kids Cotton Pajama Set",
  "description": "Comfortable cotton pajama set.",
  "category": "Kids",
  "subcategory": "Sleepwear",
  "productType": "Casual",
  "brand": "ChainVanguard",
  "apparelDetails": {
    "size": "8",
    "fit": "Regular Fit",
    "color": "Multi",
    "pattern": "Printed",
    "material": "100% Cotton",
    "fabricType": "Cotton",
    "fabricWeight": "180 GSM",
    "neckline": "Crew Neck",
    "sleeveLength": "Long Sleeve",
    "careInstructions": "Machine wash warm"
  },
  "price": 1699,
  "costPrice": 1019,
  "quantity": 140,
  "minStockLevel": 20,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Textiles",
  "season": "All Season",
  "tags": ["kids", "pajamas", "sleepwear"],
  "freeShipping": true
}'

# 44. Kids > Underwear
create_product '{
  "name": "Kids Cotton Underwear 5-Pack",
  "description": "Soft cotton underwear pack for kids.",
  "category": "Kids",
  "subcategory": "Underwear",
  "productType": "Casual",
  "brand": "ChainVanguard",
  "apparelDetails": {
    "size": "8",
    "fit": "Regular Fit",
    "color": "Assorted",
    "pattern": "Solid",
    "material": "95% Cotton 5% Elastane",
    "fabricType": "Cotton",
    "fabricWeight": "180 GSM",
    "neckline": "Crew Neck",
    "sleeveLength": "Short Sleeve",
    "careInstructions": "Machine wash warm"
  },
  "price": 1299,
  "costPrice": 779,
  "quantity": 200,
  "minStockLevel": 30,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Textiles",
  "season": "All Season",
  "tags": ["kids", "underwear", "cotton"],
  "freeShipping": true
}'

# UNISEX - 6 products
echo -e "\n${CYAN}UNISEX (6)${NC}"

# 45. Unisex > T-Shirts
create_product '{
  "name": "Unisex Premium Cotton Tee",
  "description": "Classic unisex cotton t-shirt.",
  "category": "Unisex",
  "subcategory": "T-Shirts",
  "productType": "Casual",
  "brand": "ChainVanguard",
  "apparelDetails": {
    "size": "M",
    "fit": "Regular Fit",
    "color": "Black",
    "pattern": "Solid",
    "material": "100% Cotton",
    "fabricType": "Cotton",
    "fabricWeight": "180 GSM",
    "neckline": "Crew Neck",
    "sleeveLength": "Short Sleeve",
    "careInstructions": "Machine wash cold"
  },
  "price": 1299,
  "costPrice": 779,
  "quantity": 250,
  "minStockLevel": 38,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Textiles",
  "season": "All Season",
  "tags": ["unisex", "tshirt", "cotton"],
  "isFeatured": true,
  "freeShipping": true
}'

# 46. Unisex > Hoodies
create_product '{
  "name": "Unisex Classic Pullover Hoodie",
  "description": "Comfortable pullover hoodie for everyone.",
  "category": "Unisex",
  "subcategory": "Hoodies",
  "productType": "Casual",
  "brand": "ChainVanguard",
  "apparelDetails": {
    "size": "M",
    "fit": "Regular Fit",
    "color": "Charcoal",
    "pattern": "Solid",
    "material": "80% Cotton 20% Polyester",
    "fabricType": "Fleece",
    "fabricWeight": "320 GSM",
    "neckline": "Crew Neck",
    "sleeveLength": "Long Sleeve",
    "careInstructions": "Machine wash cold"
  },
  "price": 2999,
  "costPrice": 1799,
  "quantity": 200,
  "minStockLevel": 30,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Textiles",
  "season": "Autumn",
  "tags": ["unisex", "hoodie", "fleece"],
  "isFeatured": true,
  "freeShipping": true
}'

# 47. Unisex > Sweaters
create_product '{
  "name": "Unisex Crew Neck Sweater",
  "description": "Classic crew neck knit sweater.",
  "category": "Unisex",
  "subcategory": "Sweaters",
  "productType": "Casual",
  "brand": "ChainVanguard",
  "apparelDetails": {
    "size": "M",
    "fit": "Regular Fit",
    "color": "Navy",
    "pattern": "Solid",
    "material": "100% Cotton",
    "fabricType": "Cotton",
    "fabricWeight": "280 GSM",
    "neckline": "Crew Neck",
    "sleeveLength": "Long Sleeve",
    "careInstructions": "Machine wash cold"
  },
  "price": 3299,
  "costPrice": 1979,
  "quantity": 150,
  "minStockLevel": 22,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Textiles",
  "season": "Winter",
  "tags": ["unisex", "sweater", "knit"],
  "freeShipping": true
}'

# 48. Unisex > Jackets
create_product '{
  "name": "Unisex Lightweight Windbreaker",
  "description": "Packable windbreaker jacket.",
  "category": "Unisex",
  "subcategory": "Jackets",
  "productType": "Sports",
  "brand": "ChainVanguard",
  "apparelDetails": {
    "size": "M",
    "fit": "Regular Fit",
    "color": "Navy White",
    "pattern": "Solid",
    "material": "100% Nylon",
    "fabricType": "Polyester",
    "fabricWeight": "160 GSM",
    "neckline": "Crew Neck",
    "sleeveLength": "Long Sleeve",
    "careInstructions": "Machine wash cold"
  },
  "price": 3999,
  "costPrice": 2399,
  "quantity": 140,
  "minStockLevel": 20,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Textiles",
  "season": "Spring",
  "tags": ["unisex", "windbreaker", "jacket"],
  "freeShipping": true
}'

# 49. Unisex > Activewear
create_product '{
  "name": "Unisex Performance Joggers",
  "description": "Comfortable performance joggers.",
  "category": "Unisex",
  "subcategory": "Activewear",
  "productType": "Sports",
  "brand": "ChainVanguard",
  "apparelDetails": {
    "size": "M",
    "fit": "Regular Fit",
    "color": "Black",
    "pattern": "Solid",
    "material": "88% Polyester 12% Spandex",
    "fabricType": "Polyester",
    "fabricWeight": "240 GSM",
    "neckline": "Crew Neck",
    "sleeveLength": "Short Sleeve",
    "careInstructions": "Machine wash cold"
  },
  "price": 2799,
  "costPrice": 1679,
  "quantity": 160,
  "minStockLevel": 24,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Textiles",
  "season": "All Season",
  "tags": ["unisex", "joggers", "activewear"],
  "isFeatured": true,
  "freeShipping": true
}'

# 50. Unisex > Sleepwear
create_product '{
  "name": "Unisex Soft Lounge Set",
  "description": "Comfortable lounge set for relaxation.",
  "category": "Unisex",
  "subcategory": "Sleepwear",
  "productType": "Casual",
  "brand": "ChainVanguard",
  "apparelDetails": {
    "size": "M",
    "fit": "Loose Fit",
    "color": "Grey Melange",
    "pattern": "Solid",
    "material": "95% Cotton 5% Spandex",
    "fabricType": "Jersey",
    "fabricWeight": "220 GSM",
    "neckline": "Crew Neck",
    "sleeveLength": "Long Sleeve",
    "careInstructions": "Machine wash warm"
  },
  "price": 3499,
  "costPrice": 2099,
  "quantity": 130,
  "minStockLevel": 20,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Textiles",
  "season": "All Season",
  "tags": ["unisex", "lounge", "sleepwear"],
  "freeShipping": true
}'

echo ""
echo "=========================================="
echo "📊 SUMMARY"
echo "=========================================="
echo -e "${GREEN}✅ Success: $SUCCESS / 50${NC}"
echo -e "${RED}❌ Failed: $FAILED / 50${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All 50 products created!${NC}"
    exit 0
else
    echo -e "${RED}⚠️  $FAILED products failed${NC}"
    exit 1
fi