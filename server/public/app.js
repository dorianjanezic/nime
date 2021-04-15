// import * as Tone from "tone";

// console.log("hi");
// //create a synth and connect it to the main output (your speakers)
// const synth = new Tone.Synth().toDestination();

// //play a middle 'C' for the duration of an 8th note
// synth.triggerAttackRelease("C2", "8n");

var client = new Paho.Client(mqtt.192.168.1.4, Number(mqtt.1883), "sub-client-id");
// set callback handlers
client.onConnectionLost = onConnectionLost;
client.onMessageArrived = onMessageArrived;
// connect the client
console.log("attempting to connect...");
client.connect({ onSuccess: onConnect, useSSL: true });
// called when the client connects
function onConnect() {
  // Once a connection has been made, make a subscription and send a message.
  console.log("onConnect");
  client.subscribe(topic_name);
}

// client.on("message", function (topic, message) {
//   console.log(topic, " : ", message.toString());
//   client.end();
// });
