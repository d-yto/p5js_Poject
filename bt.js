const BT = { SUCCESS: "SUCCESS", FAILURE: "FAILURE", RUNNING: "RUNNING" };

class NodeBase {
  constructor(name = "Node") {
    this.name = name;
  }
  tick() {
    console.log(`Ticking: ${this.name}`);
  }
}

class Sequence extends NodeBase {
  constructor(children) {
    super();
    this.children = children;
  }
  tick(e, ctx) {
    for (let child of this.children) {
      const status = child.tick(e, ctx);
      if (status !== BT.SUCCESS) {
        return status;
      }
    }
    return BT.SUCCESS;
  }
}

class Selector extends NodeBase {
  constructor(children) {
    super();
    this.children = children;
  }
  tick(e, ctx) {
    for (let child of this.children) {
      const status = child.tick(e, ctx);
      if (status !== BT.FAILURE) {
        return status;
      }
    }
    return BT.FAILURE;
  }
}

class Condition extends NodeBase {
  constructor(fn) {
    super();
    this.fn = fn;
  }
  tick(e, ctx) {
    return this.fn(e, ctx) ? BT.SUCCESS : BT.FAILURE;
  }
}

class Action extends NodeBase {
  constructor(fn) {
    super();
    this.fn = fn;
  }
  tick(e, ctx) {
    return this.fn(e, ctx);
  }
}

class DuringPhase extends NodeBase {
    constructor(start, end, child){
        super()
        this.start = start
        this.end = end
        this.child = child
    }
    tick(e,ctx){
        if(ctx.t < this.start || ctx.t >= this.end) return BT.FAILURE
        return this.child.tick(e,ctx)
    }
}

const actions = {
  wander: new Action((e, ctx) => {
    let n = e.sampleNoise();
    if (!n){
        e.steeringTarget = {
            x:e.direction.x,
            y:e.direction.y
        }
        return BT.RUNNING;
    }
    let br = e.boundaryRepulsion();
    let w = 0.4 + sin(frameCount * 0.15) * 0.2;
    e.steeringTarget = {
      x: (n.x / n.len) * w + br.x,
      y: (n.y / n.len) * w + br.y,
    };
    e.targetVel = e.baseVel * 0.6;
    return BT.RUNNING;
  }),
  seekWildFood: new Action((e, ctx) => {
    let target = e.targetFood(ctx.foodGrid);
    if (!target) return BT.FAILURE;
    let r = 80;
    let s = target.len < r ? e.vel * (target.len / r) : e.vel;
    e.steeringTarget = { x: target.x * s * 0.85, y: target.y * s * 0.85 };
    return BT.RUNNING;
  }),
  seekPileFood: new Action((e, ctx) => {
    if (!e.targetFoodPile && e.foodPileSearchCooldown <= 0) {
      e.targetFoodPile = e.findEatablePile();
      e.foodPileSearchCooldown = 60;
    } else {
      e.foodPileSearchCooldown--;
    }
    if (!e.targetFoodPile) return BT.FAILURE;
    let pileCenter = {
      x: e.targetFoodPile.x + e.targetFoodPile.width / 2,
      y: e.targetFoodPile.y + e.targetFoodPile.height / 2,
    };
    let seek = e.seekPoint(pileCenter, 60);
    e.steeringTarget = seek;
    if (seek.dist < 15) {
      e.eatFromPile(e.targetFoodPile);
      return BT.SUCCESS;
    }
    return BT.RUNNING;
  }),
  seekPartner: new Action((e, ctx) => {
    let p = e.partner;
    if (!p) return BT.FAILURE;
    let d = { x: p.x - e.x, y: p.y - e.y };
    e.steeringTarget = e.seekPoint(p, 60);
    if (sqrt(d.x * d.x + d.y * d.y) < e.size / 2 + p.size / 2) {
      birth(e, p);
      return BT.SUCCESS;
    }
    return BT.RUNNING;
  }),
  depositStorage: new Action((e, ctx) => {
    if (
      !e.targetStockPile ||
      e.targetStockPile.currentStorage >= e.targetStockPile.storageMax
    )
      e.targetStockPile = e.pileCheck();
    if (!e.targetStockPile) return BT.FAILURE;
    let pileCenter = {
      x: e.targetStockPile.x + e.targetStockPile.width / 2,
      y: e.targetStockPile.y + e.targetStockPile.height / 2,
    };
    let seek = e.seekPoint(pileCenter, 60);
    e.steeringTarget = seek;
    if (seek.dist < 20) {
      while (
        e.storage.length > 0 &&
        e.targetStockPile.currentStorage < e.targetStockPile.storageMax
      ) {
        e.targetStockPile.items.push(e.storage.pop());
      }
      return BT.SUCCESS;
    } else {
      e.jobState = "depositing";
      return BT.RUNNING;
    }
  }),
  jobSearch: new Action((e, ctx) => {
    if (e.jobSearchCooldown <= 0) {
        findNearestJobInteract(e);
        e.jobSearchCooldown = 30;
    } else {
        e.jobSearchCooldown -= worldSpeed;
    }

    return e.jobTarget
        ? BT.SUCCESS
        : BT.FAILURE;
  }),
  doJob: new Action((e, ctx) => {
    if (!e.jobTarget) return BT.FAILURE;
    let seek = e.seekPoint(e.jobTarget,60);

    e.steeringTarget = seek;

    if (seek.dist > 12) return BT.RUNNING;

    e.jobState = "working";
    e.targetVel = 0;

    e.workTimer -= worldSpeed;

    if (e.workTimer <= 0) {
        jobBehaviours[e.job].onWorkComplete(e,e.jobTarget);
        e.jobState = "idle";
        e.jobTarget = null;
        e.workTimer = 60;
        e.jobSearchCooldown = 0;

        return BT.SUCCESS;
    }

    return BT.RUNNING;
  }),
};

const conditions = {
  isHungry: new Condition((e, ctx) => {
    return e.hunger < e.maxHunger * 0.25;
  }),
  wantsToEat:  new Condition((e, ctx) => e.hunger < e.maxHunger * 0.85),
  canReproduce: new Condition((e, ctx) => {
    return e.partner && e.hunger >= e.maxHunger * 0.5;
  }),
  hasStorage: new Condition((e, ctx) => {
    return e.storage.length > 0;
  }),
  canDoJob: new Condition((e, ctx) => {
    if (!e.job) return false;
    if (!e.jobTarget) return false;
    return true;
  }),
};

const sequences = {
  ifHungryEat: new Sequence([
    conditions.isHungry,
    new Selector([actions.seekPileFood, actions.seekWildFood]),
  ]),
  reproduce: new Sequence([conditions.canReproduce, actions.seekPartner]),
  workerJobSequence: new Sequence([
    new Selector([
        conditions.canDoJob,
        actions.jobSearch
    ]),
    actions.doJob
  ]),
  
};
const selectors = {};


const BTrees = {
  childTree: new Selector([sequences.ifHungryEat, actions.wander]),
  adultTree: new Selector([
    sequences.ifHungryEat,
    new DuringPhase(0.0, 0.6, new Selector([
        new Sequence([
            conditions.wantsToEat,

            actions.wander
        ]),
    ])),

  ]),

};

const jobSubTrees = {
  farmer: new Sequence([actions.jobSearch, actions.doJob]),
};
