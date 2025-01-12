
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const audioBuffers = new Map();

async function loadSound(name, url) {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    audioBuffers.set(name, audioBuffer);
}

function playSound(name) {
    const audioBuffer = audioBuffers.get(name);
    if (!audioBuffer) {
        console.error(`Sound "${name}" not loaded.`);
        return;
    }
    const soundSource = audioContext.createBufferSource();
    soundSource.buffer = audioBuffer;
    soundSource.connect(audioContext.destination);
    soundSource.start(0);
}

async function loadSounds(sounds) {
    const promises = sounds.map(({ name, url }) => loadSound(name, url));
    await Promise.all(promises);
    console.log("All sounds loaded.");
}

export { loadSound, playSound, loadSounds };
