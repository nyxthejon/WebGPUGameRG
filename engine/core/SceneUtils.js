import { mat4 } from 'glm';

import { Camera } from './Camera.js';
import { Model } from './Model.js';
import { Transform } from './Transform.js';


export function getLocalModelMatrix(node) {
    try {
        const matrix = mat4.create();
        for (const transform of node.getComponentsOfType(Transform)) {
            const transformMatrix = transform.matrix;
            if (transformMatrix.some(isNaN)) {
                throw new Error('Transform matrix contains NaN values');
            }
            mat4.multiply(matrix, matrix, transformMatrix);
        }
        return matrix;
    } catch (error) {
        console.error('Error calculating local model matrix:', error, node);
        return mat4.create(); // Return identity matrix as fallback
    }
}

export function getGlobalModelMatrix(node) {
    const localMatrix = getLocalModelMatrix(node);
    if (node.parent) {
        const parentMatrix = getGlobalModelMatrix(node.parent);
        return mat4.multiply(mat4.create(), parentMatrix, localMatrix);
    }
    return localMatrix;
}




export function getLocalViewMatrix(node) {
    return getLocalModelMatrix(node).invert();
}

export function getGlobalViewMatrix(node) {
    return getGlobalModelMatrix(node).invert();
}

export function getProjectionMatrix(node) {
    return node.getComponentOfType(Camera)?.projectionMatrix ?? mat4.create();
}
