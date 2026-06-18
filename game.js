const game = {
    state:{
        people: [],
        foods: [],
        structures: [],
        unemployed: [],
        ui: null,
        builderUI: null,
        selected: null,
        camera: { x:0, y:0 },
        dragPos: { x:0, y:0 },
        isDragging: false,
        totalDragDist:0,
        time:{
            dayTime: 0,
            dayLength: 2400,
            dayCount: 0,
            yearLength: 1,
            worldSpeed: 1,
        },
        metrics: {
            deathToll: 0,
            showHealthbars: true,
        },
        stats:{
            adult: {
                color: [160, 116, 105], // Muted Terracotta
                get vel() {
                return getRandomNumInclusive(0.9, 1.1);
                },
                type: "adult",
                get age() {
                return getRandomIntInclusive(18, 85);
                },
                size: 12,
                get hunger(){
                    return getRandomIntInclusive(60 * 0.4, 60);
                },
                maxHunger: 60,
                hungerRate: 0.3,
                repRateMin: 500,
                repRateMax:4400,
            },
            child: {
                color: [130, 170, 180], // Soft Slate Blue
                get vel() {
                return getRandomNumInclusive(0.7, 0.9);
                },
                type: "kid",
                age: 0,
                size: 8,
                hunger: 17,
                maxHunger: 25,
                hungerRate: 0.3,
            },
            carrot: {
            foodName: "carrot",
            color: [220, 120, 60], // Natural Orange
            size: 7,
            hunger: 6,
            rotTime: 5,
            rotRate: 0.9,
            },
            wheat: {
                foodName: `wheat`,
                color: [210, 180, 90], // Golden Straw
                size: 5,
            },
        },
        config:{
            winWidth: 600,
            winHeight: 600,
            mapWidth: 2000,
            mapHeight: 2000,
            marginWidthUI: 60,
            marginHeightUI: 60,
            uiWidth: 480,
            uiHeight: 480,
            entryHeight: 28,
            buttonheight: 60
            
        },
    },
    init(){
        this.state.people = [];
        this.state.foods = [];
        this.state.structures = [];
        taskManager.tasks = [];

        this.state.ui = null;
        this.state.builderUI = null;
        this.state.selected = null;
        this.state.camera = { x: 0, y: 0 };
        this.state.time.dayTime = 0;
        this.state.time.dayCount = 0;
        this.state.time.worldSpeed = 1;
        this.state.metrics.deathToll = 0;

        noStroke();
        createCanvas(this.state.config.winWidth, this.state.config.winHeight + this.state.config.buttonheight)
        pixelDensity(1)

        for (let i = 0; i < 20; i++){
            this.addPerson(new Child(this.state.stats.child))
        }
        for (let i = 0; i < 30; i++){
            this.addPerson(new Adult(this.state.stats.adult))
        }
    },
    addPerson(person){
        this.state.people.push(person)
    },
    addFood(food){
        this.state.foods.push(food)
    },
    addStructure(structure){
        this.state.structures.push(structure)
    },
    addTask(task){
        taskManager.add(task)
    },
    update(delta = 1){
        const time = this.state.time

        taskManager.removeFinished()
        this.state.unemployed = this.state.people.filter((c) => c.type === "adult" && c.job === null);
        collisionCheck(this.state.people);

        if (frameCount % (120 / time.worldSpeed) === 0) {
            rotUpdate();
        }

        if (frameCount % (40 / time.worldSpeed) === 0) {
            for (let i = 0; i < 2; i++) {
                const carrot = new Carrot(this.state.stats.carrot);
                this.state.foods.push(carrot);
            }
        }

        time.dayTime += time.worldSpeed
        if (time.dayTime >= time.dayLength) {
            time.dayTime = 0;
            time.dayCount++;

            if (time.dayCount % time.yearLength === 0) {
                grow();
            }
        }

        const foodGrid = createGrid(this.state.foods, 50)

        for (let s of this.state.structures) {
            s.update();
        }

        for (let f of this.state.foods) {
        f.update();
        }

        for (let p of this.state.people) {
        p.update(foodGrid);
        }
        death();
        if (frameCount % (20/time.worldSpeed) === 0){
            updateReproductionTasks();
        }
    },
    render(){
        background(51);
        const time = this.state.time;
        const t = getDayTimeFloat();

        push();
        translate(-this.state.camera.x, -this.state.camera.y);

        for (let s of this.state.structures) s.render();
        for (let f of this.state.foods) f.render();
        for (let p of this.state.people) p.render();

        pop();

        this.renderLightingOverlay(t);
        this.hud();


        if (this.state.ui) {
            this.state.ui.render();
        }

        if (this.state.builderUI && this.state.builderUI.placing && mouseY < this.state.config.winHeight) {
        let config = this.state.builderUI.selected;

        let snappedX = round((mouseX - config.width / 2 + this.state.camera.x) / config.width) * config.width;
        let snappedY = round((mouseY - config.height / 2 + this.state.camera.y) / config.height) * config.height;
        let occupied = this.state.structures.find((c) => snappedX === c.x && snappedY === c.y);

        push();
        if (occupied) {
            fill(225, 0, 0, 60);
        } else {
            fill(...config.color, 90);
        }
        noStroke();
        rect(
            snappedX - this.state.camera.x,
            snappedY - this.state.camera.y,
            config.width,
            config.height
        );
        pop();
        }

        
    },
    hud(){
        const y = this.state.config.winHeight + this.state.config.buttonheight / 2;
        textStyle(BOLD)
        textSize(13);
        textAlign(CENTER, CENTER);
        noStroke();


        fill(130, 120, 62);
        rect(0, this.state.config.winHeight, 100, this.state.config.buttonheight);
        fill(210);
        text("Hunger Bar", 50, y);


        fill(90, 20, 20);
        rect(100, this.state.config.winHeight, 100, this.state.config.buttonheight);
        fill(210);
        text(`Speed ${game.state.time.worldSpeed}x`, 150, y);


        fill(90, 30, 120);
        rect(200, this.state.config.winHeight, 100, this.state.config.buttonheight);
        fill(210);
        text("Build Menu", 250, y);


        fill(20);
        rect(300, this.state.config.winHeight, this.state.config.winWidth - 300, this.state.config.buttonheight);
        fill(210);
        textAlign(RIGHT, CENTER);
        text(`Population: ${this.state.people.length}`, this.state.config.winWidth - 20, y);
    },
        
    renderLightingOverlay(t) {
        let noonLight = color(255, 255, 255, 0);
        let sunsetLight = color(220, 100, 80, 50);
        let sunriseLight = color(255, 200, 150, 40); 
        let nightLight = color(30, 40, 90, 100); 
        let overlayColor;

        if (t < 0.25) {
            let amt = map(t, 0.0, 0.25, 0, 1);
            overlayColor = lerpColor(sunriseLight, noonLight, amt);
        } else if (t < 0.5) {
            let amt = map(t, 0.25, 0.5, 0, 1);
            overlayColor = lerpColor(noonLight, sunsetLight, amt);
        } else if (t < 0.75) {
            let amt = map(t, 0.5, 0.75, 0, 1);
            overlayColor = lerpColor(sunsetLight, nightLight, amt);
        } else {
            let amt = map(t, 0.75, 1.0, 0, 1);
            overlayColor = lerpColor(nightLight, sunriseLight, amt);
        }

        blendMode(SOFT_LIGHT);
        fill(overlayColor);
        noStroke();
        rect(0, 0, this.state.config.winWidth, this.state.config.winHeight);
        blendMode(BLEND);
    }
}
