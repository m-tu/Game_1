import Game from './Game.js';
import Player from './Player.js';
import * as Vec2 from './Vec2.js';

require('../style/style.less');

var Key = {
  w: 87, a: 65, s: 83, d: 68
};
var keys = {};
const SNAPSHOT_PERIOD = 100;

function keyDownListener(evt) {
  keys[evt.keyCode] = true;
};

function keyUpListener(evt) {
  keys[evt.keyCode] = false;
}

var debug = false;
var ctx, game,//idk
    canvas = document.getElementById('canvas'),
    w = canvas.width,
    h = canvas.height;


var toScreenPosition = function(camera, worldPosition) {
  const [w, h] = camera.screenSize;
  const [x, y] = worldPosition;
  const [cx, cy] = camera.position;
  return [w * 0.5 + (x - cx) * camera.PPM * camera.zoom,
          h * 0.5 - (y - cy) * camera.PPM * camera.zoom];
};

var toWorldPosition = function(camera, screenPosition) {
  const [w, h] = camera.screenSize;
  const [x, y] = screenPosition;
  const [cx, cy] = camera.position;
  return [(x - w * 0.5) / camera.PPM / camera.zoom + cx,
          -(y - h * 0.5) / camera.PPM / camera.zoom + cy];
};

var mousePos = [0, 0];

window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
window.addEventListener('keydown', keyDownListener, false);
window.addEventListener('keyup', keyUpListener, false);
window.addEventListener('mousewheel', function(evt) {
  const delta = evt.wheelDeltaY;
  const dir = delta / Math.abs(delta);
  const zoomFactor = 0.1 * dir;
  game.getEntities('camera').forEach(e => {
    e.zoom *= 1 + zoomFactor;
  });
  return false;
}, false);
window.addEventListener('mousemove', function(evt) {
  const rect = canvas.getBoundingClientRect();
  mousePos[0] = evt.clientX - rect.left;
  mousePos[1] = evt.clientY - rect.top;
}, false);

var assets = function(names) {
  return names.reduce((acc, name) => {
    var img = new Image();
    img.src = name;
    acc[name] = img;
    return acc;
  }, {});
}(['maneger.png', 'player.png', 'dummy.png']);

(function runGaem(){
  ctx = canvas.getContext('2d');

  console.log('start');
  game = new Game();

  muthafukingBlackBox();

  requestAnimationFrame(update);
})();

function update(time) {

  var dt = (time - game.gameTime) / 1000.0;
  game.gameTime = time;

  game.currUpdateMs += dt;
  if (game.currUpdateMs >= 1.0 / game.clientUpdateRate) {
    game.currUpdateMs = 0;
    if (game.connection.readyState === WebSocket.OPEN) {
      game.getEntities('position', 'camera', 'network').forEach(e => {

        var message = {
          type: 'cl-update',
          content: {
            rotation: e.rotation,
            id: e.networkId
          }
        };
        
        game.connection.send(JSON.stringify(message));
      });
    }
  }

  game.getEntities('position', 'camera', 'network').forEach(e => {
    const speed = e.speed;
    const st = speed * dt;
    const [mx, my] = toWorldPosition(e, mousePos);
    const diff = [mx - e.position[0], my - e.position[1]];
    var rotation = Math.atan2(diff[0], diff[1]);

    e.rotation = rotation;
  });

  game.getEntities('position', 'network').forEach(e => {
    game.localUpdate(e, time, SNAPSHOT_PERIOD);
  });

  const camera = game.getEntities('camera', 'position')[0];
  ctx.clearRect(0, 0, w, h);
  game.getEntities('position', 'asset').forEach(e => drawEntity(camera, e));
  
  if (debug) {
    game.getEntities('position', 'network').forEach(e => {
      drawDebugPositions(camera, e); 
    });
  }

  requestAnimationFrame(update);
}

function drawDebugPositions(camera, entity) {
  ctx.strokeStyle = 'rgb(255, 255, 0)';
  ctx.lineWidth = 3;
  const [px, py] = toScreenPosition(camera, entity.prevPosition);
  const [cx, cy] = toScreenPosition(camera, entity.position);
  const [nx, ny] = toScreenPosition(camera, entity.nextPosition);
  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.lineTo(nx, ny);
  ctx.stroke();
  ctx.fillStyle = 'rgb(255, 0, 0)';
  ctx.beginPath();
  ctx.arc(cx, cy, 0.05 * camera.PPM, 0, 2 * Math.PI);
  ctx.fill();
}

function drawEntity(camera, entity) {

  const [sx, sy] = toScreenPosition(camera, entity.position);

  const img = assets[entity.assetId];
  const w = img.width;
  const h = img.height;

  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate(entity.rotation);
  ctx.scale(camera.zoom, camera.zoom);
  ctx.drawImage(assets[entity.assetId], -w * 0.5, -h * 0.5, w, h);
  ctx.restore();
}



function muthafukingBlackBox() {

  var playerEntity = game.createEntity();
  playerEntity.addComponent('position', {
    position: [0, 0],
    rotation: 0
  });

  playerEntity.addComponent('camera', {
    speed: 32, // meters per second
    PPM: 30, // pixels per meter
    screenSize: [w, h],
    zoom: 1.0,
  });

  playerEntity.addComponent('asset', {
    assetId: 'player.png'
  });

  var conn = new WebSocket('ws://localhost:9001/feed');
  game.connection = conn;
  conn.onopen = (evt) => {
    conn.send(JSON.stringify({
      type: 'join-req'
    }));
  };
  conn.onmessage = (msg) => {

    const message = JSON.parse(msg.data);

    if (!message) return;
    const payload = message.content;
    switch (message.type) {
      case 'join-ack':
        playerEntity.addComponent('network', {
          networkWeight: 0,
          networkId: payload.id,
          prevRotation: payload.rotation || 0,
          nextRotation: payload.rotation || 0,
          prevPosition: payload.position,
          nextPosition: payload.position,
          lastUpdate: game.gameTime,
          snapshotAccumDt: 0
        });
        game.networkMapping.set(payload.id, playerEntity.id);
        break;
      case 'player-join':
        var entity = game.createEntity();
        entity.addComponent('position', {
          position: payload.position,
          rotation: 0
        });

        entity.addComponent('asset', {
          assetId: 'player.png'
        });

        entity.addComponent('network', {
          networkWeight: 100,
          networkId: payload.id,
          prevRotation: payload.rotation || 0,
          nextRotation: payload.rotation || 0,
          prevPosition: payload.position,
          nextPosition: payload.position,
          lastUpdate: game.gameTime,
          snapshotAccumDt: 0
        });

        game.networkMapping.set(payload.id, entity.id);
        break;
      case 'update':
        const netEntities = message.content;
        for (var i = 0; i < netEntities.length; i++) {
          var netEntity = netEntities[i];
          game.networkUpdate(netEntity);
        }
        break;
      case 'player-quit':
        var localId = game.networkMapping.get(payload.id);
        var entity = game.findEntity(localId);
        console.log("destroying entity" + entity);
        game.destroyEntity(entity);
        break;
      case 'spawns':
        const spawns = message.content;
        const assetMap = {
          'player': 'player.png',
          'npc': 'maneger.png'
        };
        spawns.forEach(spawn => {
          var entity = game.createEntity();
          entity.addComponent('position', {
            position: spawn.position,
            rotation: 0
          });

          entity.addComponent('network', {
            networkWeight: 100,
            networkId: spawn.id,
            prevRotation: spawn.rotation || 0,
            nextRotation: spawn.rotation || 0,
            prevPosition: spawn.position,
            nextPosition: spawn.position,
            lastUpdate: game.gameTime,
            snapshotAccumDt: 0
          });

          game.networkMapping.set(spawn.id, entity.id);

          entity.addComponent('asset', {
            assetId: assetMap[spawn.type] || 'dummy.png'
          });
        });
        break;
      default:
        console.log("received unknown message type: " + message.type);
        break;
    }

  };
}


