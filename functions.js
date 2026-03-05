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
function isColliding(object1, object2) {
    let dx = (object1.x + object1.size/2) - (object2.x + object2.size/2);
    let dy = (object1.y + object1.size/2) - (object2.y + object2.size/2);
    let distanceSq = dx * dx + dy * dy;
    let nx = sqrt(distanceSq/dx)
    let ny = sqrt(distanceSq/dy)
    let radiusSum = (object1.size / 2) + (object2.size / 2);
    if (distanceSq < (radiusSum * radiusSum)){
        return true
    }
}

function touchingBoundary(obj){
    if(obj.x >400){
        obj.direction.x *=-1
        obj.x = 400
    } else if(obj.x <0){
        obj.direction.x *=-1
        obj.x = 0
    }
    if(obj.y >400){
        obj.direction.y *=-1
       obj.y = 400
    } else if(obj.y<0){
        obj.direction.y *=-1
        obj.y = 0
    }
}

function kidCollision(i,j){
    let dotproductI = dotproduct(i)
    let dotproductJ = dotproduct(j)
    let reflectXforI = i.direction.x * dotproductI 
    let reflectYforI = i.direction.y * dotproductI 

    let reflectXforJ = i.direction.x * dotproductI 
    let reflectYforJ = i.direction.y * dotproductI 
}

function dotproduct(i){
i.direction.x * isColliding.nx + i.direction.y * isColliding.ny
}