

function setup() {
    let canvas = createCanvas(winWidth, winHeight);
    for(let i =0; i<20;i++){

        data.kids.push(new child());
    }
}
function draw() {
    background(51);
    for (let i of data.kids){
        i.update();
    }
}