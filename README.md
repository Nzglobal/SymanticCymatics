# SymanticCymatics

### Why?
I wanted to visualise real time audio, for seeing audio feedback for my guitar playing. This also works for voice or any other audio source, it allows you to see beautiful visuals.
A big screen in a dark room is best for full immersion!
This project is a 3D visualizer that creates cymatic patterns based on audio input. It uses WebGL through the Three.js library for rendering and allows user interaction through various controls.

## Features

- Real-time visualization of audio input.
- Particle count and size adjustments.
- Camera controls for zooming and movement.
- Toggleable color cycling and animation pause.
- Hotkeys for various functionalities.

## Installation

1. Clone the repository:
    ```sh
    git clone https://github.com/Nzglobal/SymanticCymatics.git
    ```
2. Navigate to the project directory:
    ```sh
    cd SymanticCymatics
    ```
3. Open `index.html` in your web browser.

## Screenshots
![image](https://github.com/Nzglobal/SymanticCymatics/assets/9160922/31f86b16-39a5-4d87-a05c-1bc1d51c9e2b)


### Controls

#### Camera Movement
- **W**: Move forward
- **S**: Move backward
- **A**: Move left
- **D**: Move right

#### Particle Adjustments
- **Arrow Up**: Increase particle count
- **Arrow Down**: Decrease particle count
- **Arrow Left**: Decrease particle size
- **Arrow Right**: Increase particle size

#### Other Controls
- **C**: Toggle color cycling
- **P**: Pause/resume animation
- **R**: Reset camera view

#### Zoom
- **Mouse Wheel**: Zoom in/out
- **Touch Pinch**: Zoom in/out

#### Mouse and Touch Controls
- **Drag**: Rotate the particle system


### JavaScript

The main logic is contained in `app.js`, which includes:
- Initialization of the Three.js scene, camera, and renderer.
- Particle system creation and updating based on audio input.
- Event listeners for user interaction (keyboard, mouse, and touch).
- Animation loop for rendering and updating particle positions and colors.

### Audio Processing

The project uses the Web Audio API to capture audio input and analyze its frequency data to influence the particle positions and colors.

## Acknowledgements

- [Three.js](https://threejs.org/) - JavaScript 3D Library
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) - Audio processing in the browser
