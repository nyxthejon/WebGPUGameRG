import { ResizeSystem } from 'engine/systems/ResizeSystem.js';
import { UpdateSystem } from 'engine/systems/UpdateSystem.js';
import { Transform } from 'engine/core/Transform.js';
import { Light } from '/engine/core/Light.js';
import { GLTFLoader } from 'engine/loaders/GLTFLoader.js';
//import { UnlitRenderer } from 'engine/renderers/UnlitRenderer.js';
import { LitRenderer } from 'engine/renderers/LitRenderer.js';


import { FirstPersonController } from 'engine/controllers/FirstPersonController.js';

import { Camera, Model } from 'engine/core.js';

import {
    calculateAxisAlignedBoundingBox,
    mergeAxisAlignedBoundingBoxes,
} from 'engine/core/MeshUtils.js';

import { Physics } from 'engine/Physics.js';


const canvas = document.querySelector('canvas');
//const renderer = new UnlitRenderer(canvas);
const renderer = new LitRenderer(canvas);
await renderer.initialize();

const loader = new GLTFLoader();
await loader.load(new URL('blender fix/dizajn3cameratest6.gltf', import.meta.url));
console.log(loader);
const scene = loader.loadScene(loader.defaultScene);
if (!scene) {
    throw new Error('A default scene is required to run this example');
}

scene.addComponent(new Light());

const camera = scene.find(node => node.getComponentOfType(Camera));
if (!camera) {
    throw new Error('A camera in the scene is required to run this example');
}

// Ensure the camera has a Transform component
let transform = camera.getComponentOfType(Transform);


camera.addComponent(new FirstPersonController(camera, canvas));
camera.isDynamic = true;
camera.fov = 30;
camera.aabb = {
    min: [-0.1, -0.1, -0.1],
    max: [0.1, 0.1, 0.1],
};

console.log("camera loaded: ", camera);

const controller = camera.getComponentOfType(FirstPersonController);


// const physics = new Physics(scene);
// scene.traverse(node => {
//     const model = node.getComponentOfType(Model);
//     if (!model) {
//         return;
//     }

//     const boxes = model.primitives.map(primitive => calculateAxisAlignedBoundingBox(primitive.mesh));
//     node.aabb = mergeAxisAlignedBoundingBoxes(boxes);
// });

function update(time, dt) {
    scene.traverse(node => {
        for (const component of node.components) {
            component.update?.(time, dt);
        }
    });

    //Physics.update(time, dt);
}


function render() {
    renderer.render(scene, camera);
}

function resize({ displaySize: { width, height }}) {
    camera.getComponentOfType(Camera).aspect = width / height;
}

new UpdateSystem({ update,render }).start();
new ResizeSystem({ canvas, resize }).start();
