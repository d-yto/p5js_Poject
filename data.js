
let data ={
    people:[],
    foods:[],
    collisions:[],
    nearestFoods:[],
    infoBars:[],
}
let stats ={
    adult:{
        color:[132, 102, 100],
        velMin:0.9,
        velMax:1.1,
        type:"adult",
        get age() {  return getRandomIntInclusive(18,85)  },
        str:12,
        store:8,
        size:12,
        hunger:100,
        maxHunger:100,
        hungerRate:0.6,
        repRateMin:0,
        repRateMax:1000

    },
    child:{
        color:[100, 130, 132],
        velMin:0.7,
        velMax:0.9,
        type:"kid",
        age:0,
        str:3,
        store:1,
        size:8,
        hunger:30,
        maxHunger:30,
        hungerRate:0.6,
        repRateMin:Infinity,
        repRateMax:Infinity,
    

    },
    carrot:{
        foodName:"carrot",
        color:[186, 98, 69],
        size:7,
        hunger:6,
        rotTime:9,
        rotRate:0.9
    },

}


class entity{
    constructor(config){
        this.x = getRandomIntInclusive(0,mapWidth)
        this.y = getRandomIntInclusive(0,mapHeight)
        this.vel = getRandomNumInclusive(config.velMin, config.velMax)
        this.ID = crypto.randomUUID();
        this.age = config.age
        this.str = config.str
        this.store = config.store
        this.size = config.size
        this.type = config.type
        this.hunger = config.hunger
        this.maxHunger = config.maxHunger
        this.hungerRate = config.hungerRate
        this.noiseOffset = getRandomIntInclusive(1000, 9000);
        this.direction ={x:random(), y:random()}
        this.color = [...config.color]
        this.collisionCooldown = 0
        this.repRate = getRandomIntInclusive(config.repRateMin,config.repRateMax)
        this.targetVel = this.vel
        this.dead = false
        this.partner = null
        this.children = []
    }
    update(foodGrid){
        createEntity(this)
        
        movement(this,foodGrid) //moves the kid
        
        touchingBoundary(this)//checks if the kid is touching boundary
        updateHunger(this)
        if (healthbar) hungerBar(this)
    }
}


class food{
    constructor(config){
        this.foodName = config.foodName
        this.x = getRandomIntInclusive(0,mapWidth)
        this.y = getRandomIntInclusive(0,mapHeight)
        this.color = config.color
        this.size = config.size
        this.hunger = config.hunger
        this.rotTime = config.rotTime
        this.rotRate = config.rotRate
        this.ID = crypto.randomUUID();
    }
    update(foodGrid){
        fill (this.color)
        circle(this.x,this.y,this.size)
        rotUpdate(this)
    }
}

let winHeight = 500;
let winWidth = 500;

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