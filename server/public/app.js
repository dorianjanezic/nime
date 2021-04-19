const client = mqtt.connect('ws://localhost:8888', {
      clientId: 'javascript'
    });

    client.on('connect', function () {
      console.log('connected!');
      client.subscribe('distance');
    });

    client.on('message', function (topic, message) {
      console.log(topic + ': ' + message.toString());
      document.getElementById("p1").innerHTML = message.toString();
    });

    document.getElementById('button1').addEventListener('click', function () {
      client.publish('hello', 'world');
    });