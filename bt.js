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
  requestTask: new Action((e) => {
    if (e.currentTask) return BT.SUCCESS;

    const task = taskManager.chooseBestTask(e);

    if (!task) return BT.FAILURE;

    console.log(e.name, "accepted", task.type);
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
    console.log(e.name, task.type, Math.floor(seek.dist));
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
  hasTask: new Condition((e) => e.currentTask !== null),
};

const sequences = {
};
const selectors = {};


const BTrees = {
  childTree: new Selector([
    new Sequence([
      conditions.hasTask,
      actions.performTask,
    ]),
    new Sequence([
      actions.requestTask,
      actions.performTask,
    ]),
  
    actions.wander,
  ]),
  adultTree: new Selector([
    new Sequence([
      conditions.hasTask,
      actions.performTask,
    ]),
    new Sequence([
      actions.requestTask,
      actions.performTask,
    ]),
  
    actions.wander,
  ]),
  workerTree: new Selector([
    new Sequence([
      conditions.hasTask,
      actions.performTask,
    ]),
    new Sequence([
      actions.requestTask,
      actions.performTask,
    ]),
  
    actions.wander,
  ]),

};






