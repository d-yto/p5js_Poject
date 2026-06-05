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
    chooseBestTask(worker) {
      const candidates = [];

      // 1. Open world tasks
      for (const task of this.tasks) {
        if (task.status !== "open") continue;
        if (!task.isValid()) continue;
        if (!task.canBeTakenByWorker(worker)) continue;

        candidates.push({
          task,
          score: task.getPriority(worker),
        });
      }

      if (candidates.length === 0) return null;

      candidates.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return this._distanceSq(a.task.target, worker) -
              this._distanceSq(b.task.target, worker);
      });

      const best = candidates[0];
      best.task.reserve(worker);
      return best.task;
    }
    _distanceSq(target, worker){
      if (!target) return Infinity;
      const dx = target.x - worker.x;
      const dy = target.y - worker.y;
      return dx * dx + dy * dy;
    };
  }
  
  //base task node
  class Task{
    constructor(config){
      this.id = crypto.randomUUID()
      this.type = config.type
      this.target = config.target
      this.priority = config.priority ?? 1
      this.assignedWorker = null
      this.status = "open"
      this.requiredStructure = config.requiredStructure ?? null
      this.requiredJob = config.requiredJob ?? null
      this.workDuration = config.workDuration ?? 60
  
    }
    reserve(worker){
      this.assignedWorker = worker
      this.status = "reserved"
    }
    release(){
      this.assignedWorker = null
      this.status = "open"
    }
    complete(){
      this.status = "completed"
    }
    cancel(){
      this.status = "cancelled"
  
      if (this.target && this.target.task === this){
        this.target.task = null
      }
    }
    isValid(){
      return true;
    }
    perform(worker){}
    canBeTakenByWorker(worker){
      if (this.requiredJob && this.requiredJob !== worker.job) return false;
      if (this.requiredStructure && this.requiredStructure 
        !== worker.assignedStructure) return false;
      return true;
    }
    getPriority(worker){
      return typeof this.priority === "number"
      ? this.priority
      : this.priority.getScore(worker);
    }
  }
  

  class HarvestTask extends Task {
    constructor(crop, farm){
      super({
        type:"harvest",
        target: crop,
        priority: 5,
        requiredJob: "farmer",
        requiredStructure: farm,
        workDuration: 90
      })
      this.farm = farm
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
        priority: 3,
        requiredJob: "farmer",
        requiredStructure: farm,
        workDuration:50
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
      });
    }
    isValid() {
      return data.foods.includes(this.target);
    }
    getPriority(worker) {
      const hungerNeed =
          1 - worker.hunger / worker.maxHunger;
  
      let dx = this.target.x - worker.x;
      let dy = this.target.y - worker.y;
  
      let dist = sqrt(dx * dx + dy * dy);
  
      return hungerNeed * 100 - dist * 0.05;
  }
    perform(worker) {
      const idx = data.foods.indexOf(this.target);

      if (idx !== -1) {
          const food = data.foods.splice(idx, 1)[0];

          worker.hunger =
              min(worker.hunger + food.hunger,
                  worker.maxHunger);
      }
  
      this.complete();
    }
  }

    class DepositTask extends Task{
      constructor(worker, structure){
        super({
          type:"deposite",
          target:structure,
          priority:4,
          workDuration:30
        })
      }
    }