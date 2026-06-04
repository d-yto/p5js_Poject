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
    requestTask(worker){
      let validTasks = this.tasks.filter(task => 
        task.status === "open" &&
        task.isValid() &&
        canBeTakenByWorker(worker))

      if(validTasks.length === 0) return null;
  
      validTasks.sort((a, b) => {
        const priorityDiff = b.getPriority(worker) - a.getPriority(worker);
        if (priorityDiff !== 0) return priorityDiff;
        return this._distanceSq(a.target, worker) - this._distanceSq(b.target, worker);
      })
    };
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
  

  //world tasks
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


  //need tasks
  class EatTask extends Task {
    constructor(foodOption, worker) {
      super({
        type: "eat",
        target: foodOption.target,
        priority: new HungerNeed(worker),
        workDuration: 20,
      });
      this.sourceType = foodOption.type;
    }
    isValid() {
      if (!this.target) return false;
  
      if (this.sourceType === "wild") {
        return data.foods.includes(this.target);
      }
  
      if (this.sourceType === "pile") {
        return (
          data.structures.includes(this.target) &&
          this.target.items.some((item) => stats[item.resource]?.hunger > 0)
        );
      }
  
      return false;
    }
    perform(worker) {
      if (this.sourceType === "wild") {
        const index = data.foods.indexOf(this.target);
        if (index !== -1) {
          const food = data.foods.splice(index, 1)[0];
          worker.hunger = min(worker.hunger + food.hunger, worker.maxHunger);
        }
      } else if (this.sourceType === "pile") {
        const idx = this.target.items.findIndex(
          (item) => stats[item.resource]?.hunger > 0,
        );
        if (idx !== -1) {
          const item = this.target.items.splice(idx, 1)[0];
          worker.hunger = min(worker.hunger + stats[item.resource].hunger, worker.maxHunger);
        }
      }
  
      this.complete();
    }
  }

  class Need {
    getScore(worker){
      return 0;
    }
    getTask(worker){
      return null
    }
  }



  class HungerNeed extends Need{
    getTask(worker) {
    const foodOption = worker.findBestFoodOption();
    if (!foodOption) return null;
    return new EatTask(foodOption, worker);
  }
  }