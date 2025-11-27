'use strict';

const UserContract = require('./lib/userContract');
const ProductContract = require('./lib/productContract');
const OrderContract = require('./lib/orderContract');
const InventoryContract = require('./lib/inventoryContract');
const VendorRequestContract = require('./lib/vendorRequestContract');
const TokenContract = require('./lib/tokenContract');

module.exports.UserContract = UserContract;
module.exports.ProductContract = ProductContract;
module.exports.OrderContract = OrderContract;
module.exports.InventoryContract = InventoryContract;
module.exports.VendorRequestContract = VendorRequestContract;
module.exports.TokenContract = TokenContract;

module.exports.contracts = [
  UserContract,
  ProductContract,
  OrderContract,
  InventoryContract,
  VendorRequestContract,
  TokenContract
];
