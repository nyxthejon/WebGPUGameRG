export class Light {
    constructor({
        color = [1, 1, 1],
        intensity = 1.0,
        type = 'point',
        name = 'Light'
    } = {}) {
        this.color = color;
        this.intensity = intensity;
        this.type = type;
        this.name = name;
    }
}