import Game from './Game.js';
import Player from './Player.js';

require('../style/style.less');

var Key = {
  w: 87, a: 65, s: 83, d: 68
};
var keys = {};


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

var debug = true;
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
    drawEntity(e);
  });

  requestAnimationFrame(update);
}


function drawEntity(entity) {
  const imgSize = 75;
  const halfSize = imgSize * 0.5;
  var [x, y] = entity.position;
  var [cx, cy] = camera.position;
  // Screen coordinates of the entity
  var [sx, sy] = [x - cx - halfSize, y - cy - halfSize];

  if (debug) {
    ctx.beginPath();
    ctx.drawImage(assets[entity.assetId], sx, sy, 75, 75);
    ctx.arc(x - cx, y - cy, 10, 0, 2 * Math.PI);
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
      game.updateEntity(netEntity);
    }
  };
}


