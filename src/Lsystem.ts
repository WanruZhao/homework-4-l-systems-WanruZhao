class charRule {
    successor : string;
    probability : number;

    constructor(s: string, p: number) {
        this.successor = s;
        this.probability = p;
    }
}

var grammar : {
    [key :string] : charRule[]
};
grammar = {};

grammar["X"] = [
    new charRule(">X", 0.2),
    new charRule("F<[+FF-E]E", 0.2),
    new charRule("F<[-FF+E]X*", 0.2),
    new charRule("F>[+FF-E]E", 0.2),
    new charRule("F>[-FF+E]X*", 0.2),
];

grammar["E"] = [
    new charRule("E*", 0.3),
    new charRule("E[TX]", 0.1),
    new charRule("F[TX]", 0.6),
];


function pickSuc(cur: string) : string {
    let candidates : charRule[] = grammar[cur];

    if(typeof candidates === "undefined") {
        return cur;
    }

    // generate prob
    let prob = Math.random();

    let suc = "";
    let sumProb = 0.0;

    // pick one replace rule
    let len : number = candidates.length;
    for(let i = 0; i < len; i++) {
        if(prob > sumProb && prob <= sumProb + candidates[i].probability) {
            suc = candidates[i].successor;
        }
        sumProb += candidates[i].probability;
    }
    return suc;
}



// linked list node class
export class LinkedListNode {
    prev : LinkedListNode;
    next : LinkedListNode;
    val : string;

    constructor(p: LinkedListNode, n: LinkedListNode, v : string) {
        this.prev = p;
        this.next = n;
        this.val = v;
    }
};

// linked list class
export class LinkedList {
    // head and tail are 
    head = new LinkedListNode(null, null, "");
    tail = new LinkedListNode(null, null, "");

    constructor() {
        this.head.next = this.tail;
        this.tail.prev = this.head;
    }

    // convert string to linked list
    fromString(s : string) {
        let pre = this.head;
        let next = this.tail;
        for(let i = 0; i < s.length; i++) {
            let newNode = new LinkedListNode(pre, next, s.charAt(i));
            pre.next = newNode;
            next.prev = newNode;
            pre = pre.next;
        }
    }

    // convert linked list to string
    toString() : string {
        let res = "";
        let cur = this.head.next;
        while(cur.next) {
            res += cur.val;
            cur = cur.next;
        }
        return res;
    }

    // replace current linked list node to its successor
    replace(cur : LinkedListNode) {
        let suc = pickSuc(cur.val);
        let newList = new LinkedList();
        newList.fromString(suc);

        // if new linked list is not empty, replace the origin node with new list
        if(newList.head.next !== newList.tail) {
            let next = cur.next;
            cur.prev.next = newList.head.next;
            newList.head.next.prev = cur.prev;
            newList.tail.prev.next = next;
            next.prev = newList.tail.prev;
        }
    }

};


// l-system class
export default class Lsystem {
    axiom : string;
    final : string;
    iteration: number;

    constructor(a: string, i: number) {
        this.axiom = a;
        this.iteration = i;
    }

    updateAxiom(a : string) {
        this.axiom = a;
        this.final = "";
    }

    updateIter(i : number) {
        this.iteration = i;
        this.final = "";
    }

    calFinal() {
        let list = new LinkedList();
        list.fromString(this.axiom);


        // for every node in grammar list, do replace based on rules _iteration_ times
        for(let i = 0; i < this.iteration; i++) {
            let cur = list.head.next;
            let next = cur.next;

            while(next) {

                list.replace(cur);
                
                cur = next;
                next = cur.next;
            }
        }
        this.final = list.toString();
    }


};