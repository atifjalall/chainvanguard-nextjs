#!/bin/bash

# ============================================
# ChainVanguard - CORRECTED Product Catalog
# Uses ONLY valid subcategories from categories.js
# ============================================

set -e

ENV_PATH="/Users/atifjalal/Desktop/chainvanguard-nextjs/chainvanguard-backend/api/.env"

if [ -f "$ENV_PATH" ]; then
    source "$ENV_PATH"
else
    echo "❌ .env file not found"
    exit 1
fi

BASE_URL="${TEST_BASE_URL:-http://localhost:3001}"

GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

if [ -z "$VENDOR_TOKEN" ]; then
    echo -e "${RED}❌ VENDOR_TOKEN not found${NC}"
    exit 1
fi

TOTAL=0
SUCCESS=0
FAILED=0

echo "=========================================="
echo "🚀 Creating VALID Product Catalog"
echo "=========================================="
echo "Based on categories.js validation"
echo ""

create_product() {
    TOTAL=$((TOTAL + 1))
    
    local response=$(curl -s -X POST ${BASE_URL}/api/products \
      -H "Authorization: Bearer $VENDOR_TOKEN" \
      -H "Content-Type: application/json" \
      -d "$1")
    
    if echo "$response" | jq -e '.success == true' > /dev/null 2>&1; then
        SUCCESS=$((SUCCESS + 1))
        local name=$(echo "$1" | jq -r '.name')
        echo -e "${GREEN}✓${NC} $TOTAL/47 | $name"
    else
        FAILED=$((FAILED + 1))
        local error=$(echo "$response" | jq -r '.message // "Error"')
        echo -e "${RED}✗${NC} $TOTAL/47 | $error"
    fi
    sleep 0.5
}

# ==========================================
# MEN'S COLLECTION (13 products)
# Valid subcategories: T-Shirts, Shirts, Hoodies, Sweaters, Jackets, Coats, Jeans, Trousers, Shorts, Suits, Activewear, Sleepwear, Underwear
# ==========================================

echo -e "\n${CYAN}MEN'S COLLECTION (13)${NC}"
echo "=========================================="

create_product '{
  "name": "Premium Cotton Crew Neck T-Shirt",
  "description": "Experience ultimate comfort with our premium 100% cotton crew neck t-shirt. Crafted from breathable, pre-shrunk fabric that maintains its shape and softness wash after wash. Perfect for everyday wear, casual outings, or layering. Features reinforced shoulder seams and a tagless design for maximum comfort.",
  "category": "Men",
  "subcategory": "T-Shirts",
  "productType": "Casual",
  "brand": "ChainVanguard Essentials",
  "apparelDetails": {
    "size": "M",
    "fit": "Regular Fit",
    "color": "Navy Blue",
    "pattern": "Solid",
    "material": "100% Combed Cotton",
    "fabricType": "Jersey",
    "fabricWeight": "180 GSM",
    "neckline": "Crew Neck",
    "sleeveLength": "Short Sleeve",
    "careInstructions": "Machine wash cold with like colors. Tumble dry low."
  },
  "price": 1299,
  "costPrice": 780,
  "quantity": 150,
  "minStockLevel": 20,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Textiles",
  "season": "All Season",
  "tags": ["cotton", "casual", "basics", "tshirt"],
  "isFeatured": true,
  "isNewArrival": true,
  "freeShipping": true
}'

create_product '{
  "name": "Classic Oxford Formal Shirt",
  "description": "Elevate your professional wardrobe with our Classic Oxford formal shirt. Made from premium 100% cotton Oxford weave fabric, this shirt offers exceptional breathability and a crisp, polished appearance. Features include a standard collar, button-down front, chest pocket, and adjustable cuffs.",
  "category": "Men",
  "subcategory": "Shirts",
  "productType": "Formal",
  "brand": "ChainVanguard Professional",
  "apparelDetails": {
    "size": "M",
    "fit": "Slim Fit",
    "color": "White",
    "pattern": "Solid",
    "material": "100% Cotton Oxford",
    "fabricType": "Cotton",
    "fabricWeight": "140 GSM",
    "neckline": "Collar",
    "sleeveLength": "Long Sleeve",
    "careInstructions": "Machine wash warm. Hang dry or tumble dry low."
  },
  "price": 2499,
  "costPrice": 1499,
  "quantity": 100,
  "minStockLevel": 15,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Textiles",
  "season": "All Season",
  "tags": ["formal", "business", "shirt", "cotton"],
  "isFeatured": true,
  "freeShipping": true
}'

create_product '{
  "name": "Merino Wool V-Neck Sweater",
  "description": "Stay warm and stylish with our luxurious Merino wool V-neck sweater. Crafted from 100% extra-fine Merino wool, this sweater offers exceptional softness and natural temperature regulation. The classic V-neck design pairs perfectly with dress shirts or casual tees.",
  "category": "Men",
  "subcategory": "Sweaters",
  "productType": "Casual",
  "brand": "ChainVanguard Premium",
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
    "careInstructions": "Hand wash cold or dry clean. Lay flat to dry."
  },
  "price": 4999,
  "costPrice": 2999,
  "quantity": 80,
  "minStockLevel": 10,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Textiles",
  "season": "Winter",
  "tags": ["wool", "sweater", "winter", "premium"],
  "isFeatured": true,
  "freeShipping": true
}'

create_product '{
  "name": "Essential Fleece Pullover Hoodie",
  "description": "Your new go-to comfort piece. This essential fleece pullover hoodie features a soft cotton-poly blend fleece interior that keeps you warm without the weight. Designed with a spacious kangaroo pocket, adjustable drawstring hood, and ribbed cuffs for the perfect fit.",
  "category": "Men",
  "subcategory": "Hoodies",
  "productType": "Casual",
  "brand": "ChainVanguard Active",
  "apparelDetails": {
    "size": "M",
    "fit": "Regular Fit",
    "color": "Heather Grey",
    "pattern": "Solid",
    "material": "80% Cotton, 20% Polyester",
    "fabricType": "Jersey",
    "fabricWeight": "320 GSM",
    "neckline": "Other",
    "sleeveLength": "Long Sleeve",
    "careInstructions": "Machine wash cold. Tumble dry low."
  },
  "price": 2999,
  "costPrice": 1799,
  "quantity": 120,
  "minStockLevel": 20,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Textiles",
  "season": "Autumn",
  "tags": ["hoodie", "casual", "comfort", "fleece"],
  "isNewArrival": true,
  "freeShipping": true
}'

create_product '{
  "name": "Classic Denim Trucker Jacket",
  "description": "A timeless wardrobe essential. Our Classic Denim Trucker Jacket features premium 12oz denim fabric with authentic copper rivets and button closures. The versatile design includes two chest pockets with button flaps and two hand pockets.",
  "category": "Men",
  "subcategory": "Jackets",
  "productType": "Casual",
  "brand": "ChainVanguard Denim",
  "apparelDetails": {
    "size": "L",
    "fit": "Regular Fit",
    "color": "Dark Indigo",
    "pattern": "Solid",
    "material": "100% Cotton Denim",
    "fabricType": "Denim",
    "fabricWeight": "380 GSM",
    "neckline": "Collar",
    "sleeveLength": "Long Sleeve",
    "careInstructions": "Machine wash cold separately. Tumble dry low."
  },
  "price": 4999,
  "costPrice": 2999,
  "quantity": 60,
  "minStockLevel": 10,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Textiles",
  "season": "Spring",
  "tags": ["denim", "jacket", "trucker", "classic"],
  "isFeatured": true,
  "freeShipping": true
}'

create_product '{
  "name": "Premium Wool Blend Overcoat",
  "description": "Sophisticated warmth meets timeless style. This premium overcoat features a luxurious wool blend fabric that provides exceptional insulation while maintaining a refined silhouette. Details include notched lapels, a double-breasted front with horn buttons, welt pockets, and a full interior lining.",
  "category": "Men",
  "subcategory": "Coats",
  "productType": "Formal",
  "brand": "ChainVanguard Premium",
  "apparelDetails": {
    "size": "L",
    "fit": "Regular Fit",
    "color": "Charcoal",
    "pattern": "Solid",
    "material": "70% Wool, 30% Polyester",
    "fabricType": "Wool",
    "fabricWeight": "450 GSM",
    "neckline": "Collar",
    "sleeveLength": "Long Sleeve",
    "careInstructions": "Dry clean only. Hang on padded hanger."
  },
  "price": 12999,
  "costPrice": 7799,
  "quantity": 40,
  "minStockLevel": 5,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Premium",
  "season": "Winter",
  "tags": ["coat", "wool", "formal", "winter"],
  "isFeatured": true,
  "freeShipping": true
}'

create_product '{
  "name": "Slim Fit Stretch Denim Jeans",
  "description": "The perfect blend of style and comfort. These slim fit jeans feature premium stretch denim that moves with you while maintaining structure. Classic five-pocket styling with reinforced seams and durable rivets at stress points.",
  "category": "Men",
  "subcategory": "Jeans",
  "productType": "Casual",
  "brand": "ChainVanguard Denim",
  "apparelDetails": {
    "size": "L",
    "fit": "Slim Fit",
    "color": "Dark Blue",
    "pattern": "Solid",
    "material": "98% Cotton, 2% Elastane",
    "fabricType": "Denim",
    "fabricWeight": "340 GSM",
    "neckline": "Other",
    "sleeveLength": "Other",
    "careInstructions": "Machine wash cold inside out. Tumble dry low."
  },
  "price": 3499,
  "costPrice": 2099,
  "quantity": 100,
  "minStockLevel": 15,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Textiles",
  "season": "All Season",
  "tags": ["jeans", "denim", "slim", "stretch"],
  "isNewArrival": true,
  "freeShipping": true
}'

create_product '{
  "name": "Tailored Fit Dress Trousers",
  "description": "Professional polish with all-day comfort. These tailored dress trousers feature a refined cotton blend fabric with just enough stretch for ease of movement. Details include a flat front, side pockets, back welt pockets, and belt loops.",
  "category": "Men",
  "subcategory": "Trousers",
  "productType": "Formal",
  "brand": "ChainVanguard Professional",
  "apparelDetails": {
    "size": "M",
    "fit": "Slim Fit",
    "color": "Navy",
    "pattern": "Solid",
    "material": "65% Polyester, 35% Cotton",
    "fabricType": "Cotton",
    "fabricWeight": "240 GSM",
    "neckline": "Other",
    "sleeveLength": "Other",
    "careInstructions": "Machine wash warm. Hang dry or tumble dry low."
  },
  "price": 3299,
  "costPrice": 1979,
  "quantity": 90,
  "minStockLevel": 15,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Textiles",
  "season": "All Season",
  "tags": ["trousers", "formal", "business", "dress"],
  "isFeatured": true,
  "freeShipping": true
}'

create_product '{
  "name": "Performance Athletic Shorts",
  "description": "Built for your active lifestyle. These performance athletic shorts feature moisture-wicking fabric that keeps you cool and dry during intense workouts. Designed with an elastic waistband with interior drawcord, deep side pockets, and a secure zippered back pocket.",
  "category": "Men",
  "subcategory": "Shorts",
  "productType": "Sports",
  "brand": "ChainVanguard Active",
  "apparelDetails": {
    "size": "M",
    "fit": "Regular Fit",
    "color": "Black",
    "pattern": "Solid",
    "material": "100% Polyester",
    "fabricType": "Polyester",
    "fabricWeight": "150 GSM",
    "neckline": "Other",
    "sleeveLength": "Other",
    "careInstructions": "Machine wash cold. Tumble dry low."
  },
  "price": 1899,
  "costPrice": 1139,
  "quantity": 120,
  "minStockLevel": 20,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Textiles",
  "season": "Summer",
  "tags": ["shorts", "athletic", "sports", "performance"],
  "isNewArrival": true,
  "freeShipping": true
}'

create_product '{
  "name": "Two-Piece Business Suit",
  "description": "Command the boardroom with confidence. This expertly tailored two-piece suit features a premium wool blend fabric with a subtle texture. The jacket includes notched lapels, a two-button closure, flap pockets, and a chest welt pocket.",
  "category": "Men",
  "subcategory": "Suits",
  "productType": "Formal",
  "brand": "ChainVanguard Executive",
  "apparelDetails": {
    "size": "M",
    "fit": "Slim Fit",
    "color": "Charcoal Grey",
    "pattern": "Solid",
    "material": "65% Wool, 35% Polyester",
    "fabricType": "Wool",
    "fabricWeight": "320 GSM",
    "neckline": "Collar",
    "sleeveLength": "Long Sleeve",
    "careInstructions": "Dry clean only. Steam to remove wrinkles."
  },
  "price": 14999,
  "costPrice": 8999,
  "quantity": 30,
  "minStockLevel": 5,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Premium",
  "season": "All Season",
  "tags": ["suit", "formal", "business", "wool"],
  "isFeatured": true,
  "freeShipping": true
}'

create_product '{
  "name": "Performance Training Set",
  "description": "Unleash your athletic potential with our complete training set. Includes a moisture-wicking short sleeve shirt and matching shorts designed for maximum performance. Advanced fabric technology pulls sweat away from skin while strategic mesh panels provide ventilation.",
  "category": "Men",
  "subcategory": "Activewear",
  "productType": "Sports",
  "brand": "ChainVanguard Performance",
  "apparelDetails": {
    "size": "M",
    "fit": "Regular Fit",
    "color": "Navy/Grey",
    "pattern": "Solid",
    "material": "88% Polyester, 12% Spandex",
    "fabricType": "Polyester",
    "fabricWeight": "180 GSM",
    "neckline": "Crew Neck",
    "sleeveLength": "Short Sleeve",
    "careInstructions": "Machine wash cold. Tumble dry low."
  },
  "price": 2999,
  "costPrice": 1799,
  "quantity": 100,
  "minStockLevel": 15,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Textiles",
  "season": "All Season",
  "tags": ["activewear", "sports", "training", "gym"],
  "isNewArrival": true,
  "freeShipping": true
}'

create_product '{
  "name": "Premium Cotton Pajama Set",
  "description": "Luxury sleep experience in premium cotton. This pajama set features ultra-soft 100% cotton fabric with a silky smooth finish. The set includes a button-front shirt with a chest pocket and matching drawstring pants with side pockets.",
  "category": "Men",
  "subcategory": "Sleepwear",
  "productType": "Casual",
  "brand": "ChainVanguard Comfort",
  "apparelDetails": {
    "size": "M",
    "fit": "Loose Fit",
    "color": "Navy Stripe",
    "pattern": "Striped",
    "material": "100% Cotton",
    "fabricType": "Cotton",
    "fabricWeight": "160 GSM",
    "neckline": "Collar",
    "sleeveLength": "Long Sleeve",
    "careInstructions": "Machine wash warm. Tumble dry low."
  },
  "price": 2499,
  "costPrice": 1499,
  "quantity": 80,
  "minStockLevel": 10,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Textiles",
  "season": "All Season",
  "tags": ["pajamas", "sleepwear", "cotton", "comfort"],
  "freeShipping": true
}'

create_product '{
  "name": "Cotton Boxer Briefs 3-Pack",
  "description": "Essential comfort for every day. These premium boxer briefs feature soft cotton fabric with just enough stretch for a secure, comfortable fit. Designed with a contoured pouch, flexible waistband, and tag-free construction.",
  "category": "Men",
  "subcategory": "Underwear",
  "productType": "Casual",
  "brand": "ChainVanguard Essentials",
  "apparelDetails": {
    "size": "M",
    "fit": "Regular Fit",
    "color": "Assorted",
    "pattern": "Solid",
    "material": "95% Cotton, 5% Elastane",
    "fabricType": "Cotton",
    "fabricWeight": "200 GSM",
    "neckline": "Other",
    "sleeveLength": "Other",
    "careInstructions": "Machine wash warm. Tumble dry low."
  },
  "price": 1299,
  "costPrice": 779,
  "quantity": 200,
  "minStockLevel": 30,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Textiles",
  "season": "All Season",
  "tags": ["underwear", "boxer-briefs", "cotton", "basics"],
  "freeShipping": true
}'

# ==========================================
# WOMEN'S COLLECTION (18 products)
# Valid subcategories: T-Shirts, Blouses, Shirts, Dresses, Skirts, Jeans, Trousers, Shorts, Jackets, Coats, Sweaters, Hoodies, Suits, Jumpsuits, Activewear, Sleepwear, Swimwear, Underwear
# ==========================================

echo -e "\n${CYAN}WOMEN'S COLLECTION (18)${NC}"
echo "=========================================="

create_product '{
  "name": "Soft Cotton V-Neck Tee",
  "description": "Everyday essential meets feminine style. This soft cotton V-neck tee features a flattering drape and comfortable fit. Made from premium ring-spun cotton for exceptional softness and durability. The classic V-neck elongates the neckline while the longer length provides comfortable coverage.",
  "category": "Women",
  "subcategory": "T-Shirts",
  "productType": "Casual",
  "brand": "ChainVanguard Women",
  "apparelDetails": {
    "size": "M",
    "fit": "Regular Fit",
    "color": "Dusty Rose",
    "pattern": "Solid",
    "material": "100% Ring-Spun Cotton",
    "fabricType": "Jersey",
    "fabricWeight": "160 GSM",
    "neckline": "V-Neck",
    "sleeveLength": "Short Sleeve",
    "careInstructions": "Machine wash cold. Tumble dry low."
  },
  "price": 1199,
  "costPrice": 719,
  "quantity": 150,
  "minStockLevel": 25,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Textiles",
  "season": "All Season",
  "tags": ["tshirt", "cotton", "casual", "basics"],
  "isNewArrival": true,
  "isSustainable": true,
  "freeShipping": true
}'

create_product '{
  "name": "Elegant Silk-Blend Blouse",
  "description": "Sophisticated elegance for the modern professional. This luxurious silk-blend blouse features a lustrous finish and fluid drape. Designed with a classic collar, button-front closure, and subtle pleating details. Long sleeves with button cuffs add versatility.",
  "category": "Women",
  "subcategory": "Blouses",
  "productType": "Formal",
  "brand": "ChainVanguard Professional",
  "apparelDetails": {
    "size": "M",
    "fit": "Regular Fit",
    "color": "Ivory",
    "pattern": "Solid",
    "material": "70% Silk, 30% Polyester",
    "fabricType": "Silk",
    "fabricWeight": "120 GSM",
    "neckline": "Collar",
    "sleeveLength": "Long Sleeve",
    "careInstructions": "Hand wash cold or dry clean."
  },
  "price": 3499,
  "costPrice": 2099,
  "quantity": 80,
  "minStockLevel": 12,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Textiles",
  "season": "All Season",
  "tags": ["blouse", "silk", "formal", "elegant"],
  "isFeatured": true,
  "freeShipping": true
}'

create_product '{
  "name": "Classic Button-Down Shirt",
  "description": "A versatile wardrobe staple. This classic button-down shirt features crisp cotton fabric that maintains a polished look throughout the day. Perfect for professional settings or casual weekends when paired with jeans.",
  "category": "Women",
  "subcategory": "Shirts",
  "productType": "Casual",
  "brand": "ChainVanguard Women",
  "apparelDetails": {
    "size": "M",
    "fit": "Regular Fit",
    "color": "White",
    "pattern": "Solid",
    "material": "100% Cotton",
    "fabricType": "Cotton",
    "fabricWeight": "140 GSM",
    "neckline": "Collar",
    "sleeveLength": "Long Sleeve",
    "careInstructions": "Machine wash warm. Iron on medium."
  },
  "price": 1999,
  "costPrice": 1199,
  "quantity": 100,
  "minStockLevel": 15,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Textiles",
  "season": "All Season",
  "tags": ["shirt", "cotton", "versatile", "classic"],
  "freeShipping": true
}'

create_product '{
  "name": "Cozy Cashmere-Blend Sweater",
  "description": "Luxurious warmth and ultimate softness. This premium cashmere-blend sweater offers cloud-like comfort with exceptional warmth-to-weight ratio. Features include a relaxed fit, ribbed crew neck, cuffs, and hem.",
  "category": "Women",
  "subcategory": "Sweaters",
  "productType": "Casual",
  "brand": "ChainVanguard Premium",
  "apparelDetails": {
    "size": "M",
    "fit": "Regular Fit",
    "color": "Camel",
    "pattern": "Solid",
    "material": "30% Cashmere, 70% Wool",
    "fabricType": "Wool",
    "fabricWeight": "260 GSM",
    "neckline": "Crew Neck",
    "sleeveLength": "Long Sleeve",
    "careInstructions": "Hand wash cold. Lay flat to dry."
  },
  "price": 5999,
  "costPrice": 3599,
  "quantity": 60,
  "minStockLevel": 10,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Textiles",
  "season": "Winter",
  "tags": ["sweater", "cashmere", "wool", "premium"],
  "isFeatured": true,
  "isSustainable": true,
  "freeShipping": true
}'

create_product '{
  "name": "Soft Fleece Zip-Up Hoodie",
  "description": "Comfort meets versatility in this essential zip-up hoodie. Features ultra-soft fleece interior for cozy warmth without bulk. Full-length zipper with protective chin guard, two front pockets, and adjustable hood with drawcords.",
  "category": "Women",
  "subcategory": "Hoodies",
  "productType": "Casual",
  "brand": "ChainVanguard Active",
  "apparelDetails": {
    "size": "M",
    "fit": "Regular Fit",
    "color": "Sage Green",
    "pattern": "Solid",
    "material": "80% Cotton, 20% Polyester",
    "fabricType": "Jersey",
    "fabricWeight": "300 GSM",
    "neckline": "Other",
    "sleeveLength": "Long Sleeve",
    "careInstructions": "Machine wash cold. Tumble dry low."
  },
  "price": 2499,
  "costPrice": 1499,
  "quantity": 120,
  "minStockLevel": 20,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Textiles",
  "season": "Autumn",
  "tags": ["hoodie", "fleece", "casual", "comfort"],
  "isNewArrival": true,
  "freeShipping": true
}'

create_product '{
  "name": "Classic Cropped Denim Jacket",
  "description": "A wardrobe icon reimagined. This cropped denim jacket features premium stretch denim for comfort and style. Classic details include button-front closure, chest pockets, and adjustable button cuffs. The shorter length creates a flattering silhouette.",
  "category": "Women",
  "subcategory": "Jackets",
  "productType": "Casual",
  "brand": "ChainVanguard Denim",
  "apparelDetails": {
    "size": "M",
    "fit": "Regular Fit",
    "color": "Light Blue",
    "pattern": "Solid",
    "material": "98% Cotton, 2% Elastane",
    "fabricType": "Denim",
    "fabricWeight": "320 GSM",
    "neckline": "Collar",
    "sleeveLength": "Long Sleeve",
    "careInstructions": "Machine wash cold separately. Tumble dry low."
  },
  "price": 3999,
  "costPrice": 2399,
  "quantity": 90,
  "minStockLevel": 15,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Textiles",
  "season": "Spring",
  "tags": ["jacket", "denim", "cropped", "casual"],
  "isFeatured": true,
  "freeShipping": true
}'

create_product '{
  "name": "Elegant Wool-Blend Wrap Coat",
  "description": "Timeless sophistication in every detail. This luxurious wrap coat features a premium wool blend fabric that provides warmth without weight. Elegant details include a shawl collar, self-tie belt, side slit pockets, and full lining.",
  "category": "Women",
  "subcategory": "Coats",
  "productType": "Formal",
  "brand": "ChainVanguard Premium",
  "apparelDetails": {
    "size": "M",
    "fit": "Regular Fit",
    "color": "Burgundy",
    "pattern": "Solid",
    "material": "60% Wool, 40% Polyester",
    "fabricType": "Wool",
    "fabricWeight": "420 GSM",
    "neckline": "Other",
    "sleeveLength": "Long Sleeve",
    "careInstructions": "Dry clean only. Store on padded hanger."
  },
  "price": 11999,
  "costPrice": 7199,
  "quantity": 40,
  "minStockLevel": 5,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Premium",
  "season": "Winter",
  "tags": ["coat", "wool", "wrap", "elegant"],
  "isFeatured": true,
  "freeShipping": true
}'

create_product '{
  "name": "High-Rise Skinny Jeans",
  "description": "The perfect fit for every body. These high-rise skinny jeans feature premium stretch denim that hugs your curves while providing all-day comfort. The higher rise provides a smoothing effect and elongates the legs.",
  "category": "Women",
  "subcategory": "Jeans",
  "productType": "Casual",
  "brand": "ChainVanguard Denim",
  "apparelDetails": {
    "size": "M",
    "fit": "Slim Fit",
    "color": "Dark Indigo",
    "pattern": "Solid",
    "material": "92% Cotton, 6% Polyester, 2% Elastane",
    "fabricType": "Denim",
    "fabricWeight": "320 GSM",
    "neckline": "Other",
    "sleeveLength": "Other",
    "careInstructions": "Machine wash cold inside out. Tumble dry low."
  },
  "price": 2999,
  "costPrice": 1799,
  "quantity": 120,
  "minStockLevel": 20,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Textiles",
  "season": "All Season",
  "tags": ["jeans", "denim", "skinny", "high-rise"],
  "isNewArrival": true,
  "freeShipping": true
}'

create_product '{
  "name": "Wide-Leg Palazzo Trousers",
  "description": "Effortless elegance in motion. These flowing wide-leg palazzo trousers feature a luxurious drape and comfortable elastic waistband. The high-rise design flatters the waistline while the wide leg creates an elongating effect.",
  "category": "Women",
  "subcategory": "Trousers",
  "productType": "Casual",
  "brand": "ChainVanguard Women",
  "apparelDetails": {
    "size": "M",
    "fit": "Loose Fit",
    "color": "Black",
    "pattern": "Solid",
    "material": "95% Polyester, 5% Spandex",
    "fabricType": "Polyester",
    "fabricWeight": "220 GSM",
    "neckline": "Other",
    "sleeveLength": "Other",
    "careInstructions": "Machine wash cold. Hang dry."
  },
  "price": 2799,
  "costPrice": 1679,
  "quantity": 100,
  "minStockLevel": 15,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Textiles",
  "season": "All Season",
  "tags": ["trousers", "palazzo", "wide-leg", "elegant"],
  "freeShipping": true
}'

create_product '{
  "name": "High-Waisted Denim Shorts",
  "description": "Summer staple with vintage vibes. These high-waisted denim shorts feature a flattering fit that sits at your natural waist. Crafted from quality denim with just enough stretch for comfort.",
  "category": "Women",
  "subcategory": "Shorts",
  "productType": "Casual",
  "brand": "ChainVanguard Denim",
  "apparelDetails": {
    "size": "M",
    "fit": "Regular Fit",
    "color": "Medium Blue",
    "pattern": "Solid",
    "material": "99% Cotton, 1% Elastane",
    "fabricType": "Denim",
    "fabricWeight": "300 GSM",
    "neckline": "Other",
    "sleeveLength": "Other",
    "careInstructions": "Machine wash cold. Tumble dry low."
  },
  "price": 1899,
  "costPrice": 1139,
  "quantity": 110,
  "minStockLevel": 18,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Textiles",
  "season": "Summer",
  "tags": ["shorts", "denim", "high-waisted", "summer"],
  "isNewArrival": true,
  "freeShipping": true
}'

create_product '{
  "name": "Pleated Midi Skirt",
  "description": "Feminine elegance with modern movement. This pleated midi skirt features accordion-style pleats that create beautiful flow with every step. Designed with a comfortable elastic waistband and lightweight, breathable fabric.",
  "category": "Women",
  "subcategory": "Skirts",
  "productType": "Casual",
  "brand": "ChainVanguard Women",
  "apparelDetails": {
    "size": "M",
    "fit": "Regular Fit",
    "color": "Blush Pink",
    "pattern": "Solid",
    "material": "100% Polyester",
    "fabricType": "Chiffon",
    "fabricWeight": "140 GSM",
    "neckline": "Other",
    "sleeveLength": "Other",
    "careInstructions": "Hand wash cold. Hang dry."
  },
  "price": 2299,
  "costPrice": 1379,
  "quantity": 90,
  "minStockLevel": 15,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Textiles",
  "season": "Spring",
  "tags": ["skirt", "pleated", "midi", "feminine"],
  "isFeatured": true,
  "freeShipping": true
}'

create_product '{
  "name": "Floral Wrap Maxi Dress",
  "description": "Romance meets versatility in this stunning wrap maxi dress. Features a beautiful floral print on soft, flowing fabric. The classic wrap design with adjustable tie allows for a customizable fit.",
  "category": "Women",
  "subcategory": "Dresses",
  "productType": "Party",
  "brand": "ChainVanguard Collection",
  "apparelDetails": {
    "size": "M",
    "fit": "Regular Fit",
    "color": "Floral Multi",
    "pattern": "Printed",
    "material": "100% Rayon",
    "fabricType": "Cotton",
    "fabricWeight": "160 GSM",
    "neckline": "V-Neck",
    "sleeveLength": "3/4 Sleeve",
    "careInstructions": "Machine wash cold. Hang dry."
  },
  "price": 3999,
  "costPrice": 2399,
  "quantity": 80,
  "minStockLevel": 12,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Textiles",
  "season": "Summer",
  "tags": ["dress", "maxi", "floral", "wrap"],
  "isFeatured": true,
  "isNewArrival": true,
  "freeShipping": true
}'

create_product '{
  "name": "Belted Wide-Leg Jumpsuit",
  "description": "One-piece wonder that makes getting dressed effortless. This chic jumpsuit features a flattering V-neckline, adjustable shoulder straps, and wide legs that elongate your frame. Includes a matching belt to define the waist.",
  "category": "Women",
  "subcategory": "Jumpsuits",
  "productType": "Casual",
  "brand": "ChainVanguard Collection",
  "apparelDetails": {
    "size": "M",
    "fit": "Regular Fit",
    "color": "Navy",
    "pattern": "Solid",
    "material": "95% Polyester, 5% Spandex",
    "fabricType": "Polyester",
    "fabricWeight": "240 GSM",
    "neckline": "V-Neck",
    "sleeveLength": "Sleeveless",
    "careInstructions": "Machine wash cold. Hang dry."
  },
  "price": 3799,
  "costPrice": 2279,
  "quantity": 70,
  "minStockLevel": 10,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Textiles",
  "season": "All Season",
  "tags": ["jumpsuit", "wide-leg", "elegant", "chic"],
  "isNewArrival": true,
  "freeShipping": true
}'

create_product '{
  "name": "Tailored Blazer Suit",
  "description": "Power dressing redefined. This tailored blazer suit features a structured jacket with notched lapels and matching trousers. Perfect for professional settings and formal occasions.",
  "category": "Women",
  "subcategory": "Suits",
  "productType": "Formal",
  "brand": "ChainVanguard Professional",
  "apparelDetails": {
    "size": "M",
    "fit": "Slim Fit",
    "color": "Black",
    "pattern": "Solid",
    "material": "65% Polyester, 35% Wool",
    "fabricType": "Wool",
    "fabricWeight": "300 GSM",
    "neckline": "Collar",
    "sleeveLength": "Long Sleeve",
    "careInstructions": "Dry clean only."
  },
  "price": 9999,
  "costPrice": 5999,
  "quantity": 40,
  "minStockLevel": 8,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Premium",
  "season": "All Season",
  "tags": ["suit", "blazer", "formal", "professional"],
  "isFeatured": true,
  "freeShipping": true
}'

create_product '{
  "name": "Seamless Workout Set",
  "description": "Performance meets style in this seamless workout set. Includes a supportive sports bra and high-waisted leggings designed with four-way stretch fabric. Moisture-wicking technology keeps you dry.",
  "category": "Women",
  "subcategory": "Activewear",
  "productType": "Sports",
  "brand": "ChainVanguard Active",
  "apparelDetails": {
    "size": "M",
    "fit": "Slim Fit",
    "color": "Charcoal/Pink",
    "pattern": "Solid",
    "material": "92% Nylon, 8% Spandex",
    "fabricType": "Polyester",
    "fabricWeight": "240 GSM",
    "neckline": "Other",
    "sleeveLength": "Sleeveless",
    "careInstructions": "Machine wash cold. Hang dry."
  },
  "price": 3499,
  "costPrice": 2099,
  "quantity": 100,
  "minStockLevel": 15,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Textiles",
  "season": "All Season",
  "tags": ["activewear", "leggings", "sports-bra", "gym"],
  "isNewArrival": true,
  "freeShipping": true
}'

create_product '{
  "name": "Satin Pajama Set",
  "description": "Luxury sleep experience in silky-smooth satin. This elegant pajama set features a button-front shirt with notched collar and matching shorts with elastic waistband. The satin fabric has a beautiful drape and lustrous finish.",
  "category": "Women",
  "subcategory": "Sleepwear",
  "productType": "Casual",
  "brand": "ChainVanguard Comfort",
  "apparelDetails": {
    "size": "M",
    "fit": "Regular Fit",
    "color": "Champagne",
    "pattern": "Solid",
    "material": "100% Polyester Satin",
    "fabricType": "Satin",
    "fabricWeight": "140 GSM",
    "neckline": "Collar",
    "sleeveLength": "Short Sleeve",
    "careInstructions": "Machine wash cold delicate. Hang dry."
  },
  "price": 2999,
  "costPrice": 1799,
  "quantity": 80,
  "minStockLevel": 12,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Textiles",
  "season": "All Season",
  "tags": ["pajamas", "satin", "sleepwear", "luxury"],
  "freeShipping": true
}'

create_product '{
  "name": "Two-Piece Swimsuit Set",
  "description": "Beach confidence in a flattering two-piece set. Features a supportive top with adjustable straps and removable padding, paired with comfortable high-waisted bottoms. Chlorine and fade-resistant fabric.",
  "category": "Women",
  "subcategory": "Swimwear",
  "productType": "Sports",
  "brand": "ChainVanguard Active",
  "apparelDetails": {
    "size": "M",
    "fit": "Regular Fit",
    "color": "Tropical Print",
    "pattern": "Printed",
    "material": "82% Nylon, 18% Spandex",
    "fabricType": "Polyester",
    "fabricWeight": "200 GSM",
    "neckline": "Other",
    "sleeveLength": "Sleeveless",
    "careInstructions": "Rinse after use. Hand wash cold. Lay flat to dry."
  },
  "price": 2799,
  "costPrice": 1679,
  "quantity": 90,
  "minStockLevel": 15,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Textiles",
  "season": "Summer",
  "tags": ["swimsuit", "bikini", "beach", "summer"],
  "isNewArrival": true,
  "freeShipping": true
}'

create_product '{
  "name": "Seamless Comfort Briefs 5-Pack",
  "description": "Ultimate comfort for everyday confidence. These seamless briefs feature bonded edges for a no-show look under any outfit. Ultra-soft stretch fabric moves with you while the mid-rise design provides comfortable coverage.",
  "category": "Women",
  "subcategory": "Underwear",
  "productType": "Casual",
  "brand": "ChainVanguard Essentials",
  "apparelDetails": {
    "size": "M",
    "fit": "Regular Fit",
    "color": "Nude Assorted",
    "pattern": "Solid",
    "material": "92% Nylon, 8% Spandex",
    "fabricType": "Cotton",
    "fabricWeight": "140 GSM",
    "neckline": "Other",
    "sleeveLength": "Other",
    "careInstructions": "Machine wash warm. Tumble dry low."
  },
  "price": 1499,
  "costPrice": 899,
  "quantity": 200,
  "minStockLevel": 30,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Textiles",
  "season": "All Season",
  "tags": ["underwear", "seamless", "briefs", "essentials"],
  "freeShipping": true
}'

# ==========================================
# KIDS' COLLECTION (10 products)
# Valid subcategories: T-Shirts, Shirts, Sweaters, Hoodies, Jeans, Trousers, Shorts, Dresses, Jackets, Coats, Activewear, Sleepwear, Underwear
# ==========================================

echo -e "\n${CYAN}KIDS' COLLECTION (10)${NC}"
echo "=========================================="

create_product '{
  "name": "Kids Graphic Cotton Tee",
  "description": "Fun and comfortable for active kids. This 100% cotton t-shirt features colorful graphics that kids love and durability parents appreciate. Pre-shrunk fabric maintains its shape wash after wash.",
  "category": "Kids",
  "subcategory": "T-Shirts",
  "productType": "Casual",
  "brand": "ChainVanguard Kids",
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
    "careInstructions": "Machine wash cold. Tumble dry low."
  },
  "price": 899,
  "costPrice": 539,
  "quantity": 150,
  "minStockLevel": 25,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Textiles",
  "season": "All Season",
  "tags": ["kids", "tshirt", "cotton", "graphic"],
  "isNewArrival": true,
  "freeShipping": true
}'

create_product '{
  "name": "Kids Button-Down Shirt",
  "description": "Smart casual style for young gentlemen. This button-down shirt features soft cotton fabric perfect for sensitive skin. Classic collar and button-front design with a chest pocket.",
  "category": "Kids",
  "subcategory": "Shirts",
  "productType": "Casual",
  "brand": "ChainVanguard Kids",
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
    "careInstructions": "Machine wash cold. Tumble dry low."
  },
  "price": 1299,
  "costPrice": 779,
  "quantity": 100,
  "minStockLevel": 15,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Textiles",
  "season": "All Season",
  "tags": ["kids", "shirt", "button-down", "cotton"],
  "freeShipping": true
}'

create_product '{
  "name": "Kids Pullover Sweater",
  "description": "Cozy warmth for chilly days. This soft pullover sweater features a comfortable crew neck and ribbed cuffs. Made from a cotton-acrylic blend that is warm yet breathable.",
  "category": "Kids",
  "subcategory": "Sweaters",
  "productType": "Casual",
  "brand": "ChainVanguard Kids",
  "apparelDetails": {
    "size": "8",
    "fit": "Regular Fit",
    "color": "Grey",
    "pattern": "Solid",
    "material": "60% Cotton, 40% Acrylic",
    "fabricType": "Cotton",
    "fabricWeight": "260 GSM",
    "neckline": "Crew Neck",
    "sleeveLength": "Long Sleeve",
    "careInstructions": "Machine wash cold. Tumble dry low."
  },
  "price": 1699,
  "costPrice": 1019,
  "quantity": 90,
  "minStockLevel": 15,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Textiles",
  "season": "Winter",
  "tags": ["kids", "sweater", "warm", "comfortable"],
  "freeShipping": true
}'

create_product '{
  "name": "Kids Zip-Up Hoodie",
  "description": "Essential layering piece for active kids. This zip-up hoodie features soft fleece interior for warmth without bulk. Full-length zipper makes it easy to put on and take off.",
  "category": "Kids",
  "subcategory": "Hoodies",
  "productType": "Casual",
  "brand": "ChainVanguard Kids",
  "apparelDetails": {
    "size": "8",
    "fit": "Regular Fit",
    "color": "Red",
    "pattern": "Solid",
    "material": "80% Cotton, 20% Polyester",
    "fabricType": "Jersey",
    "fabricWeight": "280 GSM",
    "neckline": "Other",
    "sleeveLength": "Long Sleeve",
    "careInstructions": "Machine wash cold. Tumble dry low."
  },
  "price": 1599,
  "costPrice": 959,
  "quantity": 120,
  "minStockLevel": 20,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Textiles",
  "season": "Autumn",
  "tags": ["kids", "hoodie", "fleece", "comfortable"],
  "isNewArrival": true,
  "freeShipping": true
}'

create_product '{
  "name": "Kids Windbreaker Jacket",
  "description": "Weather-ready protection for outdoor play. This lightweight windbreaker features water-resistant fabric that blocks wind and light rain. Zip-front closure with chin guard protects delicate skin.",
  "category": "Kids",
  "subcategory": "Jackets",
  "productType": "Sports",
  "brand": "ChainVanguard Kids",
  "apparelDetails": {
    "size": "8",
    "fit": "Regular Fit",
    "color": "Green",
    "pattern": "Solid",
    "material": "100% Polyester",
    "fabricType": "Polyester",
    "fabricWeight": "180 GSM",
    "neckline": "Other",
    "sleeveLength": "Long Sleeve",
    "careInstructions": "Machine wash cold. Hang dry."
  },
  "price": 2299,
  "costPrice": 1379,
  "quantity": 80,
  "minStockLevel": 12,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Textiles",
  "season": "Spring",
  "tags": ["kids", "jacket", "windbreaker", "outdoor"],
  "freeShipping": true
}'

create_product '{
  "name": "Kids Adjustable Waist Jeans",
  "description": "Growing with them in style. These durable jeans feature an adjustable interior waistband that adapts as kids grow. Made from quality denim with reinforced knees for extended wear.",
  "category": "Kids",
  "subcategory": "Jeans",
  "productType": "Casual",
  "brand": "ChainVanguard Kids",
  "apparelDetails": {
    "size": "8",
    "fit": "Regular Fit",
    "color": "Dark Blue",
    "pattern": "Solid",
    "material": "100% Cotton Denim",
    "fabricType": "Denim",
    "fabricWeight": "300 GSM",
    "neckline": "Other",
    "sleeveLength": "Other",
    "careInstructions": "Machine wash cold. Tumble dry low."
  },
  "price": 1699,
  "costPrice": 1019,
  "quantity": 110,
  "minStockLevel": 18,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Textiles",
  "season": "All Season",
  "tags": ["kids", "jeans", "denim", "adjustable"],
  "isNewArrival": true,
  "freeShipping": true
}'

create_product '{
  "name": "Kids School Trousers",
  "description": "Smart and practical for school days. These school trousers feature durable fabric that withstands daily wear. Wrinkle-resistant finish keeps them looking neat all day.",
  "category": "Kids",
  "subcategory": "Trousers",
  "productType": "School",
  "brand": "ChainVanguard Kids",
  "apparelDetails": {
    "size": "8",
    "fit": "Regular Fit",
    "color": "Navy",
    "pattern": "Solid",
    "material": "65% Polyester, 35% Cotton",
    "fabricType": "Cotton",
    "fabricWeight": "220 GSM",
    "neckline": "Other",
    "sleeveLength": "Other",
    "careInstructions": "Machine wash warm. Tumble dry low."
  },
  "price": 1499,
  "costPrice": 899,
  "quantity": 100,
  "minStockLevel": 15,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Textiles",
  "season": "All Season",
  "tags": ["kids", "trousers", "school", "uniform"],
  "freeShipping": true
}'

create_product '{
  "name": "Kids Athletic Shorts",
  "description": "Freedom to move and play. These athletic shorts feature moisture-wicking fabric that keeps kids cool and dry. Elastic waistband with interior drawcord for secure fit.",
  "category": "Kids",
  "subcategory": "Shorts",
  "productType": "Sports",
  "brand": "ChainVanguard Kids",
  "apparelDetails": {
    "size": "8",
    "fit": "Regular Fit",
    "color": "Black",
    "pattern": "Solid",
    "material": "100% Polyester",
    "fabricType": "Polyester",
    "fabricWeight": "140 GSM",
    "neckline": "Other",
    "sleeveLength": "Other",
    "careInstructions": "Machine wash cold. Tumble dry low."
  },
  "price": 999,
  "costPrice": 599,
  "quantity": 130,
  "minStockLevel": 20,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Textiles",
  "season": "Summer",
  "tags": ["kids", "shorts", "athletic", "sports"],
  "isNewArrival": true,
  "freeShipping": true
}'

create_product '{
  "name": "Kids Party Dress",
  "description": "Perfect for special occasions. This charming party dress features soft, comfortable fabric with a full skirt for twirling. Delicate details include a ribbon sash at waist and decorative accents.",
  "category": "Kids",
  "subcategory": "Dresses",
  "productType": "Party",
  "brand": "ChainVanguard Kids",
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
    "careInstructions": "Machine wash cold delicate. Hang dry."
  },
  "price": 2299,
  "costPrice": 1379,
  "quantity": 70,
  "minStockLevel": 10,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Textiles",
  "season": "All Season",
  "tags": ["kids", "dress", "party", "special-occasion"],
  "isFeatured": true,
  "freeShipping": true
}'

create_product '{
  "name": "Kids Sports Training Set",
  "description": "Built for young athletes. This complete training set includes a moisture-wicking t-shirt and coordinating shorts. Breathable fabric keeps kids comfortable during intense activity.",
  "category": "Kids",
  "subcategory": "Activewear",
  "productType": "Sports",
  "brand": "ChainVanguard Kids",
  "apparelDetails": {
    "size": "8",
    "fit": "Regular Fit",
    "color": "Blue/White",
    "pattern": "Solid",
    "material": "100% Polyester",
    "fabricType": "Polyester",
    "fabricWeight": "160 GSM",
    "neckline": "Crew Neck",
    "sleeveLength": "Short Sleeve",
    "careInstructions": "Machine wash cold. Tumble dry low."
  },
  "price": 1499,
  "costPrice": 899,
  "quantity": 100,
  "minStockLevel": 15,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Textiles",
  "season": "All Season",
  "tags": ["kids", "activewear", "sports", "training"],
  "isNewArrival": true,
  "freeShipping": true
}'

# ==========================================
# UNISEX COLLECTION (6 products)
# Valid subcategories: T-Shirts, Hoodies, Sweaters, Jackets, Activewear, Sleepwear
# ==========================================

echo -e "\n${CYAN}UNISEX COLLECTION (6)${NC}"
echo "=========================================="

create_product '{
  "name": "Unisex Essential Cotton Tee",
  "description": "The ultimate wardrobe staple for everyone. This unisex t-shirt features premium ring-spun cotton that gets softer with every wash. Classic crew neck and relaxed fit work for all body types.",
  "category": "Unisex",
  "subcategory": "T-Shirts",
  "productType": "Casual",
  "brand": "ChainVanguard Essentials",
  "apparelDetails": {
    "size": "M",
    "fit": "Regular Fit",
    "color": "Black",
    "pattern": "Solid",
    "material": "100% Ring-Spun Cotton",
    "fabricType": "Jersey",
    "fabricWeight": "180 GSM",
    "neckline": "Crew Neck",
    "sleeveLength": "Short Sleeve",
    "careInstructions": "Machine wash cold. Tumble dry low."
  },
  "price": 1099,
  "costPrice": 659,
  "quantity": 200,
  "minStockLevel": 30,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Textiles",
  "season": "All Season",
  "tags": ["unisex", "tshirt", "cotton", "basics"],
  "isNewArrival": true,
  "isSustainable": true,
  "freeShipping": true
}'

create_product '{
  "name": "Unisex Pullover Hoodie",
  "description": "Classic comfort that never goes out of style. This pullover hoodie features a soft cotton-poly fleece blend that provides warmth without weight. Spacious kangaroo pocket keeps essentials close.",
  "category": "Unisex",
  "subcategory": "Hoodies",
  "productType": "Casual",
  "brand": "ChainVanguard Comfort",
  "apparelDetails": {
    "size": "M",
    "fit": "Regular Fit",
    "color": "Charcoal",
    "pattern": "Solid",
    "material": "80% Cotton, 20% Polyester",
    "fabricType": "Jersey",
    "fabricWeight": "320 GSM",
    "neckline": "Other",
    "sleeveLength": "Long Sleeve",
    "careInstructions": "Machine wash cold. Tumble dry low."
  },
  "price": 2499,
  "costPrice": 1499,
  "quantity": 150,
  "minStockLevel": 25,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Textiles",
  "season": "Autumn",
  "tags": ["unisex", "hoodie", "pullover", "comfort"],
  "isFeatured": true,
  "isNewArrival": true,
  "freeShipping": true
}'

create_product '{
  "name": "Unisex Crew Neck Sweater",
  "description": "Timeless warmth for everyone. This classic crew neck sweater features soft knit fabric perfect for layering. Comfortable fit suits all body types and styles.",
  "category": "Unisex",
  "subcategory": "Sweaters",
  "productType": "Casual",
  "brand": "ChainVanguard Comfort",
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
    "careInstructions": "Machine wash cold. Lay flat to dry."
  },
  "price": 2799,
  "costPrice": 1679,
  "quantity": 100,
  "minStockLevel": 15,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Textiles",
  "season": "Winter",
  "tags": ["unisex", "sweater", "knit", "warm"],
  "freeShipping": true
}'

create_product '{
  "name": "Unisex Lightweight Windbreaker",
  "description": "Weather protection meets contemporary style. This versatile windbreaker features water-resistant nylon fabric that blocks wind and light rain. Full-zip front with interior storm flap.",
  "category": "Unisex",
  "subcategory": "Jackets",
  "productType": "Sports",
  "brand": "ChainVanguard Active",
  "apparelDetails": {
    "size": "M",
    "fit": "Regular Fit",
    "color": "Navy/White",
    "pattern": "Solid",
    "material": "100% Nylon",
    "fabricType": "Polyester",
    "fabricWeight": "160 GSM",
    "neckline": "Other",
    "sleeveLength": "Long Sleeve",
    "careInstructions": "Machine wash cold. Hang dry."
  },
  "price": 3499,
  "costPrice": 2099,
  "quantity": 100,
  "minStockLevel": 15,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Textiles",
  "season": "Spring",
  "tags": ["unisex", "windbreaker", "jacket", "water-resistant"],
  "isNewArrival": true,
  "freeShipping": true
}'

create_product '{
  "name": "Unisex Performance Joggers",
  "description": "Comfort meets functionality in these versatile joggers. Features moisture-wicking fabric that keeps you dry during workouts or casual wear. Tapered leg with elastic cuffs creates a modern silhouette.",
  "category": "Unisex",
  "subcategory": "Activewear",
  "productType": "Sports",
  "brand": "ChainVanguard Active",
  "apparelDetails": {
    "size": "M",
    "fit": "Regular Fit",
    "color": "Black",
    "pattern": "Solid",
    "material": "88% Polyester, 12% Spandex",
    "fabricType": "Polyester",
    "fabricWeight": "240 GSM",
    "neckline": "Other",
    "sleeveLength": "Other",
    "careInstructions": "Machine wash cold. Tumble dry low."
  },
  "price": 2299,
  "costPrice": 1379,
  "quantity": 120,
  "minStockLevel": 20,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Textiles",
  "season": "All Season",
  "tags": ["unisex", "joggers", "activewear", "performance"],
  "isFeatured": true,
  "freeShipping": true
}'

create_product '{
  "name": "Unisex Lounge Set",
  "description": "Relaxation redefined with this comfortable lounge set. Includes a loose-fitting pullover and matching relaxed-fit pants. Ultra-soft cotton blend fabric feels gentle against skin.",
  "category": "Unisex",
  "subcategory": "Sleepwear",
  "productType": "Casual",
  "brand": "ChainVanguard Comfort",
  "apparelDetails": {
    "size": "M",
    "fit": "Loose Fit",
    "color": "Grey Melange",
    "pattern": "Solid",
    "material": "95% Cotton, 5% Spandex",
    "fabricType": "Jersey",
    "fabricWeight": "220 GSM",
    "neckline": "Crew Neck",
    "sleeveLength": "Long Sleeve",
    "careInstructions": "Machine wash warm. Tumble dry low."
  },
  "price": 2999,
  "costPrice": 1799,
  "quantity": 90,
  "minStockLevel": 15,
  "countryOfOrigin": "Pakistan",
  "manufacturer": "ChainVanguard Textiles",
  "season": "All Season",
  "tags": ["unisex", "loungewear", "sleepwear", "comfortable"],
  "isNewArrival": true,
  "freeShipping": true
}'

echo ""
echo "=========================================="
echo "📊 FINAL SUMMARY"
echo "=========================================="
echo -e "${GREEN}✅ Success: $SUCCESS / 47${NC}"
echo -e "${RED}❌ Failed: $FAILED / 47${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 Complete! All 47 products created!${NC}"
    echo ""
    echo "Product Distribution:"
    echo "  • Men: 13 products"
    echo "  • Women: 18 products"
    echo "  • Kids: 10 products"
    echo "  • Unisex: 6 products"
    echo ""
    exit 0
else
    echo -e "${RED}⚠️  $FAILED products failed${NC}"
    exit 1
fi