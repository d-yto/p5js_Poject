

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

    for (let i = data.kids.length - 1; i >= 0; i--) {
        for (let j = i - 1; j >= 0; j--) {
            let kid1 = data.kids[i];
            let kid2 = data.kids[j];
  
            if (kid1 && kid2 && isColliding(kid1, kid2)) {
            kidCollision(kid1, kid2);
            }
        }
    }

}