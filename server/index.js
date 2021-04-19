/////////////////////////////////////////////////////////////////////////////
let express = require('express');
let app = express();
app.use('/', express.static('public'));
let http = require('http');
let server_http_index = http.createServer(app);
let port_http_index = process.env.PORT || 3000;
server_http_index.listen(port_http_index, function () {
  console.log('Websocket srvr listening on port:', port_http_index);
});

/////////////////////////////////////////////////////////////////////////////
const aedes = require('aedes')();
const server = require('net').createServer(aedes.handle);
const httpServer = require('http').createServer();
const ws = require('websocket-stream');
const port = 1883;
const wsPort = 8888;

server.listen(port, function () {
  console.log('Aedes listening on port:', port);
});

ws.createServer({ server: httpServer }, aedes.handle);

httpServer.listen(wsPort, function () {
  console.log('websocket server listening on port ', wsPort);
});
// const httpServer = require('http').createServer();

const server_http = http.createServer(app);
// server_http.createServer({ server: httpServer }, aedes.handle);
// httpServer.listen(port_http, function () {
//   console.log('Websocket srvr listening on port:', port_http);
// });

aedes.on('subscribe', function (subscriptions, client) {
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
  console.log(
    'Client Connected: \x1b[33m' + (client ? client.id : client) + '\x1b[0m',
    'to broker',
    aedes.id
  );
});

// fired when a client disconnects
aedes.on('clientDisconnect', function (client) {
  console.log(
    'Client Disconnected: \x1b[31m' + (client ? client.id : client) + '\x1b[0m',
    'to broker',
    aedes.id
  );
});

// fired when a message is published
aedes.on('publish', async function (packet, client) {
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
});