#!/bin/bash

# ============================================
# ChainVanguard - Complete Auth Test Suite
# ============================================

echo "🧪 ChainVanguard Authentication Testing Suite"
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
# Function to extract JSON value using jq
get_json_value() {
    # Try multiple nested paths
    local result=$(echo "$1" | jq -r ".data.wallet.$2 // .data.user.$2 // .data.$2 // .$2 // empty" 2>/dev/null)
    if [ -z "$result" ] || [ "$result" = "null" ]; then
        # Fallback to grep method for backwards compatibility
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
echo "📝 Test 1: User Registration (All Roles)"
echo "=============================================="
echo ""

# Test 1.1: Register Supplier
echo "Test 1.1: Register Supplier"
SUPPLIER_REG=$(curl -s -X POST ${BASE_URL}/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "walletName": "Global Textile Wallet",
    "password": "Supplier2024!Secure",
    "name": "ravian Smith",
    "email": "ravian.supplier@test.com",
    "phone": "+1 415 555 0101",
    "role": "supplier",
    "address": "500 Textile Drive",
    "city": "San Francisco",
    "state": "California",
    "country": "USA",
    "postalCode": "94102",
    "companyName": "Global Textile Supply Co",
    "businessType": "Manufacturing",
    "businessAddress": "500 Textile Drive, San Francisco, CA",
    "registrationNumber": "SUP-2024-001",
    "taxId": "US-TAX-12345",
    "acceptedTerms": true
  }')

if contains "$SUPPLIER_REG" "success.*true"; then
    print_result "Supplier Registration" "PASS"
    
    # DEBUG: Print the full response
    echo -e "${YELLOW}DEBUG - Full Response:${NC}"
    echo "$SUPPLIER_REG" | jq '.' 2>/dev/null || echo "$SUPPLIER_REG"
    echo ""
    
    SUPPLIER_ADDRESS=$(echo "$SUPPLIER_REG" | jq -r '.data.user.walletAddress')
    SUPPLIER_MNEMONIC=$(echo "$SUPPLIER_REG" | jq -r '.data.wallet.mnemonic')
    SUPPLIER_EMAIL=$(echo "$SUPPLIER_REG" | jq -r '.data.user.email')  # ← ADD THIS LINE
    
    echo -e "${BLUE}   Address: $SUPPLIER_ADDRESS${NC}"
    echo -e "${BLUE}   Mnemonic: $SUPPLIER_MNEMONIC${NC}"
    echo -e "${BLUE}   Email: $SUPPLIER_EMAIL${NC}"
fi

sleep 1

# Test 1.2: Register Vendor
echo ""
echo "Test 1.2: Register Vendor"
VENDOR_REG=$(curl -s -X POST ${BASE_URL}/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "walletName": "Fashion Hub Wallet",
    "password": "Vendor2024!Fashion",
    "name": "Maria Garcia",
    "email": "ravian.vendor@test.com",
    "phone": "+1 212 555 0202",
    "role": "vendor",
    "address": "1250 Fashion Ave",
    "city": "New York",
    "state": "NY",
    "country": "USA",
    "postalCode": "10018",
    "companyName": "Fashion Hub Boutique",
    "businessType": "Retailer",
    "businessAddress": "1250 Fashion Ave, New York, NY",
    "registrationNumber": "VEN-2024-002",
    "taxId": "US-TAX-67890",
    "acceptedTerms": true
  }')

if contains "$VENDOR_REG" "success.*true"; then
    print_result "Vendor Registration" "PASS"
    VENDOR_ADDRESS=$(echo "$VENDOR_REG" | jq -r '.data.user.walletAddress')
    echo -e "${BLUE}   Address: $VENDOR_ADDRESS${NC}"
else
    print_result "Vendor Registration" "FAIL"
fi

sleep 1

# Test 1.3: Register Customer
echo ""
echo "Test 1.3: Register Customer"
CUSTOMER_REG=$(curl -s -X POST ${BASE_URL}/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "walletName": "My Shopping Wallet",
    "password": "Customer2024!Shop",
    "name": "David Chen",
    "email": "ravian.customer@test.com",
    "phone": "+1 650 555 0303",
    "role": "customer",
    "address": "789 Oak Street, Apt 4B",
    "city": "Palo Alto",
    "state": "CA",
    "country": "USA",
    "postalCode": "94301",
    "acceptedTerms": true
  }')

if contains "$CUSTOMER_REG" "success.*true"; then
    print_result "Customer Registration" "PASS"
    CUSTOMER_ADDRESS=$(echo "$CUSTOMER_REG" | jq -r '.data.user.walletAddress')
    echo -e "${BLUE}   Address: $CUSTOMER_ADDRESS${NC}"
else
    print_result "Customer Registration" "FAIL"
fi

sleep 1

# Test 1.4: Register Blockchain Expert
echo ""
echo "Test 1.4: Register Blockchain Expert"
EXPERT_REG=$(curl -s -X POST ${BASE_URL}/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "walletName": "Admin Security Wallet",
    "password": "Expert2024!Blockchain",
    "name": "Dr. alih Williams",
    "email": "ravian.expert@test.com",
    "phone": "+1 617 555 0404",
    "role": "expert",
    "address": "100 Innovation Way",
    "city": "Boston",
    "state": "MA",
    "country": "USA",
    "postalCode": "02115",
    "acceptedTerms": true
  }')

if contains "$EXPERT_REG" "success.*true"; then
    print_result "Expert Registration" "PASS"
    EXPERT_ADDRESS=$(echo "$EXPERT_REG" | jq -r '.data.user.walletAddress')
    echo -e "${BLUE}   Address: $EXPERT_ADDRESS${NC}"
else
    print_result "Expert Registration" "FAIL"
fi

sleep 1

echo ""
echo "=============================================="
echo "🔐 Test 2: User Login (All Roles)"
echo "=============================================="
echo ""

# Test 2.1: Login Supplier
echo "Test 2.1: Login Supplier"
SUPPLIER_LOGIN=$(curl -s -X POST ${BASE_URL}/api/auth/login/password \
  -H "Content-Type: application/json" \
  -d "{
    \"address\": \"$SUPPLIER_ADDRESS\",
    \"password\": \"Supplier2024!Secure\"
  }")

if contains "$SUPPLIER_LOGIN" "success.*true"; then
    print_result "Supplier Login" "PASS"
    SUPPLIER_TOKEN=$(echo "$SUPPLIER_LOGIN" | jq -r '.data.token')
    echo -e "${BLUE}   Token: ${SUPPLIER_TOKEN:0:30}...${NC}"
else
    print_result "Supplier Login" "FAIL"
fi

sleep 1

# Test 2.2: Login Vendor
echo ""
echo "Test 2.2: Login Vendor"
VENDOR_LOGIN=$(curl -s -X POST ${BASE_URL}/api/auth/login/password \
  -H "Content-Type: application/json" \
  -d "{
    \"address\": \"$VENDOR_ADDRESS\",
    \"password\": \"Vendor2024!Fashion\"
  }")

if contains "$VENDOR_LOGIN" "success.*true"; then
    print_result "Vendor Login" "PASS"
    VENDOR_TOKEN=$(echo "$VENDOR_LOGIN" | jq -r '.data.token')
else
    print_result "Vendor Login" "FAIL"
fi

sleep 1

# Test 2.3: Login Customer
echo ""
echo "Test 2.3: Login Customer"
CUSTOMER_LOGIN=$(curl -s -X POST ${BASE_URL}/api/auth/login/password \
  -H "Content-Type: application/json" \
  -d "{
    \"address\": \"$CUSTOMER_ADDRESS\",
    \"password\": \"Customer2024!Shop\"
  }")

if contains "$CUSTOMER_LOGIN" "success.*true"; then
    print_result "Customer Login" "PASS"
    CUSTOMER_TOKEN=$(echo "$CUSTOMER_LOGIN" | jq -r '.data.token')
else
    print_result "Customer Login" "FAIL"
fi

sleep 1

# Test 2.4: Login Expert
echo ""
echo "Test 2.4: Login Expert"
EXPERT_LOGIN=$(curl -s -X POST ${BASE_URL}/api/auth/login/password \
  -H "Content-Type: application/json" \
  -d "{
    \"address\": \"$EXPERT_ADDRESS\",
    \"password\": \"Expert2024!Blockchain\"
  }")

if contains "$EXPERT_LOGIN" "success.*true"; then
    print_result "Expert Login" "PASS"
    EXPERT_TOKEN=$(echo "$EXPERT_LOGIN" | jq -r '.data.token')
else
    print_result "Expert Login" "FAIL"
fi

sleep 1

echo ""
echo "=============================================="
echo "👤 Test 3: Profile Management"
echo "=============================================="
echo ""

# Test 3.1: Get Profile
echo "Test 3.1: Get Supplier Profile"
PROFILE=$(curl -s -X GET ${BASE_URL}/api/auth/profile \
  -H "Authorization: Bearer $SUPPLIER_TOKEN")

if contains "$PROFILE" "ravian Smith"; then
    print_result "Get Profile" "PASS"
    echo -e "${BLUE}   Name: ravian Smith${NC}"
    echo -e "${BLUE}   Role: supplier${NC}"
else
    print_result "Get Profile" "FAIL"
fi

sleep 1

# Test 3.2: Update Profile
echo ""
echo "Test 3.2: Update Profile"
UPDATE_PROFILE=$(curl -s -X PUT ${BASE_URL}/api/auth/profile \
  -H "Authorization: Bearer $SUPPLIER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+1 415 555 9999",
    "companyName": "Global Textile Supply Co. (Updated)"
  }')

if contains "$UPDATE_PROFILE" "success.*true"; then
    print_result "Update Profile" "PASS"
else
    print_result "Update Profile" "FAIL"
fi

sleep 1

echo ""
echo "=============================================="
echo "🔑 Test 4: Password Recovery"
echo "=============================================="
echo ""

# Test 4.1: Find Wallet by Mnemonic
echo "Test 4.1: Find Wallet by Mnemonic"
FIND_WALLET=$(curl -s -X POST ${BASE_URL}/api/auth/wallet/find \
  -H "Content-Type: application/json" \
  -d "{
    \"mnemonic\": \"$SUPPLIER_MNEMONIC\"
  }")

if contains "$FIND_WALLET" "success.*true"; then
    print_result "Find Wallet by Mnemonic" "PASS"
    FOUND_ADDRESS=$(echo "$FIND_WALLET" | jq -r '.data.walletAddress')
    echo -e "${BLUE}   Found Address: $FOUND_ADDRESS${NC}"
else
    print_result "Find Wallet by Mnemonic" "FAIL"
fi

sleep 1

# Test 4.2: Recover Wallet with Mnemonic + Address
echo ""
echo "Test 4.2: Recover Wallet & Reset Password"
RECOVER=$(curl -s -X POST ${BASE_URL}/api/auth/wallet/recover \
  -H "Content-Type: application/json" \
  -d "{
    \"mnemonic\": \"$SUPPLIER_MNEMONIC\",
    \"walletAddress\": \"$SUPPLIER_ADDRESS\",
    \"newPassword\": \"NewSupplier2024!Recovered\"
  }")

if contains "$RECOVER" "success.*true"; then
    print_result "Password Recovery" "PASS"
else
    print_result "Password Recovery" "FAIL"
fi

sleep 1

# Test 4.3: Login with New Password
echo ""
echo "Test 4.3: Login with New Password"
NEW_PASSWORD_LOGIN=$(curl -s -X POST ${BASE_URL}/api/auth/login/password \
  -H "Content-Type: application/json" \
  -d "{
    \"address\": \"$SUPPLIER_ADDRESS\",
    \"password\": \"NewSupplier2024!Recovered\"
  }")

if contains "$NEW_PASSWORD_LOGIN" "success.*true"; then
    print_result "Login with New Password" "PASS"
    SUPPLIER_TOKEN=$(echo "$NEW_PASSWORD_LOGIN" | jq -r '.data.token')
else
    print_result "Login with New Password" "FAIL"
fi

sleep 1

echo ""
echo "=============================================="
echo "📧 Test 5: Email Verification"
echo "=============================================="
echo ""

# Test 5.1: Send Verification Code
echo "Test 5.1: Send Verification Code"
SEND_VERIFY=$(curl -s -X POST ${BASE_URL}/api/auth/send-verification \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H "Content-Type: application/json")

if contains "$SEND_VERIFY" "success.*true"; then
    print_result "Send Verification Code" "PASS"
    VERIFY_CODE=$(echo "$SEND_VERIFY" | jq -r '.data.code')
    echo -e "${BLUE}   Code: $VERIFY_CODE${NC}"
else
    print_result "Send Verification Code" "FAIL"
fi

sleep 1

# Test 5.2: Verify Email with Code
echo ""
echo "Test 5.2: Verify Email with Code"
CUSTOMER_EMAIL=$(echo "$CUSTOMER_REG" | jq -r '.data.user.email')
VERIFY_EMAIL=$(curl -s -X POST ${BASE_URL}/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$CUSTOMER_EMAIL\",
    \"code\": \"$VERIFY_CODE\"
  }")

if contains "$VERIFY_EMAIL" "success.*true"; then
    print_result "Verify Email" "PASS"
else
    print_result "Verify Email" "FAIL"
    echo "Debug: Email=$CUSTOMER_EMAIL, Code=$VERIFY_CODE"
fi

sleep 1

echo ""
echo "=============================================="
echo "🔐 Test 6: Password Change"
echo "=============================================="
echo ""

# Test 6.1: Change Password
echo "Test 6.1: Change Password"
CHANGE_PASSWORD=$(curl -s -X PUT ${BASE_URL}/api/auth/change-password \
  -H "Authorization: Bearer $VENDOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "Vendor2024!Fashion",
    "newPassword": "NewVendor2024!Changed"
  }')

if contains "$CHANGE_PASSWORD" "success.*true"; then
    print_result "Change Password" "PASS"
else
    print_result "Change Password" "FAIL"
fi

sleep 1

# Test 6.2: Login with Changed Password
echo ""
echo "Test 6.2: Login with Changed Password"
CHANGED_PASSWORD_LOGIN=$(curl -s -X POST ${BASE_URL}/api/auth/login/password \
  -H "Content-Type: application/json" \
  -d "{
    \"address\": \"$VENDOR_ADDRESS\",
    \"password\": \"NewVendor2024!Changed\"
  }")

if contains "$CHANGED_PASSWORD_LOGIN" "success.*true"; then
    print_result "Login after Password Change" "PASS"
    VENDOR_TOKEN=$(echo "$CHANGED_PASSWORD_LOGIN" | jq -r '.data.token')
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
echo "Test 7.1: Get All Users (Admin Only)"
ALL_USERS=$(curl -s -X GET ${BASE_URL}/api/auth/users \
  -H "Authorization: Bearer $EXPERT_TOKEN")

if contains "$ALL_USERS" "success.*true"; then
    print_result "Get All Users (Admin)" "PASS"
    USER_COUNT=$(echo "$ALL_USERS" | jq -r '.data.total')
    echo -e "${BLUE}   Total Users: $USER_COUNT${NC}"
else
    print_result "Get All Users (Admin)" "FAIL"
fi

sleep 1

# Test 7.2: Get Statistics (Admin)
echo ""
echo "Test 7.2: Get User Statistics (Admin Only)"
STATS=$(curl -s -X GET ${BASE_URL}/api/auth/stats \
  -H "Authorization: Bearer $EXPERT_TOKEN")

if contains "$STATS" "success.*true"; then
    print_result "Get Statistics (Admin)" "PASS"
    SUPPLIERS=$(echo "$STATS" | jq -r '.data.suppliers')
    VENDORS=$(echo "$STATS" | jq -r '.data.vendors')
    CUSTOMERS=$(echo "$STATS" | jq -r '.data.customers')
    echo -e "${BLUE}   Suppliers: $SUPPLIERS, Vendors: $VENDORS, Customers: $CUSTOMERS${NC}"
else
    print_result "Get Statistics (Admin)" "FAIL"
fi

sleep 1

# Test 7.3: Non-Admin trying to access Admin endpoint (Should Fail)
echo ""
echo "Test 7.3: Non-Admin Access to Admin Endpoint (Should FAIL)"
NON_ADMIN=$(curl -s -X GET ${BASE_URL}/api/auth/users \
  -H "Authorization: Bearer $CUSTOMER_TOKEN")

if contains "$NON_ADMIN" "Access denied"; then
    print_result "Non-Admin Access Denied" "PASS"
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
    \"password\": \"Test2024!\",
    \"name\": \"Duplicate User\",
    \"email\": \"$SUPPLIER_EMAIL\",
    \"phone\": \"+1 111 111 1111\",
    \"role\": \"customer\",
    \"address\": \"123 Test St\",
    \"city\": \"Test City\",
    \"country\": \"USA\",
    \"acceptedTerms\": true
  }")

if contains "$DUPLICATE" "already exists" || contains "$DUPLICATE" "duplicate"; then
    print_result "Duplicate Email Rejected" "PASS"
else
    print_result "Duplicate Email Rejected" "FAIL"
    echo -e "${YELLOW}Debug: Tried to register with email: $SUPPLIER_EMAIL${NC}"
fi

sleep 1

# Test 10.2: Invalid Login Credentials
echo ""
echo "Test 10.2: Invalid Password (Should FAIL)"
INVALID_LOGIN=$(curl -s -X POST ${BASE_URL}/api/auth/login/password \
  -H "Content-Type: application/json" \
  -d "{
    \"address\": \"$SUPPLIER_ADDRESS\",
    \"password\": \"WrongPassword123!\"
  }")

if contains "$INVALID_LOGIN" "Invalid credentials"; then
    print_result "Invalid Password Rejected" "PASS"
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
    "password": "Test2024!",
    "email": "incomplete@test.com"
  }')

if contains "$MISSING_FIELDS" "required"; then
    print_result "Missing Fields Rejected" "PASS"
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
    "mnemonic": "wrong words that do not form a valid mnemonic phrase",
    "walletAddress": "0x1234567890abcdef",
    "newPassword": "NewPassword123!"
  }')

# Check if response indicates an error (should NOT be successful)
if contains "$INVALID_MNEMONIC" "success.*false" || \
   contains "$INVALID_MNEMONIC" "Invalid" || \
   contains "$INVALID_MNEMONIC" "not found" || \
   contains "$INVALID_MNEMONIC" "error" || \
   contains "$INVALID_MNEMONIC" "failed"; then
    print_result "Invalid Mnemonic Rejected" "PASS"
else
    print_result "Invalid Mnemonic Rejected" "FAIL"
    echo -e "${YELLOW}Response: $INVALID_MNEMONIC${NC}"
fi

sleep 1

echo ""
echo "=============================================="
echo "📊 TEST SUMMARY"
echo "=============================================="
echo ""
echo -e "${BLUE}Total Tests: $TOTAL_TESTS${NC}"
echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
echo -e "${RED}Failed: $FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED! 🎉${NC}"
    echo ""
    echo "=============================================="
    echo "📝 Registered Test Users:"
    echo "=============================================="
    echo ""
    echo "1. Supplier:"
    echo "   Email: ravian.supplier@test.com"
    echo "   Address: $SUPPLIER_ADDRESS"
    echo "   Password: NewSupplier2024!Recovered"
    echo ""
    echo "2. Vendor:"
    echo "   Email: ravian.vendor@test.com"
    echo "   Address: $VENDOR_ADDRESS"
    echo "   Password: NewVendor2024!Changed"
    echo ""
    echo "3. Customer:"
    echo "   Email: ravian.customer@test.com"
    echo "   Address: $CUSTOMER_ADDRESS"
    echo "   Password: Customer2024!Shop"
    echo ""
    echo "4. Expert:"
    echo "   Email: ravian.expert@test.com"
    echo "   Address: $EXPERT_ADDRESS"
    echo "   Password: Expert2024!Blockchain"
    echo ""
    exit 0
else
    echo -e "${RED}⚠️  SOME TESTS FAILED${NC}"
    echo ""
    echo "Please check the failed tests above and fix the issues."
    echo ""
    exit 1
fi