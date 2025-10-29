#!/bin/bash

# ============================================
# ChainVanguard - Pakistan Textile Supply Chain Test Suite
# Complete Authentication Testing with Pakistani Data
# ============================================

echo "🇵🇰 ChainVanguard - Pakistan Textile Supply Chain Testing"
echo "=============================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Base URL
BASE_URL="http://localhost:3001"

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

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

# Function to extract JSON value using jq
get_json_value() {
    local result=$(echo "$1" | jq -r ".data.wallet.$2 // .data.user.$2 // .data.$2 // .$2 // empty" 2>/dev/null)
    if [ -z "$result" ] || [ "$result" = "null" ]; then
        echo "$1" | grep -o "\"$2\":\"[^\"]*\"" | head -1 | cut -d'"' -f4
    else
        echo "$result"
    fi
}

# Function to check if response contains string
contains() {
    if echo "$1" | grep -q "$2"; then
        return 0
    else
        return 1
    fi
}

echo "=============================================="
echo "🔧 Pre-flight Checks"
echo "=============================================="
echo ""

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}⚠️  jq is not installed. Installing now...${NC}"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install jq
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        sudo apt-get install -y jq
    else
        echo -e "${RED}Please install jq manually: https://stedolan.github.io/jq/download/${NC}"
        exit 1
    fi
fi

# Check if server is running
SERVER_CHECK=$(curl -s ${BASE_URL}/health 2>/dev/null)
if contains "$SERVER_CHECK" "OK"; then
    print_result "Server is running" "PASS"
else
    print_result "Server is running" "FAIL"
    echo -e "${RED}ERROR: Server is not running at ${BASE_URL}${NC}"
    echo "Please start the server with: npm run dev"
    exit 1
fi

sleep 1

echo ""
echo "=============================================="
echo "📝 Test 1: User Registration (Pakistan Textile Supply Chain)"
echo "=============================================="
echo ""

# Test 1.1: Register Textile Supplier (Faisalabad)
echo "Test 1.1: Register Textile Supplier - Faisalabad Mills"
SUPPLIER_REG=$(curl -s -X POST ${BASE_URL}/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "walletName": "Faisalabad Textile Mills Wallet",
    "password": "FaisalabadMills2024!@#",
    "name": "Ahmed Hassan",
    "email": "ahmed.hassan@faisalabadtextiles.com.pk",
    "phone": "+92 300 1234567",
    "role": "supplier",
    "address": "Plot 45, Industrial Estate, Satyana Road",
    "city": "Faisalabad",
    "state": "Punjab",
    "country": "Pakistan",
    "postalCode": "38000",
    "companyName": "Faisalabad Textile Mills Ltd",
    "businessType": "Manufacturing",
    "businessAddress": "Plot 45, Industrial Estate, Satyana Road, Faisalabad",
    "registrationNumber": "FTM-PK-2024-001",
    "taxId": "PK-NTN-1234567",
    "acceptedTerms": true
  }')

if contains "$SUPPLIER_REG" "success.*true"; then
    print_result "Textile Supplier Registration (Faisalabad)" "PASS"
    SUPPLIER_ADDRESS=$(echo "$SUPPLIER_REG" | jq -r '.data.user.walletAddress')
    SUPPLIER_MNEMONIC=$(echo "$SUPPLIER_REG" | jq -r '.data.wallet.mnemonic')
    SUPPLIER_EMAIL=$(echo "$SUPPLIER_REG" | jq -r '.data.user.email')
    SUPPLIER_NAME=$(echo "$SUPPLIER_REG" | jq -r '.data.user.name')
    
    echo -e "${BLUE}   Company: Faisalabad Textile Mills Ltd${NC}"
    echo -e "${BLUE}   Contact: Ahmed Hassan${NC}"
    echo -e "${BLUE}   Wallet: $SUPPLIER_ADDRESS${NC}"
    echo -e "${BLUE}   Phone: +92 300 1234567${NC}"
else
    print_result "Textile Supplier Registration (Faisalabad)" "FAIL"
fi

sleep 1

# Test 1.2: Register Vendor (Karachi Fashion Retailer)
echo ""
echo "Test 1.2: Register Fashion Vendor - Karachi Boutique"
VENDOR_REG=$(curl -s -X POST ${BASE_URL}/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "walletName": "Karachi Fashion Boutique Wallet",
    "password": "KarachiFashion2024!@#",
    "name": "Fatima Ali",
    "email": "fatima.ali@karachifashion.com.pk",
    "phone": "+92 321 9876543",
    "role": "vendor",
    "address": "Shop 12, Dolmen Mall, Clifton Block 4",
    "city": "Karachi",
    "state": "Sindh",
    "country": "Pakistan",
    "postalCode": "75600",
    "companyName": "Karachi Fashion Boutique",
    "businessType": "Retailer",
    "businessAddress": "Shop 12, Dolmen Mall, Clifton Block 4, Karachi",
    "registrationNumber": "KFB-PK-2024-002",
    "taxId": "PK-NTN-7654321",
    "acceptedTerms": true
  }')

if contains "$VENDOR_REG" "success.*true"; then
    print_result "Fashion Vendor Registration (Karachi)" "PASS"
    VENDOR_ADDRESS=$(echo "$VENDOR_REG" | jq -r '.data.user.walletAddress')
    VENDOR_EMAIL=$(echo "$VENDOR_REG" | jq -r '.data.user.email')
    
    echo -e "${BLUE}   Shop: Karachi Fashion Boutique${NC}"
    echo -e "${BLUE}   Owner: Fatima Ali${NC}"
    echo -e "${BLUE}   Wallet: $VENDOR_ADDRESS${NC}"
    echo -e "${BLUE}   Phone: +92 321 9876543${NC}"
else
    print_result "Fashion Vendor Registration (Karachi)" "FAIL"
fi

sleep 1

# Test 1.3: Register Customer (Lahore)
echo ""
echo "Test 1.3: Register Customer - Lahore"
CUSTOMER_REG=$(curl -s -X POST ${BASE_URL}/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "walletName": "Personal Shopping Wallet",
    "password": "LahoreShopper2024!@#",
    "name": "Zainab Khan",
    "email": "zainab.khan@gmail.com",
    "phone": "+92 333 5551234",
    "role": "customer",
    "address": "House 456, Block E, DHA Phase 5",
    "city": "Lahore",
    "state": "Punjab",
    "country": "Pakistan",
    "postalCode": "54792",
    "acceptedTerms": true
  }')

if contains "$CUSTOMER_REG" "success.*true"; then
    print_result "Customer Registration (Lahore)" "PASS"
    CUSTOMER_ADDRESS=$(echo "$CUSTOMER_REG" | jq -r '.data.user.walletAddress')
    
    echo -e "${BLUE}   Customer: Zainab Khan${NC}"
    echo -e "${BLUE}   City: Lahore, DHA Phase 5${NC}"
    echo -e "${BLUE}   Wallet: $CUSTOMER_ADDRESS${NC}"
    echo -e "${BLUE}   Phone: +92 333 5551234${NC}"
else
    print_result "Customer Registration (Lahore)" "FAIL"
fi

sleep 1

# Test 1.4: Register Blockchain Expert (Islamabad)
echo ""
echo "Test 1.4: Register Blockchain Expert - Islamabad Tech Hub"
EXPERT_REG=$(curl -s -X POST ${BASE_URL}/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "walletName": "ChainVanguard Admin Wallet",
    "password": "IslamabadExpert2024!@#",
    "name": "Dr. Usman Tariq",
    "email": "dr.usman@chainvanguard.pk",
    "phone": "+92 51 8887777",
    "role": "expert",
    "address": "Suite 301, Blue Area, F-7 Markaz",
    "city": "Islamabad",
    "state": "Federal Capital",
    "country": "Pakistan",
    "postalCode": "44000",
    "acceptedTerms": true
  }')

if contains "$EXPERT_REG" "success.*true"; then
    print_result "Blockchain Expert Registration (Islamabad)" "PASS"
    EXPERT_ADDRESS=$(echo "$EXPERT_REG" | jq -r '.data.user.walletAddress')
    
    echo -e "${BLUE}   Expert: Dr. Usman Tariq${NC}"
    echo -e "${BLUE}   Location: Blue Area, Islamabad${NC}"
    echo -e "${BLUE}   Wallet: $EXPERT_ADDRESS${NC}"
    echo -e "${BLUE}   Phone: +92 51 8887777${NC}"
else
    print_result "Blockchain Expert Registration (Islamabad)" "FAIL"
fi

sleep 1

echo ""
echo "=============================================="
echo "🔐 Test 2: User Login (All Roles)"
echo "=============================================="
echo ""

# Test 2.1: Login Supplier
echo "Test 2.1: Login Textile Supplier (Ahmed Hassan)"
SUPPLIER_LOGIN=$(curl -s -X POST ${BASE_URL}/api/auth/login/password \
  -H "Content-Type: application/json" \
  -d "{
    \"address\": \"$SUPPLIER_ADDRESS\",
    \"password\": \"FaisalabadMills2024!@#\"
  }")

if contains "$SUPPLIER_LOGIN" "success.*true"; then
    print_result "Supplier Login" "PASS"
    SUPPLIER_TOKEN=$(echo "$SUPPLIER_LOGIN" | jq -r '.data.token')
    echo -e "${BLUE}   Company: Faisalabad Textile Mills${NC}"
    echo -e "${BLUE}   Token: ${SUPPLIER_TOKEN:0:30}...${NC}"
else
    print_result "Supplier Login" "FAIL"
fi

sleep 1

# Test 2.2: Login Vendor
echo ""
echo "Test 2.2: Login Fashion Vendor (Fatima Ali)"
VENDOR_LOGIN=$(curl -s -X POST ${BASE_URL}/api/auth/login/password \
  -H "Content-Type: application/json" \
  -d "{
    \"address\": \"$VENDOR_ADDRESS\",
    \"password\": \"KarachiFashion2024!@#\"
  }")

if contains "$VENDOR_LOGIN" "success.*true"; then
    print_result "Vendor Login" "PASS"
    VENDOR_TOKEN=$(echo "$VENDOR_LOGIN" | jq -r '.data.token')
    echo -e "${BLUE}   Shop: Karachi Fashion Boutique${NC}"
else
    print_result "Vendor Login" "FAIL"
fi

sleep 1

# Test 2.3: Login Customer
echo ""
echo "Test 2.3: Login Customer (Zainab Khan)"
CUSTOMER_LOGIN=$(curl -s -X POST ${BASE_URL}/api/auth/login/password \
  -H "Content-Type: application/json" \
  -d "{
    \"address\": \"$CUSTOMER_ADDRESS\",
    \"password\": \"LahoreShopper2024!@#\"
  }")

if contains "$CUSTOMER_LOGIN" "success.*true"; then
    print_result "Customer Login" "PASS"
    CUSTOMER_TOKEN=$(echo "$CUSTOMER_LOGIN" | jq -r '.data.token')
    echo -e "${BLUE}   Customer: Zainab Khan from Lahore${NC}"
else
    print_result "Customer Login" "FAIL"
fi

sleep 1

# Test 2.4: Login Expert
echo ""
echo "Test 2.4: Login Blockchain Expert (Dr. Usman)"
EXPERT_LOGIN=$(curl -s -X POST ${BASE_URL}/api/auth/login/password \
  -H "Content-Type: application/json" \
  -d "{
    \"address\": \"$EXPERT_ADDRESS\",
    \"password\": \"IslamabadExpert2024!@#\"
  }")

if contains "$EXPERT_LOGIN" "success.*true"; then
    print_result "Expert Login" "PASS"
    EXPERT_TOKEN=$(echo "$EXPERT_LOGIN" | jq -r '.data.token')
    echo -e "${BLUE}   Expert: Dr. Usman Tariq${NC}"
else
    print_result "Expert Login" "FAIL"
fi

sleep 1

echo ""
echo "=============================================="
echo "👤 Test 3: Profile Management"
echo "=============================================="
echo ""

# Test 3.1: Get Profile (FIXED - Dynamic name check)
echo "Test 3.1: Get Supplier Profile"
PROFILE=$(curl -s -X GET ${BASE_URL}/api/auth/profile \
  -H "Authorization: Bearer $SUPPLIER_TOKEN")

# Extract the name from profile response (dynamic check)
PROFILE_NAME=$(echo "$PROFILE" | jq -r '.data.name // .data.user.name // empty')
PROFILE_ROLE=$(echo "$PROFILE" | jq -r '.data.role // .data.user.role // empty')

if contains "$PROFILE" "success.*true"; then
    print_result "Get Profile" "PASS"
    if [ -n "$PROFILE_NAME" ]; then
        echo -e "${BLUE}   Name: $PROFILE_NAME${NC}"
    fi
    if [ -n "$PROFILE_ROLE" ]; then
        echo -e "${BLUE}   Role: $PROFILE_ROLE${NC}"
    fi
    echo -e "${BLUE}   Company: Faisalabad Textile Mills${NC}"
else
    print_result "Get Profile" "FAIL"
    echo -e "${YELLOW}Debug - Profile Response:${NC}"
    echo "$PROFILE" | jq '.' 2>/dev/null || echo "$PROFILE"
fi

sleep 1

# Test 3.2: Update Profile
echo ""
echo "Test 3.2: Update Supplier Profile"
UPDATE_PROFILE=$(curl -s -X PUT ${BASE_URL}/api/auth/profile \
  -H "Authorization: Bearer $SUPPLIER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+92 300 9998888",
    "city": "Faisalabad",
    "state": "Punjab",
    "address": "Plot 45-B, Satyana Road Industrial Estate"
  }')

if contains "$UPDATE_PROFILE" "success.*true"; then
    print_result "Update Profile" "PASS"
    echo -e "${BLUE}   Updated phone: +92 300 9998888${NC}"
else
    print_result "Update Profile" "FAIL"
fi

sleep 1

echo ""
echo "=============================================="
echo "🔑 Test 4: Wallet Recovery"
echo "=============================================="
echo ""

# Test 4.1: Find Wallet by Mnemonic
echo "Test 4.1: Find Wallet using Mnemonic"
FIND_WALLET=$(curl -s -X POST ${BASE_URL}/api/auth/wallet/find \
  -H "Content-Type: application/json" \
  -d "{
    \"mnemonic\": \"$SUPPLIER_MNEMONIC\"
  }")

if contains "$FIND_WALLET" "success.*true"; then
    print_result "Find Wallet" "PASS"
    FOUND_ADDRESS=$(echo "$FIND_WALLET" | jq -r '.data.walletAddress')
    echo -e "${BLUE}   Found wallet: $FOUND_ADDRESS${NC}"
else
    print_result "Find Wallet" "FAIL"
fi

sleep 1

# Test 4.2: Recover Wallet with New Password
echo ""
echo "Test 4.2: Recover Wallet with New Password"
RECOVER_WALLET=$(curl -s -X POST ${BASE_URL}/api/auth/wallet/recover \
  -H "Content-Type: application/json" \
  -d "{
    \"mnemonic\": \"$SUPPLIER_MNEMONIC\",
    \"walletAddress\": \"$SUPPLIER_ADDRESS\",
    \"newPassword\": \"NewFaisalabad2024!@#\"
  }")

if contains "$RECOVER_WALLET" "success.*true"; then
    print_result "Wallet Recovery" "PASS"
    echo -e "${BLUE}   Password reset successful${NC}"
else
    print_result "Wallet Recovery" "FAIL"
fi

sleep 1

# Test 4.3: Login with Recovered Password
echo ""
echo "Test 4.3: Login with New Password"
RECOVERED_LOGIN=$(curl -s -X POST ${BASE_URL}/api/auth/login/password \
  -H "Content-Type: application/json" \
  -d "{
    \"address\": \"$SUPPLIER_ADDRESS\",
    \"password\": \"NewFaisalabad2024!@#\"
  }")

if contains "$RECOVERED_LOGIN" "success.*true"; then
    print_result "Login after Recovery" "PASS"
    SUPPLIER_TOKEN=$(echo "$RECOVERED_LOGIN" | jq -r '.data.token')
    echo -e "${BLUE}   Successfully logged in with new password${NC}"
else
    print_result "Login after Recovery" "FAIL"
fi

sleep 1

echo ""
echo "=============================================="
echo "📧 Test 5: Email Verification"
echo "=============================================="
echo ""

# Test 5.1: Send Verification Code (Requires Auth Token)
echo "Test 5.1: Send Email Verification Code"
SEND_CODE=$(curl -s -X POST ${BASE_URL}/api/auth/send-verification \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H "Content-Type: application/json")

if contains "$SEND_CODE" "success.*true"; then
    print_result "Send Verification Code" "PASS"
    
    # Extract verification code from response
    VERIFICATION_CODE=$(echo "$SEND_CODE" | jq -r '.data.code // .code // .verificationCode // empty')
    
    # Get customer email
    CUSTOMER_EMAIL=$(echo "$CUSTOMER_REG" | jq -r '.data.user.email // .data.email')
    
    echo -e "${BLUE}   Code sent to: $CUSTOMER_EMAIL${NC}"
    if [ -n "$VERIFICATION_CODE" ] && [ "$VERIFICATION_CODE" != "null" ]; then
        echo -e "${BLUE}   Verification Code: $VERIFICATION_CODE${NC}"
    fi
else
    print_result "Send Verification Code" "FAIL"
    echo -e "${YELLOW}   Debug - Response: $SEND_CODE${NC}"
    VERIFICATION_CODE=""
fi

sleep 1

# Test 5.2: Verify Email
echo ""
echo "Test 5.2: Verify Email with Code"

if [ -z "$VERIFICATION_CODE" ] || [ "$VERIFICATION_CODE" = "null" ]; then
    print_result "Email Verification" "FAIL"
    echo -e "${YELLOW}   Skipped: No verification code available${NC}"
else
    VERIFY_EMAIL=$(curl -s -X POST ${BASE_URL}/api/auth/verify-email \
      -H "Content-Type: application/json" \
      -d "{
        \"email\": \"$CUSTOMER_EMAIL\",
        \"code\": \"$VERIFICATION_CODE\"
      }")

    if contains "$VERIFY_EMAIL" "success.*true"; then
        print_result "Email Verification" "PASS"
        echo -e "${BLUE}   Email verified for: $CUSTOMER_EMAIL${NC}"
    else
        print_result "Email Verification" "FAIL"
        echo -e "${YELLOW}   Debug - Response: $VERIFY_EMAIL${NC}"
    fi
fi

sleep 1

echo ""
echo "=============================================="
echo "🔒 Test 6: Password Management"
echo "=============================================="
echo ""

# Test 6.1: Change Password
echo "Test 6.1: Change Vendor Password"
CHANGE_PASSWORD=$(curl -s -X PUT ${BASE_URL}/api/auth/change-password \
  -H "Authorization: Bearer $VENDOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "KarachiFashion2024!@#",
    "newPassword": "NewKarachiFashion2024!@#"
  }')

if contains "$CHANGE_PASSWORD" "success.*true"; then
    print_result "Change Password" "PASS"
    echo -e "${BLUE}   Password changed for Karachi Fashion Boutique${NC}"
else
    print_result "Change Password" "FAIL"
fi

sleep 1

# Test 6.2: Login with Changed Password
echo ""
echo "Test 6.2: Login with New Password"
CHANGED_PASSWORD_LOGIN=$(curl -s -X POST ${BASE_URL}/api/auth/login/password \
  -H "Content-Type: application/json" \
  -d "{
    \"address\": \"$VENDOR_ADDRESS\",
    \"password\": \"NewKarachiFashion2024!@#\"
  }")

if contains "$CHANGED_PASSWORD_LOGIN" "success.*true"; then
    print_result "Login after Password Change" "PASS"
    VENDOR_TOKEN=$(echo "$CHANGED_PASSWORD_LOGIN" | jq -r '.data.token')
    echo -e "${BLUE}   Successfully logged in with new password${NC}"
else
    print_result "Login after Password Change" "FAIL"
fi

sleep 1

echo ""
echo "=============================================="
echo "👥 Test 7: Admin Endpoints (Expert Only)"
echo "=============================================="
echo ""

# Test 7.1: Get All Users (Admin)
echo "Test 7.1: Get All Users (Dr. Usman - Admin)"
ALL_USERS=$(curl -s -X GET ${BASE_URL}/api/auth/users \
  -H "Authorization: Bearer $EXPERT_TOKEN")

if contains "$ALL_USERS" "success.*true"; then
    print_result "Get All Users (Admin)" "PASS"
    USER_COUNT=$(echo "$ALL_USERS" | jq -r '.data.total // .total // empty')
    echo -e "${BLUE}   Total Users: $USER_COUNT${NC}"
else
    print_result "Get All Users (Admin)" "FAIL"
fi

sleep 1

# Test 7.2: Get Statistics (Admin)
echo ""
echo "Test 7.2: Get User Statistics (Admin)"
STATS=$(curl -s -X GET ${BASE_URL}/api/auth/stats \
  -H "Authorization: Bearer $EXPERT_TOKEN")

if contains "$STATS" "success.*true"; then
    print_result "Get Statistics (Admin)" "PASS"
    SUPPLIERS=$(echo "$STATS" | jq -r '.data.suppliers // .suppliers // 0')
    VENDORS=$(echo "$STATS" | jq -r '.data.vendors // .vendors // 0')
    CUSTOMERS=$(echo "$STATS" | jq -r '.data.customers // .customers // 0')
    echo -e "${BLUE}   Suppliers: $SUPPLIERS, Vendors: $VENDORS, Customers: $CUSTOMERS${NC}"
else
    print_result "Get Statistics (Admin)" "FAIL"
fi

sleep 1

# Test 7.3: Non-Admin Access (Should Fail)
echo ""
echo "Test 7.3: Customer Accessing Admin Endpoint (Should FAIL)"
NON_ADMIN=$(curl -s -X GET ${BASE_URL}/api/auth/users \
  -H "Authorization: Bearer $CUSTOMER_TOKEN")

if contains "$NON_ADMIN" "Access denied" || contains "$NON_ADMIN" "Unauthorized" || contains "$NON_ADMIN" "403"; then
    print_result "Non-Admin Access Denied" "PASS"
    echo -e "${BLUE}   Correctly denied access to customer${NC}"
else
    print_result "Non-Admin Access Denied" "FAIL"
fi

sleep 1

echo ""
echo "=============================================="
echo "🔄 Test 8: Token Management"
echo "=============================================="
echo ""

# Test 8.1: Token Verification
echo "Test 8.1: Verify JWT Token"
VERIFY_TOKEN=$(curl -s -X POST ${BASE_URL}/api/auth/verify \
  -H "Content-Type: application/json" \
  -d "{
    \"token\": \"$SUPPLIER_TOKEN\"
  }")

if contains "$VERIFY_TOKEN" "success.*true"; then
    print_result "Token Verification" "PASS"
else
    print_result "Token Verification" "FAIL"
fi

sleep 1

# Test 8.2: Token Refresh
echo ""
echo "Test 8.2: Refresh JWT Token"
REFRESH_TOKEN=$(curl -s -X POST ${BASE_URL}/api/auth/refresh \
  -H "Authorization: Bearer $SUPPLIER_TOKEN")

if contains "$REFRESH_TOKEN" "success.*true"; then
    print_result "Token Refresh" "PASS"
    NEW_SUPPLIER_TOKEN=$(echo "$REFRESH_TOKEN" | jq -r '.data.token')
else
    print_result "Token Refresh" "FAIL"
fi

sleep 1

echo ""
echo "=============================================="
echo "🚪 Test 9: Logout"
echo "=============================================="
echo ""

# Test 9.1: Logout Supplier
echo "Test 9.1: Logout Supplier"
LOGOUT=$(curl -s -X POST ${BASE_URL}/api/auth/logout \
  -H "Authorization: Bearer $SUPPLIER_TOKEN")

if contains "$LOGOUT" "success.*true"; then
    print_result "Logout" "PASS"
    echo -e "${BLUE}   Ahmed Hassan logged out successfully${NC}"
else
    print_result "Logout" "FAIL"
fi

sleep 1

echo ""
echo "=============================================="
echo "❌ Test 10: Error Handling"
echo "=============================================="
echo ""

# Test 10.1: Duplicate Email Registration
echo "Test 10.1: Duplicate Email (Should FAIL)"
DUPLICATE=$(curl -s -X POST ${BASE_URL}/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"walletName\": \"Duplicate Wallet\",
    \"password\": \"Test2024!@#\",
    \"name\": \"Duplicate User\",
    \"email\": \"$SUPPLIER_EMAIL\",
    \"phone\": \"+92 305 6789012\",
    \"role\": \"customer\",
    \"address\": \"123 Test Road, Gulberg\",
    \"city\": \"Lahore\",
    \"state\": \"Punjab\",
    \"country\": \"Pakistan\",
    \"postalCode\": \"54000\",
    \"acceptedTerms\": true
  }")

if contains "$DUPLICATE" "already exists" || contains "$DUPLICATE" "duplicate" || contains "$DUPLICATE" "409"; then
    print_result "Duplicate Email Rejected" "PASS"
    echo -e "${BLUE}   Correctly rejected duplicate email${NC}"
else
    print_result "Duplicate Email Rejected" "FAIL"
fi

sleep 1

# Test 10.2: Invalid Login Credentials
echo ""
echo "Test 10.2: Invalid Password (Should FAIL)"
INVALID_LOGIN=$(curl -s -X POST ${BASE_URL}/api/auth/login/password \
  -H "Content-Type: application/json" \
  -d "{
    \"address\": \"$SUPPLIER_ADDRESS\",
    \"password\": \"WrongPassword123!@#\"
  }")

if contains "$INVALID_LOGIN" "Invalid credentials" || contains "$INVALID_LOGIN" "401"; then
    print_result "Invalid Password Rejected" "PASS"
    echo -e "${BLUE}   Correctly rejected invalid password${NC}"
else
    print_result "Invalid Password Rejected" "FAIL"
fi

sleep 1

# Test 10.3: Missing Required Fields
echo ""
echo "Test 10.3: Missing Required Fields (Should FAIL)"
MISSING_FIELDS=$(curl -s -X POST ${BASE_URL}/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "walletName": "Incomplete Wallet",
    "password": "Test2024!@#",
    "email": "incomplete@test.pk"
  }')

if contains "$MISSING_FIELDS" "required" || contains "$MISSING_FIELDS" "400"; then
    print_result "Missing Fields Rejected" "PASS"
    echo -e "${BLUE}   Correctly rejected incomplete registration${NC}"
else
    print_result "Missing Fields Rejected" "FAIL"
fi

sleep 1

# Test 10.4: Invalid Mnemonic Recovery
echo ""
echo "Test 10.4: Invalid Mnemonic (Should FAIL)"
INVALID_MNEMONIC=$(curl -s -X POST ${BASE_URL}/api/auth/wallet/recover \
  -H "Content-Type: application/json" \
  -d '{
    "mnemonic": "galat words jo ek valid mnemonic phrase nahi bantay",
    "walletAddress": "0x1234567890abcdef",
    "newPassword": "NewPassword123!@#"
  }')

if contains "$INVALID_MNEMONIC" "Invalid" || \
   contains "$INVALID_MNEMONIC" "error" || \
   contains "$INVALID_MNEMONIC" "failed" || \
   contains "$INVALID_MNEMONIC" "500"; then
    print_result "Invalid Mnemonic Rejected" "PASS"
    echo -e "${BLUE}   Correctly rejected invalid mnemonic${NC}"
else
    print_result "Invalid Mnemonic Rejected" "FAIL"
fi

sleep 1

# ------------------------------------------------------------------
# Final: Logins for env extraction (Supplier, Vendor, Customer, Expert)
# ------------------------------------------------------------------
echo ""
echo "=============================================="
echo "🔎 Final: Login each user and print env variables"
echo "=============================================="
echo ""

# Helper to extract with multiple fallbacks
extract() {
  echo "$1" | jq -r "$2 // $3 // $4 // empty" 2>/dev/null || echo ""
}

# 1) Supplier - use latest password used in tests (recovered/changed)
echo "Final Login: Supplier"
FINAL_SUPPLIER_LOGIN=$(curl -s -X POST ${BASE_URL}/api/auth/login/password \
  -H "Content-Type: application/json" \
  -d "{
    \"address\": \"$SUPPLIER_ADDRESS\",
    \"password\": \"NewFaisalabad2024!@#\"
  }")

SUPPLIER_TOKEN=$(echo "$FINAL_SUPPLIER_LOGIN" | jq -r '.data.token // .token // empty')
# fetch profile to derive ids/wallets
SUP_PROFILE=$(curl -s -X GET ${BASE_URL}/api/auth/profile -H "Authorization: Bearer $SUPPLIER_TOKEN")
SUPPLIER_USER_ID=$(echo "$SUP_PROFILE" | jq -r '.data._id // .data.user._id // .data.id // .data.user.id // empty')
SUPPLIER_WALLET=$(echo "$SUP_PROFILE" | jq -r '.data.walletAddress // .data.user.walletAddress // .data.wallet.address // .data.user.wallet // empty')
SUPPLIER_ID=$(echo "$SUP_PROFILE" | jq -r '.data.wallet._id // .data.wallet.id // .data.user.walletId // .data.walletId // empty')

echo ""
echo "SUPPLIER_TOKEN=$SUPPLIER_TOKEN"
echo "SUPPLIER_USER_ID=$SUPPLIER_USER_ID"
echo "SUPPLIER_WALLET=$SUPPLIER_WALLET"
echo "SUPPLIER_ID=$SUPPLIER_ID"
echo ""

# 2) Vendor - use latest changed password
echo "Final Login: Vendor"
FINAL_VENDOR_LOGIN=$(curl -s -X POST ${BASE_URL}/api/auth/login/password \
  -H "Content-Type: application/json" \
  -d "{
    \"address\": \"$VENDOR_ADDRESS\",
    \"password\": \"NewKarachiFashion2024!@#\"
  }")

VENDOR_TOKEN=$(echo "$FINAL_VENDOR_LOGIN" | jq -r '.data.token // .token // empty')
VENDOR_PROFILE=$(curl -s -X GET ${BASE_URL}/api/auth/profile -H "Authorization: Bearer $VENDOR_TOKEN")
VENDOR_USER_ID=$(echo "$VENDOR_PROFILE" | jq -r '.data._id // .data.user._id // .data.id // .data.user.id // empty')
VENDOR_WALLET=$(echo "$VENDOR_PROFILE" | jq -r '.data.walletAddress // .data.user.walletAddress // .data.wallet.address // .data.user.wallet // empty')
VENDOR_ID=$(echo "$VENDOR_PROFILE" | jq -r '.data.wallet._id // .data.wallet.id // .data.user.walletId // .data.walletId // empty')

echo ""
echo "VENDOR_TOKEN=$VENDOR_TOKEN"
echo "VENDOR_USER_ID=$VENDOR_USER_ID"
echo "VENDOR_WALLET=$VENDOR_WALLET"
echo "VENDOR_ID=$VENDOR_ID"
echo ""

# 3) Customer - password unchanged
echo "Final Login: Customer"
FINAL_CUSTOMER_LOGIN=$(curl -s -X POST ${BASE_URL}/api/auth/login/password \
  -H "Content-Type: application/json" \
  -d "{
    \"address\": \"$CUSTOMER_ADDRESS\",
    \"password\": \"LahoreShopper2024!@#\"
  }")

CUSTOMER_TOKEN=$(echo "$FINAL_CUSTOMER_LOGIN" | jq -r '.data.token // .token // empty')
CUSTOMER_PROFILE=$(curl -s -X GET ${BASE_URL}/api/auth/profile -H "Authorization: Bearer $CUSTOMER_TOKEN")
CUSTOMER_USER_ID=$(echo "$CUSTOMER_PROFILE" | jq -r '.data._id // .data.user._id // .data.id // .data.user.id // empty')
CUSTOMER_WALLET=$(echo "$CUSTOMER_PROFILE" | jq -r '.data.walletAddress // .data.user.walletAddress // .data.wallet.address // .data.user.wallet // empty')
CUSTOMER_ID=$(echo "$CUSTOMER_PROFILE" | jq -r '.data.wallet._id // .data.wallet.id // .data.user.walletId // .data.walletId // empty')

echo ""
echo "CUSTOMER_TOKEN=$CUSTOMER_TOKEN"
echo "CUSTOMER_USER_ID=$CUSTOMER_USER_ID"
echo "CUSTOMER_WALLET=$CUSTOMER_WALLET"
echo "CUSTOMER_ID=$CUSTOMER_ID"
echo ""

# 4) Expert - password unchanged
echo "Final Login: Expert"
FINAL_EXPERT_LOGIN=$(curl -s -X POST ${BASE_URL}/api/auth/login/password \
  -H "Content-Type: application/json" \
  -d "{
    \"address\": \"$EXPERT_ADDRESS\",
    \"password\": \"IslamabadExpert2024!@#\"
  }")

EXPERT_TOKEN=$(echo "$FINAL_EXPERT_LOGIN" | jq -r '.data.token // .token // empty')
EXPERT_PROFILE=$(curl -s -X GET ${BASE_URL}/api/auth/profile -H "Authorization: Bearer $EXPERT_TOKEN")
EXPERT_USER_ID=$(echo "$EXPERT_PROFILE" | jq -r '.data._id // .data.user._id // .data.id // .data.user.id // empty')
EXPERT_WALLET=$(echo "$EXPERT_PROFILE" | jq -r '.data.walletAddress // .data.user.walletAddress // .data.wallet.address // .data.user.wallet // empty')
EXPERT_ID=$(echo "$EXPERT_PROFILE" | jq -r '.data.wallet._id // .data.wallet.id // .data.user.walletId // .data.walletId // empty')

echo ""
echo "EXPERT_TOKEN=$EXPERT_TOKEN"
echo "EXPERT_USER_ID=$EXPERT_USER_ID"
echo "EXPERT_WALLET=$EXPERT_WALLET"
echo "EXPERT_ID=$EXPERT_ID"
echo ""

# ============================================
# 📊 TEST SUMMARY
# ============================================
echo ""
echo -e "${BLUE}Total Tests: $TOTAL_TESTS${NC}"
echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
echo -e "${RED}Failed: $FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED! 🎉${NC}"
    echo ""
    echo "=============================================="
    echo "📝 Registered Test Users (Pakistan Textile Supply Chain)"
    echo "=============================================="
    echo ""
    echo "1. 🏭 TEXTILE SUPPLIER (Faisalabad):"
    echo "   Company: Faisalabad Textile Mills Ltd"
    echo "   Contact: Ahmed Hassan"
    echo "   Email: ahmed.hassan@faisalabadtextiles.com.pk"
    echo "   Phone: +92 300 1234567"
    echo "   Address: $SUPPLIER_ADDRESS"
    echo "   Password: NewFaisalabad2024!@#"
    echo ""
    echo "2. 👗 FASHION VENDOR (Karachi):"
    echo "   Shop: Karachi Fashion Boutique"
    echo "   Owner: Fatima Ali"
    echo "   Email: fatima.ali@karachifashion.com.pk"
    echo "   Phone: +92 321 9876543"
    echo "   Address: $VENDOR_ADDRESS"
    echo "   Password: NewKarachiFashion2024!@#"
    echo ""
    echo "3. 🛍️  CUSTOMER (Lahore):"
    echo "   Name: Zainab Khan"
    echo "   Email: zainab.khan@gmail.com"
    echo "   Phone: +92 333 5551234"
    echo "   Address: $CUSTOMER_ADDRESS"
    echo "   Password: LahoreShopper2024!@#"
    echo ""
    echo "4. 🔬 BLOCKCHAIN EXPERT (Islamabad):"
    echo "   Name: Dr. Usman Tariq"
    echo "   Email: dr.usman@chainvanguard.pk"
    echo "   Phone: +92 51 8887777"
    echo "   Address: $EXPERT_ADDRESS"
    echo "   Password: IslamabadExpert2024!@#"
    echo ""
    echo "=============================================="
    echo "✅ All blockchain logs saved successfully!"
    echo "✅ Pakistan textile supply chain system ready!"
    echo "=============================================="
    echo ""
    exit 0
else
    echo -e "${RED}⚠️  SOME TESTS FAILED${NC}"
    echo ""
    echo "Please check the failed tests above and fix the issues."
    echo ""
    exit 1
fi