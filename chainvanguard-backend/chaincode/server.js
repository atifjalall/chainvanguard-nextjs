'use strict';

const shim = require('fabric-shim');

// Import contracts
const UserContract = require('./lib/userContract');
const ProductContract = require('./lib/productContract');
const OrderContract = require('./lib/orderContract');
const InventoryContract = require('./lib/inventoryContract');
const VendorRequestContract = require('./lib/vendorRequestContract');
const TokenContract = require('./lib/tokenContract');

console.log('='.repeat(60));
console.log('Starting ChainVanguard Chaincode Server (CaaS)');
console.log('='.repeat(60));
console.log('CHAINCODE_ID:', process.env.CHAINCODE_ID);
console.log('CHAINCODE_SERVER_ADDRESS:', process.env.CHAINCODE_SERVER_ADDRESS);
console.log('='.repeat(60));

// Start chaincode as external service
const server = shim.server({
    UserContract: UserContract,
    ProductContract: ProductContract,
    OrderContract: OrderContract,
    inventory: InventoryContract,
    vendorRequest: VendorRequestContract,
    TokenContract: TokenContract
}, {
    ccid: process.env.CHAINCODE_ID,
    address: process.env.CHAINCODE_SERVER_ADDRESS
});

server.start().then(() => {
    console.log('✅ Chaincode server started successfully');
    console.log('Listening on:', process.env.CHAINCODE_SERVER_ADDRESS);
}).catch((err) => {
    console.error('❌ Failed to start chaincode server:', err);
    process.exit(1);
});
