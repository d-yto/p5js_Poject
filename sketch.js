

function setup() {
    let canvas = createCanvas(winWidth, winHeight);
    pixelDensity(1);
    for(let i =0; i<8;i++){

        data.kids.push(new entity(...entityType.child));
    }
    for(let i =0; i<6;i++){

        data.adults.push(new entity(...entityType.adult));
    }
}
function draw() {
    background(51);
    const people = [...data.kids, ...data.adults]
    collisionCheck(people)
    if (frameCount%18 === 0){
        data.foods.push(new food(...foodTypes.carrot))
    }
    for(let i =0; i<people.length;i++){
        if (frameCount%500 === 0){

            console.log(`${people[i].type} Hunger:${people[i].hunger}`)
        }
    }
        eat(people)
        const all = [...data.kids, ...data.adults, ...data.foods]
    for (let i of all){
        i.update();
    }
}