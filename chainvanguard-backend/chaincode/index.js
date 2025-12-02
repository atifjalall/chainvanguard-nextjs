/* eslint-disable @typescript-eslint/no-require-imports */
'use strict';

const UserContract = require('./lib/userContract');
const ProductContract = require('./lib/productContract');
const OrderContract = require('./lib/orderContract');
const InventoryContract = require('./lib/inventoryContract');
const VendorRequestContract = require('./lib/vendorRequestContract');
const VendorInventoryContract = require('./lib/vendorInventoryContract');
const TokenContract = require('./lib/tokenContract');
const BackupContract = require('./lib/backupContract');

module.exports.UserContract = UserContract;
module.exports.ProductContract = ProductContract;
module.exports.OrderContract = OrderContract;
module.exports.InventoryContract = InventoryContract;
module.exports.VendorRequestContract = VendorRequestContract;
module.exports.VendorInventoryContract = VendorInventoryContract;
module.exports.TokenContract = TokenContract;
module.exports.BackupContract = BackupContract;

module.exports.contracts = [
  UserContract,
  ProductContract,
  OrderContract,
  InventoryContract,
  VendorRequestContract,
  VendorInventoryContract,
  TokenContract,
  BackupContract
];
