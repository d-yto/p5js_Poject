

function setup() {
    let canvas = createCanvas(winWidth, winHeight+buttonheight);
    pixelDensity(1);
    for(let i =0; i<8;i++){

        data.people.push(new entity(stats.child));
    }
    for(let i =0; i<6;i++){

        data.people.push(new entity(stats.adult));
    }
}


function draw() {
    
    background(51);
    collisionCheck(data.people)
    
    if (frameCount%(80/worldSpeed) === 0){
        data.foods.push(new food(stats.carrot))
    }
    
    if (frameCount %(1800/worldSpeed) === 0){
        for (let i of data.people){
            grow(i)
        }
    }
    
    const foodGrid = createGrid(data.foods, 50)
    eat(data.people,foodGrid)
    const all = [...data.people, ...data.foods]
    
    for (let i of all){
        i.update(foodGrid);
        if (i.repRate>0)i.repRate--;;
    }
    death()
    getFreaky()
    
    document.getElementById('deaths').textContent = `Deaths: ${deathToll}`;

    fill(130,120,62)
    rect(0,winHeight, 100, buttonheight,)

    fill(90,20,20)
    rect(100,winHeight, 100, buttonheight,)

    fill (20)
    rect(200, winHeight,winWidth-200,buttonheight)
}

