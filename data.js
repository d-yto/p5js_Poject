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
        this.wait = floor(random(1,4))
    }
    update(){
        fill (174,118,216)
        circle(this.x,this.y,this.size)

        kidMovement(this) //moves the kid
        
        touchingBoundary(this)
        for (let i = data.kids.length - 1; i >= 0; i--) {
            for (let j = i - 1; j >= 0; j--) {
                let kid1 = data.kids[i];
                let kid2 = data.kids[j];
      
                if (kid1 && kid2 && isColliding(kid1, kid2)) {
                kidCollision(kid1, kid2);
                }
            }
        }

    }
}
let winHeight = 500;
let winWidth = 500;
let kidstride =1000