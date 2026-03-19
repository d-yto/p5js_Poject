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
    
    
    
    let e = 0.8
    let j = -(1+e) * velAlongNorm / invMass
    
    v1x += (j * nx) / m1
    v1y += (j * ny) / m1
    v2x -= (j * nx) / m2
    v2y -= (j * ny) / m2
    
    object1.vel = Math.sqrt(v1x * v1x + v1y * v1y)
    if (object1.vel > 0) {
        object1.direction.x = v1x / object1.vel
        object1.direction.y = v1y / object1.vel
    }
    
    object2.vel = Math.sqrt(v2x * v2x + v2y * v2y)
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
    /*  */
    let recoverySpeed = 0.003
    obj.vel += (obj.targetVel - obj.vel)*recoverySpeed



}

function updateHunger(i){
    if (frameCount % 120 === 0){
        i.hunger -= i.hungerRate
    }
    if (i.hunger>100)i.hunger = i.maxHunger

}
function death(){
    data.people = data.people.filter(p => p.hunger > 0)
    let old = data.people.filter(p => p.age>90)
    for(i of old){
        let odds = (i.age*4)-350
        let roll = getRandomIntInclusive(1,100)
        i.dead = Boolean(roll<odds)
    }
    data.people = data.people.filter(p => p.dead === false)
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
    /* Sample two perlin noise values based on the entity's position & the current time.*/
    /* noisescale controls how zoomed in this noise map is-- the smaller the value, the smoother movements will be. */
    /* nt advances the noise over time so the field slowly shifts. This avoids repeated movements.*/
    let noiseScale = 0.001;
    let nt = 0.005 * frameCount;

    /* for both x & y, uses noise() to map a force in the positive or negative direction. since noise() returns a value from 0 - 1, we remap it to -1 - 1 so the force can be in any direction*/
    /* noiseOffset is unique per entity to avoid entity's moving in sync */
    let nx = noise(noiseScale * i.x + i.noiseOffset, nt) * 2 - 1;
    let ny = noise(noiseScale * i.y + i.noiseOffset + 1000, nt) * 2 - 1;

    /* gets the length of the noise vector so we can later normalize it. */
    /* if the length of the noise vector is 0, we bail out early to avoid inevitable error from dividing by 0 */
    let len = sqrt(nx * nx + ny * ny);
    if (len === 0) return;
    
    /* Looks around for the nearest food item within the search radius. If a nearest food within the search radius exists, it blends the direction to food with the noise force.*/
    let target = nearestFood(i)
    let p = i.partner
    if(p){
        let px = p.x - i.x
        let py = p.y - i.y
        let pLenSq = (px*px) + (py*py)
        if(pLenSq > 0){
            let pLen = sqrt(pLenSq)
            nx = (nx * 0.1) + (px / pLen * 0.9);
            ny = (ny * 0.1) + (py / pLen * 0.9);
        }
    }else if(target){
        let tx = target.x - i.x
        let ty = target.y - i.y
        let tLenSq =(tx*tx)+(ty*ty)
        if (tLenSq>0){
            let tLen = Math.sqrt(tLenSq)
            /* 30% noise wandering 70% pull toward food. Adjusting these two values changes how directy entity's will make their way to the food.*/
            nx = (nx * 0.35) + (tx / tLen * 0.65);
            ny = (ny * 0.35) + (ty / tLen * 0.65);
        } 
    }
    

    /* Pushes entities away from the edges of the canvas. */
    /* boundMargin is how far away the repulsion from the edge starts. */
    /* repulse is the strength at which the wall pushes back.  */
    /* the closer the entity is to the wall (the further they are in the margin), the stronger the push.  */
    let boundMargin = 120
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

    /* steerstrength dictates how quickly entitys turn towards the target direction. */
    /* after a collision, steerforce is reduced by a factor of 10 to allow for the collision to play out before noise starts pulling the entity back onto course.
    After 1/3 seconds, normal steering resumes. */
    let steerStrength = i.collisionCooldown > 0 ? 0.004 : 0.04;
    if (i.collisionCooldown > 0) i.collisionCooldown--;

    /* gradually nudge entity dirction towards the comined noise, food, and boundary force. */
    /* linear interpolation rather than snappping immediately to the new direction.
    It being a lerp means it moves a small fraction of the way there each time, giving a more smooth transition. */
    i.direction.x += (nx / len - i.direction.x) * steerStrength;
    i.direction.y += (ny / len - i.direction.y) * steerStrength;


    /* finally normalizes direction back into a unit vector with a length of exactly 1. 
    Steering can stretch or shrink this, so to be safe we correct that here, letting speed stay consistent. 
    Vel is what controls speed, direction should just point. if directions length is greater than or less than 1 it will affect speed.*/
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

function grow(i){
    if(frameCount%3600 === 0){
        i.age++;
        console.log(`Age update!`)
        if(i.age ===18 && i.type === "kid"){
            let a = stats.adult
            i.vel = getRandomNumInclusive(a.velMin, a.velMax)
            i.age = 18
            i.str = a.str
            i.store = a.store
            i.size = a.size
            i.type = a.type
            i.maxHunger = a.maxHunger
            i.hungerRate = a.hungerRate
            i.color = a.color
            i.repRate = getRandomIntInclusive(a.repRateMin,a.repRateMax)

        }
    }
}

function keyReleased(){

    if (key==='q'){
        console.log(`current hunger`)
        console.log(`-----------------`);
        let adultTop = -Infinity
        let adultBottom = Infinity
        let adultAvg = 0
        let kidTop = -Infinity
        let kidBottom = Infinity
        let kidAvg = 0
        
        for (let i of data.people.filter( i => i.type === "adult")){
            if(i.hunger>adultTop) adultTop = i.hunger
            if (i.hunger<adultBottom)adultBottom = i.hunger
            adultAvg += i.hunger
        }
        adultAvg/=data.people.filter( i => i.type === "adult").length
        console.log(`Highest adult hunger: ${adultTop}`)
        console.log(`Average adult hunger: ${adultAvg}`)
        console.log(`Lowest adult hunger: ${adultBottom}
            `)

        for (let i of data.people.filter( i => i.type === "kid")){
            if(i.hunger>kidTop) kidTop = i.hunger
            if (i.hunger<kidBottom) kidBottom = i.hunger
            kidAvg += i.hunger
        }
        kidAvg /= data.people.filter(i=> i.type === "kid").length
        console.log(`Highest child hunger: ${kidTop}`)
        console.log(`Average child hunger: ${kidAvg}`)
        console.log(`Lowest child hunger: ${kidBottom}`)
    }
}

function getRandomIntInclusive(min, max){
    return Math.floor(Math.random()*(max - min + 1))+min
}
function getRandomNumInclusive(min, max){
    return Math.random()*(max - min + 1)+min
}

function getFreaky() {
    const cellsize = 50;
    const applicable = data.people.filter(i => i.age>17&& i.hunger>=(i.maxHunger*0.7)&&i.repRate === 0)
    const grid = createGrid(applicable, cellsize);
    const checked = new Set();
    for (let i of data.people) {
        /* Reset search stats for this specific person */
        let nearest = null;
        let nearestDistSq = Infinity;

        let cellX = Math.floor((i.x + i.size / 2) / cellsize);
        let cellY = Math.floor((i.y + i.size / 2) / cellsize);
        /* grid check */
        for (let ox=-1;ox <= 1; ox++){
            for(let oy = -1; oy <= 1; oy++){
                let key = `${cellX+ox},${cellY+oy}`
                if(!grid.has(key)) continue;
                for (let e of grid.get(key)){
                    if(e === i) continue;
                    let pairKey = i.ID < e.ID ? `${i.ID},${e.ID}` : `${e.ID},${i.ID}`;
                    if(checked.has(pairKey))continue;
                    checked.add(pairKey)

                    let dx = (i.x + i.size/2) - (e.x + e.size/2)
                    let dy = (i.y + i.size/2) - (e.y + e.size/2)
                    let distanceSq = (dx * dx) + (dy * dy)
                    

                    if (distanceSq<nearestDistSq){
                        nearest = e
                        nearestDistSq = distanceSq
                    }
                } 
            }
            if (nearest){
                i.partner = nearest
            }
        }
    }
}


    /* Final pass to convert squared distance to actual distance */

    /* I now want this to go to one another then call birth() */


function birth(){
    let roll = getRandomIntInclusive(1,3)
    
    if (roll === 1){
        /* Inherit from parent 1 */
        data.people.push(new entity(...entityType.child))

    }
    if (roll === 2){
        /* Inherit from parent 2 */

    }
    if (roll ===3){
        /* Inherit an average of both parents, while having a % range for mutation up and down */
    }
}