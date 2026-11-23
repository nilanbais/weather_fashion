/* 
Code in this file is used in setting up the cookie-parser of the express.js webserver
*/ 

const key = process.env.NODE_ENV || 'development'
const credentials = require(`./server_modules/server_resources/credentials.${key}`);

module.exports = credentials;