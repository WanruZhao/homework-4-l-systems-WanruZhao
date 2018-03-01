import {vec3, vec4} from 'gl-matrix';
import * as Stats from 'stats-js';
import * as DAT from 'dat-gui';
import Icosphere from './geometry/Icosphere';
import Square from './geometry/Square';
import Cube from './geometry/Cube';
import OpenGLRenderer from './rendering/gl/OpenGLRenderer';
import Camera from './Camera';
import {setGL} from './globals';
import ShaderProgram, {Shader} from './rendering/gl/ShaderProgram';
import { GUIController } from 'dat-gui';
import Tree, {setBranch, setFlower, setEnd, flower} from './Tree';
import Lsystem from './Lsystem';
import Obj, {ObjInfo} from './Object';


const controls = {
  tesselations: 5,
  'Load Scene': loadScene, 
  Color: "#EC2D7A",
  Axiom: "X",
  Iteration : 2,
  Angle : 90.0,
};

// read text file function
// reference: https://stackoverflow.com/questions/14446447/how-to-read-a-local-text-file
function readTextFile(file : string) : string
{
  var allText : string;
    var rawFile = new XMLHttpRequest();
    rawFile.open("GET", file, false);
    rawFile.onreadystatechange = function ()
    {
        if(rawFile.readyState === 4)
        {
            if(rawFile.status === 200 || rawFile.status == 0)
            {
                allText = rawFile.responseText;
                return allText;
            }
        }
    }
    rawFile.send(null);
    return allText;
}

//----------------------------load scene--------------------------------------------
let icosphere: Icosphere;
let square: Square;
let cube: Cube;
let g: Lsystem;
let ground: Obj;
let tree: Tree;
let particle: Array<Obj>;
var meshP : any;
var centers : Array<vec4>;
var cols = new Array<vec4>();

function loadScene() {
  icosphere = new Icosphere(vec3.fromValues(0, 0, 0), 1, controls.tesselations);
  icosphere.create();
  square = new Square(vec3.fromValues(0, 0, 0));
  square.create();
  cube = new Cube(vec3.fromValues(0, 0, 0));
  cube.create();


  // load obj
  var OBJ = require('webgl-obj-loader');
  var meshPathB = './obj/branch.obj';
  var dataB = readTextFile(meshPathB);
  var meshB = new OBJ.Mesh(dataB);
  setBranch(new ObjInfo(meshB));
  var meshPathF = '../obj/flower.obj';
  var dataF = readTextFile(meshPathF);
  var meshF = new OBJ.Mesh(dataF);
  setFlower(new ObjInfo(meshF));
  var meshPathE = '../obj/endbranch.obj';
  var dataE = readTextFile(meshPathE);
  var meshE = new OBJ.Mesh(dataE);
  setEnd(new ObjInfo(meshE));
  var meshPathG = '../obj/lowground.obj';
  var dataG = readTextFile(meshPathG);
  var meshG = new OBJ.Mesh(dataG);
  ground = new Obj(meshG, vec4.create());
  ground.create();

  //load particle mesh
  var meshPathP = '../obj/cube.obj';
  var dataP = readTextFile(meshPathP);
  meshP = new OBJ.Mesh(dataP);
  particle = new Array<Obj>();

  //load tree
  tree = new Tree(vec3.fromValues(0, 0, 0), 2);
  tree.create();

  //generate centers
  centers = new Array<vec4>(20);
  for(let i = 0; i < 20; i++) {
    
    let x = (2 * Math.random() - 1) * 100;
    let y =  Math.random() * 50;
    let z = (2 * Math.random() - 1) * 100;

    centers[i] = vec4.fromValues(x, y, z, 1.0);
  }

  //-------------------generate particless
  particle = new Array<Obj>();
  for(let i = 0; i < 20; i++) {
    let p = new Obj(meshP, centers[i]);
    p.create();
    particle.push(p);
  }

  
  for(let i = 0; i < 20; i++) {
    cols.push(vec4.fromValues(1,1,0,0.2));
  }
  
}

// Used to assign color to object
var objColor: vec4;
// Used to change shader
var prog: ShaderProgram[];
// time
var time = 0;

//--------------------------------------main------------------------------------------
function main() {
  // Initial display for framerate
  const stats = Stats();
  stats.setMode(0);
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.left = '0px';
  stats.domElement.style.top = '0px';
  document.body.appendChild(stats.domElement);

  // Initialize obj color
  objColor = vec4.fromValues(0.93, 0.18, 0.48, 1);

  
  //----------------------------set webgl and canvas----------------------------
  // get canvas and webgl context
  const canvas = <HTMLCanvasElement> document.getElementById('canvas');
  const gl = <WebGL2RenderingContext> canvas.getContext('webgl2');
  if (!gl) {
    alert('WebGL 2 not supported!');
  }
  setGL(gl);


  //------------------------------GUI----------------------------------------
  // Add controls to the gui
  const gui = new DAT.GUI();
  gui.add(controls, 'tesselations', 0, 8).step(1);
  gui.add(controls, 'Load Scene');
  
  // Change color of cube
  gui.addColor(controls,'Color').onChange(function(){
 
    let color = [];

    color[0] = parseInt(controls.Color.slice(1, 3), 16);
    color[1] = parseInt(controls.Color.slice(3, 5), 16);
    color[2] = parseInt(controls.Color.slice(5, 7), 16);

    objColor = vec4.fromValues(color[0] / 255, 
                                color[1] / 255,
                                color[2] / 255,
                                1);
  });

  gui.add(controls, 'Axiom').onChange(function() {
    tree.destory();
    tree.updateAxiom(controls.Axiom);
    tree.create();
  })

  gui.add(controls, 'Iteration', 0, 10).step(1).onChange(function() {
    tree.destory();
    tree.updateIteration(controls.Iteration);
    tree.create();
  })

  gui.add(controls, 'Angle', 0, 180).step(5).onChange(function() {
    tree.destory();
    tree.updateAngle(controls.Angle);
    tree.create();
  })

  
  //-------------------set up scene, gl and camera-----------------
  // Initial call to load scene
  loadScene();
  const camera = new Camera(vec3.fromValues(0, 50, 100), vec3.fromValues(0, 0, 0));
  const renderer = new OpenGLRenderer(canvas);
  renderer.setClearColor(1.0, 0.72, 0.75, 1);
  gl.enable(gl.DEPTH_TEST);

  gl.enable(gl.BLEND);
  gl.cullFace(gl.FRONT);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);


  //-------------------shaders----------------------------
  const lambert1 = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/lambert-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/lambert-frag.glsl')),
  ]);

  const lambert2 = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/flow-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/flow-frag.glsl')),
  ]);

  const lambert3 = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/ground-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/ground-frag.glsl')),
  ]);

  const lambert4 = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/custom-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/custom-frag.glsl')),
  ]);

  prog = new Array<ShaderProgram>();
  prog.push(lambert3);
  prog.push(lambert1);
  prog.push(lambert1);
  prog.push(lambert4);

  let proP = new Array<ShaderProgram>();
  for(let i = 0; i < 20; i++) 
  {
    proP.push(lambert2);
  }
  
  
  //--------------------tick---------------------------------
  // call every frame
  function tick() {
    camera.update();
    stats.begin();
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);

    renderer.clear();
    renderer.render(camera, proP, particle, cols
      , time);
    renderer.render(camera, prog, [
      
      ground,
      tree.branch,
      tree.flower,
      square,
      
    ], [
      
      vec4.fromValues(255. / 255., 190. / 255., 100. / 255., 1),
      vec4.fromValues(60. / 255., 120. / 255., 19. / 255., 1),
      objColor,
      vec4.fromValues(1, 1, 1, 0.5),
    ]
    , time);


    

    time++;
    stats.end();
    requestAnimationFrame(tick);
  }


  //---------------------window listener-------------------------
  window.addEventListener('resize', function() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.setAspectRatio(window.innerWidth / window.innerHeight);
    camera.updateProjectionMatrix();
  }, false);

  
  

  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.setAspectRatio(window.innerWidth / window.innerHeight);
  camera.updateProjectionMatrix();

  tick();
}

main();
