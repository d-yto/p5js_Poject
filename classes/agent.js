class Living extends Entity {
  constructor(config) {
    super(config);
    this.hunger = config.hunger;
    this.maxHunger = config.maxHunger;
    this.hungerRate = config.hungerRate;
    this.continueEating = false
    this.vel = config.vel;
    this.baseVel = this.vel;
    this.targetVel = this.vel;
    this.direction = { x: random(), y: random() };
    this.noiseOffset = getRandomIntInclusive(1000, 9000);
    this.collisionCooldown = 0;
    this.dead = false;
    this.age = config.age;
    this.type = config.type;
    this.name = names[floor(random(0, names.length))];
    this.BT = null;
  }
  updateFoodIntent() {
    if (this.hunger / this.maxHunger >= 0.90) {
      this.continueEating = false;
    }
  }
  touchingBoundary() {
    let s = this.size / 2;
    [`x`, `y`].forEach((axis, i) => {
      let limit = [game.state.config.mapWidth, game.state.config.mapHeight][i];
      if (this[axis] < s || this[axis] > limit - s) {
        this.direction[axis] *= -1; //swaps its vel
        this[axis] = Math.max(s, Math.min(this[axis], limit - s)); //clamps to nearest boundary so it doesnt get stuck in a wall
      }
    });
  }

  boundaryRepulsion() {
    let boundMargin = 300;
    let repulse = 0.8;
    let brx = 0;
    let bry = 0;

    // X Axis Forces
    if (this.x < boundMargin) {
      brx += repulse * (1 - Math.max(0, this.x) / boundMargin);
    } else if (this.x > game.state.config.mapWidth - boundMargin) {
      brx -= repulse * (1 - Math.max(0, game.state.config.mapWidth - this.x) / boundMargin);
    }

    // Y Axis Forces
    if (this.y < boundMargin) {
      bry += repulse * (1 - Math.max(0, this.y) / boundMargin);
    } else if (this.y > game.state.config.mapHeight - boundMargin) {
      bry -= repulse * (1 - Math.max(0, game.state.config.mapHeight - this.y) / boundMargin);
    }

    return { x: brx, y: bry };
  }

  sampleNoise() {
    /* samples perlin noise for organic movement*/
    let noiseScale = 0.003;
    let nt = 0.005 * frameCount;
    let nx =
      noise(noiseScale * this.x + this.noiseOffset, nt) -
      noise(noiseScale * this.x + this.noiseOffset + 500, nt);
    let ny =
      noise(noiseScale * this.y + this.noiseOffset + 1000, nt) -
      noise(noiseScale * this.y + this.noiseOffset + 1500, nt);
    let lenSq = nx * nx + ny * ny;
    if (lenSq === 0) return;
    let len = sqrt(lenSq);

    return { x: nx, y: ny, len };
  }



  steer(target) {
    //updates direction vector
    if (!target) return;
    let strength =
      this.hunger < this.maxHunger * 0.9
        ? 0.12 * game.state.time.worldSpeed
        : 0.05 * game.state.time.worldSpeed;
    if (this.collisionCooldown > 0) strength = 0.01 * game.state.time.worldSpeed;

    this.direction.x += (target.x - this.direction.x) * strength;
    this.direction.y += (target.y - this.direction.y) * strength;

    //Normalize vector
    let dLen = sqrt(this.direction.x ** 2 + this.direction.y ** 2);
    if (dLen > 0) {
      this.direction.x /= dLen;
      this.direction.y /= dLen;
    }
  }

  move() {
    this.x += this.direction.x * this.vel * game.state.time.worldSpeed;
    this.y += this.direction.y * this.vel * game.state.time.worldSpeed;

    if (this.collisionCooldown <= 0) {
        this.vel += (this.targetVel - this.vel) * 0.09 * game.state.time.worldSpeed;
    };
    this.touchingBoundary();
  }

  updateHunger() {
    if (frameCount % (120 / game.state.time.worldSpeed) === 0)
      this.hunger = max((this.hunger -= this.hungerRate), 0);
  }

  shouldDie() {
    if (this.hunger <= 0) return true;
    if (this.age >= 90) {
      if (frameCount % (300 / game.state.time.worldSpeed) === 0) {
        let odds = this.age * 4 - 350;
        if (getRandomIntInclusive(1, 100) < odds) {
          console.log(`${this.name} died of old age at age ${this.age}`);
          return true;
        }
      }
    }
    return false;
  }
  render() {
     noStroke();
    fill(0, 0, 0, 40);
    ellipse(this.x, this.y + this.size/2.5, this.size * 0.8, this.size * 0.4);

    // Entity Body
    stroke(40, 40, 40, 150); // Soft translucent outline
    strokeWeight(1.5)
    fill(this.color);

    circle(this.x, this.y, this.size);

    let cx = this.x;
    let cy = this.y;
    stroke(255, 255, 255, 150);
    strokeWeight(1);
    line(
      cx,
      cy,
      cx + this.direction.x * (this.vel * 14),
      cy + this.direction.y * (this.vel * 14),
    );
    noStroke();
     if (game.state.metrics.showHealthbars) hungerBar(this);
  }
  findEatablePile() {
    let nearest = null;
    let nearestDistSq = Infinity;
  
    for (let s of game.state.structures) {
      if (!(s instanceof StockPile)) continue;
      // check if it has edible items
      if (!s.items.some(item => game.state.stats[item.resource]?.hunger > 0)) continue;
  
      let cx = s.x + s.width / 2;
      let cy = s.y + s.height / 2;
      let dx = cx - this.x;
      let dy = cy - this.y;
      let dSq = dx * dx + dy * dy;
      if (dSq < nearestDistSq) {
        nearest = s;
        nearestDistSq = dSq;
      }
    }
    return nearest;
  }
  
  eatFromPile(pile) {
    let idx = pile.items.findIndex(item => game.state.stats[item.resource]?.hunger > 0);
    if (idx === -1) { this.targetFoodPile = null; return; }
  
    let item = pile.items.splice(idx, 1)[0];
    let hungerValue = game.state.stats[item.resource].hunger;
    this.hunger = min(this.hunger + hungerValue, this.maxHunger);
    this.targetFoodPile = null; 
    console.log(
      `${this.name} ate ${item.resource} from stockpile`
    );
  }


  findBestFoodOption(){

    let best = null;
    let bestScore = -Infinity;

    // evaluate stockpiles
    for(let pile of game.state.structures){
      if(!(pile instanceof StockPile)) continue;
      let foodItem = pile.getAvailableEdibleItem()
      if(!foodItem) continue;
      let score = this.scoreFoodSource(pile, game.state.stats[foodItem.resource].hunger, "pile");
      
      if(score > bestScore){
        bestScore = score;
        best = {
          type: "pile",
          target: pile,
          score: score
        };
      }
    }
    
    // evaluate wild food
    for(let food of game.state.foods){
      if (food.task) continue 
      let score = this.scoreFoodSource(food, food.hunger,);
      if(score > bestScore){
        bestScore = score;
        best = { type: "wild", target: food, score: score };
      }
    }

    return best;
  }
  scoreFoodSource(target, hungerValue, type){
    const point = target.getTaskPoint ? target.getTaskPoint(this) : target;

    let dx = point.x - this.x;
    let dy = point.y - this.y;
    let distSq = dx * dx + dy * dy
    let dist = sqrt(distSq);

    const distancePenalty = distSq * 0.0002
    let pileBonus = type === "pile" ? 30 : 0;

    return hungerValue * 20 + pileBonus - distancePenalty;

  }
  seekPoint(t, slowingRadius) {
    if (t && typeof t.getTaskPoint === "function") {
      t = t.getTaskPoint(this);
    }
    let dx = t.x - this.x;
    let dy = t.y - this.y;
    let dist = sqrt(dx * dx + dy * dy);
    if (dist === 0) return { x: 0, y: 0, dist: 0 };
    let speed = dist < slowingRadius? dist / slowingRadius: 1;
    this.targetVel = this.baseVel * speed;

    let br = this.boundaryRepulsion();
    return {
      x: dx / dist + br.x,
      y: dy / dist + br.y,
      dist: dist,
    };
  }
  update(foodGrid) {
    this.steeringTarget = null
    this.updateHunger();
    this.updateFoodIntent();
    this.BT.tick(this, {foodGrid: foodGrid, t:getDayTimeFloat()})
    if (this.collisionCooldown > 0) this.collisionCooldown -= game.state.time.worldSpeed;
    this.steer(this.steeringTarget);
    this.move();
  }
}

class Adult extends Living {
  constructor(config) {
    super(config);
    this.children = [];
    this.partner = null;
    this.repRate = getRandomIntInclusive(config.repRateMin, config.repRateMax);
    this.assignedStructure = null;
    this.job = null;
    this.jobState = "idle"; // eg idle or walking or chopping a tree or watering plants so on and so forth
    this.jobTarget = null;
    this.storage = [];
    this.jobSearchCooldown = 0;
    this.targetStockPile = null;
    this.targetFoodPile = null;
    this.foodPileSearchCooldown = 0;
    this.BT = BTrees.adultTree;
    this.currentTask = null
  }

  get canReproduce() {
    return (
      this.repRate <= 0 &&
      this.partner === null &&
      this.currentTask === null &&
      this.hunger > this.maxHunger * 0.65
    );
  }

  

  pileCheck() {
    let nearest = null;
    let nearestDistSq = Infinity;
    for (let s of game.state.structures) {
      if (!(s instanceof StockPile)) continue;
      if (s.currentStorage >= s.storageMax) continue;
      let cx = s.x + s.width / 2;
      let cy = s.y + s.height / 2;
      let dx = cx - this.x;
      let dy = cy - this.y;
      let distSq = dx * dx + dy * dy;
      if (distSq < nearestDistSq) {
        nearestDistSq = distSq;
        nearest = s;
      }
    }
    return nearest;
  }

  
  update(foodGrid) {
    if (this.repRate > 0) this.repRate = max(0, this.repRate - game.state.time.worldSpeed);
    super.update(foodGrid);
  }
}

class Child extends Living {
  constructor(config) {
    super(config);
    this.BT = BTrees.childTree
  }
  growUp() {
    let adult = new Adult(game.state.stats.adult);
    adult.x = this.x;
    adult.y = this.y;
    adult.vel = this.vel + 0.2;
    adult.targetVel = adult.vel;
    adult.direction = this.direction;
    adult.noiseOffset = this.noiseOffset;
    adult.hunger = this.hunger;
    adult.age = 18;
    return adult;
  }
}