function randomDirection() {
    // Generate a random angle in radians (0 to 2*PI)
    const angle = Math.random() * Math.PI * 2; //
    
    // Calculate the x and y components of the direction vector
    const directionX = Math.cos(angle);
    const directionY = Math.sin(angle);
    
    // The resulting vector (directionX, directionY) is a "unit vector"
    // (its length/magnitude is exactly 1), which is useful for consistent movement speed.
    return { x: directionX, y: directionY };
}
function isColliding(object1, object2){
    let distanceX = object1.x -object2.x;
    let distanceY = object1.y -object2.y;
    let distance = Math.sqrt(distanceX^2 + distanceY^2)
    return distance < (object1.size + object2.size);
}

function touchingBoundary(objectX, objectY, directionX, directionY){
    if(objectX >400){
        directionX *=-1
        objectX = 400
    } else if(objectX<0){
        directionX *=-1
        objectX = 0
    }
    if(objectY >400){
        directionY *=-1
        objectY = 400
    } else if(objectY<0){
        directionY *=-1
        objectY = 0
    }
}

function kidCollision(){
    
}