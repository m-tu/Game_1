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
        position: [Infinity, Infinity]
      };
    }

  }

  addPlayer(player) {
	  this.players.push(player);
  }

  addEnemy(enemy) {
    this.enemies.push(enemy);
  }

  updateEntity(netEntity) {
    var localEntity = this.entities[netEntity.id];
    localEntity.position = netEntity.position;
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
