
let data ={
    kids:[],
    collisions:[],
    adults:[],
}


class child{
    constructor(){
        this.x = random(0,winWidth)
        this.y = random(0,winHeight)
        this.vel = random(0.3,0.7)
        this.direction = randomDirection()
        this.stride = floor(random(10,stride))
        this.ID = crypto.randomUUID();
        this.age = 0
        this.str = 3
        this.store = 1
        this.size = 8
        this.type = "kid"
    }
    update(){
        fill (174,118,216)
        circle(this.x,this.y,this.size)

        movement(this) //moves the kid
        
        touchingBoundary(this)//checks if the kid is touching boundary
        

    }
}

class adult{
    constructor(){
        this.x = random(0,winWidth)
        this.y = random(0,winHeight)
        this.vel = random(0.4,1.1)
        this.direction = randomDirection()
        this.stride = floor(random(10,stride))
        this.ID = crypto.randomUUID();
        this.age = floor(random(18,85));
        this.str = 15
        this.store = 5
        this.size = 12
        this.type = "adult"
        this.hunger = 100
        this.maxHunger = 100
        this.hungerRate = 1.2
    }
    update(){
        fill (20, 152, 186)
        circle(this.x,this.y,this.size)

        movement(this) //moves the obj
        
        touchingBoundary(this)//checks if the obj is touching boundary
        updateHunger(this)

    }
}
let winHeight = 500;
let winWidth = 500;
let stride = 1000;

