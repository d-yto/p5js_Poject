

function setup() {
    let canvas = createCanvas(winWidth, winHeight+buttonheight);
    pixelDensity(1);
    for(let i =0; i<50;i++){

        data.people.push(new Child(stats.child));
    }
    for(let i =0; i<50;i++){

        data.people.push(new Adult(stats.adult));
    }
}


function draw() {
    background(51);

    push();
    translate(-camX, -camY)



    collisionCheck(data.people)
    if (frameCount % (120/worldSpeed) === 0){
        rotUpdate()
        updateHunger()

    }
    if (frameCount%(20/worldSpeed) === 0){
        for(let i = 0; i<4; i++)data.foods.push(new Carrot(stats.carrot))
    }
    
    if (frameCount %(300/worldSpeed) === 0){
            grow()
    }
    
    const foodGrid = createGrid(data.foods, 50)
    eat()
    const all = [...data.structures, ...data.people, ...data.foods]
    
    for (let p of all){
        p.update(foodGrid)
    }
    death()
    getFreaky()
    
    pop();
    unemployed = data.people.filter(c => c.type === 'adult' && c.job === null)
    
    openUi()
    scrollOffset = lerp(scrollOffset, scrollTarget, 0.15)
    fill(130,120,62)
    rect(0,winHeight, 100, buttonheight,)

    fill(90,20,20)
    rect(100,winHeight, 100, buttonheight,)

    fill (20)
    rect(200, winHeight,winWidth-200,buttonheight)
    fill(255)
    text(data.people.length,400,winHeight)
}

