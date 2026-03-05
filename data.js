let data ={
    kids:[],
    
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
        this.x = random(0,400)
        this.y = random(0,400)
        this.direction = randomDirection()
        this.stride = floor(random(10,200))
        this.vel = 0.7
        this.ID = data.kids.length+1
        this.age = 0
        this.str = 3
        this.store = 1
        this.size = 12
    }
    update(){
        fill (174,118,216)
        circle(this.x,this.y,this.size)
        if(this.stride<=0){
            this.direction = randomDirection()
            this.stride = floor(random(10,200))
        }
        this.x += this.direction.x*this.vel
        this.y += this.direction.y*this.vel
        this.stride--;

        
/*         if(this.x >400){
            this.direction.x *=-1
            this.x = 400
        } else if(this.x<0){
            this.direction.x *=-1
            this.x = 0
        }
        if(this.y >400){
            this.direction.y *=-1
            this.y = 400
        } else if(this.y<0){
            this.direction.y *=-1
            this.y = 0
        } */
       touchingBoundary(this)
        for (let i = 0;i< data.kids.length; i++){
            for (let j = 0;j<data.kids.length; j++){
                let kid1 = data.kids[i]
                let kid2 = data.kids[j]
                if(isColliding(kid1,kid2)){
                    kidCollision(i,j);
                }
            }
        }   

    }
}
let winHeight = 400;
let winWidth = 400;