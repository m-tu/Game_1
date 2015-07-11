import DrawableObject from './DrawableObject.js';

class Player extends DrawableObject {

  constructor(name, x, y){
    super(x, y);
	this.name = name;
    this.h = 100;
    this.w = 100;
    this.color = 'black';
  }

  toString() {
	return `Player name is: ${this.name}`;
  }

}

export default Player;