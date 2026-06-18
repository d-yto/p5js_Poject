/* **UTILITIES** */
function getRandomIntInclusive(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function getRandomNumInclusive(min, max) {
  return Math.random() * (max - min) + min;
}

/* **GRID** */
function createGrid(people, cellsize) {
  /* Creates a grid */
  let grid = new Map();

  for (let i of people) {
    let cellX = Math.floor((i.x + i.size / 2) / cellsize);
    let cellY = Math.floor((i.y + i.size / 2) / cellsize);
    let key = `${cellX},${cellY}`;
    if (!grid.has(key)) {
      grid.set(key, []);
    }
    grid.get(key).push(i);
  }
  return grid;
}

/* **RENDER** */
function hungerBar(i) {
  /* Creates a hunger bar for each entity. 
    Gives user visual feedback on the ecosystem's overall health
    as the entity's hunger declines, the bar shrinks in size & changes color based on severity. */
  let barWidth = 20;
  let barHeight = 3;
  let bx = i.x - barWidth / 2;
  let by = i.y - i.size / 2 - 6;
  let decFill = i.hunger / i.maxHunger;

  noStroke();
  fill(80, 80, 80);
  rect(bx, by, barWidth, barHeight);

  if (decFill <= 0.2) {
    fill(186, 26, 26);
  } else if (decFill <= 0.6) {
    fill(255, 102, 51);
  } else if (decFill > 0.6) {
    fill(102, 204, 51);
  }
  rect(bx, by, barWidth * decFill, barHeight);
}

/* **ENTITY LIFECYCLE** */
function birth(i, e) {
  /* Called when parents meet, initializes the childs birth.
    Child inherits stats (currently only Vel) from one parent, or an average of both,
    dependent on its roll */
  let roll = getRandomIntInclusive(1, 3);

  let child = new Child(game.state.stats.child);
  child.x = (i.x + e.x) / 2;
  child.y = (i.y + e.y) / 2;
  child.hunger = child.maxHunger * getRandomNumInclusive(0.5, 0.7);
  game.addPerson(child);
  if (roll === 1) {
    /* inherit from i */
    child.vel = Math.max(0.1, i.vel - getRandomNumInclusive(0.1, 0.33));
  }
  if (roll === 2) {
    /* inherit from e */
    child.vel = Math.max(0.1, e.vel - getRandomNumInclusive(0.1, 0.33));
  }
  if (roll === 3) {
    /* avg both parents, include minor mutations */
    child.vel = Math.max(
      0.1,
      (i.vel + e.vel) / 2 - getRandomNumInclusive(0.1, 0.33),
    );
  }

  i.hunger -= 25;
  e.hunger -= 25;
  i.repRate = getRandomIntInclusive(0, 1000);
  e.repRate = getRandomIntInclusive(0, 1000);
  i.partner = null;
  e.partner = null;
  i.children.push(child);
  e.children.push(child);
  console.log(`BIRTH`);
}
function death() {
  /* removes people if they should die */
  let alive = new Set(game.state.people.filter(p => !p.shouldDie()))

  for (let p of game.state.people){
    if (!alive.has(p)){
      p.partner = null;
      p.jobTarget = null;
      p.assignedStructure = null;
      p.targetStockPile = null;
      p.targetFoodPile = null;
    }else{
      if (p.partner && !alive.has(p.partner)){
        p.partner = null
      }
    }
  }
  
  for (let task of taskManager.tasks) {
    for (let worker of [...task.assignedWorkers]) {
      if (!alive.has(worker)) {
        task.release(worker);
      }
    }
  }

  let before = game.state.people.length;
  game.state.people = Array.from(alive);
  game.state.metrics.deathToll += before - game.state.people.length;
  
  for (let s of game.state.structures) {
    if (!s.workers) continue;
    s.workers = s.workers.filter(e => alive.has(e));
  }
}
function grow() {
  /* Function for when each year passes, to grow by 1 year.
    If i === 18 it transitions to being an adult */
  let add = [];
  let remove = [];

  for (let i of game.state.people) {
    i.age++;
    if (i.age === 18 && i.type === "kid") {
      let adult = i.growUp();
      add.push(adult);
      remove.push(i);
    }
  }
  for (let i of remove) {
    let index = game.state.people.indexOf(i);
    if (index > -1) game.state.people.splice(index, 1);
  }
  for (let i of add) game.state.people.push(i);
  if (add.length > 0) console.log(`${add.length} child/children grew up`);
}

function updateReproductionTasks() {
  const candidates = game.state.people.filter(
    (p) =>
      p.type === "adult" &&
      p.canReproduce &&
      !hasActiveReproductionTask(p)
  );

  const grid = createGrid(candidates, 100);
  const pairs = [];
  const checked = new Set();

  for (let adult of candidates) {
    const cellX = Math.floor((adult.x + adult.size / 2) / 100);
    const cellY = Math.floor((adult.y + adult.size / 2) / 100);

    for (let ox = -1; ox <= 1; ox++) {
      for (let oy = -1; oy <= 1; oy++) {
        const key = `${cellX + ox},${cellY + oy}`;
        if (!grid.has(key)) continue;

        for (let other of grid.get(key)) {
          if (adult === other) continue;

          const pairKey =
            adult.ID < other.ID
              ? `${adult.ID},${other.ID}`
              : `${other.ID},${adult.ID}`;

          if (checked.has(pairKey)) continue;
          checked.add(pairKey);

          const dx = adult.x - other.x;
          const dy = adult.y - other.y;
          const distSq = dx * dx + dy * dy;

          const fullness =
            adult.hunger / adult.maxHunger + other.hunger / other.maxHunger;

          const score = fullness * 80 - Math.sqrt(distSq) * 0.03;

          pairs.push({ adult, other, score });
        }
      }
    }
  }

  pairs.sort((a, b) => b.score - a.score);

  const used = new Set();

  for (let pair of pairs) {
    if (used.has(pair.adult) || used.has(pair.other)) continue;

    const task = new ReproduceTask(pair.adult, pair.other);
    taskManager.add(task);

    used.add(pair.adult);
    used.add(pair.other);
  }
}

function hasActiveReproductionTask(person) {
  return taskManager.tasks.some(
    (task) =>
      task instanceof ReproduceTask &&
      task.status !== "completed" &&
      task.status !== "cancelled" &&
      task.parents.includes(person)
  );
}

/* **COLLISION**  */
function isColliding(object1, object2) {
  /* Checks if two circles are colliding. */
  let dx = object1.x + object1.size / 2 - (object2.x + object2.size / 2);
  let dy = object1.y + object1.size / 2 - (object2.y + object2.size / 2);
  let distanceSq = dx * dx + dy * dy;
  let radiusSum = object1.size / 2 + object2.size / 2;
  if (distanceSq < radiusSum * radiusSum) {
    return true;
  }
}

function handleCollision(object1, object2) {
  /* Circle on circle collision physics. THIS TOOK SO LONG TO DO */
  let dx = object1.x + object1.size / 2 - (object2.x + object2.size / 2);
  let dy = object1.y + object1.size / 2 - (object2.y + object2.size / 2);
  let distanceSq = dx * dx + dy * dy;
  let distance = Math.sqrt(distanceSq);

  if (distance === 0) return;

  let nx = dx / distance;
  let ny = dy / distance;

  let v1x = object1.direction.x * object1.vel;
  let v1y = object1.direction.y * object1.vel;

  let v2x = object2.direction.x * object2.vel;
  let v2y = object2.direction.y * object2.vel;

  let relVelX = v1x - v2x;
  let relVelY = v1y - v2y;
  let velAlongNorm = relVelX * nx + relVelY * ny;
  if (velAlongNorm > 0) return;

  let m1 = object1.size;
  let m2 = object2.size;
  let invM1 = 1 / m1;
  let invM2 = 1 / m2;
  let invMass = invM1 + invM2;

  let e = 0.8;
  let j = (-(1 + e) * velAlongNorm) / invMass;

  v1x += (j * nx) / m1;
  v1y += (j * ny) / m1;
  v2x -= (j * nx) / m2;
  v2y -= (j * ny) / m2;

  object1.vel = Math.sqrt(v1x * v1x + v1y * v1y);
  if (object1.vel > 0) {
    object1.direction.x = v1x / object1.vel;
    object1.direction.y = v1y / object1.vel;
  }

  object2.vel = Math.sqrt(v2x * v2x + v2y * v2y);
  if (object2.vel > 0) {
    object2.direction.x = v2x / object2.vel;
    object2.direction.y = v2y / object2.vel;
  }

  let overlap = m1 / 2 + m2 / 2 - distance;
  object1.x += nx * ((overlap * invM1) / invMass);
  object1.y += ny * ((overlap * invM1) / invMass);
  object2.x -= nx * ((overlap * invM2) / invMass);
  object2.y -= ny * ((overlap * invM2) / invMass);

  object1.collisionCooldown = 20 * game.state.time.worldSpeed;
  object2.collisionCooldown = 20 * game.state.time.worldSpeed;
}
function collisionCheck(people) {
  /* checks for people near one another then sends that to check if they are colliding */
  const cellsize = 50;
  const grid = createGrid(people, cellsize);
  const checked = new Set();

  for (let i of people) {
    let cellX = Math.floor((i.x + i.size / 2) / cellsize);
    let cellY = Math.floor((i.y + i.size / 2) / cellsize);

    for (let ox = -1; ox <= 1; ox++) {
      for (let oy = -1; oy <= 1; oy++) {
        let key = `${cellX + ox},${cellY + oy}`;
        if (!grid.has(key)) continue;

        for (let e of grid.get(key)) {
          if (e === i) continue;
          let pairKey = i.ID < e.ID ? `${i.ID},${e.ID}` : `${e.ID},${i.ID}`;
          if (checked.has(pairKey)) continue;
          checked.add(pairKey);
          if (isColliding(i, e)) {
            handleCollision(i, e);
          }
        }
      }
    }
  }
}

/* **FOOD** */


function rotUpdate() {
  /* updates how rotted the food is */
  for (let i of game.state.foods) {
    i.rotTime -= i.rotRate;
  }
  game.state.foods = game.state.foods.filter((c) => c.rotTime > 0);
}

/* **INPUT / UI** */
function mouseClicked() {
  if (game.state.totalDragDist > 10) {
    game.state.totalDragDist = 0;
    return;
  }
  if (game.state.ui) {
    game.state.ui.handleclick(mouseX, mouseY);
    return;
  }
  if (game.state.builderUI && game.state.builderUI.placing) {
    game.state.builderUI.handleclick(mouseX, mouseY);
    return;
  }

  if (mouseY > game.state.config.winHeight && mouseY < game.state.config.winHeight + game.state.config.buttonheight) {
    if (mouseY > game.state.config.winHeight) {
      if (mouseX > 0 && mouseX < 100) {
        healthbar = !healthbar;
        game.state.metrics.showHealthbars = !game.state.metrics.showHealthbars;
      }
      if (mouseX > 100 && mouseX < 200) {
        if (game.state.time.worldSpeed === 1) game.state.time.worldSpeed *= 5;
        else if (game.state.time.worldSpeed === 5) game.state.time.worldSpeed /= 5;
      }
      if (mouseX > 200 && mouseX < 300) {
        if (!game.state.builderUI) game.state.builderUI = new BuilderUI();
        game.state.ui = game.state.builderUI;
        game.state.selected = `builder`;
      }
      return;
    }
  }
}
function mousePressed() {
  if (mouseY > game.state.config.winHeight) return;
  if (game.state.ui) return;
  game.state.totalDragDist = 0;
  game.state.isDragging = true;
  game.state.dragPos.x = mouseX + game.state.camera.x;
  game.state.dragPos.y = mouseY + game.state.camera.y;
}
function mouseDragged() {
  if (!game.state.isDragging) return;
  game.state.camera.x = game.state.dragPos.x - mouseX;
  game.state.camera.y = game.state.dragPos.y - mouseY;
  game.state.totalDragDist += dist(mouseX, pmouseX, mouseY, pmouseY);
  game.state.camera.x = constrain(game.state.camera.x, 0, game.state.config.mapWidth - game.state.config.winWidth);
  game.state.camera.y = constrain(game.state.camera.y, 0, game.state.config.mapHeight - game.state.config.winHeight);
}
function mouseReleased() {
  game.state.isDragging = false;
}

function keyPressed() {
  if (keyCode === 27) {
    game.state.selected = null;
    game.state.ui = null;
    if (game.state.builderUI) game.state.builderUI.placing = false;
    scrollTarget = 0;
  }
}

function placeStructure(config, x, y) {
  let cfg = { ...config };
  cfg.x = round((x + game.state.camera.x) / cfg.width) * cfg.width;
  cfg.y = round((y + game.state.camera.y) / cfg.height) * cfg.height;

  let occupied = game.state.structures.some((c) => c.x === cfg.x && c.y === cfg.y);
  if (occupied) {
    console.log(`Tile occupied`);
    return;
  }

  let StructureClass = cfg.for;
  if (!StructureClass) {
    console.log(`No class found for: ${cfg.for}`);
    return;
  }

  game.state.structures.push(new StructureClass(cfg));
}

function doubleClicked() {
  console.log(`Double click`);
  let x = mouseX + game.state.camera.x;
  let y = mouseY + game.state.camera.y;

  let occupied = game.state.structures.find(
    (c) => x > c.x && x < c.x + c.width && y > c.y && y < c.y + c.height,
  );
  if (occupied) {
    game.state.selected = occupied;
    let UIClass = occupied.uiClass;
    console.log(game.state.selected);
    if (!UIClass) return;
    game.state.ui = new UIClass(occupied);
  }
}

function mouseWheel(e) {
  if (game.state.ui) game.state.ui.updateScroll(e.delta);
}


function getDayTimeFloat(){
  const time = game.state.time
  return time.dayTime / time.dayLength
  
}

