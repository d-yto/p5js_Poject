class Node {
    tick(){

    }
}

class Sequence extends Node{
    constructor(children){
        super();
        this.children = children
    }
    tick(){
        for (let child of this.children){
            const status = child.tick
            if(status !== 'SUCCESS') return status
            return 'SUCCESS'
        }
    }
}