

function setup() {
    let canvas = createCanvas(winWidth, winHeight);
    for(let i =0; i<8;i++){

        data.kids.push(new child());
    }
    for(let i =0; i<6;i++){

        data.adults.push(new adult());
    }
}
function draw() {
    background(51);
    const all = [...data.kids, ...data.adults, ...data.foods]
    const people = [...data.kids, ...data.adults]
    for (let i of all){
        i.update();
    }
    collisionCheck(people)
    if (frameCount%200 === 0){
        data.foods.push(new food(...foodTypes.carrot))
    }
    eat(people, data.foods)
}