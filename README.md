# Node Flipdots

A Node.js project for controlling and simulating flipdot displays, perfect for educational purposes and creative coding exercises.

## Overview

This project provides a framework for generating animations for flipdot displays, which are electromechanical displays consisting of small discs (dots) that can be flipped to show different colors (typically black or white). The application:

- Creates bitmap graphics on a virtual canvas
- Processes these graphics for flipdot compatibility
- Provides a real-time web preview
- Outputs frames as PNG images

## Installation

Make sure you have [Node.js](https://nodejs.org/en) installed.

Clone the repository and install dependencies:

```bash
git clone <repository-url>
cd node-flipdots
npm install
```

## Running the Application

Start the development server with:

```bash
npm run dev
```

This runs the application with nodemon for automatic reloading when files are modified.

Once running:
1. Open your browser and navigate to `http://localhost:3000/view`
2. You'll see the real-time preview of the flipdot display output

## Project Structure

- `src/index.js` - Main entry point that sets up the canvas, rendering loop, and example animations
- `src/ticker.js` - Handles the timing mechanism (like requestAnimationFrame for Node.js)
- `src/preview.js` - Creates a simple HTTP server for real-time preview in the browser
- `src/settings.js` - Configuration for display resolution, panel layout, and framerate
- `output/` - Directory containing generated PNG frames

## Settings and Configuration

The display settings can be modified in `src/settings.js`:

```javascript
export const FPS = 15;                    // Frames per second
export const PANEL_RESOLUTION = [28, 14]; // Size of each panel in dots
export const PANEL_LAYOUT = [3, 2];       // Layout of panels (horizontal, vertical)
export const RESOLUTION = [               // Total resolution calculation
    PANEL_RESOLUTION[0] * PANEL_LAYOUT[0],
    PANEL_RESOLUTION[1] * PANEL_LAYOUT[1],
];
```

## Creating Your Own Animations

The main rendering loop is in `src/index.js`. To create your own animations:

1. Modify the callback function in the `ticker.start()` method
2. Use the canvas 2D context (`ctx`) to draw your graphics
3. The graphics are automatically converted to black and white for the flipdot display

Example of drawing a simple animation:

```javascript
ticker.start(({ deltaTime, elapsedTime }) => {
    // Clear the canvas
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, width, height);
    
    // Draw something (e.g., moving circle)
    const x = Math.floor(((Math.sin(elapsedTime / 1000) + 1) / 2) * width);
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(x, height/2, 5, 0, Math.PI * 2);
    ctx.fill();
});
```

## Advanced Usage

### Binary Thresholding

The application automatically converts all drawn graphics to pure black and white using thresholding:

```javascript
// Any pixel with average RGB value > 127 becomes white, otherwise black
const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
const binary = brightness > 127 ? 255 : 0;
```

### Output

The rendered frames are saved as PNG files in the `output` directory and can be accessed via the web preview or directly from the filesystem.

## Project Extensions

Some ideas to extend this project:
- Add text scrolling animations
- Implement Conway's Game of Life
- Create a clock or countdown timer
- Add socket.io for remote control
- Create a library of animation effects
- Build an API to control the display

## Dependencies

- [`canvas`](https://www.npmjs.com/package/canvas) - For creating and manipulating graphics
- [`nodemon`](https://www.npmjs.com/package/nodemon) - For development auto-reloading 