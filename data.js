let data = {
  people: [],
  foods: [],
  collisions: [],
  nearestFoods: [],
  infoBars: [],
  structures: [],
  selected: null,
  activeUI: null,
};
let stats = {
  adult: {
    color: [132, 102, 100],
    get vel() {
      return getRandomIntInclusive(0.9, 1.1);
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
    repRateMax: 1000,
  },
  child: {
    color: [100, 130, 132],
    get vel() {
      return getRandomIntInclusive(0.7, 0.9);
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

  update(foodGrid) {
    createEntity(this);

    movement(this, foodGrid); //moves the kid

    touchingBoundary(this); //checks if the kid is touching boundary
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
  }

  canReproduce() {
    return (
      this.age >= 18 && this.hunger >= 0.7 * this.maxHunger && this.repRate <= 0
    );
  }
  update(foodGrid) {
    super.update(foodGrid); // calls Living's update which handles movement/render
    if (frameCount % (10 / worldSpeed) === 0) this.repRate--;
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
    this.stage = 0;
    this.watered = false;
    this.workers = [];
    this.capacity = config.capacity;
    this.job = "farmer";
    this.uiClass = WorkerAssignUI;
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
    return max(0, unemployed.length * entryHeight - 23/32*this.height);
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
      let inbounds =
        mx > 115 &&
        mx < 115 + (this.width - marginWidthUI * 2 - 115) &&
        my > entryY &&
        my < entryY + 25 &&
        my > marginHeightUI * 2 &&
        my < winHeight - marginHeightUI;

      if (!inbounds) return;

      if (s.workers.includes(e)) {
        // if worker is already assigned-- unassingn them when clicked
        s.workers = s.workers.filter((w) => w !== e);
        e.job = null;
        e.assignedStructure = null;
      } else if (!atCap) {
        s.workers.push(e);
        e.assignedStructure = s;
        e.job = s.job;
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
    }
    maxScroll() {
        return max(0, this.structures.length * entryHeight - 23/32*this.height);
    }
    drawRow(e,i){
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
        // handle placement if something is already selected
        if (this.selected && my < winHeight) {
            placeStructure(
                this.selected,
                mx - this.selected.width / 2,
                my - this.selected.height / 2
            )
            return
        }
    
        // otherwise check if a row was clicked
        this.structures.forEach((config, i) => {
            let entryY = 28 * i + winHeight / 6 + 22 - this.scrollOffset
            let inbounds = mx > 115 &&
                           mx < 115 + (this.width - marginWidthUI * 2 - 115) &&
                           my > entryY && my < entryY + 25 &&
                           my > marginHeightUI * 2 && my < winHeight - marginHeightUI
    
            if (!inbounds) return
            this.selected = this.selected === config ? null : config
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
let employeeSelected = null;
let buildableStructures = Object.values(structureConfigs).flatMap(entry => 
    entry.for ? [entry] : Object.values(entry)
)
