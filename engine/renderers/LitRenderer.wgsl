struct Camera {
    viewMatrix: mat4x4f,
    projectionMatrix: mat4x4f
}

struct Model {
    modelMatrix: mat4x4f,
    normalMatrix: mat4x4f
}

struct Material {
    baseColorFactor: vec4f,
}

struct Light {
    position: vec3f,
    color: vec3f,
    intensity: f32,
}

@group(0) @binding(0) var<uniform> camera: Camera;
@group(1) @binding(0) var<uniform> model: Model;
@group(2) @binding(0) var<uniform> material: Material;
@group(2) @binding(1) var baseColorTexture: texture_2d<f32>;
@group(2) @binding(2) var baseColorSampler: sampler;
@group(3) @binding(0) var<uniform> light: Light;

struct VertexOutput {
    @builtin(position) position: vec4f,
    @location(0) worldPos: vec3f,
    @location(1) normal: vec3f,
    @location(2) texcoords: vec2f,
}

@vertex
fn vertexMain(
    @location(0) position: vec3f,
    @location(1) normal: vec3f,
    @location(2) texcoords: vec2f,
) -> VertexOutput {
    var output: VertexOutput;
    output.worldPos = (model.modelMatrix * vec4f(position, 1)).xyz;
    output.normal = normalize((model.normalMatrix * vec4f(normal, 0)).xyz);
    output.position = camera.projectionMatrix * camera.viewMatrix * vec4f(output.worldPos, 1);
    output.texcoords = texcoords;
    return output;
}

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
    let baseColor = textureSample(baseColorTexture, baseColorSampler, input.texcoords) * material.baseColorFactor;
    
    // Calculate lighting
    let lightDir = normalize(light.position - input.worldPos);
    let normal = normalize(input.normal);
    
    // Diffuse lighting
    let diff = max(dot(normal, lightDir), 0.0);
    let diffuse = light.color * diff * light.intensity;
    
    // Ambient lighting
    let ambient = vec3f(0.1);
    
    // Final color
    let finalColor = baseColor.rgb * (ambient + diffuse);
    return vec4f(finalColor, baseColor.a);
}