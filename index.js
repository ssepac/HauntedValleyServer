const dgram = require("dgram");
const luxon = require("luxon");
const dod = require('deep-object-diff')
const { MESSAGE_TYPES, DEFAULT_INACTIVITY_TIME, DEFAULT_SUBSCRIPTION_EXPIRY_TIME } = require("./constants");
const {checkOnline, getSubscriberName} = require('./util')

const server = dgram.createSocket("udp4");

//Includes dummy first value
const playerInfoMap = {
  "0xdummy_address": {
    x: 450,
    y: 450,
    mapId: "map1",
    direction: "WEST",
  },
};
let playerInfoMapOld={
  "0xdummy_address": {
    x: 450,
    y: 450,
    mapId: "map1",
    direction: "WEST",
  },
}
let playerStatusMap = {};
const PORT = 3000;
const HOST = "192.168.1.174";

server.on("error", (err) => {
  console.log(`server error:\n${err.stack}`);
  server.close();
});

server.on("connect", () => {
  console.log("recv");
});

server.on("message", (msg, rinfo) => {
  const parsedMsg = JSON.parse(msg);
  console.log(parsedMsg)

  //TODO Split this into different files and/or methods
  switch (parsedMsg.messageType) {
    case MESSAGE_TYPES.POSITION_UPDATE:

      //Upsert player status
      playerStatusMap[parsedMsg.address] = {
        lastActivity: luxon.DateTime.now().toMillis(),
        connectionInfo: {
          port: rinfo.port,
          address: rinfo.address,
        },
      };

      playerInfoMap[parsedMsg.address] = {
        x: parsedMsg.xCoord,
        y: parsedMsg.yCoord,
        mapId: parsedMsg.mapId,
        direction: parsedMsg.direction,
        isWalking: parsedMsg.isWalking,
      };
      //console.log(JSON.stringify(playerInfoMap));
      //server.send(JSON.stringify(playerInfoMap), rinfo.port, rinfo.address);
      break;
    case MESSAGE_TYPES.QUERY:
      server.send(JSON.stringify(playerInfoMap), rinfo.port, rinfo.address);
      break;
    case MESSAGE_TYPES.SUBSCRIBE:
      playerStatusMap[getSubscriberName(rinfo.address, rinfo.port)] = {
        lastActivity: luxon.DateTime.now().toMillis(),
        connectionInfo: {
          port: rinfo.port,
          address: rinfo.address,
          persistent: true
        },
      };
      console.log(`${rinfo.address} subscribed.`)
      break;
    case MESSAGE_TYPES.UNSUBSCRIBE:
      delete playerStatusMap[rinfo.address]
      console.log(`${rinfo.address}:${rinfo.port} unsubscribed.`)
      break;
  }
});

server.on("listening", () => {
  const address = server.address();
  console.log(`server listening ${address.address}:${address.port}`);
});

server.bind(PORT, HOST);

//Sends player coord map to all players.
setInterval(() => {
  Object.keys(playerStatusMap).forEach((player) => {
    const diff = dod.diff(playerInfoMapOld, playerInfoMap)
    //console.log(JSON.stringify(diff))
    server.send(JSON.stringify(diff), playerStatusMap[player].connectionInfo.port, playerStatusMap[player].connectionInfo.address);
    playerInfoMapOld = {...playerInfoMap}
  });
}, 15);

//Remove inactive players and expired subscriptions from "mailing list".
setInterval(()=>{
  Object.keys(playerStatusMap).forEach((player) => {

    /** Players will log out after 10 seconds of no update from client. */
    if(!playerStatusMap[player].connectionInfo.persistent && !checkOnline(DEFAULT_INACTIVITY_TIME, luxon.DateTime.now().toMillis(), playerStatusMap[player].lastActivity)){
      console.log(`Player at ${playerStatusMap[player].connectionInfo.address}:${playerStatusMap[player].connectionInfo.port} went offline.`)
      delete playerStatusMap[player]
    }
    /** Subscriptions will persist up to an hour (3.6e6 ms) before terminating. */
    else if(playerStatusMap[player].connectionInfo.persistent && !checkOnline(DEFAULT_SUBSCRIPTION_EXPIRY_TIME, luxon.DateTime.now().toMillis(), playerStatusMap[player].lastActivity)){
      console.log(`Subscriber at ${playerStatusMap[player].connectionInfo.address}:${playerStatusMap[player].connectionInfo.port} was removed via expiration.`)
      delete playerStatusMap[player]
    }
  })
}, 1000)
