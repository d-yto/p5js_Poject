let data ={
    kids:[],
    collisions:[],
    createStats:{
        adult:{
            size:20,
            Vel:3,
            str:12,
            store:8,
            pos:{x:Math.random(0,400),
                y:Math.random(0,400),
            },
            age:[Math.random(18,64)],
        },
        dog:{
            size:10,
            vel:4,
            str:6,
            store:0,
            pos:{x:Math.random(0,400),
                y:Math.random(0,400),
            },
        }
    },
}

class child{
    constructor(){
        this.x = random(0,winWidth)
        this.y = random(0,winHeight)
        this.direction = randomDirection()
        this.stride = floor(random(10,kidstride))
        this.vel = random(0.3,0.7)
        this.ID = data.kids.length+1
        this.age = 0
        this.str = 3
        this.store = 1
        this.size = 8
    }
    update(){
        fill (174,118,216)
        circle(this.x,this.y,this.size)

        kidMovement(this) //moves the kid
        
        touchingBoundary(this)//checks if the kid is touching boundary
        

    }
}
let winHeight = 500;
let winWidth = 500;
let kidstride =1000
let cursorX = pmouseX
let cursorY = pmouseY