import {Ticker} from "./utils/index.js";
import {FPS} from "./config/index.js";
import {GameData, TetrisGameAdapter} from "./game/index.js";
import {getXboxStringFromControllerIndex, InputManager} from "./input/index.js";
import {Renderer} from "./display/index.js";
import {initializeInput} from "./input/index.js";

const IS_DEV = process.argv.includes("--dev");

const ticker = new Ticker({fps: FPS});
const renderer = new Renderer(IS_DEV);
const inputManager = new InputManager();

const games: { [index: number]: TetrisGameAdapter } = {};

await initializeInput(inputManager, games);
let counter = 0;
let pauseState: { selection: "restart" | "quit", controller: number } | undefined
let gameData: GameData[]

// Start the main game loop.
ticker.start(async ({deltaTime, elapsedTime}: { deltaTime: number, elapsedTime: number }) => {
    counter++;
    if (counter > 3) {
        console.clear();
        console.time("Write frame");
        console.log(`Rendering a ${renderer.getWidth()}x${renderer.getHeight()} canvas`);
        console.log("View at http://localhost:3000/view");
    }

    inputManager.update();

    const activeControllers = Object.keys(games).map(Number);

    if (isPaused()) {
        handlePauseMenu(activeControllers);
    } else {
        activeControllers.forEach(index => {
            const controllerState = inputManager.getControllerState(index);
            const clickedButtons = controllerState.buttonsClicked.map(getXboxStringFromControllerIndex);
            if (clickedButtons.includes("BUTTON_MENU")) {
                setPaused(index)
            }
        })

        gameData = activeControllers.map(index => {
            return games[index].executeTick(inputManager.getControllerState(index));
        });
    }

    if (counter > 3) {
        counter = 0;

        if (!isPaused()) {
            renderer.renderUnpaused(gameData);
        } else {
            renderer.renderPaused(gameData, getPauseSelection()!);
        }
        console.log(`Elapsed time: ${(elapsedTime / 1000).toFixed(2)}s`);
        console.log(`Delta time: ${deltaTime.toFixed(2)}ms`);
        console.timeEnd("Write frame");
    }
});


// Pause Menu

function handlePauseMenu(activeControllers: number[]) {
    if (pauseState === undefined) return;

    const controllerState = inputManager.getControllerState(pauseState.controller);
    const clickedButtons = controllerState.buttonsClicked.map(getXboxStringFromControllerIndex);

    if (clickedButtons.includes("D_PAD_UP") || clickedButtons.includes("D_PAD_DOWN")) {
        if (pauseState.selection === "restart") {
            pauseState.selection = "quit"
        } else {
            pauseState.selection = "restart"
        }
    }

    if (clickedButtons.includes("A")) {
        gameData = activeControllers.map(index => {
            return games[index].executeTick(inputManager.getControllerState(index), pauseState?.selection);
        });
        pauseState = undefined;
    }

    if (clickedButtons.includes("B") || clickedButtons.includes("BUTTON_MENU")) {
        pauseState = undefined;
    }
}

function setPaused(controllerIndex: number) {
    pauseState = {
        selection: "restart",
        controller: controllerIndex,
    }
}

function isPaused() {
    return pauseState !== undefined;
}

function getPauseSelection() {
    return pauseState?.selection
}
