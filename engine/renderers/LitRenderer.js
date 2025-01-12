import { mat4 } from 'glm';
import * as WebGPU from '../WebGPU.js';
import { Camera, Model } from '../core.js';
import { Light } from 'engine/core/Light.js';
import { Transform } from 'engine/core/Transform.js';

import {
    getLocalModelMatrix,
    getGlobalViewMatrix,
    getProjectionMatrix,
} from '../core/SceneUtils.js';
import { BaseRenderer } from './BaseRenderer.js';

const vertexBufferLayout = {
    arrayStride: 32, // position(12) + normal(12) + texcoords(8) = 32 bytes
    attributes: [
        {
            // Position
            name: 'position',
            shaderLocation: 0,
            offset: 0,
            format: 'float32x3',
        },
        {
            // Normal
            name: 'normal',
            shaderLocation: 1,
            offset: 12,
            format: 'float32x3',
        },
        {
            // Texcoords
            name: 'texcoords',
            shaderLocation: 2,
            offset: 24,
            format: 'float32x2',
        },
    ],
};

export class LitRenderer extends BaseRenderer {
    constructor(canvas) {
        super(canvas);
        this.lights = new Map();
    }

    async initialize() {
        await super.initialize();
    
        const code = await fetch(new URL('LitRenderer.wgsl', import.meta.url))
            .then(response => response.text());
        const module = this.device.createShaderModule({ code });
    
        this.pipeline = await this.device.createRenderPipelineAsync({
            layout: 'auto',
            vertex: {
                module,
                buffers: [vertexBufferLayout],
                entryPoint: 'vertexMain',
            },
            fragment: {
                module,
                targets: [{ format: this.format }],
                entryPoint: 'fragmentMain',
            },
            depthStencil: {
                format: 'depth24plus',
                depthWriteEnabled: true,
                depthCompare: 'less',
            },
        });
    
        this.lightUniformBuffer = this.device.createBuffer({
            size: 32, 
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
    
        this.lightBindGroup = this.device.createBindGroup({
            layout: this.pipeline.getBindGroupLayout(3),
            entries: [
                {
                    binding: 0,
                    resource: { buffer: this.lightUniformBuffer },
                },
            ],
        });
    
        this.recreateDepthTexture();
    }

    recreateDepthTexture() {
        this.depthTexture?.destroy();
        this.depthTexture = this.device.createTexture({
            format: 'depth24plus',
            size: [this.canvas.width, this.canvas.height],
            usage: GPUTextureUsage.RENDER_ATTACHMENT,
        });
    }

    updateLight(lightId, position, color, intensity) {
        const light = this.lights.get(lightId);
        if (!light) return;

        light.properties.position.set(position);
        light.properties.color.set(color);
        light.properties.intensity = intensity;

        const data = new Float32Array([
            ...position, 0, 
            ...color, intensity 
        ]);

        this.device.queue.writeBuffer(light.uniformBuffer, 0, data);
    }

    prepareNode(node) {
        if (this.gpuObjects.has(node)) {
            return this.gpuObjects.get(node);
        }

        const modelUniformBuffer = this.device.createBuffer({
            size: 128,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        const modelBindGroup = this.device.createBindGroup({
            layout: this.pipeline.getBindGroupLayout(1),
            entries: [
                { binding: 0, resource: { buffer: modelUniformBuffer } },
            ],
        });

        const gpuObjects = { modelUniformBuffer, modelBindGroup };
        this.gpuObjects.set(node, gpuObjects);
        return gpuObjects;
    }

    render(scene, camera) {
        if (this.depthTexture.width !== this.canvas.width || 
            this.depthTexture.height !== this.canvas.height) {
            this.recreateDepthTexture();
        }

        const encoder = this.device.createCommandEncoder();
        this.renderPass = encoder.beginRenderPass({
            colorAttachments: [{
                view: this.context.getCurrentTexture().createView(),
                clearValue: [0.1, 0.1, 0.1, 1],
                loadOp: 'clear',
                storeOp: 'store',
            }],
            depthStencilAttachment: {
                view: this.depthTexture.createView(),
                depthClearValue: 1,
                depthLoadOp: 'clear',
                depthStoreOp: 'discard',
            },
        });

        this.renderPass.setPipeline(this.pipeline);

        // Set up camera
        const cameraComponent = camera.getComponentOfType(Camera);
        if (!cameraComponent) {
            console.error('Camera node is missing a Camera component');
            return;
        }


        const viewMatrix = getGlobalViewMatrix(camera);
        const projectionMatrix = getProjectionMatrix(camera);
        if (!viewMatrix) {
            console.error('Failed to calculate View Matrix');
            return;
        }
        if (!projectionMatrix) {
            console.error('Failed to calculate Projection Matrix');
            return;
        }

        const { cameraUniformBuffer, cameraBindGroup } = this.prepareCamera(cameraComponent);

        this.device.queue.writeBuffer(cameraUniformBuffer, 0, new Float32Array(viewMatrix));
        this.device.queue.writeBuffer(cameraUniformBuffer, 64, new Float32Array(projectionMatrix));
        this.renderPass.setBindGroup(0, cameraBindGroup);


        // Light
        const lights = [];
        this.renderPass.setBindGroup(0, cameraBindGroup);
        this.renderPass.setBindGroup(3, this.lightBindGroup);



        
        scene.traverse(node => {
            const light = node.getComponentOfType(Light);
            if (light) {
                const transform = node.getComponentOfType(Transform);
                const position = transform ? transform.translation : [0, 5, 0];
                
                const lightData = new Float32Array([
                    ...position, 0,  
                    ...light.color,  
                    light.intensity * 0.00001,  
                ]);
                
                this.device.queue.writeBuffer(this.lightUniformBuffer, 0, lightData);
            }
        });

        const lightId = lights[0] || 'default';
        const light = this.lights.get(lightId);
        if (light) {
            this.renderPass.setBindGroup(3, light.bindGroup);
        }

        // Render scene
        this.renderNode(scene);

        this.renderPass.end();
        this.device.queue.submit([encoder.finish()]);
    }

    renderModel(model) {
        for (const primitive of model.primitives) {
            this.renderPrimitive(primitive);
        }
    }

    prepareCamera(camera) {
        if (this.gpuObjects.has(camera)) {
            return this.gpuObjects.get(camera);
        }

        const cameraUniformBuffer = this.device.createBuffer({
            size: 128,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        const cameraBindGroup = this.device.createBindGroup({
            layout: this.pipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: cameraUniformBuffer } },
            ],
        });

        const gpuObjects = { cameraUniformBuffer, cameraBindGroup };
        this.gpuObjects.set(camera, gpuObjects);
        return gpuObjects;
    }

    prepareTexture(texture) {
        if (!texture || !texture.image) {
            console.warn('Skipping texture: texture or texture.image is undefined:', texture);
            return {
                gpuTexture: this.device.createTexture({
                    size: [1, 1, 1],
                    format: 'rgba8unorm',
                    usage: GPUTextureUsage.TEXTURE_BINDING,
                }),
                gpuSampler: this.device.createSampler({}),
            };
        }

        if (this.gpuObjects.has(texture)) {
            return this.gpuObjects.get(texture);
        }

        const { gpuTexture } = this.prepareImage(texture.image);
        const { gpuSampler } = this.prepareSampler(texture.sampler);

        const gpuObjects = { gpuTexture, gpuSampler };
        this.gpuObjects.set(texture, gpuObjects);
        return gpuObjects;
    }

    prepareMaterial(material) {
        if (this.gpuObjects.has(material)) {
            return this.gpuObjects.get(material);
        }

        const baseTexture = material.baseTexture
            ? this.prepareTexture(material.baseTexture)
            : {
                gpuTexture: this.device.createTexture({
                    size: [1, 1, 1],
                    format: 'rgba8unorm',
                    usage: GPUTextureUsage.TEXTURE_BINDING,
                }),
                gpuSampler: this.device.createSampler({}),
            };

        const materialUniformBuffer = this.device.createBuffer({
            size: 16,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        const materialBindGroup = this.device.createBindGroup({
            layout: this.pipeline.getBindGroupLayout(2),
            entries: [
                { binding: 0, resource: { buffer: materialUniformBuffer } },
                { binding: 1, resource: baseTexture.gpuTexture.createView() },
                { binding: 2, resource: baseTexture.gpuSampler },
            ],
        });

        const gpuObjects = { materialUniformBuffer, materialBindGroup };
        this.gpuObjects.set(material, gpuObjects);
        return gpuObjects;
    }

    renderPrimitive(primitive) {
        const material = primitive.material || {
            baseFactor: [1.0, 1.0, 1.0, 1.0],
            baseTexture: null,
        };

        const { materialUniformBuffer, materialBindGroup } = this.prepareMaterial(material);
        this.device.queue.writeBuffer(materialUniformBuffer, 0, new Float32Array(material.baseFactor));
        this.renderPass.setBindGroup(2, materialBindGroup);

        const { vertexBuffer, indexBuffer } = this.prepareMesh(primitive.mesh, vertexBufferLayout);
        this.renderPass.setVertexBuffer(0, vertexBuffer);
        this.renderPass.setIndexBuffer(indexBuffer, 'uint32');
        this.renderPass.drawIndexed(primitive.mesh.indices.length);
    }

    renderNode(node, modelMatrix = mat4.create()) {
        const localMatrix = getLocalModelMatrix(node);
        modelMatrix = mat4.multiply(mat4.create(), modelMatrix, localMatrix);
        const normalMatrix = mat4.normalFromMat4(mat4.create(), modelMatrix);

        const { modelUniformBuffer, modelBindGroup } = this.prepareNode(node);
        this.device.queue.writeBuffer(modelUniformBuffer, 0, new Float32Array(modelMatrix));
        this.device.queue.writeBuffer(modelUniformBuffer, 64, new Float32Array(normalMatrix));
        this.renderPass.setBindGroup(1, modelBindGroup);

        for (const model of node.getComponentsOfType(Model)) {
            this.renderModel(model);
        }

        for (const child of node.children) {
            if(child.isVisible != false){
                this.renderNode(child, modelMatrix);
            }
        }
    }

    prepareMaterial(material) {
        if (this.gpuObjects.has(material)) {
            return this.gpuObjects.get(material);
        }

        const baseTexture = material.baseTexture
            ? this.prepareTexture(material.baseTexture)
            : {
                gpuTexture: this.device.createTexture({
                    size: [1, 1, 1],
                    format: 'rgba8unorm',
                    usage: GPUTextureUsage.TEXTURE_BINDING,
                }),
                gpuSampler: this.device.createSampler({}),
            };

        const materialUniformBuffer = this.device.createBuffer({
            size: 16,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        const materialBindGroup = this.device.createBindGroup({
            layout: this.pipeline.getBindGroupLayout(2),
            entries: [
                { binding: 0, resource: { buffer: materialUniformBuffer } },
                { binding: 1, resource: baseTexture.gpuTexture.createView() },
                { binding: 2, resource: baseTexture.gpuSampler },
            ],
        });

        const gpuObjects = { materialUniformBuffer, materialBindGroup };
        this.gpuObjects.set(material, gpuObjects);
        return gpuObjects;
    }

}