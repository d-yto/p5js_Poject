
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
        get vel() {  return getRandomIntInclusive(0.9,1.1)  },
        type:"adult",
        get age() {  return getRandomIntInclusive(18,85)  },
        str:12,
        store:40,
        size:12,
        hunger:60,
        maxHunger:60,
        hungerRate:0.6,
        repRateMin:0,
        repRateMax:1000

    },
    child:{
        color:[100, 130, 132],
        get vel() {  return getRandomIntInclusive(0.9,1.1)  },
        type:"kid",
        age:0,
        str:3,
        store:20,
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
        rotTime:5,
        rotRate:0.9
    },

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
        this.repRate = getRandomIntInclusive(config.repRateMin,config.repRateMax)
    }
    updateHunger(){
        if (this.store>0){
            if (this.hunger + this.store<this.maxHunger){
                
                this.hunger += this.store
                this.store = 0
            } else if (this.hunger + this.store > this.maxHunger){
                let d = this.maxHunger - this.hunger
                this.hunger = this.maxHunger
                this.store -= d 
            }
        }
    }
    canReproduce(){
        return this.age >=18 && this.hunger >= 0.7*this.maxHunger && this.repRate<=0
    }
    update(foodGrid){
        super.update(foodGrid)  // calls Living's update which handles movement/render
        this.updateHunger()
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