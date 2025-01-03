import { quat, vec3, vec4, mat3, mat4 } from 'glm';

export function transformVertex(vertex, matrix,
    normalMatrix = mat3.normalFromMat4(mat3.create(), matrix),
    tangentMatrix = mat3.fromMat4(mat3.create(), matrix),
) {
    vec3.transformMat4(vertex.position, vertex.position, matrix);
    vec3.transformMat3(vertex.normal, vertex.normal, normalMatrix);
    vec3.transformMat3(vertex.tangent, vertex.tangent, tangentMatrix);
}

export function transformMesh(mesh, matrix,
    normalMatrix = mat3.normalFromMat4(mat3.create(), matrix),
    tangentMatrix = mat3.fromMat4(mat3.create(), matrix),
) {
    for (const vertex of mesh.vertices) {
        transformVertex(vertex, matrix, normalMatrix, tangentMatrix);
    }
}

export function calculateAxisAlignedBoundingBox(mesh) {
    if (!mesh.vertices || mesh.vertices.length === 0) {
        console.warn('Mesh has no vertices:', mesh);
        return {
            min: vec3.fromValues(Infinity, Infinity, Infinity),
            max: vec3.fromValues(-Infinity, -Infinity, -Infinity),
        };
    }

    const initial = {
        min: vec3.clone(mesh.vertices[0].position),
        max: vec3.clone(mesh.vertices[0].position),
    };

    return {
        min: mesh.vertices.reduce((a, b) => {
            if (!b || !b.position) {
                console.warn('Invalid vertex position:', b);
                return a;
            }
            return vec3.min(a, a, b.position);
        }, initial.min),
        max: mesh.vertices.reduce((a, b) => {
            if (!b || !b.position) {
                console.warn('Invalid vertex position:', b);
                return a;
            }
            return vec3.max(a, a, b.position);
        }, initial.max),
    };
}


export function mergeAxisAlignedBoundingBoxes(boxes) {
    if (!boxes || boxes.length === 0) {
        console.warn('No bounding boxes to merge.');
        return {
            min: vec3.fromValues(Infinity, Infinity, Infinity),
            max: vec3.fromValues(-Infinity, -Infinity, -Infinity),
        };
    }

    // Validate and filter boxes
    const validBoxes = boxes.filter(box => {
        const isValid = box &&
            box.min && box.max &&
            box.min.length === 3 &&
            box.max.length === 3 &&
            box.min.every(value => typeof value === 'number') &&
            box.max.every(value => typeof value === 'number');

        if (!isValid) {
            console.warn('Invalid bounding box detected:', box);
        }
        return isValid;
    });

    if (validBoxes.length === 0) {
        console.warn('No valid bounding boxes to merge.');
        return {
            min: vec3.fromValues(Infinity, Infinity, Infinity),
            max: vec3.fromValues(-Infinity, -Infinity, -Infinity),
        };
    }

    const initial = {
        min: vec3.clone(validBoxes[0].min),
        max: vec3.clone(validBoxes[0].max),
    };

    return {
        min: validBoxes.reduce(({ min: amin }, { min: bmin }) => {
            console.log('Reducing min:', amin, bmin);
            return vec3.min(amin, amin, bmin);
        }, initial.min),
        max: validBoxes.reduce(({ max: amax }, { max: bmax }) => {
            console.log('Reducing max:', amax, bmax);
            return vec3.max(amax, amax, bmax);
        }, initial.max),
    };
}


