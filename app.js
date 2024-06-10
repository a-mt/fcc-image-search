'use strict';

const app = require('./express');

// Start server
var port = process.env.PORT || 8080;
app.listen(port, function(){
    console.log("The server is listening on port " + port);
});
