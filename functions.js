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

function createChild(){
    circle(childX,childY, 12)
    fill(17,100,30)
    

    if(stride <=0){
        direction = randomDirection()
        stride = floor(random(10,30))
    }
    
    childX += direction.x*data.createStats.child.Vel
    childY += direction.y*data.createStats.child.Vel
    stride--;

    if(childX > 400){
        direction.x *=-1
        childX = 400
    } else if(childX<0){
        direction.x *=-1
        childX = 0
    }
    if(childY > 400){
        direction.y *=-1
        childY = 400
    } else if(childY<0){
        direction.y *=-1
        childY = 0
    }
}

