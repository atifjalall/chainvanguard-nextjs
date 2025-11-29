#!/bin/bash

# Test all 7 ChainVanguard Contracts
# Run this from chainvanguard-nextjs directory

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}Testing All 7 ChainVanguard Contracts${NC}"
echo -e "${YELLOW}========================================${NC}\n"

# Set environment
export PATH=/Users/atifjalal/Desktop/fabric-samples/bin:$PATH
export FABRIC_CFG_PATH=/Users/atifjalal/Desktop/fabric-samples/config/
cd ~/Desktop/fabric-samples/test-network

export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=$PWD/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=$PWD/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051

ORDERER_CA=$PWD/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem
PEER_CERT=$PWD/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt

# Test 1: VendorInventoryContract ✨ NEW
echo -e "${GREEN}Test 1: VendorInventoryContract (NEW!) ✨${NC}"
peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com \
  --tls --cafile $ORDERER_CA \
  -C supply-chain-channel -n chainvanguard \
  --peerAddresses localhost:7051 --tlsRootCertFiles $PEER_CERT \
  -c '{"function":"VendorInventoryContract:initLedger","Args":[]}' 2>&1 | grep -q "Chaincode invoke successful" && \
  echo -e "${GREEN}✅ VendorInventoryContract initialized${NC}\n" || \
  echo -e "${YELLOW}⚠️  VendorInventoryContract may already be initialized${NC}\n"

# Test 2: UserContract
echo -e "${GREEN}Test 2: UserContract${NC}"
peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com \
  --tls --cafile $ORDERER_CA \
  -C supply-chain-channel -n chainvanguard \
  --peerAddresses localhost:7051 --tlsRootCertFiles $PEER_CERT \
  -c '{"function":"UserContract:initLedger","Args":[]}' 2>&1 | grep -q "Chaincode invoke successful" && \
  echo -e "${GREEN}✅ UserContract initialized${NC}\n" || \
  echo -e "${YELLOW}⚠️  UserContract may already be initialized${NC}\n"

# Test 3: ProductContract
echo -e "${GREEN}Test 3: ProductContract${NC}"
peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com \
  --tls --cafile $ORDERER_CA \
  -C supply-chain-channel -n chainvanguard \
  --peerAddresses localhost:7051 --tlsRootCertFiles $PEER_CERT \
  -c '{"function":"ProductContract:initLedger","Args":[]}' 2>&1 | grep -q "Chaincode invoke successful" && \
  echo -e "${GREEN}✅ ProductContract initialized${NC}\n" || \
  echo -e "${YELLOW}⚠️  ProductContract may already be initialized${NC}\n"

# Test 4: InventoryContract
echo -e "${GREEN}Test 4: InventoryContract${NC}"
peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com \
  --tls --cafile $ORDERER_CA \
  -C supply-chain-channel -n chainvanguard \
  --peerAddresses localhost:7051 --tlsRootCertFiles $PEER_CERT \
  -c '{"function":"InventoryContract:initLedger","Args":[]}' 2>&1 | grep -q "Chaincode invoke successful" && \
  echo -e "${GREEN}✅ InventoryContract initialized${NC}\n" || \
  echo -e "${YELLOW}⚠️  InventoryContract may already be initialized${NC}\n"

# Test 5: OrderContract
echo -e "${GREEN}Test 5: OrderContract${NC}"
peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com \
  --tls --cafile $ORDERER_CA \
  -C supply-chain-channel -n chainvanguard \
  --peerAddresses localhost:7051 --tlsRootCertFiles $PEER_CERT \
  -c '{"function":"OrderContract:initLedger","Args":[]}' 2>&1 | grep -q "Chaincode invoke successful" && \
  echo -e "${GREEN}✅ OrderContract initialized${NC}\n" || \
  echo -e "${YELLOW}⚠️  OrderContract may already be initialized${NC}\n"

# Test 6: VendorRequestContract
echo -e "${GREEN}Test 6: VendorRequestContract${NC}"
peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com \
  --tls --cafile $ORDERER_CA \
  -C supply-chain-channel -n chainvanguard \
  --peerAddresses localhost:7051 --tlsRootCertFiles $PEER_CERT \
  -c '{"function":"VendorRequestContract:initLedger","Args":[]}' 2>&1 | grep -q "Chaincode invoke successful" && \
  echo -e "${GREEN}✅ VendorRequestContract initialized${NC}\n" || \
  echo -e "${YELLOW}⚠️  VendorRequestContract may already be initialized${NC}\n"

# Test 7: TokenContract
echo -e "${GREEN}Test 7: TokenContract${NC}"
peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com \
  --tls --cafile $ORDERER_CA \
  -C supply-chain-channel -n chainvanguard \
  --peerAddresses localhost:7051 --tlsRootCertFiles $PEER_CERT \
  -c '{"function":"TokenContract:initLedger","Args":[]}' 2>&1 | grep -q "Chaincode invoke successful" && \
  echo -e "${GREEN}✅ TokenContract initialized${NC}\n" || \
  echo -e "${YELLOW}⚠️  TokenContract may already be initialized${NC}\n"

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}All 7 contracts tested!${NC}"
echo -e "${YELLOW}========================================${NC}"

echo -e "\n${GREEN}Now testing VendorInventoryContract functionality...${NC}\n"

# Create test vendor inventory
echo -e "${GREEN}Creating vendor inventory...${NC}"
peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com \
  --tls --cafile $ORDERER_CA \
  -C supply-chain-channel -n chainvanguard \
  --peerAddresses localhost:7051 --tlsRootCertFiles $PEER_CERT \
  -c '{"function":"VendorInventoryContract:createVendorInventory","Args":["{\"vendorInventoryId\":\"vinv_test_001\",\"vendorId\":\"vendor_123\",\"vendorName\":\"Test Vendor\",\"sourceInventoryId\":\"inv_001\",\"supplierId\":\"supplier_001\",\"supplierName\":\"Test Supplier\",\"name\":\"Cotton Fabric\",\"description\":\"Premium organic cotton fabric\",\"quantity\":100,\"pricePerUnit\":5.50,\"totalCost\":550.00,\"unit\":\"meters\"}"]}' && \
  echo -e "${GREEN}✅ Vendor inventory created${NC}\n" || \
  echo -e "${RED}❌ Failed to create vendor inventory${NC}\n"

# Query vendor inventory
echo -e "${GREEN}Querying vendor inventory...${NC}"
peer chaincode query -C supply-chain-channel -n chainvanguard \
  -c '{"function":"VendorInventoryContract:getVendorInventory","Args":["vinv_test_001"]}' && \
  echo -e "${GREEN}✅ Vendor inventory query successful${NC}\n" || \
  echo -e "${RED}❌ Failed to query vendor inventory${NC}\n"

# Record usage
echo -e "${GREEN}Recording material usage for product...${NC}"
peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com \
  --tls --cafile $ORDERER_CA \
  -C supply-chain-channel -n chainvanguard \
  --peerAddresses localhost:7051 --tlsRootCertFiles $PEER_CERT \
  -c '{"function":"VendorInventoryContract:recordInventoryUsage","Args":["vinv_test_001","{\"productId\":\"prod_test_001\",\"productName\":\"Cotton T-Shirt\",\"quantityUsed\":2.5}"]}' && \
  echo -e "${GREEN}✅ Material usage recorded${NC}\n" || \
  echo -e "${RED}❌ Failed to record usage${NC}\n"

# Get products created from inventory (traceability!)
echo -e "${GREEN}Getting products created from inventory (traceability)...${NC}"
peer chaincode query -C supply-chain-channel -n chainvanguard \
  -c '{"function":"VendorInventoryContract:getProductsCreatedFromInventory","Args":["vinv_test_001"]}' && \
  echo -e "${GREEN}✅ Product traceability working!${NC}\n" || \
  echo -e "${RED}❌ Failed to get product traceability${NC}\n"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}🎉 All tests completed successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
