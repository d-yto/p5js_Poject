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
        (task.requiredJob === null ||
        (task.requiredJob === worker.job &&
        task.requiredStructure === worker.assignedStructure)))
  
      if(validTasks.length === 0) return null;
  
      validTasks.sort((a,b) =>{
  
        if(a.priority !== b.priority) return b.priority - a.priority
  
        if (!a.target || !b.target) return 0
        let adx = a.target.x - worker.x
        let ady = a.target.y - worker.y
  
        let bdx = b.target.x - worker.x
        let bdy = b.target.y - worker.y
  
        return ((adx*adx + ady*ady) - (bdx*bdx + bdy*bdy));
      }) 
      let best = validTasks[0]
      best.reserve(worker)
      return best
    }
  }
  
  
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

  class EatTask extends Task{
    constructor(worker){
        super({
            type:"eat",
            priority:10
        })
        this.worker = worker
    }
    isValid(){
        return this.worker.hunger < this.worker.maxHunger * 0.25
    }
  }