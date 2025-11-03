import GameController from "./game-controller.js";

export interface GameControllerState {
    buttonsPressed: number[];
}

export class ControllerManager {
    private liveControllerStates: GameControllerState[] = [];
    private oldControllerStates: GameControllerState[] = [];
    private controller: GameController;

    constructor() {
        this.controller = new GameController();
    }

    public async initialize() {
        await this.controller.init();

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
