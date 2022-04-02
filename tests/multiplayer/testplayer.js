const dgram = require("dgram");
const { MESSAGE_TYPES } = require("../../constants");
const MIN = 25;
const MAX = 200;
const UPDATE_MS = 33.33;
const WALKING_SPEED = 32; //pixel per second
const INCREMENT = WALKING_SPEED * (UPDATE_MS / 1000);
const HOST = "0.0.0.0";
const PORT = 3000;
const y = 400;
let x = MIN;
let increase = true;

var client = dgram.createSocket("udp4");

setInterval(() => {
  let newX = x;

  newX = x + (increase ? 1 : -1) * INCREMENT;
  const direction = increase ? "EAST" : "WEST";

  const msg = {
    address: "0x1231B0d15a11912959092635BE9803EDb2398EC3",
    xCoord: newX,
    yCoord: y,
    mapId: "map1",
    direction,
    isWalking: true,
    messageType: MESSAGE_TYPES.POSITION_UPDATE,
  };

  const msgStr = JSON.stringify(msg);

  client.send(msgStr, PORT, HOST, (err, bytes) => console.log(msgStr));

  if (newX <= MIN) increase = true;
  if (newX >= MAX) increase = false;
  x = newX;
}, UPDATE_MS);
