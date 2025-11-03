import GamepadService from "./gamepad.js";
import {EventEmitter} from "events";

export interface GamepadState {
    buttonsPressed: number[];
}

export class InputManager {
    private liveGamepadStates: GamepadState[] = [];
    private oldGamepadStates: GamepadState[] = [];
    private gamepadService: GamepadService;
    private eventEmitter = new EventEmitter();

    constructor() {
        this.gamepadService = new GamepadService();
    }

    public async initialize() {
        await this.gamepadService.init();

        this.gamepadService.on('GAMEPAD_CONNECTED', (msg) => {
            const data = JSON.parse(msg);
            this.eventEmitter.emit('connected', data.index);
        });

        this.gamepadService.on('GAMEPAD_DISCONNECTED', (msg) => {
            const data = JSON.parse(msg);
            this.eventEmitter.emit('disconnected', data.index);
        });

        this.gamepadService.on('button', (btn) => {
            const button: { name: string, index: number, gamepad: number } = JSON.parse(btn);

            while (this.liveGamepadStates.length <= button.gamepad) {
                this.liveGamepadStates.push({ buttonsPressed: [] });
                this.oldGamepadStates.push({ buttonsPressed: [] });
            }

            if (!this.liveGamepadStates[button.gamepad].buttonsPressed.includes(button.index)) {
                this.liveGamepadStates[button.gamepad].buttonsPressed.push(button.index);
            }
        });
    }

    public on(event: string, listener: (...args: any[]) => void) {
        this.eventEmitter.on(event, listener);
    }

    public update() {
        while (this.oldGamepadStates.length < this.liveGamepadStates.length) {
            this.oldGamepadStates.push({ buttonsPressed: [] });
        }

        for (let i = 0; i < this.liveGamepadStates.length; i++) {
            this.oldGamepadStates[i] = { buttonsPressed: [...this.liveGamepadStates[i].buttonsPressed] };
            this.liveGamepadStates[i].buttonsPressed = [];
        }
    }

    public getControllerState(gamepadIndex: number): GamepadState {
        if (gamepadIndex >= this.oldGamepadStates.length) {
            return { buttonsPressed: [] };
        }
        return this.oldGamepadStates[gamepadIndex];
    }
}
