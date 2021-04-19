// const { Tone } = require("tone/build/esm/core/Tone");

let socket = io();
window.addEventListener("load", function () {
  //Listen for confirmation of connection
  socket.on("connect", function () {
    console.log("Connected");
  });
});

socket.on("distance", function (data) {
  console.log(data);
  document.getElementById("p1").innerHTML = data;
});

//attach a click listener to a play button
document.querySelector("button")?.addEventListener("click", async () => {
  await Tone.start();
  console.log("audio is ready");
});

const player = new Tone.Player("testSounds/pigeons.mp3").toDestination();
// play as soon as the buffer is loaded
player.autostart = true;

const distortion = new Tone.Distortion(0.9).toDestination();
//connect a player to the distortion
// player.connect(distortion);

const filter = new Tone.Filter(400, "lowpass").toDestination();
// player.connect(filter);

const feedbackDelay = new Tone.FeedbackDelay(0.5, 0.5).toDestination();
// player.connect(feedbackDelay);

const crusher = new Tone.BitCrusher(4).toDestination();
// player.connect(crusher);

const cheby = new Tone.Chebyshev(50).toDestination();
// player.connect(cheby);

const freeverb = new Tone.Freeverb().toDestination();
freeverb.dampening = 1000;
player.connect(freeverb);

const tremolo = new Tone.Tremolo(9, 0.75).toDestination().start();
player.connect(tremolo);

const phaser = new Tone.Phaser({
  frequency: 15,
  octaves: 5,
  baseFrequency: 1000,
}).toDestination();
player.connect(phaser);

// const metalSynth = new Tone.MetalSynth({
//   frequency: 400,
//   envelope: {
//     attack: 0.001,
//     decay: 1.4,
//     release: 0.2,
//   },
//   harmonicity: 5.1,
//   modulationIndex: 32,
//   resonance: 4000,
//   octaves: 1.5,
// }).toDestination();

// metalSynth.triggerAttackRelease("2n", 0.05);
