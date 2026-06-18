

let jobs = {
  farmer: { type: `farmer` },
  builder: {},
  forager: {},
  hunter: {},
  lumberjack: {},
};
let names = [
  `Heubert`,
  `Hank`,
  `Shelly`,
  `Merideth`,
  `Benjamin`,
  `Theodore`,
  `Gerald`,
  `Elton`,
  `Archie`,
  `Gary`,
  `Agatha`,
  `Wilfred`,
  `Ingrid`,
  `Ernest`,
  `Edwin`,
  `Fitzgerald`,
  `Olen`,
  `Fredrick`,
  `Wilbert`,
  `Darcel`,
  `Daisy`,
  `Petunia`,
  `Paulene`,
  `Franklynn`,
  `Trudie`,
  `Dennis`,
  `Bryan`,
  `Patrishia`,
  `Eleanor`,
  `Clyde`,
  `Mabel`,
  `Harold`,
  `Beatrice`,
  `Clarence`,
  `Myrtle`,
  `Eugene`,
  `Florence`,
  `Alfred`,
  `Mildred`,
  `Cecil`,
  `Hattie`,
  `Leonard`,
  `Blanche`,
  `Norman`,
  `Ethel`,
  `Stanley`,
  `Viola`,
  `Howard`,
  `Lillian`,
  `Ralph`,
  `Gertrude`,
  `Victor`,
  `Clara`,
  `Edgar`,
  `Nellie`,
  `Wallace`,
  `Pearl`,
  `Milton`,
  `Ada`,
  `Lloyd`,
  `Irene`,
  `Russell`,
  `Olive`,
  `Harvey`,
  `Esther`,
  `Raymond`,
  `Hazel`,
  `Gilbert`,
  `Fannie`,
];

//entity classes
class Entity {
  constructor(config) {
    this.x = getRandomIntInclusive(0, game.state.config.mapWidth);
    this.y = getRandomIntInclusive(0, game.state.config.mapHeight);
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
  constructor(config) {
    super(config);
    this.cropType = config.cropType;
    this.stage = 0;
    this.health = 10;
  }
  update() {
    this.render();
  }
}

class Carrot extends Food {
  constructor(config) {
    super(config);
  }
}

//structure classes

let structureConfigs = {
  farm: {
    wheat: {
      color: [66, 45, 31],
      type: `wheat`,
      width: 100,
      height: 100,
      capacity: 5,
      structureName: `Wheat Farm`,
      for: farmland,
      cropColor: [100, 160, 50],
      dryColor: [210, 180, 80],
      readyColor: [200, 160, 40],
    },
    carrot: {
      color: [66, 45, 31],
      type: `carrot`,
      width: 100,
      height: 100,
      capacity: 5,
      structureName: `Carrot Farm`,
      for: farmland,
      cropColor: [180, 140, 60],
      dryColor: [60, 160, 40],
      readyColor: [200, 90, 30],
    },
  },
  pile: {
    color: [79, 64, 40],
    storageMax: 100,
    width: 100,
    height: 100,
    structureName: `StockPile`,
    for: StockPile,
  },
};

//Crops

class FarmCrop extends Entity {
  constructor(config) {
    super(config);
    this.x = config.x;
    this.y = config.y;
    this.type = config.type;
    this.growthStage = 0;
    this.harvestStage = 3;
    this.watered = false;
    this.harvestAmount = config.harvestAmount ?? 1;
    this.resource = config.type;
    this.parent = config.parent;
    this.wateredResetTime = 0;
    this.baseColor = [...this.color];
    this.dryColor = [...structureConfigs.farm[this.type].dryColor];
    this.readyColor = [...structureConfigs.farm[this.type].readyColor];
    this.task = null
  }

  render() {
    

    let size = map(this.growthStage, 0, this.harvestStage, 3, 10);

    let readyColor = color(...this.readyColor); // golden when harvest-ready
    let grownColor = color(...this.baseColor);
    let dryColor = color(...this.dryColor);

    let growProgress = this.growthStage / this.harvestStage; // 0 to 1
    let grown = lerpColor(grownColor, readyColor, growProgress);
    let finalColor = this.watered ? grown : dryColor;

    fill(finalColor);
    circle(this.x, this.y, size);

  }

  update() {
    if (this.wateredResetTime === 0) {
      this.watered = false;
    } else {
      this.wateredResetTime-=game.state.time.worldSpeed;
    }
  }
}

//UI classes








let buildableStructures = Object.values(structureConfigs).flatMap((entry) =>
  entry.for ? [entry] : Object.values(entry),
);




const PHASE_DAY_START = 0.0
const PHASE_EVENING_START = 0.6
const PHASE_NIGHT_START = 0.8
const taskManager = new TaskManager
