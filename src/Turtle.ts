import {vec3, vec4, mat4} from 'gl-matrix';

export var blFade = 0.75;
export var bwFade = 0.5;

export var grids = [
    new Array<boolean>(7),
    new Array<boolean>(7),
    new Array<boolean>(7),
    new Array<boolean>(7),
    new Array<boolean>(7),
    new Array<boolean>(7),
    new Array<boolean>(7),
];

export function resetGrid() {
    for(let i = 0; i < 7; i++) {
        for(let j = 0; j < 7; j++) {
            grids[i][j] = false;
        }
    }
    grids[3][3] = true;
}


export default class Turtle
{
    position : vec3;
    orientation: vec3;
    branchLevel: number;

    center = vec3.create();
    rotation = mat4.create();

    constructor(p : vec3, o : vec3, l : number) {

        var pp = JSON.parse(JSON.stringify(p));
        var oo = JSON.parse(JSON.stringify(o));
        var bb = JSON.parse(JSON.stringify(l));

        this.position = vec3.fromValues(pp[0], pp[1], pp[2]);
        this.orientation = vec3.fromValues(oo[0], oo[1], oo[2]);
        this.branchLevel = bb;

    }

    goForward(len : number) {

        let rotationX = mat4.create();
        let rotationY = mat4.create();
        let rotationZ = mat4.create();

        mat4.rotateX(rotationX, rotationX, this.orientation[0] * Math.PI / 180.0);
        mat4.rotateY(rotationY, rotationY, this.orientation[1] * Math.PI / 180.0);
        mat4.rotateZ(rotationZ, rotationZ, this.orientation[2] * Math.PI / 180.0);


        mat4.multiply(this.rotation, rotationY, rotationX);
        mat4.multiply(this.rotation, this.rotation, rotationZ);

        let axis = vec4.fromValues(0, 1, 0, 0);
        vec4.transformMat4(axis, axis, this.rotation);
        vec4.normalize(axis, axis);


        let offset = len * Math.pow(blFade, this.branchLevel);

        let axis3 = vec3.fromValues(axis[0],axis[1],axis[2]);

        vec3.add(this.center, this.position, vec3.scale(axis3, axis3, offset / 2.0));
        vec3.add(this.position, this.position, vec3.scale(axis3, axis3, offset));
        

    }

    rotX(a : number)
    {

        this.orientation[0] += a;
    }

    rotY(a : number) {

        this.orientation[1] += a;
    }

    rotZ(a : number) {

        this.orientation[2] += a;
    }

    flip() {
        //console.log("flip");
        this.orientation[1] += 180;
    }

    trans(r : number, len : number) {

        let i = 3;
        let j = 3;
        do {
            i = Math.floor(Math.random() * 7);
            j = Math.floor(Math.random() * 7);
        } while(grids[i][j])

        grids[i][j] = true;


        let x =  (2 * Math.random() - 1) * r  + (i - 3) * r * 2;
        let z =  (2 * Math.random() - 1) * r  + (j - 3) * r * 2;

        this.position = vec3.fromValues(x, 0, z);
        this.orientation = vec3.fromValues(0, 0, 0);
        this.branchLevel = 0;

    }
    
};