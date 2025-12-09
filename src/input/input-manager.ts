import GamepadService from "./gamepad.js";
import {EventEmitter} from "events";

export interface GamepadState {
    buttonsPressed: number[];
    buttonsClicked: number[];
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
            const button: { name: string, index: number, gamepad: number, clicked: boolean } = JSON.parse(btn);

            while (this.liveGamepadStates.length <= button.gamepad) {
                this.liveGamepadStates.push({buttonsPressed: [], buttonsClicked: []});
                this.oldGamepadStates.push({buttonsPressed: [], buttonsClicked: []});
            }

            if (!this.liveGamepadStates[button.gamepad].buttonsPressed.includes(button.index)) {
                this.liveGamepadStates[button.gamepad].buttonsPressed.push(button.index);
            }

            if (button.clicked && !this.liveGamepadStates[button.gamepad].buttonsClicked.includes(button.index)) {
                this.liveGamepadStates[button.gamepad].buttonsClicked.push(button.index);
            }
        });
    }

    public on(event: string, listener: (...args: any[]) => void) {
        this.eventEmitter.on(event, listener);
    }

    public update() {
        while (this.oldGamepadStates.length < this.liveGamepadStates.length) {
            this.oldGamepadStates.push({buttonsPressed: [], buttonsClicked: []});
        }

        for (let i = 0; i < this.liveGamepadStates.length; i++) {
            this.oldGamepadStates[i] = {
                buttonsPressed: [...this.liveGamepadStates[i].buttonsPressed],
                buttonsClicked: [...this.liveGamepadStates[i].buttonsClicked]
            };
            this.liveGamepadStates[i].buttonsPressed = [];
            this.liveGamepadStates[i].buttonsClicked = [];
        }
    }

    public getControllerState(gamepadIndex: number): GamepadState {
        if (gamepadIndex >= this.oldGamepadStates.length) {
            return {buttonsPressed: [], buttonsClicked: []};
        }
        return this.oldGamepadStates[gamepadIndex];
    }
}
