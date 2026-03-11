

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
    const people = [...data.kids, ...data.adults]
    for (let i of people){
        i.update();
    }
    collisionCheck(people)

}