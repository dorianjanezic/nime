const aedes = require('aedes')();
const server = require('net').createServer(aedes.handle);
// const httpServer = require('http').createServer(handler);
let express = require('express');
let app = express();
app.use('/', express.static('public'));

let http = require('http');
let server_http = http.createServer(app);
let port_http = process.env.PORT || 3000;
server_http.listen(port_http, function () {
  console.log('Websocket srvr listening on port:', port_http);
});
let io = require('socket.io')(server_http); //require socket.io module and pass the http object (server)

var nedb = require('nedb');
var db = new nedb({ filename: 'users.db', autoload: true });
var fs = require('fs'); //require filesystem module
const ws = require('websocket-stream');
const port = 1883;

server.listen(port, function () {
  console.log('Aedes listening on port:', port);
});
// This is an example

// io.sockets.on('connection', function (socket) {
//   console.log('Connected');
//   // WebSocket Connection
//   // var lightvalue = 0; //static variable for current status
//   // socket.on('gyro', function (data) {
//   //   console.log('gyroo');
//   //   socket.emit('gyro', 'packet.payload.toString()'); //send button status to client
//   // });
//   io.sockets.emit('gyro', packet.payload.toString());
// });

// ws.createServer({ server: httpServer }, aedes.handle);

// function handler(req, res) {
//   //create server
//   fs.readFile(__dirname + '/public/index.html', function (err, data) {
//     //read file index.html in public folder
//     if (err) {
//       res.writeHead(404, { 'Content-Type': 'text/html' }); //display 404 on error
//       return res.end('404 Not Found');
//     }
//     res.writeHead(200, { 'Content-Type': 'text/html' }); //write HTML
//     res.write(data); //write data from index.html
//     return res.end();
//   });
// }

aedes.on('subscribe', function (subscriptions, client) {
  db.insert({
    topic: '/',
    action: 'subscribe',
    timestamp: new Date(),
    message: client.id + ' ' + subscriptions,
  });
  console.log(
    'MQTT client \x1b[32m' +
      (client ? client.id : client) +
      '\x1b[0m subscribed to topics: ' +
      subscriptions.map((s) => s.topic).join('\n'),
    'from broker',
    aedes.id
  );
});

aedes.on('unsubscribe', function (subscriptions, client) {
  db.insert({
    topic: '/',
    action: 'unsubscribe',
    timestamp: new Date(),
    message: client.id + ' ' + subscriptions,
  });
  console.log(
    'MQTT client \x1b[32m' +
      (client ? client.id : client) +
      '\x1b[0m unsubscribed to topics: ' +
      subscriptions.join('\n'),
    'from broker',
    aedes.id
  );
});

// fired when a client connects
aedes.on('client', function (client) {
  db.insert({
    topic: '/',
    action: 'connect',
    timestamp: new Date(),
    message: client.id,
  });
  console.log(
    'Client Connected: \x1b[33m' + (client ? client.id : client) + '\x1b[0m',
    'to broker',
    aedes.id
  );
});

// fired when a client disconnects
aedes.on('clientDisconnect', function (client) {
  db.insert({
    topic: '/',
    action: 'disconnect',
    timestamp: new Date(),
    message: client.id,
  });
  console.log(
    'Client Disconnected: \x1b[31m' + (client ? client.id : client) + '\x1b[0m',
    'to broker',
    aedes.id
  );
});

// fired when a message is published
aedes.on('publish', async function (packet, client) {
  if (!client) return;

  packet.payloadString = packet.payload.toString();
  packet.payloadLength = packet.payload.length;
  packet.payload = JSON.stringify(packet.payload);
  packet.timestamp = new Date();
  db.insert(packet);

  db.insert({
    topic: '/',
    action: 'publish',
    timestamp: new Date(),
    message: client.id + ' ' + packet.topic,
  });
  console.log(
    'Client \x1b[31m' +
      (client ? client.id : 'BROKER_' + aedes.id) +
      '\x1b[0m has published',
    packet.payload.toString(),
    'on',
    packet.topic,
    'to broker',
    aedes.id
  );
  io.sockets.on('connection', function (socket) {
    console.log('Connected');
    // WebSocket Connection
    // var lightvalue = 0; //static variable for current status
    // socket.on('gyro', function (data) {
    //   console.log('gyroo');
    //   socket.emit('gyro', 'packet.payload.toString()'); //send button status to client
    // });
    io.sockets.emit('gyro', packet.payload.toString());
  });
});
