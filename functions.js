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

  let child = new Child(stats.child);
  child.x = (i.x + e.x) / 2;
  child.y = (i.y + e.y) / 2;
  child.hunger = child.maxHunger * getRandomNumInclusive(0.5, 0.7);
  data.people.push(child);
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
  let before = data.people.length;
  data.people = data.people.filter((p) => !p.shouldDie());
  deathToll += before - data.people.length;

  const alive = new Set(data.people);
  for (let s of data.structures) {
    if (!s.workers) continue;
    s.workers = s.workers.filter(e => alive.has(e));
  }
}
function grow() {
  /* Function for when each year passes, to grow by 1 year.
    If i === 18 it transitions to being an adult */
  let add = [];
  let remove = [];

  for (let i of data.people) {
    i.age++;
    if (i.age === 18 && i.type === "kid") {
      let adult = i.growUp();
      add.push(adult);
      remove.push(i);
    }
  }
  for (let i of remove) {
    let index = data.people.indexOf(i);
    if (index > -1) data.people.splice(index, 1);
  }
  for (let i of add) data.people.push(i);
  if (add.length > 0) console.log(`${add.length} child/children grew up`);
}
function getFreaky() {
  /* Checks for other applicable entities to reproduce with.
    Must be >= 18, relatively full on hunger, and have a repRate of 0 to be applicable */
  const cellsize = 50;
  const applicable = data.people.filter((i) => i.canReproduce);
  const grid = createGrid(applicable, cellsize);
  const checked = new Set();
  for (let i of applicable) {
    /* Reset search stats for this specific person */
    let nearest = null;
    let nearestDistSq = Infinity;

    let cellX = Math.floor((i.x + i.size / 2) / cellsize);
    let cellY = Math.floor((i.y + i.size / 2) / cellsize);
    /* grid check */
    for (let ox = -1; ox <= 1; ox++) {
      for (let oy = -1; oy <= 1; oy++) {
        let key = `${cellX + ox},${cellY + oy}`;
        if (!grid.has(key)) continue;
        for (let e of grid.get(key)) {
          if (e === i) continue;
          let pairKey = i.ID < e.ID ? `${i.ID},${e.ID}` : `${e.ID},${i.ID}`;
          if (checked.has(pairKey)) continue;
          checked.add(pairKey);

          let dx = i.x + i.size / 2 - (e.x + e.size / 2);
          let dy = i.y + i.size / 2 - (e.y + e.size / 2);
          let distanceSq = dx * dx + dy * dy;

          if (distanceSq < nearestDistSq) {
            nearest = e;
            nearestDistSq = distanceSq;
          }
        }
      }
    }
    if (nearest) {
      i.partner = nearest;
      nearest.partner = i;
    }
  }
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
function touchingBoundary(obj) {
  /* If touching boundary, reflects velocity perpendicular to the surface. */
  let s = obj.size / 2;
  if (obj.x > mapWidth - s) {
    obj.direction.x *= -1;
    obj.x = mapWidth - s;
  } else if (obj.x < 0 + s) {
    obj.direction.x *= -1;
    obj.x = 0 + s;
  }
  if (obj.y > mapHeight - s) {
    obj.direction.y *= -1;
    obj.y = mapHeight - s;
  } else if (obj.y < 0 + s) {
    obj.direction.y *= -1;
    obj.y = 0 + s;
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

  object1.collisionCooldown = 20 * worldSpeed;
  object2.collisionCooldown = 20 * worldSpeed;
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
function nearestFood(i, grid) {
  /* checks nearby cells for food.
    If no food is in range, a null value is returned. */
  const cellsize = 50;
  let nearest = null;
  let nearestDist = Infinity;

  let cellX = Math.floor((i.x + i.size / 2) / cellsize);
  let cellY = Math.floor((i.y + i.size / 2) / cellsize);

  for (let ox = -2; ox <= 2; ox++) {
    for (let oy = -2; oy <= 2; oy++) {
      let key = `${cellX + ox},${cellY + oy}`;
      if (!grid.has(key)) continue;
      for (let foodItem of grid.get(key)) {
        let dx = i.x + i.size / 2 - (foodItem.x + foodItem.size / 2);
        let dy = i.y + i.size / 2 - (foodItem.y + foodItem.size / 2);
        let distanceSq = dx * dx + dy * dy;

        if (distanceSq < nearestDist) {
          nearest = foodItem;
          nearestDist = distanceSq;
        }
      }
    }
  }
  if (nearest) {
    nearest.dist = Math.sqrt(nearestDist);
  }
  i.nearestFood = nearest;
  return nearest;
}
function eat() {
  /* checks which entities are eating. */
  for (let i of data.people) {
    let nearest = i.nearestFood;
    if (nearest && isColliding(i, nearest)) {
      let foodIndex = data.foods.indexOf(nearest);
      if (foodIndex !== -1) {
        data.foods.splice(foodIndex, 1);
        i.hunger = Math.min((i.hunger += nearest.hunger), i.maxHunger);
      }
    }
  }
}
function rotUpdate() {
  /* updates how rotted the food is */
  for (let i of data.foods) {
    i.rotTime -= i.rotRate;
  }
  data.foods = data.foods.filter((c) => c.rotTime > 0);
}

/* **INPUT / UI** */
function mouseClicked() {
  if (totalDist > 10) {
    totalDist = 0;
    return;
  }
  if (data.activeUI) {
    data.activeUI.handleclick(mouseX, mouseY);
    return;
  }
  if (data.builderUI && data.builderUI.placing) {
    data.builderUI.handleclick(mouseX, mouseY);
    return;
  }

  if (mouseY > winHeight && mouseY < winHeight + buttonheight) {
    if (mouseY > winHeight) {
      if (mouseX > 0 && mouseX < 100) {
        healthbar = !healthbar;
      }
      if (mouseX > 100 && mouseX < 200) {
        if (worldSpeed === 1) worldSpeed *= 5;
        else if (worldSpeed === 5) worldSpeed /= 5;
      }
      if (mouseX > 200 && mouseX < 300) {
        if (!data.builderUI) data.builderUI = new BuilderUI();
        data.activeUI = data.builderUI;
        data.selected = `builder`;
      }
      return;
    }
  }
}
function mousePressed() {
  if (mouseY > winHeight) return;
  if (data.activeUI) return;
  totalDist = 0;
  isdragging = true;
  dragPosX = mouseX + camX;
  dragPosY = mouseY + camY;
}
function mouseDragged() {
  if (!isdragging) return;
  camX = dragPosX - mouseX;
  camY = dragPosY - mouseY;
  totalDist += dist(mouseX, pmouseX, mouseY, pmouseY);
  camX = constrain(camX, 0, mapWidth - winWidth);
  camY = constrain(camY, 0, mapHeight - winHeight);
}
function mouseReleased() {
  isdragging = false;
}

function keyPressed() {
  if (keyCode === 27) {
    data.selected = null;
    data.activeUI = null;
    if (data.builderUI) data.builderUI.placing = false;
    scrollTarget = 0;
  }
}

function placeStructure(config, x, y) {
  let cfg = { ...config };
  cfg.x = round((x + camX) / cfg.width) * cfg.width;
  cfg.y = round((y + camY) / cfg.height) * cfg.height;

  let occupied = data.structures.some((c) => c.x === cfg.x && c.y === cfg.y);
  if (occupied) {
    console.log(`Tile occupied`);
    return;
  }

  let StructureClass = cfg.for;
  if (!StructureClass) {
    console.log(`No class found for: ${cfg.for}`);
    return;
  }

  data.structures.push(new StructureClass(cfg));
}

function doubleClicked() {
  console.log(`Double click`);
  let x = mouseX + camX;
  let y = mouseY + camY;

  let occupied = data.structures.find(
    (c) => x > c.x && x < c.x + c.width && y > c.y && y < c.y + c.height,
  );
  if (occupied) {
    data.selected = occupied;
    let UIClass = occupied.uiClass;
    console.log(data.selected);
    if (!UIClass) return;
    data.activeUI = new UIClass(occupied);
  }
}

function mouseWheel(e) {
  if (data.activeUI) data.activeUI.updateScroll(e.delta);
}

function findNearestJobInteract(i) {
  let behaviour = jobBehaviours[i.job];
  if (!behaviour) return null;

  const cellsize = 50;
  let nearest = null;
  let nearestDist = Infinity;

  let searchPool = [];
  if (i.assignedStructure?.crops) {
    searchPool = i.assignedStructure.crops.filter(behaviour.requirement);
  }
  if (searchPool.length === 0) {
    searchPool = data.structures
      .filter((s) => s instanceof farmland)
      .flatMap((s) => s.crops)
      .filter(behaviour.requirement);
  }
  let grid = createGrid(searchPool, cellsize);

  let cellX = Math.floor((i.x + i.size / 2) / cellsize);
  let cellY = Math.floor((i.y + i.size / 2) / cellsize);

  for (let ox = -4; ox <= 4; ox++) {
    for (let oy = -4; oy <= 4; oy++) {
      let key = `${cellX + ox},${cellY + oy}`;
      if (!grid.has(key)) continue;

      for (let resource of grid.get(key)) {
        let dx = i.x + i.size / 2 - resource.x;
        let dy = i.y + i.size / 2 - resource.y;
        let distanceSq = dx * dx + dy * dy;

        if (distanceSq < nearestDist) {
          nearest = resource;
          nearestDist = distanceSq;
        }
      }
    }
  }
  if (nearest) {
    nearest.dist = Math.sqrt(nearestDist);
  }
  i.jobTarget = nearest;
  return nearest;
}

function getDayPhase(){
  t = dayLength/dayTime
  if (t<PHASE_DAY_START) return 'day';
  if (t<PHASE_EVENING_START) return 'evening';
  return 'night';
}

function makeWorkerTree(jobSubTree){
    new Selector([
        sequences.ifHungryEat,
        new sequence([conditions.hasStorage, actions.depositStorage]),
        jobSubTree,
        actions.wander,
    ])    
} 