import { lerp, clamp } from './PTMath.js';

class Game {
  constructor() {
    this.players = [];
    this.enemies = [];

    var numEntities = 128;
    this.entities = new Array(numEntities);
   
    for (var i = 0; i < numEntities; i++) {
      this.entities[i] = {
        assetId: 'nigga',
        active: false,
        position: [Infinity, Infinity],
        prevPosition: [Infinity, Infinity],
        nextPosition: [Infinity, Infinity],
        lastUpdate: 0,
        snapshotAccumDt: 0,
        uncappedAccumDt: 0
      };
    }

  }

  addPlayer(player) {
	  this.players.push(player);
  }

  addEnemy(enemy) {
    this.enemies.push(enemy);
  }

  localUpdate(entity, gameTime, lerpPeriod) {

    var [px, py] = entity.prevPosition;
    var [nx, ny] = entity.nextPosition;

    var dt = gameTime - entity.lastUpdate;
    var t = entity.snapshotAccumDt / lerpPeriod;
    var cx = lerp(px, nx, t);
    var cy = lerp(py, ny, t);

    entity.position = [cx, cy];
    entity.snapshotAccumDt += dt;
    entity.uncappedAccumDt += dt;
    if (entity.snapshotAccumDt > lerpPeriod) {
      entity.snapshotAccumDt = lerpPeriod;
    }
    entity.lastUpdate = gameTime;
  }

  networkUpdate(netEntity) {
    var localEntity = this.entities[netEntity.id];
    localEntity.prevPosition = localEntity.nextPosition;
    localEntity.nextPosition = netEntity.position;
    localEntity.snapshotAccumDt = 0;
    localEntity.uncappedAccumDt = 0;
    localEntity.active = true;
  }

  activeEntities() {
    return this.entities.filter(e => e.active)
  }

  getInfo() {
    if(this.players.length === 0) {
      console.log('Game is empty');
    } else {
      console.log('Players: ');
      this.players.forEach( p => {
        console.log(p.toString());
      });
    }
  }

}

export default Game;
