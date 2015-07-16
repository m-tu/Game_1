import Game from './Game.js';
import Player from './Player.js';

require('../style/style.less');

var Key = {
  w: 87, a: 65, s: 83, d: 68
};
var keys = {};
const SNAPSHOT_PERIOD = 100;
const PPM = 30; //pixels per meter


function keyDownListener(evt) {
  keys[evt.keyCode] = true;
};

function keyUpListener(evt) {
  keys[evt.keyCode] = false;
}

window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
window.addEventListener('keydown', keyDownListener, false);
window.addEventListener('keyup', keyUpListener, false);

var debug = false;
var camera = {
  position: [0, 0],
  speed: 500 // pixels per second
};
var ctx, game,//idk
    canvas = document.getElementById('canvas'),
    w = canvas.width,
    h = canvas.height;

var gameTime = 0;

var nignog = new Image();
nignog.src = 'maneger.png';
var assets = {
  nigga: nignog 
};

(function runGaem(){
  ctx = canvas.getContext('2d');

  console.log('start');
  game = new Game();

  muthafukingBlackBox();

  requestAnimationFrame(update);
})();

function update(time) {
  var dt = (time - gameTime) / 1000.0;
  gameTime = time;

  if (keys[Key.w]) camera.position[1] -= camera.speed * dt;
  if (keys[Key.a]) camera.position[0] -= camera.speed * dt;
  if (keys[Key.s]) camera.position[1] += camera.speed * dt;
  if (keys[Key.d]) camera.position[0] += camera.speed * dt;

  ctx.clearRect(0, 0, w, h);

  var activeEntities = game.activeEntities();
  activeEntities.forEach(e => {
    game.localUpdate(e, time, SNAPSHOT_PERIOD);
    drawEntity(e);
  });

  requestAnimationFrame(update);
}

function drawSnapshotBar(x, y, entity, snapshotPeriod) {
  const width = 100;
  const height = 10;
  const beginX = x - width * 0.5;
  const beginY = y - 50;

  if (entity.uncappedAccumDt > snapshotPeriod) {
    ctx.fillStyle = 'rgb(255, 0, 0)';
    const overflow = entity.uncappedAccumDt / snapshotPeriod;
    ctx.fillRect(beginX, beginY, width * overflow, height);
  }
  ctx.fillStyle = 'rgb(0, 0, 0)';
  ctx.fillRect(beginX, beginY, width, height);
  ctx.fillStyle = 'rgb(0, 255, 0)';
  ctx.fillRect(beginX, beginY, entity.snapshotAccumDt / snapshotPeriod * width, height);

}

function drawDebugPositions(camera, entity) {
  ctx.strokeStyle = 'rgb(255, 255, 0)';
  ctx.lineWidth = 3;
  const [cx, cy] = camera.position;
  const [x, y] = entity.prevPosition;
  const [nx, ny] = entity.nextPosition;
  ctx.beginPath();
  ctx.moveTo(x * PPM - cx, y * PPM - cy);
  ctx.lineTo(nx * PPM - cx, ny * PPM - cy);
  ctx.stroke();
}

function drawEntity(entity) {
  const imgSize = 75;
  const halfSize = imgSize * 0.5;
  var [ex, ey] = entity.position;
  var [x, y] = [ex * PPM, ey * PPM];
  var [cx, cy] = camera.position;
  // Screen coordinates of the entity image
  var [sx, sy] = [x - cx - halfSize, y - cy - halfSize];

  ctx.drawImage(assets[entity.assetId], sx, sy, 75, 75);
  if (debug) {
    drawDebugPositions(camera, entity);
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgb(255, 0, 0)';
    ctx.beginPath();
    ctx.arc(x - cx, y - cy, 1 * PPM, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x - cx, y - cy, 1, 0, 2 * Math.PI);
    ctx.stroke();
  }
}



function muthafukingBlackBox() {
  var conn = new WebSocket('ws://localhost:9001/feed');
  conn.onmessage = (msg) => {
    const netEntities = JSON.parse(msg.data);
    if (!netEntities) return;

    for (var i = 0; i < netEntities.length; i++) {
      var netEntity = netEntities[i];
      game.networkUpdate(netEntity);
    }
  };
}


