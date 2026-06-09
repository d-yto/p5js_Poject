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

      let task = this.chooseBestTask(worker);
      if (task) return task;
    
      const hungerNeed = 1 - worker.hunger / worker.maxHunger;
      if (hungerNeed <= 0.2) return null; 
    
      const bestFood = worker.findBestFoodOption();
      if (!bestFood || bestFood.target.task) return null;
    
      const foodTask = new EatTask(bestFood.target);
      bestFood.target.task = foodTask;
      this.add(foodTask);
    
      return this.chooseBestTask(worker);
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
      if (this.status != "open") return false
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
      return (
        (this.target instanceof Food && data.foods.includes(this.target)) ||
        (this.target instanceof StockPile && this.target.currentStorage > 0)
      );
    }
    _distanceTo(worker) {
      const targetPoint = this.target.getTaskPoint
        ? this.target.getTaskPoint(worker)
        : this.target;
      const dx = targetPoint.x - worker.x;
      const dy = targetPoint.y - worker.y;
      return sqrt(dx * dx + dy * dy);
    }
  
    getPriority(worker) {
      const fullness = worker.hunger / worker.maxHunger;
      const safeLevel = 0.75;
      const urgentLevel = 0.35;
  
      if (fullness >= safeLevel) {
        return 1;
      }
  
      let urgency = map(fullness, safeLevel, urgentLevel, 0, 1, true);
      urgency = constrain(urgency, 0, 1);
  
      const distancePenalty = this._distanceTo(worker) * 0.05;
      return 5 + urgency * 90 - distancePenalty;
  }
    perform(worker) {
      if (this.target instanceof Food) {
        const idx = data.foods.indexOf(this.target);
        if (idx !== -1) {
          const food = data.foods.splice(idx, 1)[0];
          worker.hunger = min(worker.hunger + food.hunger, worker.maxHunger);
        }
      } else if (this.target instanceof StockPile) {
        const idx = this.target.items.findIndex(
          (item) => stats[item.resource]?.hunger > 0,
        );
        if (idx !== -1) {
          const item = this.target.items.splice(idx, 1)[0];
          worker.hunger = min(
            worker.hunger + stats[item.resource].hunger,
            worker.maxHunger,
          );
        }
      }
  
      this.complete();
    }
  }

  class DepositTask extends Task{
    constructor(structure){
      super({
        type:"deposit",
        target:structure,
        priority:1000,
        workDuration:30
      })
    }
    isValid(){
      return(this.target && this.target.currentStorage < this.target.storageMax);
    }
    perform(worker){
      this.target.items.push(...worker.storage);
      worker.storage.length = 0;
      this.complete();
    }
    canBeTakenByWorker(worker){
      
      return (worker.storage?.length ?? 0) > 0;
    }
  }