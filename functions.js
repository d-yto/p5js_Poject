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

function touchingBoundary(obj){
    if(obj.x >400){
        obj.direction.x *=-1
        obj.x = 400
    } else if(obj.x <0){
        obj.direction.x *=-1
        obj.x= 0
    }
    if(obj.y >400){
        obj.direction.y *=-1
       obj.y = 400
    } else if(obj.y<0){
        obj.direction.y *=-1
        obj.y = 0
    }
}

function kidCollision(){
    
}