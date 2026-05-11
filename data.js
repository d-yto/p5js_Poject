let data = {
  people: [],
  foods: [],
  collisions: [],
  nearestFoods: [],
  infoBars: [],
  structures: [],
  selected: null,
  activeUI: null,
  builderUI:null,
};
let stats = {
  adult: {
    color: [132, 102, 100],
    get vel() {
      return getRandomNumInclusive(0.9, 1.1);
    },
    type: "adult",
    get age() {
      return getRandomIntInclusive(18, 85);
    },
    size: 12,
    hunger: 43,
    maxHunger: 60,
    hungerRate: 1,
    repRateMin: 0,
    repRateMax: 500,
  },
  child: {
    color: [100, 130, 132],
    get vel() {
      return getRandomNumInclusive(0.7, 0.9);
    },
    type: "kid",
    age: 0,
    size: 8,
    hunger: 17,
    maxHunger: 25,
    hungerRate: 1,
  },
  carrot: {
    foodName: "carrot",
    color: [186, 98, 69],
    size: 7,
    hunger: 6,
    rotTime: 5,
    rotRate: 0.9,
  },
};

let jobs = {
  farmer: { type: `farmer` },
  builder: {},
  forager: {},
  hunter: {},
  lumberjack: {},
};
let names = [
    `Heubert`, `Hank`, `Shelly`, `Merideth`, `Benjamin`, `Theodore`, `Gerald`, `Elton`, `Archie`, `Gary`, `Agatha`, `Wilfred`, `Ingrid`, `Ernest`, `Edwin`,
    `Fitzgerald`, `Olen`, `Fredrick`, `Wilbert`, `Darcel`, `Daisy`, `Petunia`, `Paulene`, `Franklynn`, `Trudie`, `Dennis`, `Bryan`, `Patrishia`,
    `Eleanor`, `Clyde`, `Mabel`, `Harold`, `Beatrice`, `Clarence`, `Myrtle`, `Eugene`, `Florence`, `Alfred`, `Mildred`, `Cecil`, `Hattie`,
    `Leonard`, `Blanche`, `Norman`, `Ethel`, `Stanley`, `Viola`, `Howard`, `Lillian`, `Ralph`, `Gertrude`, `Victor`, `Clara`, `Edgar`, `Nellie`,
    `Wallace`, `Pearl`, `Milton`, `Ada`, `Lloyd`, `Irene`, `Russell`, `Olive`, `Harvey`, `Esther`, `Raymond`, `Hazel`, `Gilbert`, `Fannie`
];
let jobBehaviours = {
  farmer:{
    requirement: (item) => item instanceof FarmCrop && (item.watered === false || item.growthStage >= item.harvestStage),
    findTarget: (entity) => findNearestJobInteract(entity),
    onWorkComplete: (entity, target) => {
      if(target.growthStage >= target.harvestStage){
        entity.storage.push({ resource: target.resource, amount:target.harvestAmount }) 
        target.growthStage = 0;
      }else{
        target.growthStage++
      }
      target.watered = true
    }
  },
  lumberjack: {
    requirement: (item) => (item.type === 'tree' || item.growthStage >= item.harvestStage),
    onWorkComplete: (entity, target) => {
      target.hp--
      if(target.growthStage >= target.harvestStage){
        entity.storage.push(target.resource* target.harvestAmount) 
        target.toRemove = true;

      }
    }
  }
}
//entity classes
class Entity {
  constructor(config) {
    this.x = getRandomIntInclusive(0, mapWidth);
    this.y = getRandomIntInclusive(0, mapHeight);
    this.size = config.size;
    this.color = [...config.color];
    this.ID = crypto.randomUUID();
  }
  render() {
    fill(this.color);
    circle(this.x, this.y, this.size);
  }
  update() {
    this.render();
  }
}

class Living extends Entity {
  constructor(config) {
    super(config);
    this.hunger = config.hunger;
    this.maxHunger = config.maxHunger;
    this.hungerRate = config.hungerRate;
    this.vel = config.vel;
    this.baseVel = this.vel
    this.targetVel = this.vel;
    this.direction = { x: random(), y: random() };
    this.noiseOffset = getRandomIntInclusive(1000, 9000);
    this.collisionCooldown = 0;
    this.dead = false;
    this.nearestFood = null;
    this.age = config.age;
    this.type = config.type;
    this.name = names[floor(random(0,names.length))]
  }

  touchingBoundary(){
    let s = this.size/2;
    [`x`,`y`].forEach((axis,i)=>{
      let limit = [mapWidth,mapHeight][i]  
        if (this[axis] < s || this[axis]>limit-s){
          this.direction[axis] *=-1 //swaps its vel
          this[axis] = Math.max(s,Math.min(this[axis],limit-s)) //clamps to nearest boundary so it doesnt get stuck in a wall
        }
    })
  }

  boundaryRepulsion() {
    let boundMargin = 300;
    let repulse = 0.8;
    let brx = 0;
    let bry = 0;

    // X Axis Forces
    if (this.x < boundMargin) {
      brx += repulse * (1 - Math.max(0, this.x) / boundMargin);
    } else if (this.x > mapWidth - boundMargin) {
      brx -= repulse * (1 - Math.max(0, mapWidth - this.x) / boundMargin);
    }

    // Y Axis Forces
    if (this.y < boundMargin) {
      bry += repulse * (1 - Math.max(0, this.y) / boundMargin);
    } else if (this.y > mapHeight - boundMargin) {
      bry -= repulse * (1 - Math.max(0, mapHeight - this.y) / boundMargin);
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
    let lenSq = (nx * nx + ny * ny);
    if (lenSq === 0) return;
    let len = sqrt(lenSq)

    return { x:nx, y:ny, len };
  }

  targetFood(foodGrid){
    let target = nearestFood(this, foodGrid);
    if (target) {
      let tx = target.x - this.x;
      let ty = target.y - this.y;
      let lenSq = tx * tx + ty * ty;
      
      if (lenSq === 0) return { x: 0, y: 0, len: 0 };
      let len = sqrt(lenSq);
      return { x: tx / len, y: ty / len, len: len };
    }
    return null
  }

  targetBlend(foodGrid){
    let n = this.sampleNoise();
    if (!n) return null;

    let ix = n.x / n.len;
    let iy = n.y / n.len;

    let waddleStrength = 0.4 + sin(frameCount * 0.15) * 0.2;
    ix *= waddleStrength;
    iy *= waddleStrength;

    if (this.hunger < this.maxHunger * 0.9) {
      let f = this.targetFood(foodGrid);
      if (f){
        let slowingRadius = 80
        let speed = (f.len < slowingRadius) ? this.vel* (f.len/slowingRadius):this.vel
        let dx = f.x * speed
        let dy = f.y * speed

        ix = ix*0.15 + dx*0.85
        iy = iy*0.15 + dy*0.85
      }
    }

    let br = this.boundaryRepulsion();
    return { x: ix + br.x, y: iy + br.y };
  }

  steer(target){
    //updates direction vector
    let strength = this.hunger < this.maxHunger * 0.9 ? 0.12 * worldSpeed : 0.05 * worldSpeed;
    if (this.collisionCooldown > 0) strength = 0.01 * worldSpeed;

    this.direction.x += (target.x - this.direction.x) * strength 
    this.direction.y += (target.y - this.direction.y) * strength

    //Normalize vector
    let dLen = sqrt(this.direction.x**2 + this.direction.y**2);
    if (dLen > 0) {
      this.direction.x /= dLen;
      this.direction.y /= dLen;
    }
  }
  
  move(){
    this.x += this.direction.x * this.vel * worldSpeed
    this.y += this.direction.y * this.vel * worldSpeed
    
    
    this.vel += (this.targetVel - this.vel) * 0.09 * worldSpeed
    this.touchingBoundary()
  }
  
  updateHunger(){
    if(frameCount % (120/worldSpeed) === 0) this.hunger = max(this.hunger-= this.hungerRate, 0)
  }
      
  shouldDie(){
    if(this.hunger <= 0) return true;
      if (this.age >= 90){
        if (frameCount%(300/worldSpeed) === 0){
          let odds = this.age * 4 - 350;
          if(getRandomIntInclusive(1, 100) < odds){
            console.log(`${this.name} died of old age at age ${this.age}`)
            return true;
          } 
        }
      }
    return false;
  }
  render(){
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
  }
  
  
  update(foodGrid) {
    this.updateHunger()
    let target = this.targetBlend(foodGrid)
    if (this.collisionCooldown > 0) this.collisionCooldown -= worldSpeed;
    if (target) this.steer(target)
    this.move()
    this.render()
    if (healthbar) hungerBar(this);

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
    this.jobState = 'idle'; // eg idle or walking or chopping a tree or watering plants so on and so forth
    this.jobTarget = null;
    this.storage = [];
    this.jobSearchCooldown = 0;
    this.workTimer = 0;
    this.targetStockPile = null
  }

  seekPoint(t, slowingRadius){
    let dx = t.x - this.x
    let dy = t.y - this.y
    let dist = sqrt(dx * dx + dy * dy)
    if (dist === 0) return { x: 0 , y: 0 , dist:0 }
    let speed = dist< slowingRadius ? dist/slowingRadius : 1
    this.targetVel = this.baseVel
    this.vel = max(this.vel, this.baseVel*0.5)
    let br = this.boundaryRepulsion()
    return { x: (dx/dist)*speed +br.x, y: (dy/dist)*speed + br.y, dist:dist}

  }

  pileCheck(){
    let nearest = null;
    let nearestDistSq = Infinity
    for (let s of data.structures){
      if(!(s instanceof StockPile)) continue
      if (s.currentStorage >= s.storageMax) continue
      let cx = s.x + s.width/2
      let cy = s.y + s.height/2
      let dx = cx - this.x
      let dy = cy - this.y
      let distSq = dx*dx + dy*dy
      if(distSq<nearestDistSq){
        nearestDistSq = distSq
        nearest = s
      } 
    }
    return nearest
  }

  jobMove(){
    if(!this.job) return
    // If it has storage
    if (this.storage.length > 0){
      if (!this.targetStockPile||this.targetStockPile.currentStorage >= this.targetStockPile.storageMax){
        this.targetStockPile = this.pileCheck()
      }
      if (this.targetStockPile){
        let pileCenter =  {
          x: this.targetStockPile.x + this.targetStockPile.width/2,
          y: this.targetStockPile.y + this.targetStockPile.height/2,
        }
        let seek = this.seekPoint(pileCenter,60)
        if (seek.dist<20){
          this.targetStockPile.currentStorage += this.storage.length;
          this.storage = [];
        } else {
          this.jobState = 'depositing'
          return seek
        }
        
      }
    }

    if(!this.jobTarget){
      if (this.jobSearchCooldown <= 0) {
      findNearestJobInteract(this);
      this.jobSearchCooldown = 30;
      } else {
        this.jobSearchCooldown--;
      }
      if (!this.jobTarget) {
        this.jobState = 'idle';
        this.targetVel = this.baseVel;
        return null; // If they dont have anything to do then I guess they can just wander
      }
      this.jobState = 'traversing';
      this.workTimer = 60
    }


    // set our target and go to it
    let t = this.jobTarget
    let seek = this.seekPoint(this.jobTarget, 60)
    if (seek.dist > 12) return seek

    // once its found, work on the dang project
    
      this.jobState = 'working'
      this.targetVel = 0
    

    this.workTimer -= worldSpeed;
    if (this.workTimer <= 0) {
      jobBehaviours[this.job].onWorkComplete(this, t);
      this.jobTarget = null;
      this.jobState = 'idle';
      this.jobSearchCooldown = 0;
      this.vel = this.baseVel;
      this.targetVel = this.baseVel;
    }

return null;

  }
  
  targetBlend(foodGrid){

    if (this.job) {
      if (this.hunger < this.maxHunger * 0.3) {
        this.vel = this.baseVel
        this.targetVel = this.baseVel
        this.jobTarget = null
        return super.targetBlend(foodGrid);
      }


      if (this.assignedStructure) {
      let sx = this.assignedStructure.x + this.assignedStructure.width / 2;
      let sy = this.assignedStructure.y + this.assignedStructure.height / 2;
      let dx = sx - this.x;
      let dy = sy - this.y;
      if (dx * dx + dy * dy > 150 * 150) {
        this.jobState = 'returning';
        this.jobTarget = null;
        return this.seekPoint({ x: sx, y: sy }, 150);
      }
    }

      
      return this.jobMove()

    }

    let n = this.sampleNoise()
    if (!n) return null

    let ix = n.x
    let iy = n.y

    if (this.partner && this.hunger >= this.maxHunger * 0.7) {
        // only seek partner if not too hungry
        let px = this.partner.x - this.x
        let py = this.partner.y - this.y
        let pLenSq = px * px + py * py

        if (pLenSq <= this.size * this.size && this.ID < this.partner.ID) {
            birth(this, this.partner)
            return null
        }

        if (pLenSq > 0) {
            let pLen = sqrt(pLenSq)
            ix = ix * 0.3 + (px / pLen) * 0.7
            iy = iy * 0.3 + (py / pLen) * 0.7
        }

        let br = this.boundaryRepulsion()
        return { x: ix + br.x, y: iy + br.y }
      
    }
    if (this.partner) {
      if (this.partner.partner === this) this.partner.partner = null;
      this.partner = null; 
    }
    // no partner, or too hungry — fall through to food seeking
    return super.targetBlend(foodGrid)
  }
}

class Child extends Living {
  constructor(config) {
    super(config);
  }
  growUp() {
    let adult = new Adult(stats.adult);
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

class Food extends Entity {
  constructor(config) {
    super(config);
    this.foodName = config.foodName;
    this.hunger = config.hunger;

    this.rotTime = config.rotTime;
    this.rotRate = config.rotRate;
  }
  render() {
    fill(this.color);
    circle(this.x, this.y, this.size);
  }

  update(foodGrid) {
    this.render();
  }
}

class Crop extends Food {
  constructor(config){
    super(config)
    this.cropType = config.cropType
    this.stage = 0
    this.health = 10
  }
  update(){
    if (frameCount % 400 === 0){
      this.stage = min(this.stage + 1, 3)
    }
    this.render()
  }
}

class Carrot extends Food {
  constructor(config) {
    super(config);
  }
}

//structure classes
class structure {
  constructor(config) {
    this.x = config.x;
    this.y = config.y;
    this.color = config.color;
    this.type = config.type;
    this.ID = crypto.randomUUID();
  }
}

class RectangularStructure extends structure {
  constructor(config) {
    super(config);
    this.width = config.width;
    this.height = config.height;
  }
  render() {
    fill(this.color);
    rect(this.x, this.y, this.width, this.height);
  }
  update() {
    this.render();
  }
}

class farmland extends RectangularStructure {
  constructor(config) {
    super(config);
    this.crop = config.type;
    this.workers = [];
    this.capacity = config.capacity;
    this.job = "farmer";
    this.uiClass = WorkerAssignUI;
    this.crops = [];
    this.spawnCrops(config.type)
  }

  spawnCrops(type){
    let rows = 5
    let cols = 6
    let padX = this.width/(cols+1)
    let padY = this.height/(rows+1)

    for (let col = 1; col <= cols; col++) {
      for (let row = 1; row <= rows; row++) {
        this.crops.push(new FarmCrop({
          x: this.x + padX * col,
          y: this.y + padY * row,
          type:type,
          size: 6,
          color: [60, 160, 40],
          parent:this,
        }))
      }
    }
  }
  update() {
    this.render();
    for (let c of this.crops) c.update();
  }
  closestPileCheck(){

  }

}

class StockPile extends RectangularStructure {
  constructor(config) {
    super(config);
    this.currentStorage = 0;
    this.storageMax = config.storageMax;
  }
}

let structureConfigs = {
  farm: {
    wheat: {
      color: [64, 33, 27],
      type: `wheat`,
      width: 100,
      height: 100,
      capacity: 5,
      structureName:`Wheat Farm`,
      for: farmland,
    },
  },
  pile: {
    color: [79, 64, 40],
    storageMax: 100,
    width: 100,
    height: 100,
    structureName:`StockPile`,
    for: StockPile,
  },
};


//Crops

class FarmCrop extends Entity{
  constructor(config){
    super(config)
    this.x = config.x
    this.y = config.y 
    this.type = config.type
    this.growthStage = 0
    this.harvestStage = 3
    this.watered = false
    this.harvestAmount = config.harvestAmount ?? 1
    this.resource = config.type
    this.parent = config.parent

  }

  render() {
    let s = map(this.growthStage, 0, this.harvestStage, 3, 10);
    let g = map(this.growthStage, 0, this.harvestStage, 80, 200);
    fill(this.watered ? color(60, g, 40) : color(180, 140, 60));
    circle(this.x, this.y, s);
  }

  update() {
    if (frameCount % (400 / worldSpeed) === 0) {
      this.watered = false;
    }
    this.render();
  }

}


//UI classes

class UIWindow {
  constructor(marginWidthUI, marginHeightUI, uiWinWidth, uiWinHeight) {
    this.x = marginWidthUI;
    this.y = marginHeightUI;
    this.width = uiWinWidth;
    this.height = uiWinHeight;
    this.scrollOffset = 0;
    this.scrollTarget = 0;
  }
  beginClip() {
    drawingContext.save();
    drawingContext.beginPath();
    drawingContext.rect(
      this.x,
      this.y * 2,
      this.width,
      this.height - this.y * 2,
    );
    drawingContext.clip();
  }

  endClip() {
    drawingContext.restore();
  }
  drawBackground() {
    fill(30);

    rect(this.x, this.y, this.width, this.height);
  }
  drawTitle(t) {
    fill(200);
    textAlign(CENTER, TOP);
    textSize(16);
    textStyle(BOLD);
    text(t, this.x + this.width / 2, this.y + 30);
  }
  updateScroll(delta) {
    this.scrollTarget += delta / 1.8;
    this.scrollTarget = constrain(
      this.scrollTarget,
      0,
      max(0, this.maxScroll()),
    );
  }
  maxScroll() {
    return 0;
  }
  update() {
    this.scrollOffset = lerp(this.scrollOffset, this.scrollTarget, 0.085);
  }
}

class WorkerAssignUI extends UIWindow {
  constructor(structure) {
    super(marginWidthUI, marginHeightUI, uiWinWidth, uiWinHeight);
    this.structure = structure;
  }
  maxScroll() {
    return max(0, this.getAssignable().length * entryHeight - 23/32*this.height);
  }
  drawRow(e, i) {
    let s = this.structure;
    let atCap = s.workers.length >= s.capacity;
    let isAssigned = s.workers.includes(e);
    let entryY = 28 * i + winHeight / 6 + 22 - this.scrollOffset;

    noStroke();
    fill(isAssigned ? color(40, 80, 40) : atCap ? 35 : 50);
    rect(115, entryY, winWidth - marginWidthUI * 2 - 115, 25);

    fill(isAssigned ? color(100, 220, 100) : atCap ? 100 : 200);
    textAlign(LEFT, BOTTOM);
    textSize(14);
    text(`Name: ${e.name}`, 122, entryY + 21);
    text(`Age: ${e.age}`, 255, entryY + 21);
    text(`Type: Adult`, 345, entryY + 21);
  }
  getAssignable() {
    let s = this.structure;
    return [...s.workers, ...unemployed.filter((e) => !s.workers.includes(e))];
  }
  render() {
    this.drawBackground();
    this.drawTitle(
      `Assign Workers ${data.selected.workers.length}/${data.selected.capacity}`,
    );

    this.beginClip();
    this.getAssignable().forEach((e, i) => this.drawRow(e, i));
    this.endClip();

    this.update();
  }
  handleclick(mx, my) {
    let s = this.structure;
    let atCap = s.workers.length >= s.capacity;

    this.getAssignable().forEach((e, i) => {
    let entryY = 28 * i + winHeight / 6 + 22 - this.scrollOffset;
    let clickBox = { x: 115, y: entryY, w: winWidth - marginWidthUI * 2 - 115, h: 25 };
    
    if (mx > clickBox.x && mx < clickBox.x + clickBox.w && 
        my > clickBox.y && my < clickBox.y + clickBox.h) {
      if (!s.workers.includes(e) && !atCap) {
        s.workers.push(e);
        e.job = s.job;
        e.assignedStructure = s;  // ← ADD THIS LINE
      } else if (s.workers.includes(e)) {
        s.workers.splice(s.workers.indexOf(e), 1);
        e.job = null;
        e.assignedStructure = null;  // ← AND CLEAR IT WHEN UNASSIGNING
      }
    }
  });
  }
}

class BuilderUI extends UIWindow{
    constructor(){
        super(marginWidthUI, marginHeightUI, uiWinWidth, uiWinHeight);
        this.structures = buildableStructures
        this.marginWidth = marginWidthUI
        this.marginHeight = marginHeightUI
        this.selected = null
        this.placing = false
    }
    maxScroll() {
        return max(0, this.structures.length * entryHeight - 23/32*this.height);
    }
    drawRow(e,i) {
        let entryY = 28 * i + winHeight / 6 + 22 - this.scrollOffset;
        let isSelected = this.selected === e

        noStroke();
        fill(isSelected ? color(40, 80, 40) : 50);
        rect(115, entryY, winWidth - marginWidthUI * 2 - 115, 25);
    
        fill(isSelected ? color(120, 220, 120) : 200);
        textAlign(LEFT, BOTTOM);
        textSize(14);
        text(`Structure: ${e.structureName}`, 122, entryY + 21);
    }
    render() {
        this.drawBackground();
        this.drawTitle(`Build`);
        this.beginClip()
        this.structures.forEach((config, i) => this.drawRow(config, i));
        this.endClip()
        this.update()
      }
    handleclick(mx, my) {

      if (this.placing && my < winHeight) {
        placeStructure(
          this.selected,
          mx - this.selected.width / 2,
          my - this.selected.height / 2
        )
        this.placing = false
        this.selected = null
        return
      }

      this.structures.forEach((config, i) => {
        let entryY = 28 * i + winHeight / 6 + 22 - this.scrollOffset
        let inbounds = mx > 115 &&
          mx < 115 + (this.width - marginWidthUI * 2 - 115) &&
          my > entryY && my < entryY + 25 &&
          my > marginHeightUI * 2 && my < winHeight - marginHeightUI


        if (inbounds) {
          this.selected = config
          this.placing = true
          data.activeUI = null
        }
      })
    }
}

let winHeight = 600;
let winWidth = 600;

let mapWidth = 2000;
let mapHeight = 2000;

let camX = 0;
let camY = 0;
let isdragging = false;
let dragPosX, dragPosY;

let marginWidthUI = winWidth / 10;
let marginHeightUI = winHeight / 10;
let uiWinWidth = winWidth - marginWidthUI * 2;
let uiWinHeight = (8 / 10) * winHeight;
let entryHeight = 28;

let buttonheight = 60;
let nearest = [];
let deathToll = 0;
let healthbar = true;
let worldSpeed = 1;

let TF = false;
let scrollOffset = 0;
let scrollTarget = 0;
let unemployed = data.people.filter(
  (c) => c.type === "adult" && c.job === null,
);

let buildableStructures = Object.values(structureConfigs).flatMap(entry => entry.for ? [entry] : Object.values(entry)
)
let totalDist = 0


