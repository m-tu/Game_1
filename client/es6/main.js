import Game from './Game.js';
import Player from './Player.js';

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

var debug = true;
var ctx, game,//idk
    canvas = document.getElementById('canvas'),
    w = canvas.width,
    h = canvas.height;

var mousePos = [0, 0];
var camera = {
  position: [0, 0],
  speed: 16, // meters per second
  PPM: 30, // pixels per meter
  screenSize: [w, h],
  zoom: 1.0,

  toScreenPosition: function(worldPosition) {
    const PPM = this.PPM;
    const scale = this.zoom;
    const [w, h] = this.screenSize;
    const [x, y] = worldPosition;
    const [cx, cy] = this.position;
    return [w * 0.5 - (x - cx) * PPM * -scale, h * 0.5 - (y - cy) * PPM * scale];
  }
};

window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
window.addEventListener('keydown', keyDownListener, false);
window.addEventListener('keyup', keyUpListener, false);
window.addEventListener('mousewheel', function(evt) {
  const delta = evt.wheelDeltaY;
  const dir = delta / Math.abs(delta);
  const zoomFactor = 0.1 * dir;
  camera.zoom *= 1 + zoomFactor;
  return false;
}, false);
window.addEventListener('mousemove', function(evt) {
  const rect = canvas.getBoundingClientRect();
  mousePos[0] = evt.clientX - rect.left;
  mousePos[1] = evt.clientY - rect.top;
}, false);



var gameTime = 0;

var assets = function(names) {
  return names.reduce((acc, name) => {
    var img = new Image();
    img.src = name;
    acc[name] = img;
    return acc;
  }, {});
}(['maneger.png', 'player.png']);

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

  const speed = camera.speed * (1.0 / camera.zoom); // So it won't be slow as shit when zoomed out
  if (keys[Key.w]) camera.position[1] += speed * dt;
  if (keys[Key.a]) camera.position[0] -= speed * dt;
  if (keys[Key.s]) camera.position[1] -= speed * dt;
  if (keys[Key.d]) camera.position[0] += speed * dt;

  const [cx, cy] = camera.toScreenPosition(camera.position);
  const [mx, my] = mousePos;
  const rotation = Math.atan2(cx - mx, cy - my);
  ctx.clearRect(0, 0, w, h);

  var activeEntities = game.activeEntities();
  
  activeEntities.forEach(e => {
    game.localUpdate(e, time, SNAPSHOT_PERIOD);
    drawEntity(e);
  });
  const playerImg = assets['player.png'];
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-rotation);
  ctx.drawImage(playerImg, -playerImg.width * 0.5, -playerImg.height * 0.5);
  ctx.restore();

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

function drawDebugPositions(camera, entity, width) {
  ctx.strokeStyle = 'rgb(255, 255, 0)';
  ctx.lineWidth = 3;
  const [px, py] = camera.toScreenPosition(entity.prevPosition);
  const [cx, cy] = camera.toScreenPosition(entity.position);
  const [nx, ny] = camera.toScreenPosition(entity.nextPosition);
  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.lineTo(nx, ny);
  ctx.stroke();
  ctx.fillStyle = 'rgb(255, 0, 0)';
  ctx.beginPath();
  ctx.arc(cx, cy, 0.05 * camera.PPM, 0, 2 * Math.PI);
  ctx.fill();
}

function drawEntity(entity) {
  const [ex, ey] = entity.position;
  const [sx, sy] = camera.toScreenPosition(entity.position);
  const scale = camera.zoom;
  const imgSize = 75 * scale;
  const halfSize = imgSize * 0.5;

  ctx.drawImage(assets[entity.assetId], sx - halfSize, sy - halfSize, imgSize, imgSize);
  if (debug) {
    drawDebugPositions(camera, entity, halfSize);
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


