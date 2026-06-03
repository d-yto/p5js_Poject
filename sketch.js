function setup() {
  noStroke();
  let canvas = createCanvas(winWidth, winHeight + buttonheight);
  pixelDensity(1);
  for (let i = 0; i < 20; i++) {
    data.people.push(new Child(stats.child));
  }
  for (let i = 0; i < 30; i++) {
    data.people.push(new Adult(stats.adult));
  }
}

function draw() {
  taskManager.removeFinished()
  background(51);
  
 






  unemployed = data.people.filter((c) => c.type === "adult" && c.job === null);
  push();
  translate(-camX, -camY);

  collisionCheck(data.people);
  if (frameCount % (120 / worldSpeed) === 0) {
    rotUpdate();
  }
  if (frameCount % (40 / worldSpeed) === 0) {
    for (let i = 0; i < 4; i++) data.foods.push(new Carrot(stats.carrot));
  }

  dayTime += worldSpeed;
  if (dayTime >= dayLength) {
    dayTime = 0;
    dayCount++;
    if (dayCount % yearLength === 0) {
      grow();
    }
  }

  const foodGrid = createGrid(data.foods, 50);

  for (let s of data.structures) {
    s.update();
  }

  for (let f of data.foods) {
    f.update();
  }
  for (let p of data.people) {
    p.update(foodGrid);
  }

  eat();
  death();
  getFreaky();

  pop();

  let t = getDayTimeFloat()
  

  let noonLight  = color(255, 255, 255, 0);
  let sunsetLight = color(240, 110, 50, 75);
  let sunriseLight= color(255, 170, 90, 70);
  let nightLight = color(15, 25, 80, 120);
  let overlayColor;
  
  if (t < 0.25) {
    let amt = map(t, 0.0, 0.25, 0, 1);
    overlayColor = lerpColor(sunriseLight, noonLight, amt);
  } else if (t < 0.50) {
    let amt = map(t, 0.25, 0.50, 0, 1);
    overlayColor = lerpColor(noonLight, sunsetLight, amt);
  } else if (t < 0.75) {
    let amt = map(t, 0.50, 0.75, 0, 1);
    overlayColor = lerpColor(sunsetLight, nightLight, amt);
  } else {
    let amt = map(t, 0.75, 1.00, 0, 1);
    overlayColor = lerpColor(nightLight, sunriseLight, amt);
  }

  blendMode(SOFT_LIGHT)
  fill(overlayColor)
  noStroke()
  rect(0,0,winWidth,winHeight)
  blendMode(BLEND)



  if (data.activeUI) {
    data.activeUI.render();
  }
  if (data.builderUI && data.builderUI.placing && mouseY < winHeight) {
    let config = data.builderUI.selected;

    let snappedX =
      round((mouseX - config.width / 2 + camX) / config.width) * config.width;
    let snappedY =
      round((mouseY - config.height / 2 + camY) / config.height) *
      config.height;
    let occupied = data.structures.find(
      (c) => snappedX === c.x && snappedY === c.y, // Simple tile equality check
    );

    push(); // Protect existing drawing styles
    if (occupied) {
      fill(225, 0, 0, 60);
    } else {
      fill(...config.color, 90);
    }
    noStroke();
    // Render at screen coordinates
    rect(snappedX - camX, snappedY - camY, config.width, config.height);

    
    pop();
  }
  
  fill(130, 120, 62);
  rect(0, winHeight, 100, buttonheight);

  fill(90, 20, 20);
  rect(100, winHeight, 100, buttonheight);

  fill(20);
  rect(200, winHeight, winWidth - 200, buttonheight);
  fill(255);
  text(data.people.length, 400, winHeight);
  fill(90, 30, 120);
  rect(200, winHeight, winWidth - 500, buttonheight);
}
