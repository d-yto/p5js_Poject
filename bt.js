const BT = {  SUCCESS:'SUCCESS', FAILURE:'FAILURE', RUNNING:'RUNNING'  }

class NodeBase {
    // exists because I know I will likely need it later for debugging
    tick(){
    }
}

class Sequence extends NodeBase {
    constructor(children){
        super();
        this.children = children
    }
    tick(e, ctx){
        for (let child of this.children){
            const status = child.tick(e, ctx)
            if(status !== BT.SUCCESS){
                return status
            } 
        }
        return BT.SUCCESS
    }
}

class Selector extends NodeBase {
    constructor(children){
        super();
        this.children = children
    }
    tick(e, ctx){
        for (let child of this.children){
            const status = child.tick(e, ctx);
            if (status !== BT.FAILURE){
                return status
            }
        }
        return BT.FAILURE
    }
}

class Condition extends NodeBase {
    constructor(fn){
        super();
        this.fn = fn
    }
    tick(e,ctx){
        return this.fn(e, ctx) ? BT.SUCCESS : BT.FAILURE
    }
}

class Action extends NodeBase {
    constructor(fn){
        super();
        this.fn = fn
    }
    tick(e, ctx){
        return this.fn(e, ctx)
    }
}




const actions = {
    wander: new Action((e,ctx) => {
        let n = e.sampleNoise();
        if (!n) return BT.RUNNING;
        let br = e.boundaryRepulsion();
        let w = 0.4 + sin(frameCount * 0.15) * 0.2;
        e.steeringTarget = { x: (n.x / n.len) * w + br.x, y: (n.y / n.len) * w + br.y }
        e.targetVel = e.baseVel*0.6
        return BT.RUNNING
    }),
    seekWildFood: new Action((e,ctx) => {
        let target = e.targetFood(ctx.foodGrid)
        if (!target) return BT.FAILURE
        let r = 80;
        let s = target.len < r ? e.vel*(target.len/r) : e.vel
        e.steeringTarget = {  x: target.x * s * 0.85, y: target.y * s * 0.85  }
        return BT.RUNNING
    }),
    seekPileFood: new Action((e, ctx) => {
        if(!e.targetFoodPile|| e.foodPileSearchCooldown <= 0){
            e.targetFoodPile = e.findEatablePile()
            e.foodPileSearchCooldown = 60
        }else{
            e.foodPileSearchCooldown--;
        }
        if(!e.targetFoodPile) return BT.FAILURE
        let pileCenter = {
            x: e.targetFoodPile.x + e.targetFoodPile.width / 2,
            y: e.targetFoodPile.y + e.targetFoodPile.height / 2,
        }
        let seek = e.seekPoint(pileCenter,60)
        if (seek.dist < 15){
            e.eatFromPile(e.targetFoodPile)
            return BT.SUCCESS
        }
        e.steeringTarget = seek;
        return BT.RUNNING;
    }),
    seekPartner: new Action((e,ctx) => {
        let p = e.partner
        if(!p) return BT.FAILURE
        let d = { x:p.x - e.x , y:p.y - e.y}
        e.steeringTarget = e.seekPoint(p,60)
        if (sqrt(d.x*d.x + d.y*d.y) < e.size/2 + p.size/2){
            birth(e, p)
            return BT.SUCCESS
        }
        return BT.RUNNING
    }),
}

const conditions = {
    isHungry: new Condition((e, ctx) => {
        return e.hunger < e.maxHunger * 0.45
    }),
    canReproduce: new Condition((e, ctx) => {
        return e.partner && e.hunger >= e.maxHunger * 0.7
    }),
}

const sequences = {
    ifHungryEat: new Sequence([
        conditions.isHungry,
        new Selector([
            actions.seekPileFood,
            actions.seekWildFood

        ])
    ]),
    reproduce:new Sequence([
        conditions.canReproduce,
        actions.seekPartner
    ]),

}

const selectors = {

}


const childTree = new Selector([
    sequences.ifHungryEat,
    actions.wander,
])
const adultTree = new Selector([
    sequences.ifHungryEat,
    sequences.reproduce,
    actions.wander,
])
