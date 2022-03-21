const dgram = require("dgram");
const MIN = 200;
const MAX = 300;
const UPDATE_MS = 33.33;
const WALKING_SPEED = 32; //pixel per second
const INCREMENT = WALKING_SPEED * (UPDATE_MS / 1000);
const HOST = "192.168.1.174";
const PORT = 3000;
const y = 200;
let x = MIN;
let increase = true;

var client = dgram.createSocket("udp4");

setInterval(() => {
  let newX = x;

  newX = x + (increase ? 1 : -1) * INCREMENT;
  const direction = increase ? "EAST" : "WEST";

  const msg = {
    x: newX,
    y,
    mapId: "map1",
    direction,
    isWalking: true,
    messageType: "POSITION_UPDATE",
  };

  const msgStr = JSON.stringify(msg);

  client.send(msgStr, 0, msgStr.length, PORT, HOST);

  if (newX <= MIN) increase = true;
  if (newX >= MAX) increase = false;
  x = newX;
}, UPDATE_MS);