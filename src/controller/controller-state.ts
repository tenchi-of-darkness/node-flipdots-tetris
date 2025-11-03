import GameController from "./game-controller.js";

export interface GameControllerState {
    buttonsPressed: number[];
}

const liveControllerStates: GameControllerState[] = [];
const oldControllerStates: GameControllerState[] = [];

export async function initializeControllerState(){
    const controller = new GameController()
    await controller.init();

    controller.on('button', (btn) => {
        const button: {name: string, index: number, gamepad: number} = JSON.parse(btn);

        while(liveControllerStates.length <= button.gamepad){
            liveControllerStates.push({buttonsPressed: []})
            oldControllerStates.push({buttonsPressed: []})
        }

        if(!liveControllerStates[button.gamepad].buttonsPressed.includes(button.index)){
            liveControllerStates[button.gamepad].buttonsPressed.push(button.index);
        }
    })
}

export function updateControllerStates(){
    for(let i = 0; i < liveControllerStates.length; i++) {
        oldControllerStates[i] = { buttonsPressed: [...liveControllerStates[i].buttonsPressed] };
        liveControllerStates[i].buttonsPressed = [];
    }
}

export function getControllerState(gamepadIndex: number): GameControllerState {
    if (gamepadIndex >= oldControllerStates.length) {
        return {buttonsPressed: []};
    }
    return oldControllerStates[gamepadIndex];
}