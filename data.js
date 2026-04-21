
let data ={
    people:[],
    foods:[],
    collisions:[],
    nearestFoods:[],
    infoBars:[],
    structures:[],
}
let stats ={
    adult:{
        color:[132, 102, 100],
        get vel() {  return getRandomIntInclusive(0.9,1.1)  },
        type:"adult",
        get age() {  return getRandomIntInclusive(18,85)  },
        size:12,
        hunger:43,
        maxHunger:60,
        hungerRate:1,
        repRateMin:0,
        repRateMax:1000

    },
    child:{
        color:[100, 130, 132],
        get vel() {  return getRandomIntInclusive(0.7,0.9)  },
        type:"kid",
        age:0,
        size:8,
        hunger:17,
        maxHunger:25,
        hungerRate:1,
    

    },
    carrot:{
        foodName:"carrot",
        color:[186, 98, 69],
        size:7,
        hunger:6,
        rotTime:5,
        rotRate:0.9
    },

}
let farm ={
    wheat:{
        color:[77, 18, 7],
        type:`wheat`,
        width:100,
        height:100,

    }
}

class Entity{
    constructor(config){
        this.x = getRandomIntInclusive(0,mapWidth)
        this.y = getRandomIntInclusive(0,mapHeight)
        this.size = config.size
        this.color = [...config.color]
        this.ID = crypto.randomUUID();
        
    }
    render(){
        fill(this.color)
        circle(this.x, this.y, this.size)
    }
    update(){
        this.render()
    }
}

class Living extends Entity{
    constructor(config){
        super(config)
        this.hunger = config.hunger
        this.maxHunger = config.maxHunger
        this.hungerRate = config.hungerRate
        this.vel = config.vel
        this.targetVel = this.vel
        this.direction ={x:random(), y:random()}
        this.noiseOffset = getRandomIntInclusive(1000, 9000);
        this.collisionCooldown = 0
        this.dead = false
        this.nearestFood = null
        this.age = config.age
        this.type = config.type
    }
    
    update(foodGrid){
        createEntity(this)
        
        movement(this,foodGrid) //moves the kid
        
        touchingBoundary(this)//checks if the kid is touching boundary
        if (healthbar) hungerBar(this)
        }
}

class Adult extends Living{
    constructor(config){
        super(config)
        this.children = []
        this.partner = null
        this.store = config.store 
        this.maxStore = config.maxStore
        this.repRate = getRandomIntInclusive(config.repRateMin,config.repRateMax)
    }

    canReproduce(){
        return this.age >=18 && this.hunger >= 0.7*this.maxHunger && this.repRate<=0
    }
    update(foodGrid){
        super.update(foodGrid)  // calls Living's update which handles movement/render
        if (frameCount%(10/worldSpeed) === 0) this.repRate--;
    }
    
}

class Child extends Living{
    constructor(config){
        super(config)
    }
    growUp(){
        let adult = new Adult(stats.adult)
        adult.x = this.x
        adult.y = this.y
        adult.vel = this.vel + 0.2
        adult.targetVel = adult.vel
        adult.direction = this.direction
        adult.noiseOffset = this.noiseOffset
        adult.hunger = this.hunger
        adult.age = 18
        return adult
    }
}

class Food extends Entity{
    constructor(config){
        super(config)
        this.foodName = config.foodName
        this.hunger = config.hunger

        this.rotTime = config.rotTime
        this.rotRate = config.rotRate
    }
    render(){
        fill(this.color)
        circle(this.x,this.y,this.size)
    }

    update(foodGrid){
        this.render()
        
    }
}

class Carrot extends Food {
    constructor(config){
        super(config)
    }
    
}




class structure{
    constructor(config){
        this.x = `who knows`
        this.y = `who knows`
        this.color = config.color
        this.type = config.type
        this.ID = crypto.randomUUID();
    }
}

class RectangularStructure extends structure{
    constructor(config){
        super(config)
        this.width = config.width
        this.height = config.height
    }
    render(){
        fill(this.color)
        rect(this.x, this.y, this.width, this.height,)
    }
    update(){
        this.render()
    }
}

class farmland extends RectangularStructure{
    constructor(config){
        super(config)
        this.crop = config.type
        this.stage = 0
        this.watered = false
        this.workers = []
    }
}

let winHeight = 600;
let winWidth = 600;

let mapWidth = 2000;
let mapHeight = 2000;

let camX = 0;
let camY = 0;
let isdragging = false;
let dragPosX, dragPosY;


let buttonheight = 60
let nearest = []
let deathToll = 0
let healthbar = true
let worldSpeed = 1

let TF = false