
class UIWindow {
  constructor(marginWidthUI, marginHeightUI, uiWinWidth, uiWinHeight) {
    this.x = marginWidthUI;
    this.y = marginHeightUI;
    this.width = uiWinWidth ?? game.state.config.uiWinWidth ?? game.state.config.uiWidth ?? 480;
    this.height = uiWinHeight ?? game.state.config.uiWinHeight ?? game.state.config.uiHeight ?? 480;
    this.scrollOffset = 0;
    this.scrollTarget = 0;
  }
  beginClip() {
    drawingContext.save();
    drawingContext.beginPath();
    drawingContext.rect(
      this.x,
      this.y * 2,
      this.width,
      this.height - this.y * 2,
    );
    drawingContext.clip();
  }

  endClip() {
    drawingContext.restore();
  }
  drawBackground() {
    fill(30);

    rect(this.x, this.y, this.width, this.height);
  }
  drawTitle(t) {
    fill(200);
    textAlign(CENTER, TOP);
    textSize(16);
    textStyle(BOLD);
    text(t, this.x + this.width / 2, this.y + 30);
  }
  updateScroll(delta) {
    this.scrollTarget += delta / 1.8;
    this.scrollTarget = constrain(
      this.scrollTarget,
      0,
      max(0, this.maxScroll()),
    );
  }
  maxScroll() {
    return 0;
  }
  update() {
    this.scrollOffset = lerp(this.scrollOffset, this.scrollTarget, 0.085);
  }
}

class WorkerAssignUI extends UIWindow {
  constructor(structure) {
    super(game.state.config.marginWidthUI, game.state.config.marginHeightUI, game.state.config.uiWinWidth, game.state.config.uiWinHeight);
    this.structure = structure;
  }
  maxScroll() {
    return max(
      0,
      this.getAssignable().length * game.state.config.entryHeight - (23 / 32) * this.height,
    );
  }
  drawRow(e, i) {
    let s = this.structure;
    let atCap = s.workers.length >= s.capacity;
    let isAssigned = s.workers.includes(e);
    let entryY = 28 * i + game.state.config.winHeight / 6 + 22 - this.scrollOffset;

    noStroke();
    fill(isAssigned ? color(40, 80, 40) : atCap ? 35 : 50);
    rect(115, entryY, game.state.config.winWidth - game.state.config.marginWidthUI * 2 - 115, 25);

    fill(isAssigned ? color(100, 220, 100) : atCap ? 100 : 200);
    textAlign(LEFT, BOTTOM);
    textSize(14);
    text(`Name: ${e.name}`, 122, entryY + 21);
    text(`Age: ${e.age}`, 255, entryY + 21);
    text(`Type: Adult`, 345, entryY + 21);
  }
  getAssignable() {
    let s = this.structure;
    return [...s.workers, ...game.state.unemployed.filter((e) => !s.workers.includes(e))];
  }
  render() {
    this.drawBackground();
    this.drawTitle(
      `Assign Workers ${this.structure.workers.length}/${this.structure.capacity}`,
    );

    this.beginClip();
    this.getAssignable().forEach((e, i) => this.drawRow(e, i));
    this.endClip();

    this.update();
  }
  handleclick(mx, my) {
    let s = this.structure;
    let atCap = s.workers.length >= s.capacity;

    this.getAssignable().forEach((e, i) => {
      let entryY = 28 * i + game.state.config.winHeight / 6 + 22 - this.scrollOffset;
      let clickBox = {
        x: 115,
        y: entryY,
        w: game.state.config.winWidth - game.state.config.marginWidthUI * 2 - 115,
        h: 25,
      };

      if (
        mx > clickBox.x &&
        mx < clickBox.x + clickBox.w &&
        my > clickBox.y &&
        my < clickBox.y + clickBox.h
      ) {
        if (!s.workers.includes(e) && !atCap) {
          s.workers.push(e);
          e.job = s.job;
          e.assignedStructure = s; 
          e.BT = BTrees.workerTree
        } else if (s.workers.includes(e)) {

          if(e.currentTask){
            e.currentTask.release(e);
            e.currentTask = null
          }

          s.workers.splice(s.workers.indexOf(e), 1);
          e.job = null;
          e.assignedStructure = null;
          e.BT = BTrees.adultTree;
        }
      }
    });
  }
}

class BuilderUI extends UIWindow {
  constructor() {
    super(game.state.config.marginWidthUI, game.state.config.marginHeightUI, game.state.config.uiWinWidth, game.state.config.uiWinHeight);
    this.structures = buildableStructures;
    this.selected = null;
    this.placing = false;
  }
  maxScroll() {
    return max(
      0,
      this.structures.length * game.state.config.entryHeight - (23 / 32) * this.height,
    );
  }
  drawRow(e, i) {
    let entryY = 28 * i + game.state.config.winHeight / 6 + 22 - this.scrollOffset;
    let isSelected = this.selected === e;

    noStroke();
    fill(isSelected ? color(40, 80, 40) : 50);
    rect(115, entryY, game.state.config.winWidth - game.state.config.marginWidthUI * 2 - 115, 25);

    fill(isSelected ? color(120, 220, 120) : 200);
    textAlign(LEFT, BOTTOM);
    textSize(14);
    text(`Structure: ${e.structureName}`, 122, entryY + 21);
  }
  render() {
    this.drawBackground();
    this.drawTitle(`Build`);
    this.beginClip();
    this.structures.forEach((config, i) => this.drawRow(config, i));
    this.endClip();
    this.update();
  }
  handleclick(mx, my) {
    if (this.placing && my < game.state.config.winHeight) {
      placeStructure(
        this.selected,
        mx - this.selected.width / 2,
        my - this.selected.height / 2,
      );
      this.placing = false;
      this.selected = null;
      return;
    }

    this.structures.forEach((config, i) => {
      let entryY = 28 * i + game.state.config.winHeight / 6 + 22 - this.scrollOffset;
      let inbounds =
        mx > 115 &&
        mx < 115 + (this.width - game.state.config.marginWidthUI * 2 - 115) &&
        my > entryY &&
        my < entryY + 25 &&
        my > game.state.config.marginHeightUI * 2 &&
        my < game.state.config.winHeight - game.state.config.marginHeightUI;

      if (inbounds) {
        this.selected = config;
        this.placing = true;
        game.state.ui = null;
      }
    });
  }
}