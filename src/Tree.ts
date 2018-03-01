import Lsystem from './Lsystem'
import Turtle, {blFade, bwFade, resetGrid, grids} from './Turtle'
import {vec3, vec4, mat4} from 'gl-matrix';
import Drawable from './rendering/gl/Drawable';
import {gl} from './globals';
import { F_OK } from 'constants';
import Obj, {ObjInfo} from './Object';
import { currentId } from 'async_hooks';
import Branch from './Branch';
import Flower from './Flower';


// global obj info
export var flower : ObjInfo;
export var branch : ObjInfo;
export var end : ObjInfo;
export function setBranch(b : ObjInfo) {
    branch = b;
}
export function setFlower(f : ObjInfo) {
    flower = f;
}
export function setEnd(e : ObjInfo) {
    end = e;
}

// global variables needed to be updated every time process a character in string
var branchLen = 3.0;
var a = 30.0;
var curTurtle : Turtle = new Turtle(vec3.create(), vec3.create(), 0);
var radius = 10.0;


// grammer map
var renderGrammar = new Map();
renderGrammar.set("F", function() {curTurtle.goForward(branchLen);});
renderGrammar.set("E", function() {curTurtle.goForward(branchLen);});
renderGrammar.set("X", function() {curTurtle.goForward(branchLen);});
renderGrammar.set("+", function() {curTurtle.rotX(a);});
renderGrammar.set("-", function() {curTurtle.rotX(-a);});
renderGrammar.set("<", function() {curTurtle.rotY(a);});
renderGrammar.set(">", function() {curTurtle.rotY(-a);});
renderGrammar.set("&", function() {curTurtle.rotZ(a);});
renderGrammar.set("^", function() {curTurtle.rotZ(-a);});
renderGrammar.set("|", function() {curTurtle.flip();});
renderGrammar.set("T", function() {curTurtle.trans(radius, branchLen);});

class Tree
{
    lgrammar = new Lsystem("X", 0);
    stack : Array<Turtle>;
    position = vec3.create();
    iteration = 0;
    angle = 90;
    stepsize = 2.0;
    current : Turtle;

    branch : Branch;
    flower : Flower;

    // vertex information for branch
    bpos : Array<vec4>;
    bnor : Array<vec4>;
    bidx : Array<number>;

    // vertex information for flower
    fpos : Array<vec4>;
    fnor : Array<vec4>;
    fidx : Array<number>;


    constructor(p: vec3, i: number) {
        this.position = p;
        this.lgrammar.updateIter(i);
        this.current = new Turtle(this.position, vec3.fromValues(0, 0, 0), 0);
        this.branch = new Branch();
        this.flower = new Flower();

        this.bpos = new Array<vec4>();
        this.bidx = new Array<number>();
        this.bnor = new Array<vec4>();
        this.fpos = new Array<vec4>();
        this.fidx = new Array<number>();
        this.fnor = new Array<vec4>();

    }

    create() {
        
        this.generateBranches();

        this.branch.generateInfo(this.bidx, this.bpos, this.bnor);
        this.branch.create();

        this.flower.generateInfo(this.fidx, this.fpos, this.fnor);
        this.flower.create();
        

        console.log('Created tree');  

    }

    destory() {
        this.branch.destory();
        this.flower.destory();
        resetGrid();
    }

    reset() {
        this.current = new Turtle(this.position, vec3.fromValues(0, 0, 0), 0);
        this.stack = new Array<Turtle>();
        this.branch = new Branch();
        this.flower = new Flower();

        this.bpos = new Array<vec4>();
        this.bidx = new Array<number>();
        this.bnor = new Array<vec4>();
        this.fpos = new Array<vec4>();
        this.fidx = new Array<number>();
        this.fnor = new Array<vec4>();

    }

    updateAxiom(a : string) {
        this.lgrammar.updateAxiom(a);
        this.reset();
    }

    updateIteration(i : number) {
        this.iteration = i;
        this.lgrammar.updateIter(i);
        this.reset();
    }

    updateAngle(a: number) {
        this.angle = a;
        this.reset();
    }

    // this function calculates the branches and flowers position, location
    generateBranches() {
        this.stack = [];      
        this.lgrammar.calFinal();
        let grammar = this.lgrammar.final;

        for(let i = 0; i < grammar.length; i++) {
            let char = grammar.charAt(i);

            if(char === "[") {
                let t = new Turtle(this.current.position, this.current.orientation, this.current.branchLevel);
                this.stack.push(t);
                this.current.branchLevel += 1;
            } else if(char === "]") {
                this.current = this.stack.pop();
            } else if(char === "*") {
                
                let scale = mat4.create();
                let fadeL = 5.0 * Math.pow(blFade, this.current.branchLevel);
                let fadeW = 3.0 * Math.pow(bwFade, this.current.branchLevel);
                mat4.scale(scale, scale, vec3.fromValues(fadeW, fadeL, fadeW));
                let m = mat4.create();
                mat4.multiply(m, curTurtle.rotation, scale);                
                let mit = mat4.create();
                mat4.invert(mit, m);
                mat4.transpose(mit, mit);

                let tmp = JSON.parse(JSON.stringify(this.current.position));
                let trans = vec4.fromValues(tmp[0], tmp[1] + 1.0 * Math.pow(blFade, this.current.branchLevel), tmp[2], 0);

                let offset = this.fpos.length;

                for(let i = 0; i < flower.positions.length; i++) {
                    let b = flower.positions[i];
                    let p = vec4.create();
                    vec4.add(p, p, b);
                    vec4.transformMat4(p, p, m);
                    vec4.add(p, p, trans);
                    this.fpos.push(p);
                }

                for(let i = 0; i < flower.normals.length; i++) {
                    let b = flower.normals[i];
                    let n = vec4.create();
                    vec4.add(n, n, b);
                    vec4.transformMat4(n, n, mit);
                    this.fnor.push(n);
                }
            
                for(let i = 0; i < flower.indices.length; i++) {
                    this.fidx.push(flower.indices[i] + offset);
                } 
                
            } else {
                // call turtle functions
                let ps = this.current.position;
                let or = this.current.orientation;
                let bl = this.current.branchLevel;
                curTurtle = new Turtle(ps, or, bl);
                
                a = this.angle;
                branchLen = this.stepsize * this.stepsize;

                let scale = mat4.create();
                let fadeL = branchLen * Math.pow(blFade, this.current.branchLevel);
                let fadeW = 5.0 * Math.pow(bwFade, this.current.branchLevel);
                mat4.scale(scale, scale, vec3.fromValues(fadeW, fadeL, fadeW));


                var f = renderGrammar.get(char);
                if(typeof f === "undefined") {
                    continue;
                }
                f(); 

                
                if(char === "F" || char === "E" || char === "X") {
                    
                    let m = mat4.create();
                    mat4.multiply(m, curTurtle.rotation, scale);
                    let mit = mat4.create();
                    mat4.invert(mit, m);
                    mat4.transpose(mit, mit);

                    let tmp = JSON.parse(JSON.stringify(this.current.position));
                    let trans = vec4.fromValues(tmp[0], tmp[1], tmp[2], 0);

                    let offset = this.bpos.length;

                    if(char === "F") {
                        for(let i = 0; i < branch.positions.length; i++) {
                            let b = branch.positions[i];
                            let p = vec4.create();
                            vec4.add(p, p, b);
                            vec4.transformMat4(p, p, m);
                            vec4.add(p, p, trans);
                            this.bpos.push(p);
                        }
    
                        for(let i = 0; i < branch.normals.length; i++) {
                            let b = branch.normals[i];
                            let n = vec4.create();
                            vec4.add(n, n, b);
                            vec4.transformMat4(n, n, mit);
                            this.bnor.push(n);
                        }
                        
                        for(let i = 0; i < branch.indices.length; i++) {
                            this.bidx.push(branch.indices[i] + offset);
                        } 
                    } else {
                        for(let i = 0; i < end.positions.length; i++) {
                            let b = end.positions[i];
                            let p = vec4.create();
                            vec4.add(p, p, b);
                            vec4.transformMat4(p, p, m);
                            vec4.add(p, p, trans);
                            this.bpos.push(p);
                        }
    
                        for(let i = 0; i < end.normals.length; i++) {
                            let b = end.normals[i];
                            let n = vec4.create();
                            vec4.add(n, n, b);
                            vec4.transformMat4(n, n, mit);
                            this.bnor.push(n);
                        }
                        
                        for(let i = 0; i < end.indices.length; i++) {
                            this.bidx.push(end.indices[i] + offset);
                        } 
                    }
                    
                    
                }
                this.current = curTurtle;
            }
        }
    }
};

export default Tree;