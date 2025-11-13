# Flip-Dot Tetris

This project is a Tetris game designed to be played on a physical flip-dot display. It includes a web-based emulator for development and testing.

## Project Overview

The project is built with TypeScript and Node.js. It's structured to be modular, with clear separation between the game logic, display rendering, and input handling. This makes it easy to extend and adapt the game for different purposes.

### Core Components

*   **Game Logic:** The core Tetris game logic is located in `src/game`. It's responsible for managing the game state, piece movement, collision detection, and scoring.
*   **Display:** The display system in `src/display` is responsible for rendering the game state. It can operate in two modes:
    *   **Development Mode:** In this mode, the renderer creates a PNG image of the display and serves it via a web server, allowing you to preview the game in a browser at `http://localhost:3000/view`.
    *   **Production Mode:** In this mode, the renderer sends the display data to a physical flip-dot display connected via a serial port.
*   **Input:** The input system in `src/input` handles player controls. It uses a headless Chrome browser with Puppeteer to read input from connected gamepads. This allows for a flexible and robust way to handle various gamepad types.

## Getting Started

### Prerequisites

*   Node.js and pnpm
*   A connected gamepad (for playing the game)

### Installation

1.  Clone the repository.
2.  Install the dependencies:
    ```bash
    pnpm install
    ```
3.  Install the browser for puppeteer:
    ```bash
    pnpm run install-browser
    ```

### Running the Game

*   **Development Mode:**
    ```bash
    pnpm run dev
    ```
    This will start the game and a web server for previewing the display. Open `http://localhost:3000/view` in your browser to see the game.

*   **Production Mode:**
    ```bash
    pnpm run start
    ```
    This will start the game and attempt to connect to a physical flip-dot display.

## Extending the Software

This project is designed to be extensible. Here are some key areas you might want to modify:

### Game Logic (`src/game`)

The core game logic is in `src/game/tetris.ts`. The `TetrisGame` class manages the game state. You can modify this class to change the game rules, scoring, or piece behavior. The `TetrisGameAdapter` class is used to connect the game logic to the main application loop.

The Tetris pieces are defined in `src/game/pieces.ts`. You can add new pieces or modify existing ones by editing this file.

Collision detection is handled in `src/game/collision.ts`. The `canMovePiece` and `canRotatePiece` functions are the core of the collision logic.

### Display (`src/display`)

The `Renderer` class in `src/display/renderer.ts` is responsible for drawing the game. You can modify the `render` method to change how the game is displayed. The renderer uses the `canvas` library to draw the game state.

The `drawBoard`, `drawMovingPiece`, and `drawPlacedBlocks` methods are responsible for drawing the different elements of the game. You can customize these methods to change the appearance of the game.

The web preview server is in `src/display/preview-server.ts`. You can modify this file to change the appearance of the web preview.

### Input (`src/input`)

The input system uses a `GamepadService` in `src/input/gamepad.ts` to read gamepad input. This service uses Puppeteer to run a headless Chrome browser that listens for gamepad events. The `InputManager` class in `src/input/input-manager.ts` manages the gamepad states and emits events when buttons are pressed.

You can modify the `handleInput` method in `src/game/tetris.ts` to change how the game responds to player input. The `buttonMapping` object in this file maps gamepad buttons to game actions.

### Configuration (`src/config`)

The `src/config/settings.ts` file contains basic configuration options for the game, such as the `FPS` (frames per second) and the `LAYOUT` of the flip-dot display. You can modify these values to change the game's performance and appearance.

## How it Works

1.  **Initialization:** The main application entry point is `src/index.ts`. It initializes the `Ticker`, `Renderer`, and `InputManager`.
2.  **Input:** The `InputManager` uses a `GamepadService` to listen for gamepad events in a headless Chrome browser. It emits events when gamepads are connected, disconnected, or when buttons are pressed.
3.  **Game Loop:** The `Ticker` class provides a fixed-rate game loop. On each tick, the main loop does the following:
    1.  Updates the `InputManager` to get the latest controller state.
    2.  For each active controller, it executes a tick in the `TetrisGameAdapter`.
    3.  The `TetrisGameAdapter` processes the input and updates the game state.
    4.  The `Renderer` draws the updated game state to a canvas.
    5.  Depending on the mode, the `Renderer` either saves the canvas as a PNG for the web preview or sends the data to the physical flip-dot display.

##  Improvements and recommendations
In this stage of the application is the use of an Xbox controller not supported when starting the application on a windows machine because of the headless browser doesn't handle the input for the controller as expected. It will work on Mac OS(Apple) and Linux.
If running the application in Windows it is recommended to connect the controllers via bluetooth.