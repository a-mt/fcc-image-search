const { MongoClient, ObjectId } = require('mongodb');

var express = require('express');
var request = require('request');
var app     = express();
var router  = express.Router();

var CSE_API_KEY  = process.env.CSE_API_KEY;
var MONGOLAB_URI = process.env.MONGOLAB_URI;
var DB_NAME      = 'imagesearch';
var nbLatest     = 10;

const mongoClient = new MongoClient(MONGOLAB_URI);
const mongoConnection = mongoClient.connect();

if(!CSE_API_KEY) {
    throw new Error("Please set the CSE_API_KEY environment variable");
}
if(!MONGOLAB_URI) {
    throw new Error("Please set the MONGOLAB_URI environment variable");
}

// Most recently submitted strings
router.get('/api/latest/imagesearch/', async function(req, res){   
    var db = (await mongoConnection).db(DB_NAME);

    db.collection('latestsearch')
     .find({}, {term: 1, when: 1, _id: 0})
     .limit(nbLatest)
     .sort({when: -1})
     .toArray()
     .then((docs) => {
       res.write('[');
       for(var i=0; i<docs.length; i++) {
           if(i > 0) {
               res.write(",\n");
           }
           res.write(JSON.stringify(docs[i]));
       }
       res.write(']');
       res.send();

    }).catch(err => {
        console.error(err);
        res.send(JSON.stringify(err));
    });
});

// Search images
router.get("/api/imagesearch/:q", async function(req, res){
    
    // Get parameters
   var query  = req.params.q;
   var offset = parseInt(req.query.offset) || 1;
   if(isNaN(offset)) {
       offset = 1;
   }
    offset--;

    // Save string to latest searches
    var db = (await mongoConnection).db(DB_NAME);
    var collection = db.collection('latestsearch');

    collection.insertOne({
       term: query,
       when: new Date()
    }).then(function(data) {

       // Remove older requests if necessary
       collection.count({}).then(function(count){
           if(count <= nbLatest) {
               return;
           }
           collection
             .find()
             .skip(count - nbLatest).limit(1)
             .toArray()
             .then((docs) => {
                 collection.deleteMany({
                     when: {$lt: docs[0].when}
                 });
             });
       }).catch(err => {
            console.error(err);
            res.send(JSON.stringify(err));
       });

    }).catch(err => {
        console.error(err);
        res.send(JSON.stringify(err));
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

router.get('/', function(req, res){
    var Remarkable = require('remarkable');
    var md = new Remarkable({ linkify: true });
    var url  = (req.get('x-forwarded-proto') ? 'https' : 'http') + '://' + req.get('host');

    data = `
    # Image Search Abstraction Layer

    User Stories :

    * I can get the image URLs, alt text and page urls for a set of images relating to a given search string

      ex : ${url}/api/imagesearch/lolcats%20funny 

    * I can paginate through the responses by adding a ?offset=2 parameter to the URL.

      ex : ${url}/api/imagesearch/lolcats%20funny?offset=10 

    * I can get a list of the most recently submitted search strings

      ex : ${url}/api/latest/imagesearch/
    `.replace(/\n    /g, '\n');

    app.engine('html', require('ejs').renderFile);
    app.set('view engine', 'html');
    app.set('views', process.cwd());

    var url = (req.get('x-forwarded-proto') ? 'https' : 'http') + '://' + req.get('host');
    res.render('layout', {
        body: md.render(data.toString()),
    });
});

app.use(router);

module.exports = app;