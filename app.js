var express = require('express');
var request = require('request');
var mongo   = require('mongodb').MongoClient;
var app     = express();

var CSE_API_KEY  = process.env.CSE_API_KEY;
var MONGOLAB_URI = process.env.MONGOLAB_URI;
var nbLatest     = 10;

if(!CSE_API_KEY) {
    throw new Error("Please set the CSE_API_KEY environment variable");
}
if(!MONGOLAB_URI) {
    throw new Error("Please set the MONGOLAB_URI environment variable");
}

// Most recently submitted strings
app.get('/api/latest/imagesearch/', function(req, res){
    mongo.connect(MONGOLAB_URI, function(err, db){
       if(err) throw err;

       db.collection('latestsearch')
         .find({}, {term: 1, when: 1, _id: 0})
         .limit(nbLatest)
         .sort({when: -1})
         .toArray(function(err, docs){
           if(err) throw err;

           res.write('[');
           for(var i=0; i<docs.length; i++) {
               if(i > 0) {
                   res.write(",\n");
               }
               res.write(JSON.stringify(docs[i]));
           }
           res.write(']');
           res.send();
            db.close();
       });
    });
});

// Search images
app.get("/api/imagesearch/:q", function(req, res){
    
    // Get parameters
   var query  = req.params.q;
   var offset = parseInt(req.query.offset) || 1;
   if(isNaN(offset)) {
       offset = 1;
   }
    offset--;

    // Save string to latest searches
    mongo.connect(MONGOLAB_URI, function(err, db){
       if(err) throw err;
       
       var collection = db.collection('latestsearch');
       collection.insert({
           term: query,
           when: new Date()
       }, function(err, data) {
           if(err) {
               db.close();
               return;
           }

           // Remove older requests if necessary
           collection.count({}, function(err, count){
               if(err || count <= nbLatest) {
                   db.close();
                   return;
               }
               collection
                 .find()
                 .skip(count - nbLatest).limit(1)
                 .toArray(function(err, docs){
                     if(err) {
                         db.close();
                         return;
                     }
                     collection.remove({
                         when: {$lt: docs[0].when}
                     }, function(err, data){
                         db.close();
                     });
                 });
           });
       });
    });
    
    // Doc parameters : https://developers.google.com/custom-search/json-api/v1/reference/cse/list#request
    var nbResults = 10;
    var url = 'https://www.googleapis.com/customsearch/v1'
            + '?key=' + CSE_API_KEY
            + '&cx=005970217820831269622:qg0w4rzloeq'
            + '&q=' + encodeURIComponent(query)
            + '&searchType=image'
            + '&num=' + nbResults
            + '&start=' + (offset ? offset*nbResults +1 : 1) // -1 just to test it does work
            + '&fields=items(link,snippet,image/thumbnailLink,image/contextLink)'
            + '&alt=json';

    // Request Custom Search Engine
    request({
        method: 'GET',
        uri: url
    }, function (err, api_res, body) {
        if(err) throw err;

        // Failed ?
        if(api_res.statusCode != 200) {
            var msg = 'Request failed (status: ' + api_res.statusCode + ')';

            try {
                body = JSON.parse(body);
                if(body.error && body.error.errors) {
                    for(var i=0; i<body.error.errors.length; i++) {
                        msg += ' Msg: ' + body.error.errors[i].reason
                    }
                }
            } catch(e) {}

            res.send(JSON.stringify({
                error: msg
            }));
            return;
        }

        // Display formatted content
        var items = JSON.parse(body).items;
        res.write('[');
        for(var i=0; i<items.length; i++) {
            var item = items[i];
            
            if(i != 0) {
                res.write(",\n");
            }
            res.write(JSON.stringify({
                url      : item.link,
                snippet  : item.snippet,
                thumbnail: item.image.thumbnailLink,
                context  : item.image.contextLink
            }));
        }
        res.write(']')
        res.send();
    })
});

app.get('/', function(req, res){
    var Remarkable = require('remarkable');
    var md = new Remarkable({ linkify: true });
    var fs = require('fs');

    fs.readFile(__dirname + '/README.md', 'utf8', function(err, data) {
        if(err) throw err;
        
        app.engine('html', require('ejs').renderFile);
        app.set('view engine', 'html');
        app.set('views', __dirname);

        var url = (req.get('x-forwarded-proto') ? 'https' : 'http') + '://' + req.get('host');
        res.render('layout', {
            body: md.render(data.toString())
                    .replace(/https:\/\/cryptic-ridge-9197.herokuapp.com/g, url)
        });
  });
});

// Start server
var port = process.env.PORT || 8080;
app.listen(port, function(){
    console.log("The server is listening on port " + port);
});
