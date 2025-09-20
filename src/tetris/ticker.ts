import {Pieces} from "./pieces.js";
import {TetrisLogic} from "./game.js";

export class TetrisTicker {
    private timeAccumulate: number = 0;

    waitForTick(deltaTime: number, callback: () => void) {
        this.timeAccumulate = this.timeAccumulate + deltaTime;

        if (this.timeAccumulate > 1) {
            this.timeAccumulate -= 1;
            callback()
        }
    }
}