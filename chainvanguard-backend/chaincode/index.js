/* eslint-disable @typescript-eslint/no-require-imports */
"use strict";

const UserContract = require("./lib/userContract");
const ProductContract = require("./lib/productContract");

module.exports.UserContract = UserContract;
module.exports.ProductContract = ProductContract;

module.exports.contracts = [UserContract, ProductContract];
