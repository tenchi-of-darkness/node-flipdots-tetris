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

const games: { [index: number]: Game } = {};

controllerManager.on('connected', (index: number) => {
    if (Object.keys(games).length < 2 && !games[index]) {
        console.log(`Adding game for controller ${index}`);
        games[index] = new Game();
    }
});

controllerManager.on('disconnected', (index: number) => {
    if (games[index]) {
        console.log(`Removing game for controller ${index}`);
        delete games[index];
    }
});

ticker.start(async ({deltaTime, elapsedTime}: { deltaTime: number, elapsedTime: number }) => {
    console.clear();
    console.time("Write frame");
    console.log(`Rendering a ${renderer.getWidth()}x${renderer.getHeight()} canvas`);
    console.log("View at http://localhost:3000/view");

    controllerManager.update();

    const activeControllers = Object.keys(games).map(Number);
    const gameData = activeControllers.map(index => {
        return games[index].executeTick(controllerManager.getControllerState(index));
    });

    renderer.render(gameData);

    console.log(`Eslapsed time: ${(elapsedTime / 1000).toFixed(2)}s`);
    console.log(`Delta time: ${deltaTime.toFixed(2)}ms`);
    console.timeEnd("Write frame");
});