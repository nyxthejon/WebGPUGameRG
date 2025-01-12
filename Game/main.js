import { ResizeSystem } from 'engine/systems/ResizeSystem.js';
import { UpdateSystem } from 'engine/systems/UpdateSystem.js';
import { Transform } from 'engine/core/Transform.js';
import { quat, vec3, mat4 } from 'glm';
import { Light } from '/engine/core/Light.js';
import { GLTFLoader } from 'engine/loaders/GLTFLoader.js';
import { LitRenderer } from 'engine/renderers/LitRenderer.js';
import { loadSounds, playSound } from '../engine/soundManager.js';
import { AntTransforms, RefillTransforms, getRandomAndRemove } from 'engine/core/antPositions.js'
import { showGameOverOverlay, hideGameOverlay, restartGame } from './overlay.js';
import { difficulty, getGameTime, makeGameHarder, resetGameDifficulty, returnDifficulty } from '../engine/core/difficulty.js';
import { resetAnts, returnAliveAnts, updateAntCount } from '../engine/core/AntsAlive.js';
import { FirstPersonController } from 'engine/controllers/FirstPersonController.js';
import { Camera, Model } from 'engine/core.js';
import { calculateAxisAlignedBoundingBox, mergeAxisAlignedBoundingBoxes,} from 'engine/core/MeshUtils.js';
import { Physics } from 'engine/Physics.js';



function showLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    loadingScreen.style.display = 'flex';
  }
  
  // Hide the loading screen
  function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    loadingScreen.style.display = 'none';
  }

  showLoadingScreen();


const canvas = document.querySelector('canvas');
const renderer = new LitRenderer(canvas);
await renderer.initialize();

const loader = new GLTFLoader();
await loader.load(new URL('blender fix/FINAL.gltf', import.meta.url));
const scene = loader.loadScene(loader.defaultScene);
if (!scene) {
    throw new Error('A default scene is required to run this example');
}

var ants = [];

const camera = scene.find(node => node.getComponentOfType(Camera));
if (!camera) {
    throw new Error('A camera in the scene is required to run this example');
}

// Ensure the camera has a Transform component
let transform = camera.getComponentOfType(Transform);
camera.addComponent(new FirstPersonController(camera, canvas));
camera.isDynamic = true;
camera.aabb = {
    min: [-0.1, -0.1, -0.1],
    max: [0.1, 0.1, 0.1],
};

//console.log("camera loaded: ", camera);
const Weapon = scene.find(node => node.Name === 'Weapon'); 
const Spray = scene.find(node => node.Name === 'SprayEmitter'); 
const controller = camera.getComponentOfType(FirstPersonController);
controller.attachItem(Weapon); 
controller.assignScene(scene);
controller.assignSprayBall(Spray)


//Wall initialization
scene.traverse(node => {
    if(node.Name.startsWith('Wall'))
    {
        node.isStatic = true;
    }
    if(node.Name.startsWith('HiddenWall'))
    {
        node.isStatic = true;
        node.isVisible = false;
    }
});



function antLocations()
    {
    RefillTransforms();
    scene.traverse(node => {
        if(node.Name.startsWith('ANT'))
        {
            //console.log(node);
            var position = node.getComponentOfType(Transform);
            //console.log("Ant position", position);
            var targetPosition = getRandomAndRemove(AntTransforms);
            //console.log("Target position", targetPosition);
            vec3.copy(position.translation, targetPosition.translation);
            //console.log(AntTransforms.length);
            ants.push(node);
        }
    });
    controller.addEnemyPositions(ants);
}

//Collision
const physics = new Physics(scene);
scene.traverse(node => {
    const model = node.getComponentOfType(Model);
    if (!model) {
        //console.warn('Node has no model component:', node.name || node);
        return;
    }
    const boxes = model.primitives.map((primitive, index) => {
        const aabb = calculateAxisAlignedBoundingBox(primitive.mesh);
        //console.log(`Calculated AABB for primitive ${index} of node ${node.name || 'Unnamed'}:`, aabb);
        return aabb;
    });
    const validBoxes = boxes.filter(box => box && box.min && box.max);
    if (validBoxes.length === 0) {
        //console.warn(`No valid AABBs for node: ${node.name || 'Unnamed'}`);
        return;
    }
    const mergedBox = mergeAxisAlignedBoundingBoxes(validBoxes);
    //console.log(`Merged AABB for node ${node.name || 'Unnamed'}:`, mergedBox);
    node.aabb = mergedBox;
});

function update(time, dt) {
    scene.traverse(node => {
        for (const component of node.components) {
            component.update?.(time, dt);
        }
    });

    physics.update(time, dt);
}


async function initializeSounds() {
    await loadSounds([
        { name: 'spray', url: '../engine/sounds/spray.mp3' },
        { name: 'music', url: '../engine/sounds/music.mp3' },
        { name: 'death', url: '../engine/sounds/death.mp3' }

    ]);
}

initializeSounds();



function render() {
    renderer.render(scene, camera);
}
function resize({ displaySize: { width, height }}) {
    camera.getComponentOfType(Camera).aspect = width / height;
}
new UpdateSystem({ update, render }).start();
new ResizeSystem({ canvas, resize }).start();


document.getElementById('restart-button').addEventListener('click', restartGame);
document.getElementById('continue-button').addEventListener('click', startGame);
const timerText = document.getElementById('timer-text');

function startTimer() {
    console.log("Diffculty: ", difficulty.value);
    let timeLeft = getGameTime(); 
    let timerInterval;
    timerInterval = setInterval(() => {
        if (timeLeft > 0 && returnAliveAnts() > 0) {
            timeLeft--;
            timerText.textContent = timeLeft; 
        } else if(timeLeft == 0){
            clearInterval(timerInterval);
            endGame("Lost"); 
        }
        else if(returnAliveAnts() == 0)
        {
            clearInterval(timerInterval);
            endGame("Win");
        }
    }, 1000); 
}


function endGame(outcome) {
    if(outcome == "Lost")
    setTimeout(showGameOverOverlay("GameOver", returnDifficulty()), 10);
    else if(outcome == "Win"){
        setTimeout(showGameOverOverlay("Win", returnDifficulty()), 10);
    }
}

function startGame()
{
    if(returnAliveAnts() == 0)
    {
        makeGameHarder();
        resetAnts()
        updateAntCount();
        hideGameOverlay();
    }

    ants = [];
    antLocations();
    startTimer();
    //playSound('music');

    transform = camera.getComponentOfType(Transform);
    vec3.copy(transform.translation, [-0.009912334382534027, 0.7955900430679321, 3.237427234649658]);
    //quat.copy(transform.rotation, [0.025223059579730034, -0.043589942157268524, 0.007333328016102314, 0.9987041354179382]);
    
    const modelMatrix = mat4.create();
    mat4.translate(modelMatrix, modelMatrix, transform.translation);
}


startGame();

hideLoadingScreen(); 

