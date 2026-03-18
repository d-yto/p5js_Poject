
let data ={
    kids:[],
    collisions:[],
    adults:[],
    foods:[],
    nearestFoods:[],
}
let stats ={
    adult:{
        color:[132, 102, 100],
        velMin:0.4,
        velMax:1.1,
        type:"adult",
        age:Math.random(18,85),
        str:12,
        store:8,
        size:12,
        hunger:100,
        maxHunger:100,
        hungerRate:0.8,

    },
    child:{
        color:[100, 130, 132],
        velMin:0.3,
        velMax:0.7,
        type:"kid",
        age:0,
        str:3,
        store:1,
        size:8,
        hunger:30,
        maxHunger:30,
        hungerRate:0.3,


    },
    carrotColor:[186, 98, 69],
}
let foodTypes = {
    carrot:["carrot",stats.carrotColor, 7, 6, 9, 0.9]
}
let entityType = {
    child:[
        stats.child.type/* type */,
        stats.child.color/* color */, 
        stats.child.velMin/* vel min */,
        stats.child.velMax/* vel max */,
        stats.child.age /* age */,
        stats.child.str/* Strength */,
        stats.child.store/* storage */,
        stats.child.size/* size */,
        stats.child.hunger/* hunger */,
        stats.child.maxHunger/* max hunger */, 
        stats.child.hungerRate/* hunger rate */],
    adult:[
        stats.adult.type/* type */,
        stats.adult.color/* color */, 
        stats.adult.velMin/* vel min*/,
        stats.adult.velMax/* vel max*/,
        stats.adult.age /* age */,
        stats.adult.str/* Strength */,
        stats.adult.store/* storage */,
        stats.adult.size/* size */,
        stats.adult.hunger/* hunger */,
        stats.adult.maxHunger/* max hunger */, 
        stats.adult.hungerRate/* hunger rate */],
    
}
class entity{
    constructor(inputType,inputColor,inputVelMin,inputVelMax,inputAge,inputStr,inputStore,inputSize,inputHunger,inputMaxHunger,inputHungerRate){
        this.x = random(0,winWidth)
        this.y = random(0,winHeight)
        this.vel = random(inputVelMin, inputVelMax)
        this.ID = crypto.randomUUID();
        this.age = inputAge
        this.str = inputStr
        this.store = inputStore
        this.size = inputSize
        this.type = inputType
        this.hunger = inputHunger
        this.maxHunger = inputMaxHunger
        this.hungerRate = inputHungerRate
        this.noiseOffset = random(1000, 9000);
        this.direction ={x:random(0,1), y:random(0,1)}
        this.color = inputColor
    }
    update(){
        fill (this.color)
        circle(this.x,this.y,this.size)
        
        movement(this) //moves the kid
        
        touchingBoundary(this)//checks if the kid is touching boundary
        updateHunger(this)
        
        
    }
}


class food{
    constructor(inputFoodName,inputColor,inputSize,inputHunger,inputRotTime, inputRotRate){
        this.foodName = inputFoodName
        this.x = random(0,winWidth)
        this.y = random(0,winHeight)
        this.color = inputColor
        this.size = inputSize
        this.hunger = inputHunger
        this.rotTime = inputRotTime
        this.rotRate = inputRotRate
        this.ID = crypto.randomUUID();
    }
    update(){
        fill (this.color)
        circle(this.x,this.y,this.size)
        rotUpdate(this)
    }
}




let winHeight = 500;
let winWidth = 500;
let nearest = []