/* eslint-disable @typescript-eslint/no-require-imports */
"use strict";

const UserContract = require("./lib/userContract");
const ProductContract = require("./lib/productContract");
const OrderContract = require("./lib/orderContract");

module.exports.UserContract = UserContract;
module.exports.ProductContract = ProductContract;
module.exports.OrderContract = OrderContract;

module.exports.contracts = [UserContract, ProductContract, OrderContract];
