import { quat, vec3, mat4 } from 'glm';

import { Transform } from '../core/Transform.js';
import { loadSounds, playSound } from '../soundManager.js';
import { aliveAnts, killAnt, resetAnts, returnAliveAnts, updateAntCount } from '../core/AntsAlive.js';  

export class FirstPersonController {

    constructor(node, domElement, {
        pitch = 0,
        yaw = 0,
        velocity = [0, 0, 0],
        acceleration = 25,
        maxSpeed = 3,
        decay = 0.99999,
        pointerSensitivity = 0.001,
    } = {}) {
        this.node = node;
        this.domElement = domElement;
        this.scene = null;
        this.keys = {};

        this.pitch = pitch;
        this.yaw = yaw;

        this.velocity = velocity;
        this.acceleration = acceleration;
        this.maxSpeed = maxSpeed;
        this.decay = decay;
        this.pointerSensitivity = pointerSensitivity;

        this.ShootCheck = true;
        this.heldItem = null; 
        this.spray = null;
        this.itemOffset = [0.2, -0.35, -0.7]; 
        this.spraylocalOffset = [0.15, -0, -0.75]; 

        this.ants = null;

        this.initHandlers();

    }

    initHandlers() {
        this.pointermoveHandler = this.pointermoveHandler.bind(this);
        this.keydownHandler = this.keydownHandler.bind(this);
        this.keyupHandler = this.keyupHandler.bind(this);
        this.Shoot = this.Shoot.bind(this);

        const element = this.domElement;
        const doc = element.ownerDocument;

        doc.addEventListener('keydown', this.keydownHandler);
        doc.addEventListener('keyup', this.keyupHandler);

        element.addEventListener('click', e => element.requestPointerLock());
        doc.addEventListener('pointerlockchange', e => {
            if (doc.pointerLockElement === element) {
                //console.log('Pointer lock activated');
                doc.addEventListener('pointermove', this.pointermoveHandler);
                doc.addEventListener('click', this.Shoot)
            } else {
                //console.warn('Pointer lock lost');
                doc.removeEventListener('pointermove', this.pointermoveHandler);
            }
        });
    }

    attachItem(item) {
        this.heldItem = item;
    }

    assignScene(scene){
        this.scene = scene;
    }

    assignSprayBall(spray)
    {
        this.spray = spray;
    }

    assignScene(spray){
        this.spray = spray;
    }
    addEnemyPositions(antPositions)
    {
        this.ants = antPositions;
    }

    update(t, dt) {
        const cos = Math.cos(this.yaw);
        const sin = Math.sin(this.yaw);
        const forward = [-sin, 0, -cos];
        const right = [cos, 0, -sin];

        const acc = vec3.create();
        if (this.keys['KeyW']) {
            vec3.add(acc, acc, forward);
        }
        if (this.keys['KeyS']) {
            vec3.sub(acc, acc, forward);
        }
        if (this.keys['KeyD']) {
            vec3.add(acc, acc, right);
        }
        if (this.keys['KeyA']) {
            vec3.sub(acc, acc, right);
        }

        vec3.scaleAndAdd(this.velocity, this.velocity, acc, dt * this.acceleration);

        if (!this.keys['KeyW'] &&
            !this.keys['KeyS'] &&
            !this.keys['KeyD'] &&
            !this.keys['KeyA'])
        {
            const decay = Math.exp(dt * Math.log(1 - this.decay));
            vec3.scale(this.velocity, this.velocity, decay);
        }

        const speed = vec3.length(this.velocity);
        if (speed > this.maxSpeed) {
            vec3.scale(this.velocity, this.velocity, this.maxSpeed / speed);
        }

        const transform = this.node.getComponentOfType(Transform);
        if (transform) {
            vec3.scaleAndAdd(transform.translation,
                transform.translation, this.velocity, dt);
            const rotation = quat.create();
            quat.rotateY(rotation, rotation, this.yaw);
            quat.rotateX(rotation, rotation, this.pitch);
            transform.rotation = rotation;
            if (this.heldItem) {
                const heldTransform = this.heldItem.getComponentOfType(Transform);
                const sprayTransform = this.spray.getComponentOfType(Transform);
                if (heldTransform) {
                    const cameraTransform = this.node.getComponentOfType(Transform);
                    if (cameraTransform) {
                        const localOffset = vec3.fromValues(...this.itemOffset);
                        const worldOffset = vec3.create();
                        vec3.transformQuat(worldOffset, localOffset, cameraTransform.rotation);
                        vec3.add(heldTransform.translation, cameraTransform.translation, worldOffset);
                        const additionalRotation = quat.create();
                        quat.rotateY(additionalRotation, quat.create(), 0.4); 
                        const combinedRotation = quat.create();
                        quat.multiply(combinedRotation, cameraTransform.rotation, additionalRotation);
                        heldTransform.rotation = combinedRotation;
                        const spraylocalOffset = vec3.fromValues(...this.spraylocalOffset);
                        vec3.transformQuat(worldOffset, spraylocalOffset, cameraTransform.rotation);
                        vec3.add(sprayTransform.translation, cameraTransform.translation, worldOffset);

                        if (this.ShootCheck) {
                            if (!this.sprayState) {
                                this.sprayState = {
                                    isShooting: true,
                                    travelProgress: 0, 
                                    repeatCount: 0,
                                    maxRepeats: 1, 
                                    forward: vec3.create(),
                                    startPosition: vec3.create(),
                                    endPosition: vec3.create(),
                                };
                                sprayTransform.scale = vec3.fromValues(0.01, 0.01, 0.01);
                                // forward direction
                                vec3.set(this.sprayState.forward, 0, 0, -1.1); 
                                vec3.transformQuat(this.sprayState.forward, this.sprayState.forward, cameraTransform.rotation); // World space
                                vec3.copy(this.sprayState.startPosition, sprayTransform.translation);
                                vec3.scaleAndAdd(this.sprayState.endPosition, this.sprayState.startPosition, this.sprayState.forward, 1.0); // Max distance
                            }
                            const speed = 5.0; // Adjust for smoothness
                            this.sprayState.travelProgress += speed * dt;
                            this.sprayState.travelProgress = Math.max(0, Math.min(1, this.sprayState.travelProgress));
                        
                            vec3.lerp(
                                sprayTransform.translation,
                                this.sprayState.startPosition,
                                this.sprayState.endPosition,
                                this.sprayState.travelProgress
                            );
                        
                            if (this.sprayState.travelProgress >= 1.0) {
                                vec3.copy(sprayTransform.translation, this.sprayState.startPosition);
                                this.sprayState.travelProgress = 0.0;
                                this.sprayState.repeatCount++;
                                //Spray reaches end
                                if (this.sprayState.repeatCount >= this.sprayState.maxRepeats) {
                                    this.sprayState = null; 
                                    sprayTransform.scale = vec3.fromValues(0.00001, 0.00001, 0.00001);
                                    //this.spray.parent.removeChild(this.spray);
                                    this.ShootCheck = false;
                                }
                            }
                        }
                    }
                }
            }

        }
    }

    keydownHandler(e) {
        this.keys[e.code] = true;
    }
    
    keyupHandler(e) {
        this.keys[e.code] = false;
    }

    Shoot(e) {
        if (document.pointerLockElement === null) {
            return false;
        }
        else    {
        const CameraPosition = this.node.getComponentOfType(Transform);
        const forward = vec3.create();
        playSound('spray');

        vec3.set(forward, 0, 0, -1); 
        vec3.transformQuat(forward, forward, CameraPosition.rotation); 
        this.ShootCheck = true;
        this.ants.forEach((Ant) => {
            const AntPosition = Ant.getComponentOfType(Transform);
            if (this.heldItem) {
                const toAnt = vec3.create();
                vec3.sub(toAnt, AntPosition.translation, CameraPosition.translation);
                const dot = vec3.dot(forward, vec3.normalize(toAnt, toAnt)); 
                if (dot > 0.99) { 
                const distance = vec3.distance(CameraPosition.translation, AntPosition.translation);
                if (distance < 3.5) { 
                    console.log(`Interacted with: ${Ant.Name}`);
                    // Ant.parent.removeChild(Ant);    <--- instad of remove, move the ant below ground 
                    vec3.copy(AntPosition.translation,  [-3.120896339416504, -100, -8.412511825561523]);
                    playSound('death');
                    var index = this.ants.indexOf(Ant);
                    this.ants.splice(index, 1);
                    killAnt();
                    updateAntCount();
                    }
                }
             }
          });
        }
    }
    
    pointermoveHandler(e) {
        const dx = e.movementX;
        const dy = e.movementY;

        this.pitch -= dy * this.pointerSensitivity;
        this.yaw   -= dx * this.pointerSensitivity;

        const twopi = Math.PI * 2;
        const halfpi = Math.PI / 2;

        this.pitch = Math.min(Math.max(this.pitch, -halfpi), halfpi);
        this.yaw = ((this.yaw % twopi) + twopi) % twopi;
    }

}
