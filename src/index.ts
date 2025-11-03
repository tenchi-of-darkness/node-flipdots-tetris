import {Ticker} from "./ticker.js";
import {FPS} from "./settings.js";
import "./preview.js";
import {Game} from "./tetris/game.js";
import {ControllerManager} from "./controller/controller-manager.js";
import {Renderer} from "./renderer.js";

const IS_DEV = process.argv.includes("--dev");

const renderer = new Renderer(IS_DEV);
const controllerManager = new ControllerManager();
await controllerManager.initialize();

// Initialize the ticker at x frames per second
const ticker = new Ticker({fps: FPS});

const games = [new Game(), new Game()];

ticker.start(async ({deltaTime, elapsedTime}: { deltaTime: number, elapsedTime: number }) => {
    console.clear();
    console.time("Write frame");
    console.log(`Rendering a ${renderer.getWidth()}x${renderer.getHeight()} canvas`);
    console.log("View at http://localhost:3000/view");

    controllerManager.update();

    const gameData = games.map((game, index) => game.executeTick(controllerManager.getControllerState(index)));

    renderer.render(gameData);

    console.log(`Eslapsed time: ${(elapsedTime / 1000).toFixed(2)}s`);
    console.log(`Delta time: ${deltaTime.toFixed(2)}ms`);
    console.timeEnd("Write frame");
});