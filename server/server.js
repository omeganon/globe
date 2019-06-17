// most basic dependencies
var express = require('express')
  , morgan = require('morgan')
  , bodyParser = require('body-parser')
  , methodOverride = require('method-override')
  , http = require('http')
  , request = require('request')
  , os = require('os')
  , Memcached = require('memcached')
  , geoip = require('geoip-lite')
  , path = require('path');
 
// create the app
var app = express();
var oldtrack = {
  'track': '', 
  'click': '', 
  'webview': '',
  'message': '',
  'sendtofriend': '',
  'optout': '',
  'EDITOR': '',
  'LOGIN': '',
  'MAIL': '',
  'RESPONSE': '',
  'ACCT_JUMP': '',
  'IMPORT': '',
  'EXPORT': '',
  'SCHEDULED': '',
  'AUDIENCE': '',
  'BILLING': '', 
  'PASSWORD_RESET': '', 
  'UPLOAD': '', 
  'ACTIVATE': '', 
  'PASSOWRD_CHANGE': '', 
};
var oldapp;
var memcached = new Memcached('c-dc-log01.dc.e2.ma:11211');
 
// configure everything, just basic setup
app.set('port', process.env.PORT || 8083);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(morgan('dev'));
app.use(bodyParser());
app.use(methodOverride());
app.use(express.static(path.join(__dirname, 'public')));
 
 
//---------------------------------------
// mini app
//---------------------------------------
var openConnections = [];
 
// simple route to register the clients
app.get('/stats', function(req, res) {
    
    console.log("new client connection. Total connections (0 indexed): " + openConnections.length);
 
    // set timeout as high as possible
    req.socket.setTimeout(Number.MAX_VALUE);
 
    // send headers for event-stream connection
    // see spec for more information
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      	'Access-Control-Allow-Origin': '*'
    });
    res.write('\n');
 
    // push this res object to our global variable
    openConnections.push(res);
 
    // When the request is closed, e.g. the browser window
    // is closed. We search through the open connections
    // array and remove this connection.
    req.on("close", function() {
 //       var toRemove;
//        for (var j =0 ; j < openConnections.length ; j++) {
//            if (openConnections[j] == res) {
//                toRemove =j;
//                break;
//            }
//        }
//        openConnections.splice(j,1);
        openConnections.splice(openConnections.indexOf(res), 1);
        console.log("Connction closed.");
    });
});

function interval(func, wait, times){
    var interv = function(w, t){
        return function(){
            if(typeof t === "undefined" || t-- > 0){
                setTimeout(interv, w);
                try{
                    func.call(null);
                }
                catch(e){
                    t = 0;
                    throw e.toString();
                }
            }
        };
    }(wait, times);

    setTimeout(interv, wait);
};

interval(function() {
    // we walk through each connection
   	memcached.getMulti(['tracker', 'app'], function (err, data) {
      for (var result in data) {
        if (data.hasOwnProperty(result)) {
       	  var json = JSON.parse(data[result]);
	  if (json.address !== null) {
            if (json.address != oldtrack[json.type]) {
              var geo = geoip.lookup(json.address);
              if (geo !==null && geo.ll[0] != 38 && geo.ll[1] != -97) {
                openConnections.forEach(function(resp) {
                var d = new Date();
                  resp.write('id: ' + d.getMilliseconds() + '\n');
                  resp.write('event: ' + json.type + '\n');
                  resp.write('data:{ "geo": { "latitude": "' + geo.ll[0] + '", "longitude": "' + geo.ll[1] + '" } }\n\n'); // Note the extra newline
                });
              } 
              oldtrack[json.type] = json.address;
            }
	  }
        }
      }
  });
}, 5);
 
// startup everything
http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
})
