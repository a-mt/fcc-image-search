const serverless = require('serverless-http');
const app = require('../../express.js');

module.exports.handler = serverless(app);
