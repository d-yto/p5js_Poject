

function setup() {
    let canvas = createCanvas(winWidth, winHeight);
    pixelDensity(1);
    for(let i =0; i<8;i++){

        data.kids.push(new child());
    }
    for(let i =0; i<6;i++){

        data.adults.push(new adult());
    }
}
function draw() {
    background(51);
    const people = [...data.kids, ...data.adults]
    collisionCheck(people)
    if (frameCount%100 === 0){
        data.foods.push(new food(...foodTypes.carrot))
    }
    eat(people)
    const all = [...data.kids, ...data.adults, ...data.foods]
    for (let i of all){
        i.update();
    }
}