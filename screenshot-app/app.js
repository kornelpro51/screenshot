
/**
 * Module dependencies.
 */

var express = require('express')
  , stylus = require('stylus')
  , redis = require('redis')
  , http = require('http')
  , fs = require("fs")
  , atob = require("atob")
  , cuid = require('cuid');

var requestId = function requestId(req, res, next) {
  req.requestId = cuid.slug();
  next();
};

var counter = 0;
app = express();

app.configure(function(){
  app.db = redis.createClient();
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.set('phantom', 'phantomjs');
  app.set('screenshots', '/tmp');
  app.set('default viewport width', 1024);
  app.set('default viewport height', 600);
  app.set('colors', 3);
  app.set('root', __dirname);
  app.use(express.favicon());
  app.use(express.bodyParser());
  app.use(express.logger('dev'));
  app.use(stylus.middleware({ src: __dirname + '/public' }));
  app.use(express.static(__dirname + '/public'));
  app.use(requestId);
  app.use(app.router);
});

app.configure('development', function(){
  app.use(express.errorHandler()); 
});

//require('./routes');

app.get('/', function(req, res) {
  res.render('index');
});
app.get('/getcapture', function(req, res) {
  if ( req.query.url ) {
    console.log(' *** capture start', req.query.url);
    pushResponse(req.requestId, res);
    io.sockets.emit('docapture', {url:req.query.url, requestId: req.requestId})
  } else {
    res.render('index');
  }
});

var server = http.createServer(app);
var io = require('socket.io')(server);
server.listen(3000);
var responses = {};
function pushResponse (reqId, res) {
  responses[reqId] = res;
}
function popResponse (reqId) {
  return responses[reqId];
}

io.on('connection', function (socket) {
  socket.emit('init', { hello: 'world' });
  socket.on('captureresult', function (result) {
    //console.log(' *** capture result', result);
    var res = popResponse(result.requestId);
    if (!res) {
      return;
    }
    var base64Data = result.data.replace(/^data:image\/png;base64,/,"");

    var buf = new Buffer(base64Data, 'base64');

    res.writeHead(200, {'Content-Type': 'image/png' });
    res.end(buf, 'binary');

    counter++;
    fs.writeFile("./captures/"+Date.now()+"_"+counter+".png", base64Data, 'base64', function(err) {
      if (err) {
        console.log(" ** error ** can not out put to file");
      } else {
        console.log(" ** scussess ** captured image was saved as png.");
      }
    });
  });
});


console.log("Express server listening on port 3000");
