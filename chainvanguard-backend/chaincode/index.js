"use strict";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const UserContract = require("./lib/userContract");

module.exports.UserContract = UserContract;
module.exports.contracts = [UserContract];
