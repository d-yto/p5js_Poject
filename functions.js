/* **UTILITIES** */
function getRandomIntInclusive(min, max){
    return Math.floor(Math.random()*(max - min + 1))+min
}
function getRandomNumInclusive(min, max){
    return Math.random()*(max - min )+min
}


/* **GRID** */
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



/* **RENDER** */
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
function createEntity(i){
    fill(i.color)
    circle(i.x,i.y,i.size)

    let cx = i.x 
    let cy = i.y 
    stroke(255, 255, 255, 150);
    strokeWeight(1);
    line(cx, cy, cx + i.direction.x * (i.vel*14), cy + i.direction.y * (i.vel * 14));
    noStroke();
}



/* **ENTITY LIFECYCLE** */
function birth(i,e){
    /* Called when parents meet, initializes the childs birth.
    Child inherits stats (currently only Vel) from one parent, or an average of both,
    dependent on its roll */
    let roll = getRandomIntInclusive(1,3)

    let child = new Child(stats.child)
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
function grow(){
    /* Function for when each year passes, to grow by 1 year.
    If i === 18 it transitions to being an adult */
    let add = [];
    let remove = [];

    for (let i of data.people){
        i.age++;
        if(i.age ===18 && i.type === "kid"){
            let adult = i.growUp()
            add.push(adult)
            remove.push(i)
        }
    }
    for (let i of remove){
        let index = data.people.indexOf(i)
        if (index > -1) data.people.splice(index, 1)
    } 
    for (let i of add) data.people.push(i)
    if (add.length>0)console.log(`${add.length} child/children grew up`)
}
function getFreaky() {
    /* Checks for other applicable entities to reproduce with.
    Must be >= 18, relatively full on hunger, and have a repRate of 0 to be applicable */
    const cellsize = 50;
    const applicable = data.people.filter(i => i.canReproduce?.())
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



/* **MOVEMENT** */
function sampleNoise(i){
    /* samples perlin noise to make entity movement look more organic */
    let noiseScale = 0.003;
    let nt = 0.005 * frameCount;
    let nx = noise(noiseScale * i.x + i.noiseOffset, nt) - noise(noiseScale*i.x+i.noiseOffset+500,nt);
    let ny = noise(noiseScale * i.y + i.noiseOffset + 1000, nt) - noise(noiseScale * i.y + i.noiseOffset+1500, nt)
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
    }else if(i.maxHunger*0.9>i.hunger){
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
    if(i.x>(mapWidth-boundMargin)){
        nx -= repulse *(1-((mapWidth-i.x)/boundMargin))
    }
    if(i.y<boundMargin){
        ny += repulse * (1-(i.y/boundMargin))
    }
    if (i.y>(mapHeight-boundMargin)){
        ny -= repulse * (1-((mapHeight-i.y)/boundMargin))
    }
    return { nx, ny };
}
function applySteer(i, nx, ny, len){
    /* steerstrength dictates how quickly entitys turn towards the target direction. */
    /* after a collision, steerforce is reduced by a factor of 10 to allow for the collision to play out before noise starts pulling the entity back onto course.
    After 1/3 seconds, normal steering resumes. */
    let steerStrength = i.collisionCooldown > 0 ? 0.004 * worldSpeed : 0.04 * worldSpeed;
    if (i.collisionCooldown > 0) i.collisionCooldown -= worldSpeed;

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
function movement(obj,foodGrid){
    /* applies direction and velocity (which is technically magnitude)
    nudges entities velocity closer to their normal velocity after a collision */
    mapNoise(obj,foodGrid)
    obj.x += obj.direction.x * obj.vel * worldSpeed
    obj.y += obj.direction.y * obj.vel * worldSpeed
    /*  */
    let recoverySpeed = 0.004
    obj.vel += (obj.targetVel - obj.vel)*recoverySpeed * worldSpeed



}



/* **COLLISION**  */
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
    if(obj.x >mapWidth - s){
        obj.direction.x *=-1
        obj.x = mapWidth - s
    } else if(obj.x <0+s){
        obj.direction.x *=-1
        obj.x = 0 +s
    }
    if(obj.y >mapHeight-s){
        obj.direction.y *=-1
       obj.y = mapHeight - s
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
    
    object1.collisionCooldown = 20 * worldSpeed
    object2.collisionCooldown = 20 * worldSpeed
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



/* **FOOD** */
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
        i.nearestFood = nearest
        return nearest
}
function eat(){
    /* checks which entities are eating. */
    for(let i of data.people){
        let nearest = i.nearestFood
        if (nearest && isColliding(i, nearest)){
            let foodIndex = data.foods.indexOf(nearest)
            if (foodIndex !== -1){

                data.foods.splice(foodIndex, 1)
                if(i.hunger>= i.maxHunger){
                    i.store = Math.min(i.store + nearest.hunger, i.store)
                    return
                }
                i.hunger = Math.min(i.hunger+=nearest.hunger, i.maxHunger)
            
            }
        }
    }
}
function rotUpdate(){
    /* updates how rotted the food is */
    for (let i of data.foods){
        i.rotTime -= i.rotRate        
    }
    data.foods = data.foods.filter(c => c.rotTime > 0)
}
function updateHunger(){
    /* Updates hunger of entity based off their hungerRate */
    for(let i of data.people){

        i.hunger -= i.hungerRate
        if (i.hunger>i.maxHunger)i.hunger = i.maxHunger
    }

}



/* **INPUT / UI** */
function mouseClicked(){
    if(mouseX>0 && mouseX<100 && mouseY>winHeight && mouseY<winHeight+buttonheight){
        healthbar = !healthbar
        
    }
    if(mouseX>100 && mouseX<200 && mouseY>winHeight && mouseY<winHeight+buttonheight){
        
        if (worldSpeed ===1)worldSpeed*=5
        else if (worldSpeed ===5)worldSpeed/=5
        
    }
}
function mousePressed(){
    if (mouseY > winHeight) return;
    isdragging = true
    dragPosX = mouseX + camX 
    dragPosY = mouseY + camY 
}
function mouseDragged(){
    if (!isdragging) return;
    camX = dragPosX - mouseX
    camY = dragPosY - mouseY

    camX = constrain(camX, 0, mapWidth - winWidth)
    camY = constrain(camY, 0, mapHeight - winHeight)
}
function mouseReleased(){
    isdragging = false;
}

function keyPressed(){
    if (key === 'q'){
        crop = farm.wheat
        x = mouseX - crop.width/2
        y = mouseY - crop.height/2
        placeCrop(farm.wheat,x,y)
        
    }
}

function placeCrop(crop, x,y){
let config = crop
config.x = round((x + camX)/config.width)*config.width
config.y = round((y + camY)/config.height)*config.height
let occupied = data.structures.some(c => c.x === config.x && c.y === config.y)
if (occupied){
    console.log(`oopsie`)
    return
}
data.structures.push(new farmland(config))

}

function doubleClicked(){
    console.log(`Double click`)
    let x = mouseX + camX
    let y = mouseY + camY

    let occupied = data.structures.some(c => (abs(c.x + c.width) - x) < c.width/2 && (abs(c.y + c.height) - y)<c.height/2)
    if (occupied){
        openUi()
    }
}

function openUi(){
    console.log(`UI UI UI`)
}

