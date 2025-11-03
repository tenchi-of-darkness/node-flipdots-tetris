import GameController from "./game-controller.js";
import {EventEmitter} from "events";

export interface GameControllerState {
    buttonsPressed: number[];
}

export class ControllerManager {
    private liveControllerStates: GameControllerState[] = [];
    private oldControllerStates: GameControllerState[] = [];
    private controller: GameController;
    private eventEmitter = new EventEmitter();

    constructor() {
        this.controller = new GameController();
    }

    public async initialize() {
        await this.controller.init();

        this.controller.on('GAMEPAD_CONNECTED', (msg) => {
            const data = JSON.parse(msg);
            this.eventEmitter.emit('connected', data.index);
        });

        this.controller.on('GAMEPAD_DISCONNECTED', (msg) => {
            const data = JSON.parse(msg);
            this.eventEmitter.emit('disconnected', data.index);
        });

        this.controller.on('button', (btn) => {
            const button: { name: string, index: number, gamepad: number } = JSON.parse(btn);

            while (this.liveControllerStates.length <= button.gamepad) {
                this.liveControllerStates.push({ buttonsPressed: [] });
                this.oldControllerStates.push({ buttonsPressed: [] });
            }

            if (!this.liveControllerStates[button.gamepad].buttonsPressed.includes(button.index)) {
                this.liveControllerStates[button.gamepad].buttonsPressed.push(button.index);
            }
        });
    }

    public on(event: string, listener: (...args: any[]) => void) {
        this.eventEmitter.on(event, listener);
    }

    public update() {
        // Ensure oldControllerStates has the same length as liveControllerStates
        while (this.oldControllerStates.length < this.liveControllerStates.length) {
            this.oldControllerStates.push({ buttonsPressed: [] });
        }

        for (let i = 0; i < this.liveControllerStates.length; i++) {
            this.oldControllerStates[i] = { buttonsPressed: [...this.liveControllerStates[i].buttonsPressed] };
            this.liveControllerStates[i].buttonsPressed = [];
        }
    }

    public getControllerState(gamepadIndex: number): GameControllerState {
        if (gamepadIndex >= this.oldControllerStates.length) {
            return { buttonsPressed: [] };
        }
        return this.oldControllerStates[gamepadIndex];
    }
}
