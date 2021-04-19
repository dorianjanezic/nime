var mqtt = require("mqtt");
var client = mqtt.connect("mqtt://localhost:1883");
console.log(client);

client.on("connect", function () {
  client.publish("presence", "Hello mqtt");
});

client.on("message", function (topic, message) {
  // message is Buffer
  console.log(message.toString());
  client.end();
});
