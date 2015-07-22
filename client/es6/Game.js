import { lerp, clamp } from './PTMath.js';

class Entity {

  constructor(manager, id) {
    this.manager = manager;
    this.id = id;
    this.components = new Set();
  }

  addComponent(name, attributes) {
    Object.assign(this, attributes);
    this.components.add(name);
    this.manager.registerComponent(name, this.id);
  }

  hasComponent(name) {
    return this.components.has(name);
  }
}

class Game {

  constructor() {
    var numEntities = 256;
    this.components = {};
    this.entities = new Array(numEntities);
    this.gameTime = 0;
    this.idCounter = 0;
    this.networkMapping = new Map();

    this.clientUpdateRate = 10;
    this.currUpdateMs = 0;
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
    if (entity.snapshotAccumDt > lerpPeriod) {
      entity.snapshotAccumDt = lerpPeriod;
    }
    entity.lastUpdate = gameTime;
  }

  networkUpdate(netEntity) {
    var localId = this.networkMapping.get(netEntity.id);

    if (localId === undefined) {
      console.log("no local id for net id: " + netEntity.id);
      return;
    }

    var localEntity = this.entities[localId];

    if (localEntity.hasComponent('position') &&
        localEntity.hasComponent('network')) {
      localEntity.prevPosition = localEntity.nextPosition;
      localEntity.nextPosition = netEntity.position;
      localEntity.snapshotAccumDt = 0;
    } else {
      console.log(localEntity.id + " does not have the required components for network update");
      return;
    }
  }

  createEntity() {

    const id = this.idCounter++;
    // Could extend here?
    if (id >= this.entities.length) {
      console.log("entity pool not large enough for id " + id);
      return;
    }

    var entity = new Entity(this, id);
    this.entities[id] = entity;
    return entity;
  }

  findEntity(id) {
    return this.entities[id];
  }

  destroyEntity(entity) {
    var id = entity.id;
    for (let c of entity.components) {
      this.unregisterComponent(c, id);
    }
    delete this.entities[id];
    // TODO: Add ID to free list
  }

  registerComponent(name, id) {
    var ids = this.components[name];
    if (ids) {
      ids.add(id);
    } else {
      this.components[name] = new Set([id]);
    }
  }

  unregisterComponent(name, id) {
    var ids = this.components[name];
    if (ids) {
      ids.delete(id);
    }
  }

  getEntities(...components) {
    const sets = components.map(name => this.components[name]);

    // If a component list is undefined, no entity exists with all the components for a given name.
    for (var i = 0; i < sets.length; i++) {
      if (sets[i] === undefined) return [];
    }

    const ids = sets.reduce((acc, s) => {
      return new Set([...acc].filter(x => s.has(x)));
    });

    return [...ids].map(id => this.entities[id]);
  }

}

export default Game;
