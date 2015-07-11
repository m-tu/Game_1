import Point from './point.js';
var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');
var width = canvas.width;
var height = canvas.width;
ctx.fillRect(0, 0, width, height);
ctx.strokeStyle = '#fff';

var conn = new WebSocket('ws://localhost:9001/feed');
conn.onmessage = (msg) => {
  const radius = 10.0;
  const content = JSON.parse(msg.data);
  if (!content) return;
  let [x, y] = content;

  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(x, height - y, radius, Math.PI * 2, false);
  ctx.fill();
  console.log(x + ", " + y);
};
