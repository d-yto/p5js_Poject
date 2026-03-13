function createGrid(people,cellsize){
    let grid = new Map()
    
    for(let i of people){
        let cellX = Math.floor((i.x + i.size / 2)/cellsize)
        let cellY = Math.floor((i.y + i.size / 2)/cellsize)
        let key = `${cellX},${cellY}`
        if (!grid.has(key)){
            grid.set(key,[])
        }
        grid.get(key).push(i)
    }
    return grid
}

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
    let s = (obj.size/2)
    if(obj.x >winWidth - s){
        obj.direction.x *=-1
        obj.x = winWidth - s
    } else if(obj.x <0+s){
        obj.direction.x *=-1
        obj.x = 0 +s
    }
    if(obj.y >winHeight-s){
        obj.direction.y *=-1
       obj.y = winHeight - s
    } else if(obj.y<0+s){  
        obj.direction.y *=-1
        obj.y = 0+s
    }
}

function handleCollision(object1,object2){
    let dx = (object1.x + object1.size/2) - (object2.x + object2.size/2);
    let dy = (object1.y + object1.size/2) - (object2.y + object2.size/2);
    let distanceSq = dx * dx + dy * dy;
    let distance  = Math.sqrt(distanceSq)
    
    if (distance === 0)return

    let nx = dx/distance
    let ny = dy/distance

    let relVelX = object1.direction.x - object2.direction.x
    let relVelY = object1.direction.y - object2.direction.y
    let velAlongNorm = (relVelX*nx) + (relVelY*ny)
    if (velAlongNorm > 0) return;
    
    let m1 = object1.size
    let m2 = object2.size
    let invM1 = 1 / m1
    let invM2 = 1 / m2
    let invMass = invM1 + invM2 
    


    let e = 1
    let j = -(1+e) * velAlongNorm / invMass

    object1.direction.x += (j * nx) / m1
    object1.direction.y += (j * ny) / m1
    object2.direction.x -= (j * nx) / m2
    object2.direction.y -= (j * ny) / m2
    
    let overlap = (m1/2 + m2/2) - distance
    object1.x += nx * (overlap * invM1 / invMass)
    object1.y += ny * (overlap * invM1 / invMass)
    object2.x -= nx * (overlap * invM2 / invMass)
    object2.y -= ny * (overlap * invM2 / invMass)
}


function collisionCheck(people){
    const cellsize = 50
    const grid = createGrid(people, cellsize)
    const checked = new Set()

    for(let i of people){
            let cellX = Math.floor((i.x + i.size / 2)/cellsize)
            let cellY = Math.floor((i.y + i.size / 2)/cellsize)
            
                for (let ox=-1;ox <= 1; ox++){
                    for(let oy = -1; oy <= 1; oy++){
                        let key = `${cellX+ox},${cellY+oy}`
                        if(!grid.has(key)) continue;

                        for (let e of grid.get(key)){
                            if(e === i) continue;
                            let pairKey = i.ID < e.ID ? `${i.ID},${e.ID}` : `${e.ID},${i.ID}`;
                            if(checked.has(pairKey))continue;
                            checked.add(pairKey)
                            if(isColliding(i, e)){
                                handleCollision(i, e)
                            } 
                        } 
                        
                    }
                }
            }
}

function movement(obj){
    if(obj.stride<=0){
            obj.direction = randomDirection()
            obj.stride = floor(random(0,stride))

        }
            obj.x += obj.direction.x
            obj.y += obj.direction.y
            obj.stride--;


}

function updateHunger(i){
    if (frameCount % 120 === 0){
        i.hunger -= i.hungerRate
        console.log(`${i.ID} Hunger: ${i.hunger}`)
        return i.hunger
    }
    if (i.hunger<=0)death(i)
        if (i.hunger>100)i.hunger = i.maxHunger

}
function death(i){
    if (i.type=== "kid"){
        let kidIndex = data.kids.indexOf(i) 
        data.kids.splice(kidIndex,1)

    }
    if (i.type==="adult"){
        let adultIndex = data.adults.indexOf(i)
        data.adults.splice(adultIndex,1)

    }
         
}

function rotUpdate(i){
    if (frameCount % 120 === 0){
        i.rotTime -= i.rotRate
        console.log(`Rot Duration: ${i.rotTime}`)
        return i.rotTime
    }
    if (i.rotTime <= 0) rotAway(i)
}

function rotAway(i){
    if(i.rotTime <= 0){
        let foodIndex = data.foods.indexOf(i)
        data.foods.splice(foodIndex,1)
    }
}

function eat(people){
    const cellsize = 50
    const grid = createGrid(data.foods, cellsize)
    
    for(let i of people){
        let cellX = Math.floor((i.x + i.size / 2)/cellsize)
        let cellY = Math.floor((i.y + i.size / 2)/cellsize)

        for (let ox=-1;ox <= 1; ox++){
            for(let oy = -1; oy <= 1; oy++){
                let key = `${cellX+ox},${cellY+oy}`
                if(!grid.has(key)) continue;
                for (let foodItem of grid.get(key)){
                    if (isColliding(i,foodItem)){
                        eatFood(i,foodItem)
                    }
                } 
                
            }
        }
    }
}

function eatFood(person, foodItem){
    let foodIndex = data.foods.indexOf(foodItem)
    data.foods.splice(food, 1)
    person.hunger += foodItem.hunger
}