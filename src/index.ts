import {Ticker} from "./utils/index.js";
import {FPS} from "./config/index.js";
import {TetrisGameAdapter} from "./game/index.js";
import {InputManager} from "./input/index.js";
import {Renderer} from "./display/index.js";
import {initializeInput} from "./input/index.js";

const IS_DEV = process.argv.includes("--dev");

const ticker = new Ticker({fps: FPS});
const renderer = new Renderer(IS_DEV);
const inputManager = new InputManager();

const games: { [index: number]: TetrisGameAdapter } = {};

await initializeInput(inputManager, games);

// Start the main game loop.
ticker.start(async ({deltaTime, elapsedTime}: { deltaTime: number, elapsedTime: number }) => {
    console.clear();
    console.time("Write frame");
    console.log(`Rendering a ${renderer.getWidth()}x${renderer.getHeight()} canvas`);
    console.log("View at http://localhost:3000/view");

    inputManager.update();

    const activeControllers = Object.keys(games).map(Number);

    const gameData = activeControllers.map(index => {
        return games[index].executeTick(inputManager.getControllerState(index));
    });

    renderer.render(gameData);

    console.log(`Elapsed time: ${(elapsedTime / 1000).toFixed(2)}s`);
    console.log(`Delta time: ${deltaTime.toFixed(2)}ms`);
    console.timeEnd("Write frame");
});
