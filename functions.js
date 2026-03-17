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

    let v1x = object1.direction.x* object1.vel
    let v1y = object1.direction.y* object1.vel
    
    let v2x = object2.direction.x* object2.vel
    let v2y = object2.direction.y* object2.vel
    
    let relVelX = v1x - v2x
    let relVelY = v1y - v2y
    let velAlongNorm = (relVelX*nx) + (relVelY*ny)
    if (velAlongNorm > 0) return;
    
    let m1 = object1.size
    let m2 = object2.size
    let invM1 = 1 / m1
    let invM2 = 1 / m2
    let invMass = invM1 + invM2 
    


    let e = 1
    let j = -(1+e) * velAlongNorm / invMass

    v1x += (j * nx) / m1
    v1y += (j * ny) / m1
    v2x -= (j * nx) / m2
    v2y -= (j * ny) / m2
    
    object1.vel = sqrt(v1x * v1x + v1y * v1y)
    if (object1.vel > 0) {
        object1.direction.x = v1x / object1.vel
        object1.direction.y = v1y / object1.vel
    }

    object2.vel = sqrt(v2x * v2x + v2y * v2y)
    if (object2.vel > 0) {
        object2.direction.x = v2x / object2.vel
        object2.direction.y = v2y / object2.vel
    }

    let overlap = (m1/2 + m2/2) - distance
    object1.x += nx * (overlap * invM1 / invMass)
    object1.y += ny * (overlap * invM1 / invMass)
    object2.x -= nx * (overlap * invM2 / invMass)
    object2.y -= ny * (overlap * invM2 / invMass)

    object1.collisionCooldown = 20
    object2.collisionCooldown = 20
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
    

            mapNoise(obj)

            obj.x += obj.direction.x * obj.vel
            obj.y += obj.direction.y * obj.vel


}

function updateHunger(i){
    if (frameCount % 120 === 0){
        i.hunger -= i.hungerRate
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
    data.foods.splice(foodIndex, 1)
    if (person.hunger <person.maxHunger){
        person.hunger += foodItem.hunger

    }
    if(person.hunger>= person.maxHunger){
        person.hunger = person.maxHunger
    }

}

function mapNoise(i){
    let noiseScale = 0.001;
    let nt = 0.005 * frameCount;

    let nx = noise(noiseScale * i.x + i.noiseOffset, nt) * 2 - 1;
    let ny = noise(noiseScale * i.y + i.noiseOffset + 1000, nt) * 2 - 1;

    let len = sqrt(nx * nx + ny * ny);
    if (len === 0) return;
    
    let target = nearestFood(i)
    if(target){
        let tx = target.x - i.x
        let ty = target.y - i.y

        let tLenSq =(tx*tx)+(ty*ty)
        if (tLenSq>0){
            let tLen = Math.sqrt(tLenSq)
            nx = (nx * 0.3) + (tx / tLen * 0.7);
            ny = (ny * 0.3) + (ty / tLen * 0.7);
        } 
    }



    let boundMargin = 1200
    let repulse = 0.5
    if(i.x<boundMargin){
        nx += repulse *(1-(i.x/boundMargin))
    }
    if(i.x>(winWidth-boundMargin)){
        nx -= repulse *(1-((winWidth-i.x)/boundMargin))
    }
    if(i.y<boundMargin){
        ny += repulse * (1-(i.y/boundMargin))
    }
    if (i.y>(winHeight-boundMargin)){
        ny -= repulse * (1-((winHeight-i.y)/boundMargin))
    }

    let steerStrength = i.collisionCooldown > 0 ? 0.005 : 0.05;
    if (i.collisionCooldown > 0) i.collisionCooldown--;

    i.direction.x += (nx / len - i.direction.x) * steerStrength;
    i.direction.y += (ny / len - i.direction.y) * steerStrength;



    let dLen = sqrt(i.direction.x * i.direction.x + i.direction.y * i.direction.y);
    if (dLen === 0) return;
    i.direction.x /= dLen;
    i.direction.y /= dLen;
}

function nearestFood(i){
    const cellsize = 50
    const grid = createGrid(data.foods, cellsize)
    let nearest = null
    let nearestDist = Infinity

    let cellX = Math.floor((i.x + i.size / 2)/cellsize)
        let cellY = Math.floor((i.y + i.size / 2)/cellsize)

        for (let ox=-2;ox <= 2; ox++){
            for(let oy = -2; oy <= 2; oy++){
                let key = `${cellX+ox},${cellY+oy}`
                if(!grid.has(key)) continue;
                for (let foodItem of grid.get(key)){
                    let dx = (i.x + i.size/2) - (foodItem.x + foodItem.size/2)
                    let dy = (i.y + i.size/2) - (foodItem.y + foodItem.size/2)
                    let distanceSq = (dx * dx) + (dy * dy)
                    

                    if (distanceSq<nearestDist){
                        nearest = foodItem
                        nearestDist = distanceSq
                    }
                }
                
            }
        }
        if (nearest){
            nearest.dist = Math.sqrt(nearestDist)
        }
        return nearest
}