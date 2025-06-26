require('dotenv').config();
console.log(process.env.GOCARDLESS_ACCESS_TOKEN); // prints your token
const gocardless = require('gocardless-pro-node');