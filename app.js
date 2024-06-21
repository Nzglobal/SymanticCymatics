// app.js

let scene, camera, renderer, analyser, dataArray;
let particleSystem;
let audioContext;
let rotateBehavior = false; // Variable to toggle rotation behavior
let pauseAnimation = false; // Variable to pause/resume animation
let colorCycle = false; // Variable to toggle color cycling

let particleCount = 10000; // Initial particle count
let particleSize = 0.5; // Initial particle size

const movement = {
    forward: false,
    backward: false,
    left: false,
    right: false,
};

const init = () => {
    // Set up the scene, camera, and renderer
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('visualizer') });
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.position.z = 100; // Move the camera closer for a larger visual effect

    // Add particle system
    addParticles();

    // Handle microphone input
    document.getElementById('startButton').addEventListener('click', () => {
        startAudioContext();
    });

    animate();

    // Add event listeners for zooming
    document.addEventListener('wheel', onDocumentMouseWheel, false);
    document.addEventListener('touchstart', onTouchStart, false);
    document.addEventListener('touchmove', onTouchMove, false);

    // Add event listeners for camera movement and particle adjustments
    document.addEventListener('keydown', onDocumentKeyDown, false);
    document.addEventListener('keyup', onDocumentKeyUp, false);
}

const addParticles = () => {
    const particles = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3); // For storing colors
    for (let i = 0; i < particleCount; i++) {
        const theta = Math.random() * 2 * Math.PI;
        const phi = Math.acos(2 * Math.random() - 1);
        const radius = Math.random() * 20; // Smaller radius for more concentrated particles
        particlePositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        particlePositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        particlePositions[i * 3 + 2] = radius * Math.cos(phi);

        // Initialize colors to white
        colors[i * 3] = 1;
        colors[i * 3 + 1] = 1;
        colors[i * 3 + 2] = 1;
    }
    particles.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particles.setAttribute('color', new THREE.BufferAttribute(colors, 3)); // Set colors

    const particleMaterial = new THREE.PointsMaterial({ size: particleSize, vertexColors: true }); // Set particle size
    particleSystem = new THREE.Points(particles, particleMaterial);
    scene.add(particleSystem);
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
    if (!pauseAnimation) {
        requestAnimationFrame(animate);
    }

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
        const yPos = (value / 255) * 50 - 25; // Scale the yPos for more defined patterns

        // Update particle positions to form cymatic patterns
        const theta = (i / (positions.length / 3)) * 2 * Math.PI;
        const phi = Math.acos(2 * (freqIndex / dataArray.length) - 1);
        const radius = Math.abs(yPos); // Use yPos for radius to create spherical patterns
        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.sin(phi) * Math.sin(theta);
        const z = radius * Math.cos(phi);

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

    // Color cycling
    if (colorCycle) {
        const time = Date.now() * 0.001;
        particleSystem.material.color.setHSL((0.5 + 0.5 * Math.sin(time)) % 1, 1, 0.5);
    }

    // Smooth camera movement
    if (movement.forward) camera.position.z -= 1;
    if (movement.backward) camera.position.z += 1;
    if (movement.left) camera.position.x -= 1;
    if (movement.right) camera.position.x += 1;

    renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Zoom handling
const onDocumentMouseWheel = (event) => {
    camera.position.z += event.deltaY * 0.05;
}

let touchStartDistance = 0;
const onTouchStart = (event) => {
    if (event.touches.length == 2) {
        touchStartDistance = getTouchDistance(event.touches);
    }
}

const onTouchMove = (event) => {
    if (event.touches.length == 2) {
        const touchEndDistance = getTouchDistance(event.touches);
        const distanceChange = touchEndDistance - touchStartDistance;
        camera.position.z -= distanceChange * 0.1;
        touchStartDistance = touchEndDistance;
    }
}

const getTouchDistance = (touches) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
}

const onDocumentKeyDown = (event) => {
    switch (event.key) {
        case 'w':
        case 'W':
            movement.forward = true;
            break;
        case 's':
        case 'S':
            movement.backward = true;
            break;
        case 'a':
        case 'A':
            movement.left = true;
            break;
        case 'd':
        case 'D':
            movement.right = true;
            break;
        case 'ArrowUp':
            particleCount += 1000;
            scene.remove(particleSystem);
            addParticles();
            break;
        case 'ArrowDown':
            particleCount = Math.max(1000, particleCount - 1000);
            scene.remove(particleSystem);
            addParticles();
            break;
        case 'ArrowLeft':
            particleSize = Math.max(0.1, particleSize - 0.1);
            particleSystem.material.size = particleSize;
            break;
        case 'ArrowRight':
            particleSize += 0.1;
            particleSystem.material.size = particleSize;
            break;
        case 'c':
        case 'C':
            colorCycle = !colorCycle;
            break;
        case 'p':
        case 'P':
            pauseAnimation = !pauseAnimation;
            if (!pauseAnimation) animate();
            break;
        case 'r':
        case 'R':
            camera.position.set(0, 0, 100);
            break;
    }
}

const onDocumentKeyUp = (event) => {
    switch (event.key) {
        case 'w':
        case 'W':
            movement.forward = false;
            break;
        case 's':
        case 'S':
            movement.backward = false;
            break;
        case 'a':
        case 'A':
            movement.left = false;
            break;
        case 'd':
        case 'D':
            movement.right = false;
            break;
    }
}

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
    onDocumentKeyDown(event);
});

document.addEventListener('keyup', (event) => {
    onDocumentKeyUp(event);
});

init();
