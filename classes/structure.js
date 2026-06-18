class Structure {
  constructor(config) {
    this.x = config.x;
    this.y = config.y;
    this.color = config.color;
    this.type = config.type;
    this.ID = crypto.randomUUID();
  }
}

class RectangularStructure extends Structure {
  constructor(config) {
    super(config);
    this.width = config.width;
    this.height = config.height;
  }
  render() {
    stroke(45, 35, 25, 200); // Dark wood-colored stroke
    strokeWeight(2);
    fill(this.color);
    rect(this.x, this.y, this.width, this.height, 4); // Slightly rounded corners
    noStroke();
  }
  update() {
    this.render();
  }
  getTaskPoint(origin) {
    return {
      x: constrain(origin.x, this.x, this.x + this.width),
      y: constrain(origin.y, this.y, this.y + this.height),
    };
  }
}

class farmland extends RectangularStructure {
  constructor(config) {
    super(config);
    this.crop = config.type;
    this.workers = [];
    this.capacity = config.capacity;
    this.job = "farmer";
    this.uiClass = WorkerAssignUI;
    this.crops = [];
    this.spawnCrops(config.type);
  }

  spawnCrops(type) {
    let rows = 5;
    let cols = 6;
    let padX = this.width / (cols + 1);
    let padY = this.height / (rows + 1);

    for (let col = 1; col <= cols; col++) {
      for (let row = 1; row <= rows; row++) {
        this.crops.push(
          new FarmCrop({
            x: this.x + padX * col,
            y: this.y + padY * row,
            type: type,
            size: 6,
            color: structureConfigs.farm[type].cropColor,
            dryColor: structureConfigs.farm[type].dryColor,
            readyColor: structureConfigs.farm[type].readyColor,
            parent: this,
          }),
        );
      }
    }
  }
  update() {
    this.updateTasks()
    for (let c of this.crops) c.update();
  }
  render() {
    super.render();
    for (let c of this.crops) c.render();
  }

  updateTasks(){
    for (let crop of this.crops){
  
      if (crop.growthStage >= crop.harvestStage){
  
        if (!(crop.task instanceof HarvestTask)){
          let task = new HarvestTask(crop, this)
          crop.task = task
          taskManager.add(task)
        }
  
      } else if (!crop.watered){
  
        if (!(crop.task instanceof WaterTask)){
          let task = new WaterTask(crop, this)
          crop.task = task
          taskManager.add(task)
        }
  
      }
  
    }
  }

 
}

class StockPile extends RectangularStructure {
  constructor(config) {
    super(config);
    this.items = [];
    this.storageMax = config.storageMax;
    this.displayed = [];
    this.reservedItems = new Set()
  }
  get currentStorage() {
    return this.items.length;
  }
  getAvailableEdibleItem(){
    return this.items.find(item =>
    game.state.stats[item.resource]?.hunger > 0 && 
    !this.reservedItems.has(item.id))
  }
  reserveEdibleItem(){
    const item = this.getAvailableEdibleItem()
    if (!item) return null
    this.reservedItems.add(item.id)
    return item.id
  }
  releaseReservedItem(itemId){
    if (!itemId) return
    this.reservedItems.delete(itemId)
  }
  getItemById(itemId){
    return this.items.find(item => item.id === itemId)
  }
  removeItemById(itemId){
    const index = this.items.findIndex(item => item.id === itemId);
    if (index === -1) return null;

    return this.items.splice(index, 1)[0];
  }
  updateTasks() {
    const hasDepositTask = taskManager.tasks.some(
      (task) =>
        task instanceof DepositTask &&
        task.target === this &&
        task.status !== "completed" &&
        task.status !== "cancelled",
    );

    if (this.currentStorage < this.storageMax && !hasDepositTask) {
      taskManager.add(new DepositTask(this));
    }
  }
  update() {
    this.updateTasks();
  }
  render() {
    super.render();
    const rows = 10, cols = 10;
    let padX = this.width / (cols + 1);
    let padY = this.height / (rows + 1);
    let row = 1,
      col = 1;
    for (let i = 0; i < this.currentStorage; i++) {
      let item = this.items[i];
      let type = item.resource;
      fill(game.state.stats[type].color);
      circle(this.x + padX * col, this.y + padY * row, game.state.stats[type].size);

      if (row < rows) {
        row++;
      } else if (col < cols) {
        row = 1;
        col++;
      }
    }
  }
}
