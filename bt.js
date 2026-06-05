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
        e.steeringTarget = {x:e.direction.x,y:e.direction.y}
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
/*   seekPartner: new Action((e, ctx) => {
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
      e.targetStockPile &&
      !data.structures.includes(e.targetStockPile)
    ) {
      e.targetStockPile = null;
    }
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
  }), */

  requestTask: new Action((e, ctx) => {
    if (e.currentTask) return BT.SUCCESS;

    const task = taskManager.requestTask(e);
    if (!task) return BT.FAILURE;

    e.currentTask = task;
    return BT.SUCCESS;
  }),
  performTask: new Action((e, ctx) => {
    const task = e.currentTask;
    if (!task) return BT.FAILURE;

    if (!task.isValid()) {
      task.cancel();
      e.currentTask = null;
      return BT.FAILURE;
    }

    const seek = e.seekPoint(task.target, 20);
    e.steeringTarget = seek;

    if (seek.dist > 12) return BT.RUNNING;

    e.workTimer++;
    if (e.workTimer < task.workDuration) return BT.RUNNING;

    task.perform(e);
    e.workTimer = 0;
    e.currentTask = null;
    return BT.SUCCESS;
  }),
};

const conditions = {
  wantsToEat: new Condition((e) => e.hunger < e.maxHunger * 0.9),
  hasTask: new Condition((e) => e.currentTask !== null),
};

const sequences = {
  ifHungryEat: new Sequence([
    conditions.wantsToEat,
    actions.requestTask,
  ]),
};
const selectors = {};


const BTrees = {
  childTree: new Selector([sequences.wantsToEat,sequences.ifHungryEat, actions.wander]),
  adultTree: new Selector([
    sequences.ifHungryEat,
    new DuringPhase(0.0, 0.6, new Selector([
        new Sequence([
            conditions.wantsToEat,

            actions.wander
        ]),
    ])),
  actions.wander
  ]),
  workerTree: new Selector([
    new Sequence([conditions.hasTask, actions.performTask]),
    sequences.ifHungryEat,
    actions.wander,
  ]),

};






