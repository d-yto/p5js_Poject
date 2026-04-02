
function createGrid(people,cellsize){
    /* Creates a grid */
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
    /* Checks if two circles are colliding. */
    let dx = (object1.x + object1.size/2) - (object2.x + object2.size/2);
    let dy = (object1.y + object1.size/2) - (object2.y + object2.size/2);
    let distanceSq = dx * dx + dy * dy;
    let radiusSum = (object1.size / 2) + (object2.size / 2);
    if (distanceSq < (radiusSum * radiusSum)){
        return true
    }
}

function touchingBoundary(obj){
    /* If touching boundary, reflects velocity perpendicular to the surface. */
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
    /* Circle on circle collision physics. THIS TOOK SO LONG TO DO */
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
    /* checks for people near one another then sends that to check if they are colliding */
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

function movement(obj,foodGrid){
    /* applies direction and velocity (which is technically magnitude)
    nudges entities velocity closer to their normal velocity after a collision */
    mapNoise(obj,foodGrid)
    obj.x += obj.direction.x * obj.vel * worldSpeed
    obj.y += obj.direction.y * obj.vel * worldSpeed
    /*  */
    let recoverySpeed = 0.003
    obj.vel += (obj.targetVel - obj.vel)*recoverySpeed * worldSpeed



}

function updateHunger(i){
    /* Updates hunger of entity based off their hungerRate */
    if (frameCount % (120/worldSpeed) === 0){
        i.hunger -= i.hungerRate
    }
    if (i.hunger>i.maxHunger)i.hunger = i.maxHunger

}
function death(){
    /* removes people if they are appliciable to die */
    let before = data.people.length
    data.people = data.people.filter(p => p.hunger > 0)
    let old = data.people.filter(p => p.age>90)
    for(let i of old){
        let odds = (i.age*4)-350
        let roll = getRandomIntInclusive(1,100)
        i.dead = Boolean(roll<odds)
    }
    data.people = data.people.filter(p => p.dead === false)
    deathToll +=(before - data.people.length)
}

function rotUpdate(i){
    /* updates how rotted the food is */
    if (frameCount % (120/worldSpeed) === 0){
        i.rotTime -= i.rotRate
    }
    if (i.rotTime <= 0) rotAway(i)
}

function rotAway(i){
    /* Removes food if its been out for too long and rotted. */
    if(i.rotTime <= 0){
        let foodIndex = data.foods.indexOf(i)
        data.foods.splice(foodIndex,1)
    }
}

function eat(people, grid){
    /* checks which entities are eating. */
    const cellsize = 50
    
    for(let i of people){
        let cellX = Math.floor((i.x + i.size / 2)/cellsize)
        let cellY = Math.floor((i.y + i.size / 2)/cellsize)

        for (let ox = -1; ox <= 1; ox++){
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
    /* handles food being eaten. inputs the entity and the foodItem it eats,
    then adds that foodItems hunger to the entities hunger */
    let foodIndex = data.foods.indexOf(foodItem)
    if (foodIndex === -1) return //means already eaten
    data.foods.splice(foodIndex, 1)
    person.hunger = Math.min(person.hunger+=foodItem.hunger, person.maxHunger)

}

function sampleNoise(i){
    /* samples perlin noise to make entity movement look more organic */
    let noiseScale = 0.001;
    let nt = 0.005 * frameCount;
    let nx = noise(noiseScale * i.x + i.noiseOffset, nt) * 2 - 1;
    let ny = noise(noiseScale * i.y + i.noiseOffset + 1000, nt) * 2 - 1;
    let len = sqrt(nx * nx + ny * ny);
    if (len === 0) return;

    return { nx, ny, len };
}

function blendSeekTargets(i,nx,ny,foodGrid){
    /* blends the perlin noise with seeking a lover and seeking food. If there is a lover, the individual will not seek food. */
    let p = i.partner
    if(p){
        let px = p.x - i.x
        let py = p.y - i.y
        let pLenSq = (px*px) + (py*py)
        if(pLenSq <= i.size * i.size && i.ID < p.ID){
            birth(i, p);
            return null;
        }
        if(pLenSq > 0){
            let pLen = sqrt(pLenSq)
            nx = (nx * 0.3) + (px / pLen * 0.7);
            ny = (ny * 0.3) + (py / pLen * 0.7);
        }
    }else {
        let target = nearestFood(i,foodGrid)
        if(target){
            let tx = target.x - i.x
            let ty = target.y - i.y
            let tLenSq =(tx*tx)+(ty*ty)
            if (tLenSq>0){
                let tLen = Math.sqrt(tLenSq)
                /* 35% noise wandering 65% pull toward food. Adjusting these two values changes how directy entity's will make their way to the food.*/
                nx = (nx * 0.35) + (tx / tLen * 0.65);
                ny = (ny * 0.35) + (ty / tLen * 0.65);
            } 
        }
    }
    return { nx, ny };
}

function boundaryRepulsion(i , nx, ny){
    /* Pushes entities away from the edges of the canvas. */
    /* boundMargin is how far away the repulsion from the edge starts. */
    /* repulse is the strength at which the wall pushes back.  */
    /* the closer the entity is to the wall (the further they are in the margin), the stronger the push.  */
    let boundMargin = 120
    let repulse = 0.8
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
    return { nx, ny };
}

function applySteer(i, nx, ny, len){
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

function mapNoise(i,foodGrid){
    /* calls all the functions to move everyone around */
    let noise = sampleNoise(i);
    if (!noise) return;

    let blended = blendSeekTargets(i, noise.nx, noise.ny, foodGrid);
    if (!blended) return;

    let repelled = boundaryRepulsion(i, blended.nx, blended.ny);

    applySteer(i, repelled.nx, repelled.ny, noise.len);
}

function nearestFood(i, grid){
    /* checks nearby cells for food.
    If no food is in range, a null value is returned. */
    const cellsize = 50
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
    /* Function for when each year passes, to grow by 1 year.
    If i === 18 it transitions to being an adult */
    i.age++;
    if(i.age ===18 && i.type === "kid"){
        let a = stats.adult
        i.vel +=0.2
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

function keyReleased(){
    /* Current function is for dev side, will be removed from final product. 
    
    Keys will likely be used to initiate certain events or open specific menus.*/
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
    return Math.random()*(max - min )+min
}

function getFreaky() {
    /* Checks for other applicable entities to reproduce with.
    Must be >= 18, relatively full on hunger, and have a repRate of 0 to be applicable */
    const cellsize = 50;
    const applicable = data.people.filter(i => i.age>17&& i.hunger>=(i.maxHunger*0.7)&&i.repRate === 0 && i.partner === null)
    const grid = createGrid(applicable, cellsize);
    const checked = new Set();
    for (let i of applicable) {
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
        }
        if (nearest){
            i.partner = nearest
            nearest.partner = i
        }
    }
}

function birth(i,e){
    /* Called when parents meet, initializes the childs birth.
    Child inherits stats (currently only Vel) from one parent, or an average of both,
    dependent on its roll */
    let roll = getRandomIntInclusive(1,3)

    let child = new entity(stats.child)
    child.x = (i.x + e.x) / 2
    child.y = (i.y + e.y) / 2
    child.hunger = child.maxHunger*getRandomNumInclusive(0.5,0.7)
    data.people.push(child) 
    if (roll === 1){
        /* inherit from i */
        child.vel = i.vel-getRandomNumInclusive(0.1,0.33)
    }
    if(roll === 2){
        /* inherit from e */
        child.vel = e.vel-getRandomNumInclusive(0.1,0.33)
    }
    if(roll === 3){
        /* avg both parents, include minor mutations */
        child.vel = (i.vel+e.vel)/2 - getRandomNumInclusive(0.1,0.33)
    }

   
    i.hunger -=25
    e.hunger -=25
    i.repRate = getRandomIntInclusive(0,1000)
    e.repRate = getRandomIntInclusive(0,1000)
    i.partner = null
    e.partner = null
    i.children.push(child)
    e.children.push(child)
    console.log(`BIRTH`)
}

function hungerBar(i){
    /* Creates a hunger bar for each entity. 
    Gives user visual feedback on the ecosystem's overall health
    as the entity's hunger declines, the bar shrinks in size & changes color based on severity. */
    let barWidth = 20
    let barHeight = 3
    let bx = i.x - barWidth / 2
    let by = i.y - i.size / 2 - 6
    let decFill = (i.hunger / i.maxHunger)

    noStroke()
    fill(80, 80, 80)
    rect(bx, by, barWidth, barHeight)

    if(decFill<=0.2){
        fill(186, 26, 26)
    }
    else if(decFill<=0.6){
        fill(255,102,51)
    }
    else if(decFill>0.6){
        fill(102,204,51)
    }
    rect(bx, by, barWidth *decFill, barHeight)
}

function mouseClicked(){
    if(mouseX>0 && mouseX<100 && mouseY>winHeight && mouseY<winHeight+buttonheight){
        healthbar = !healthbar
        
    }
    if(mouseX>100 && mouseX<200 && mouseY>winHeight && mouseY<winHeight+buttonheight){
        
        if (worldSpeed ===1)worldSpeed*=5
        else if (worldSpeed ===5)worldSpeed/=5
        
    }
}

function giveChildrenFood(){
    /* Function for parents to give their children food. */

    /* In order to implement, I would need to:
    - Rework the eatFood() function to store excess.
    - Implement that if store is full, they will not seek food
    - Implement eating store food
    - Implement pathfinding to children to give them food
    - Add data to know from the child which parents they have so we can remove the child from their children list when the child becomes 18. */
}