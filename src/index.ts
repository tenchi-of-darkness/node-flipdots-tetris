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
let counter = 0;
// Start the main game loop.
ticker.start(async ({deltaTime, elapsedTime}: { deltaTime: number, elapsedTime: number }) => {
    counter++;
    if(counter > 3){
        console.clear();
        console.time("Write frame");
        console.log(`Rendering a ${renderer.getWidth()}x${renderer.getHeight()} canvas`);
        console.log("View at http://localhost:3000/view");
    }

    inputManager.update();

    const activeControllers = Object.keys(games).map(Number);

    // const gameData = activeControllers.map(index => {
    //     return games[index].executeTick(inputManager.getControllerState(index));
    // });

    let gameData = activeControllers.map(index => {
        return games[index].executeTick(inputManager.getControllerState(index));
    });

    //handle pause menu actions
    activeControllers.forEach((controllerIndex, i) => {
        const data = gameData[i];
    if (!data) return;

    if (data.menuAction === 'restart') {
        //Restart the game
        games[controllerIndex] = new TetrisGameAdapter();
    } 

    if (data.menuAction === 'quit') {
        //Quit the game by removing it from active games
        delete games[controllerIndex];
    }
});

    //re-filter active controllers + gameData, in case someone quit
    const activeAfterActions = Object.keys(games).map(Number);
    gameData = activeAfterActions.map(index => {
        return games[index].executeTick(inputManager.getControllerState(index));
    });

    if(counter > 3){
        counter = 0;
        renderer.render(gameData);
        console.log(`Elapsed time: ${(elapsedTime / 1000).toFixed(2)}s`);
        console.log(`Delta time: ${deltaTime.toFixed(2)}ms`);
        console.timeEnd("Write frame");
    }

});
