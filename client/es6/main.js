import Game from './Game.js';
import Player from './Player.js';

require('../style/style.less');

window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;

var ctx, game,//idk
    canvas = document.getElementById('canvas'),
    w = canvas.width,
    h = canvas.height;

var manegger = new Image();
manegger.src = 'maneger.jpg';

(function runGaem(){
  ctx = canvas.getContext('2d');

  console.log('start');
  game = new Game();

  for (var i = 0; i < 3; i++) {
    game.addPlayer(new Player("nignog" + 1, -100, -100))
  }
  muthafukingBlackBox();

  requestAnimationFrame(update);
})();

function update() {
  ctx.clearRect(0, 0, w, h);
  game.players.forEach(p => {
    drawPlayer(p);
  });

  requestAnimationFrame(update);
}


function drawPlayer(player){
  //ctx.beginPath();
  //ctx.fillStyle = player.color;
  //ctx.rect(player.x, player.y, player.w, player.h);
  //ctx.fill();
  //ctx.closePath();
  ctx.drawImage(manegger, player.x, player.y);
}



function muthafukingBlackBox() {
  var conn = new WebSocket('ws://localhost:9001/feed');
  conn.onmessage = (msg) => {
    const content = JSON.parse(msg.data);
    if (!content) return;
    let positions = content;

    for (var i = 0; i < positions.length; i++) {
      var p = game.players[i];
      var [x, y] = positions[i];
      p.x = x;
      p.y = h - y - p.h;
    }
  };
}


