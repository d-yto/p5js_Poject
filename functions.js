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
    let radiusSum = (object1.size / 2) + (object2.size / 2);
    if (distanceSq < (radiusSum * radiusSum)){
        return true
    }
}

function touchingBoundary(obj){
    if(obj.x >winWidth){
        obj.direction.x *=-1
        obj.x = winWidth
    } else if(obj.x <0){
        obj.direction.x *=-1
        obj.x = 0
    }
    if(obj.y >winHeight){
        obj.direction.y *=-1
       obj.y = winHeight
    } else if(obj.y<0){
        obj.direction.y *=-1
        obj.y = 0
    }
}

function kidCollision(object1,object2){
    let dx = (object1.x + object1.size/2) - (object2.x + object2.size/2);
    let dy = (object1.y + object1.size/2) - (object2.y + object2.size/2);
    let distanceSq = dx * dx + dy * dy;
    let distance  = Math.sqrt(distanceSq)
    
    if (distance === 0)return

    let nx = dx/distance
    let ny = dy/distance

    
    let overlap = (object1.size/2 + object2.size/2) - distance
    object1.x += nx * (overlap / 2)
    object1.y += ny * (overlap / 2)
    object2.x -= nx * (overlap / 2)
    object2.y -= ny * (overlap / 2)
    
    let dotproduct1 = (object1.direction.x * nx) +(object1.direction.y * ny)
    let dotproduct2 = (object2.direction.x * nx) +(object2.direction.y * ny)

    object1.direction.x -= 2*dotproduct1 *nx
    object1.direction.y -= 2*dotproduct1 *ny

    object2.direction.x -= 2*dotproduct2 *nx
    object2.direction.y -= 2*dotproduct2 *ny


}

function kidMovement(obj){
    if(obj.stride<=0){
            obj.direction = randomDirection()
            obj.stride = floor(random(1,200))

        }
            obj.x += obj.direction.x*obj.vel
            obj.y += obj.direction.y*obj.vel
            obj.stride--;


}