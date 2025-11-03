import {TetrisGameAdapter} from "../game/index.js";
import {InputManager} from "./index.js";

export async function initializeInput(inputManager: InputManager, games: { [index: number]: TetrisGameAdapter }) {
    await inputManager.initialize();

    inputManager.on('connected', (index: number) => {
        if (Object.keys(games).length < 2 && !games[index]) {
            console.log(`Adding game for controller ${index}`);
            games[index] = new TetrisGameAdapter();
        }
    });

    inputManager.on('disconnected', (index: number) => {
        if (games[index]) {
            console.log(`Removing game for controller ${index}`);
            delete games[index];
        }
    });
}