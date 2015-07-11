class Game {
  constructor(){
	this.players = [];
	this.enemies = [];
  }

  addPlayer(player) {
	this.players.push(player);
  }

  addEnemy(enemy) {
    this.enemies.push(enemy);
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