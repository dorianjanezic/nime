let socket = io();
    window.addEventListener('load', function () {


      //Listen for confirmation of connection
      socket.on('connect', function () {
        console.log("Connected");
      });


    });

    socket.on('distance', function (data) {
      console.log(data);
      document.getElementById("p1").innerHTML = data;
    });