

function setup() {
    let canvas = createCanvas(winWidth, winHeight);
    pixelDensity(1);
    for(let i =0; i<8;i++){

        data.people.push(new entity(...entityType.child));
    }
    for(let i =0; i<6;i++){

        data.people.push(new entity(...entityType.adult));
    }
}
function draw() {
    background(51);
    collisionCheck(data.people)
    if (frameCount%180 === 0){
        data.foods.push(new food(...foodTypes.carrot))
    }
        eat(data.people)
        const all = [...data.people, ...data.foods]
    for (let i of all){
        i.update();
    }
    death()
}

