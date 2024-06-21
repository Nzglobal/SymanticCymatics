// app.js

let scene, camera, renderer, analyser, dataArray;
let particleSystem;
let audioContext;
let rotateBehavior = false; // Variable to toggle rotation behavior

const init = () => {
    // Set up the scene, camera, and renderer
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('visualizer') });
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.position.z = 150; // Move the camera further back for better view

    // Add particle system
    const particleCount = 10000; // Increase particle count for denser effect
    const particles = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3); // For storing colors
    for (let i = 0; i < particleCount; i++) {
        const theta = Math.random() * 2 * Math.PI;
        const radius = Math.random() * 50; // Smaller radius for more concentrated particles
        particlePositions[i * 3] = radius * Math.cos(theta);
        particlePositions[i * 3 + 1] = radius * Math.sin(theta);
        particlePositions[i * 3 + 2] = Math.random() * 10 - 5; // Small Z variation

        // Initialize colors to white
        colors[i * 3] = 1;
        colors[i * 3 + 1] = 1;
        colors[i * 3 + 2] = 1;
    }
    particles.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particles.setAttribute('color', new THREE.BufferAttribute(colors, 3)); // Set colors

    const particleMaterial = new THREE.PointsMaterial({ size: 1, vertexColors: true }); // Decrease particle size
    particleSystem = new THREE.Points(particles, particleMaterial);
    scene.add(particleSystem);

    // Handle microphone input
    document.getElementById('startButton').addEventListener('click', () => {
        startAudioContext();
    });

    animate();
}

const startAudioContext = () => {
    // Initialize audio context and analyser
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    dataArray = new Uint8Array(analyser.frequencyBinCount);

    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            const microphone = audioContext.createMediaStreamSource(stream);
            microphone.connect(analyser);
            document.getElementById('startButton').style.display = 'none'; // Hide the start button after starting
        })
        .catch(err => console.error('Error accessing microphone: ', err));
}

const animate = () => {
    requestAnimationFrame(animate);
    if (analyser) {
        analyser.getByteFrequencyData(dataArray);
    }

    // Update particles based on frequency data
    const positions = particleSystem.geometry.attributes.position.array;
    const colors = particleSystem.geometry.attributes.color.array;
    let highFrequencySum = 0;
    let lowFrequencySum = 0;
    
    for (let i = 0; i < positions.length / 3; i++) {
        const freqIndex = i % dataArray.length;
        const value = dataArray[freqIndex];
        const yPos = (value / 255) * 100 - 50; // Scale the yPos more drastically for cymatic effect

        // Update particle positions to form cymatic patterns
        const theta = (i / positions.length) * 2 * Math.PI * 3;
        const radius = Math.abs(yPos); // Use yPos for radius to create rings
        const x = radius * Math.cos(theta);
        const y = radius * Math.sin(theta);
        const z = Math.sin(theta * 3 + performance.now() * 0.001) * 30; // Add oscillation for 3D effect

        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;

        // Update color based on frequency data
        const hue = (value / 255) * 360;
        const color = new THREE.Color(`hsl(${hue}, 100%, 50%)`);
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;

        // Sum frequencies for rotation behavior
        if (freqIndex > dataArray.length / 2) {
            highFrequencySum += value;
        } else {
            lowFrequencySum += value;
        }
    }
    particleSystem.geometry.attributes.position.needsUpdate = true;
    particleSystem.geometry.attributes.color.needsUpdate = true;

    // Rotate the system based on frequency data
    if (rotateBehavior) {
        if (highFrequencySum > lowFrequencySum) {
            particleSystem.rotation.x += 0.01; // Rotate up for high frequencies
        } else {
            particleSystem.rotation.y += 0.01; // Rotate left for low frequencies
        }
    } else {
        // Default rotation
        particleSystem.rotation.x += 0.001;
        particleSystem.rotation.y += 0.002;
    }

    renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

let isDragging = false;
let previousMousePosition = {
    x: 0,
    y: 0
};

const toRadians = angle => angle * (Math.PI / 180);
const toDegrees = angle => angle * (180 / 360);

document.addEventListener('mousedown', e => {
    isDragging = true;
});

document.addEventListener('mousemove', e => {
    if (isDragging) {
        const deltaMove = {
            x: e.offsetX - previousMousePosition.x,
            y: e.offsetY - previousMousePosition.y
        };

        const deltaRotationQuaternion = new THREE.Quaternion()
            .setFromEuler(new THREE.Euler(
                toRadians(deltaMove.y * 1),
                toRadians(deltaMove.x * 1),
                0,
                'XYZ'
            ));

        particleSystem.quaternion.multiplyQuaternions(deltaRotationQuaternion, particleSystem.quaternion);

        previousMousePosition = {
            x: e.offsetX,
            y: e.offsetY
        };
    }
});

document.addEventListener('mouseup', () => {
    isDragging = false;
});

document.addEventListener('touchstart', e => {
    isDragging = true;
    previousMousePosition = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
    };
});

document.addEventListener('touchmove', e => {
    if (isDragging) {
        const deltaMove = {
            x: e.touches[0].clientX - previousMousePosition.x,
            y: e.touches[0].clientY - previousMousePosition.y
        };

        const deltaRotationQuaternion = new THREE.Quaternion()
            .setFromEuler(new THREE.Euler(
                toRadians(deltaMove.y * 1),
                toRadians(deltaMove.x * 1),
                0,
                'XYZ'
            ));

        particleSystem.quaternion.multiplyQuaternions(deltaRotationQuaternion, particleSystem.quaternion);

        previousMousePosition = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY
        };
    }
});

document.addEventListener('touchend', () => {
    isDragging = false;
});

// Event listener for toggling rotation behavior with a hotkey (e.g., 'R' key)
document.addEventListener('keydown', (event) => {
    if (event.key === 'r' || event.key === 'R') {
        rotateBehavior = !rotateBehavior;
    }
});

init();
