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
    if (!mesh || !mesh.vertices || mesh.vertices.length === 0) {
        console.warn('Invalid or empty mesh:', mesh);
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

    // Ensure only valid bounding boxes are processed
    const validBoxes = boxes.filter(box => {
        if (
            !box ||
            !box.min ||
            !box.max ||
            box.min.length !== 3 ||
            box.max.length !== 3
        ) {
            console.warn('Invalid bounding box:', box);
            return false;
        }
        return true;
    });

    if (validBoxes.length === 0) {
        console.warn('All bounding boxes are invalid.');
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
        min: validBoxes.reduce((current, next) => {
            return vec3.min(current, current, next.min);
        }, initial.min),
        max: validBoxes.reduce((current, next) => {
            return vec3.max(current, current, next.max);
        }, initial.max),
    };
}






