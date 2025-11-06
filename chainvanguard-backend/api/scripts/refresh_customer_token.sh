#!/bin/bash

source /Users/atifjalal/Desktop/chainvanguard-nextjs/chainvanguard-backend/api/.env

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

BASE_URL="http://localhost:3001"
ENV_FILE="/Users/atifjalal/Desktop/chainvanguard-nextjs/chainvanguard-backend/api/.env"

echo "🔄 Refreshing All User Tokens"
echo "=============================="
echo ""

# Function to update or add env variable
update_env() {
    local key=$1
    local value=$2
    
    if grep -q "^${key}=" "$ENV_FILE"; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s|^${key}=.*|${key}=${value}|" "$ENV_FILE"
        else
            sed -i "s|^${key}=.*|${key}=${value}|" "$ENV_FILE"
        fi
    else
        echo "${key}=${value}" >> "$ENV_FILE"
    fi
}

# Function to refresh token for a user
refresh_user_token() {
    local role=$1
    local wallet=$2
    local password=$3
    local role_upper=$(echo "$role" | tr '[:lower:]' '[:upper:]')
    
    echo -e "${BLUE}Refreshing ${role_upper} token...${NC}"
    echo "Wallet: $wallet"
    
    LOGIN_RESPONSE=$(curl -s -X POST ${BASE_URL}/api/auth/login/password \
      -H "Content-Type: application/json" \
      -d "{
        \"address\": \"$wallet\",
        \"password\": \"$password\"
      }")
    
    # Extract token
    NEW_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.token // .token // empty')
    
    if [ -n "$NEW_TOKEN" ] && [ "$NEW_TOKEN" != "null" ]; then
        echo -e "${GREEN}✅ Login successful!${NC}"
        
        # Get profile to extract IDs
        PROFILE=$(curl -s -X GET ${BASE_URL}/api/auth/profile \
          -H "Authorization: Bearer $NEW_TOKEN")
        
        USER_ID=$(echo "$PROFILE" | jq -r '.data._id // .data.user._id // .data.id // .data.user.id // empty')
        WALLET_ADDR=$(echo "$PROFILE" | jq -r '.data.walletAddress // .data.user.walletAddress // .data.wallet.address // empty')
        USER_NAME=$(echo "$PROFILE" | jq -r '.data.name // .data.user.name // empty')
        
        # Update .env file
        echo "Updating .env file..."
        update_env "${role_upper}_TOKEN" "$NEW_TOKEN"
        update_env "${role_upper}_USER_ID" "$USER_ID"
        update_env "${role_upper}_WALLET" "$WALLET_ADDR"
        update_env "${role_upper}_ID" "$USER_ID"
        
        echo -e "${GREEN}✅ ${role_upper} credentials updated in .env${NC}"
        echo ""
        echo "New ${role_upper} Token: ${NEW_TOKEN:0:30}..."
        echo "User ID: $USER_ID"
        echo "Wallet: $WALLET_ADDR"
        echo "Name: $USER_NAME"
        echo ""
        
        # Test token
        BALANCE=$(curl -s -X GET ${BASE_URL}/api/wallet/balance \
          -H "Authorization: Bearer $NEW_TOKEN")
        
        if echo "$BALANCE" | grep -q "success"; then
            echo -e "${GREEN}✅ Token verified successfully${NC}"
        else
            echo -e "${YELLOW}⚠️  Token verification failed${NC}"
        fi
        
        return 0
    else
        echo -e "${RED}❌ Login failed${NC}"
        echo "Response: $LOGIN_RESPONSE"
        return 1
    fi
}

# Refresh Supplier Token
echo "1️⃣  SUPPLIER (Faisalabad Textile Mills)"
echo "========================================="
refresh_user_token "supplier" "$SUPPLIER_WALLET" "$SUPPLIER_PASSWORD"
sleep 1

# Refresh Vendor Token
echo ""
echo "2️⃣  VENDOR (Karachi Fashion Boutique)"
echo "========================================="
refresh_user_token "vendor" "$VENDOR_WALLET" "$VENDOR_PASSWORD"
sleep 1

# Refresh Customer Token
echo ""
echo "3️⃣  CUSTOMER (Lahore Shopper)"
echo "========================================="
refresh_user_token "customer" "$CUSTOMER_WALLET" "$CUSTOMER_PASSWORD"
sleep 1

# Refresh Expert Token
echo ""
echo "4️⃣  EXPERT (Islamabad Blockchain Specialist)"
echo "========================================="
refresh_user_token "expert" "$EXPERT_WALLET" "$EXPERT_PASSWORD"
sleep 1

echo ""
echo "=============================================="
echo -e "${GREEN}✅ All tokens refreshed successfully!${NC}"
echo "=============================================="
echo ""
echo "Updated credentials are now available in .env file"
echo "You can now use these tokens in your API requests"
echo ""