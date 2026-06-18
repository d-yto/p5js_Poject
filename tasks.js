class TaskManager {
    constructor(){
      this.tasks = []
    }
    add(task){
      this.tasks.push(task)
    }
    removeFinished() {
      this.tasks = this.tasks.filter(task =>
        task.status !== "completed" &&
        task.status !== "cancelled"
      );
    }
    requestTask(worker) {
      if (worker.currentTask) return worker.currentTask;

      return this.chooseBestTask(worker);
    }
    chooseBestTask(worker) {
      const candidates = [];

      if (worker.continueEating) {
        const bestFood = worker.findBestFoodOption();

        if (bestFood) {
          const foodTask = new EatTask(bestFood.target);

          if (bestFood.type === "wild") {
            bestFood.target.task = foodTask;
          }

          this.add(foodTask);
          foodTask.reserve(worker);
          return foodTask;
        }
      }
      for (const task of this.tasks) {
        if (task.status !== "open") continue;
        if (!task.isValid()) continue;
        if (!task.canBeTakenByWorker(worker)) continue;

        candidates.push({
          task,
          score: task.getPriority(worker),
          shouldAdd: false,
        });
      }

      const bestFood = worker.findBestFoodOption()
      if (worker.hunger / worker.maxHunger < 0.70) {
        if (bestFood && !(bestFood.type === "wild" && bestFood.target.task)) {
          const foodTask = new EatTask(bestFood.target);
          
          candidates.push({
            task: foodTask,
            score: foodTask.getPriority(worker),
            shouldAdd: true,
            source: bestFood,
          });
        }
      }
      if (candidates.length === 0) return null;
      
      

      candidates.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return this._distanceSq(a.task.target, worker) -
              this._distanceSq(b.task.target, worker);
      });

      const best = candidates[0];

      if (best.shouldAdd) {
        if (best.source.type === "wild") {
          best.source.target.task = best.task;
        }

        this.add(best.task);
      }

      best.task.reserve(worker);
      return best.task;
    }
    _distanceSq(target, worker){
      if (!target) return Infinity;

      if (typeof target.getTaskPoint === "function") {
        target = target.getTaskPoint(worker);
      }

      const dx = target.x - worker.x;
      const dy = target.y - worker.y;
      return dx * dx + dy * dy;
    };
}
  

class Task{
  constructor(config){
    this.id = crypto.randomUUID()
    this.type = config.type
    this.target = config.target
    this.priority = config.priority ?? 1
    this.assignedWorkers = []
    this.requiredWorkers = config.requiredWorkers ?? 1
    this.readyWorkers = new Set();
    this.status = "open"
    this.requiredStructure = config.requiredStructure ?? null
    this.requiredJob = config.requiredJob ?? null
    this.workDuration = config.workDuration ?? 60
    this.utilityChecks = config.utilityChecks ?? [];
    this.distanceWeight = config.distanceWeight ?? 0.04;
    this.workTimer = 0
  }
  reserve(worker){
    if (!this.hasOpenWorkerSlot()) return false;

    if (this instanceof EatTask) {
      worker.continueEating = true;
    }

    this.assignedWorkers.push(worker);
    worker.currentTask = this;
    this.workTimer = 0;

    if (this.isFullyAssigned()) {
      this.status = "reserved";
    }

    return true;
  }
  release(worker){
    const workers = worker ? [worker] : [...this.assignedWorkers];

    for (let assigned of workers) {
      let index = this.assignedWorkers.indexOf(assigned);
      if (index === -1) continue;

      this.assignedWorkers.splice(index, 1);
      this.readyWorkers.delete(assigned);

      if (assigned.currentTask === this) assigned.currentTask = null;
      assigned.workTimer = 0;
    }

    if (this.status !== "completed" && this.status !== "cancelled") {
      this.status = "open";
    }
  }
  complete(){
    this.status = "completed";

    if (this.target && this.target.task === this) {
      this.target.task = null;
    }

    this.release();
  }
  cancel(){
    this.status = "cancelled";

    if (this.target && this.target.task === this) {
      this.target.task = null;
    }

    this.release();
  }
  isValid(){
    return true;
  }
  isEveryoneReady(){
    return (
      this.isFullyAssigned() &&
      this.assignedWorkers.every((worker) => this.readyWorkers.has(worker))
    );
  }
  perform(worker){}
  hasOpenWorkerSlot(){
    return this.assignedWorkers.length < this.requiredWorkers;
  }
  isFullyAssigned(){
    return this.assignedWorkers.length >= this.requiredWorkers
  }
  canBeTakenByWorker(worker){
    if (this.status !== "open") return false;
    if (!this.hasOpenWorkerSlot()) return false;
    if (this.assignedWorkers.includes(worker)) return false;

    if (this.requiredJob && this.requiredJob !== worker.job) return false;
    if (this.requiredStructure && this.requiredStructure !== worker.assignedStructure) return false;

    return true;
  }
  getBasePriority(worker){
    return typeof this.priority === "number"
    ? this.priority
    : this.priority.getScore(worker);
  }
  getUtilityScore(worker){
    let score = 0;
    for (let check of this.utilityChecks){
      const value = typeof check === "function"
        ? check(worker, this)
        : check.fn(worker, this)
      const weight = check.weight ?? 1
      score += value * weight
    }
    return score
  }
  getDistancePenalty(worker){
    if (!this.target) return 0;
    const point = this.target.getTaskPoint
      ? this.target.getTaskPoint(worker)
      : this.target
    if (!point) return 0;
    const dx = point.x - worker.x;
    const dy = point.y - worker.y;
    return Math.sqrt(dx * dx + dy * dy) * this.distanceWeight;
  }
  getPriority(worker){
  return this.getBasePriority(worker) + this.getUtilityScore(worker) - this.getDistancePenalty(worker);
  }
}


class HarvestTask extends Task {
  constructor(crop, farm){
    super({
      type: "harvest",
      target: crop,
      priority: 35,
      requiredJob: "farmer",
      requiredStructure: farm,
      workDuration: 90,
      utilityChecks: [
        {
          weight: 1,
          fn: (worker, task) => {
            const crop = task.target;
            if (!crop) return 0;
            const maturity = crop.growthStage / Math.max(crop.harvestStage || 1, 1);
            return map(maturity, 0.8, 1, 20, 90);
          },
        },
      ],
    });
  this.farm = farm;
  }
  isValid(){
    return (this.target && this.target.growthStage >= this.target.harvestStage)
  }
  perform(worker){
    worker.storage.push({
      resource: this.target.resource,
      amount: this.target.harvestAmount,
    })
    this.target.growthStage = 0;
    this.target.task = null
    this.complete()
  }
}

class WaterTask extends Task {
  constructor(crop, farm){
    super({
      type:"Water",
      target: crop,
      priority: 30,
      requiredJob: "farmer",
      requiredStructure: farm,
      workDuration:50,
      utilityChecks: [
        {
          weight: 1,
          fn: (worker, task) => {
            const crop = task.target;
            if (!crop) return 0;
            if (crop.watered) return 0;
            const stageNeed = crop.growthStage / Math.max(crop.harvestStage || 1, 1);
            return map(stageNeed, 0, 1, 80, 30);
          },
        },
      ],
    })
    this.farm = farm
  }
  isValid(){
    return (this.target && !this.target.watered)
  }
  perform(worker){
    this.target.watered = true
    this.target.growthStage++
    this.target.wateredResetTime = 400
    this.target.task = null
    this.complete()


  }
}

class EatTask extends Task {
  constructor(food) {
    super({
      type: "eat",
      target: food,
      priority: 0,
      utilityChecks: [
        {
          weight: 1,
          fn: (worker) => {
            const fullness = worker.hunger / worker.maxHunger;
            if (fullness <= 0.15) return 300;
            if (worker.continueEating) return map(fullness, 0.85, 0.15, 40, 240, true);
            return map(fullness, 0.55, 0.15, 0, 240, true);
          },
        },
      ],
    });
    this.reservedItemId = null;
  }
  isValid() {
    if (this.target instanceof Food) {
      return game.state.foods.includes(this.target);
    }

    if (this.target instanceof StockPile) {
      if (!game.state.structures.includes(this.target)) return false
      if (this.reservedItemId) {
        const item = this.target.getItemById(this.reservedItemId);
        return item && game.state.stats[item.resource]?.hunger > 0;
      }

      return this.target.getAvailableEdibleItem() !== undefined;
    }

    return false;
  }
  reserve(worker) {
    if (this.target instanceof StockPile && !this.reservedItemId) {
      const itemId = this.target.reserveEdibleItem();
      if (!itemId) return false;
      this.reservedItemId = itemId;
    }

    return super.reserve(worker);
  }
  release(worker) {
    if(this.target instanceof StockPile && this.reservedItemId){
      this.target.releaseReservedItem(this.reservedItemId)
      this.reservedItemId = null
    }
    super.release(worker);
  }
  perform(worker) {
    if (this.target instanceof Food) {
      const idx = game.state.foods.indexOf(this.target);
      if (idx !== -1) {
        const food = game.state.foods.splice(idx, 1)[0];
        worker.hunger = min(worker.hunger + food.hunger, worker.maxHunger);
      }

    } else if (this.target instanceof StockPile) {
      const item = this.target.removeItemById(this.reservedItemId);

      if (item) {
        this.target.releaseReservedItem(this.reservedItemId);
        this.reservedItemId = null;

        worker.hunger = min(
          worker.hunger + game.state.stats[item.resource].hunger,
          worker.maxHunger,
        );
      }
    }
    this.complete();
  }
}

class ReproduceTask extends Task {
  constructor(parentA, parentB) {
    super({
      type: "reproduce",
      target: {
        x: (parentA.x + parentB.x) / 2,
        y: (parentA.y + parentB.y) / 2,
      },
      priority: 20,
      requiredWorkers: 2,
      workDuration:0,
      distanceWeight: 0.02,
      utilityChecks: [
        {
          weight: 1,
          fn: (worker, task) => {
            const other = task.getPartner(worker);
            if (!other) return 0;

            const workerFullness = worker.hunger / worker.maxHunger;
            const otherFullness = other.hunger / other.maxHunger;

            return ((workerFullness + otherFullness) / 2) * 80;
          },
        },
      ],
    });

    this.parents = [parentA, parentB];
  }

  getPartner(worker) {
    return this.parents.find((parent) => parent !== worker);
  }

  isValid() {
    return this.parents.every( (parent) =>
      game.state.people.includes(parent) &&
      parent.type === "adult" &&
      parent.repRate <= 0 &&
      parent.hunger > parent.maxHunger * 0.65 &&
      (parent.currentTask === null || parent.currentTask === this)
    );
  }

  canBeTakenByWorker(worker) {
    return this.parents.includes(worker) && super.canBeTakenByWorker(worker);
  }

  perform(worker) {
    birth(this.parents[0], this.parents[1]);
    this.complete();
  }
}

class DepositTask extends Task{
  constructor(structure){
    super({
      type: "deposit",
      target: structure,
      priority: 45,
      workDuration: 30,
      utilityChecks: [
        {
          weight: 1,
          fn: (worker) => {
            return (worker.storage?.length ?? 0) * 18;
          },
        },
      ],
    });
  }
  isValid(){
    return this.target && this.target.currentStorage < this.target.storageMax;
  }
  perform(worker){
    for (let item of worker.storage) {
      this.target.items.push({
        id: crypto.randomUUID(),
        ...item,
      });
    }
    worker.storage.length = 0;
    this.complete();
  }
  canBeTakenByWorker(worker) {
    return super.canBeTakenByWorker(worker) && (worker.storage?.length ?? 0) > 0;
  }
}
