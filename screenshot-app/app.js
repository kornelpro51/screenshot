
/**
 * Module dependencies.
 */

var HTTP_PORT = 80;
var express = require('express')
  , stylus = require('stylus')
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

// --  Setup HTTP request listener --------------------

app.get('/', function(req, res) {
  res.render('index');
});

app.get('/getcapture', function(req, res) {
  if ( req.query.url ) {
    console.log(' *** capture start', req.query.url);

    // store http response object.
    pushResponse(req.requestId, res);

    // send screenshot request to the chrome extension.
    io.sockets.emit('docapture', {url:req.query.url, requestId: req.requestId})
  } else {
    res.render('index');
  }
});
// --  Create HTTP / socket.io server --------------------

var server = http.createServer(app);
var io = require('socket.io')(server);
server.listen(HTTP_PORT, "0.0.0.0");


var responses = {};
function pushResponse (reqId, res) {
  responses[reqId] = res;
}
function popResponse (reqId) {
  return responses[reqId];
}
// --  socket.io event listener --------------------

io.on('connection', function (socket) {
  socket.emit('init', { command: 'init' });

  // The screenshot result arrived from chrome extension
  socket.on('captureresult', function (result) {

    // pop response by request Id
    var res = popResponse(result.requestId);
    if (!res) {
      return;
    }
    var base64Data = result.data.replace(/^data:image\/png;base64,/,"");
    var buf = new Buffer(base64Data, 'base64');
    res.writeHead(200, {'Content-Type': 'image/png' });
    res.end(buf, 'binary');

    // save the screenshot
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


console.log("Express server listening on port " + HTTP_PORT);
