let data ={
    
    createStats:{
        child:{
            size: 7,
            Vel:0.7,
            str:3,
            store:1,
            pos:{x:200,
                y:200,
            },
            age:[],
        },
        
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
    children:[],
}
class childs{
    constructor(){
        this.x = random(0,400)
        this.y = random(0,400)
        this.direction = randomDirection()
        this.stride = floor.random(10,30)
        this.vel = 0.7
        this.ID = data.children.length+1
        this.age = 0
        this.str = 3
        this.store = 1
    }
}
let winHeight = 400;
let winWidth = 400;