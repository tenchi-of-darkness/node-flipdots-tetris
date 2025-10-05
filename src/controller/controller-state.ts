import GameController from "./game-controller.js";

export interface GameControllerState {
    buttonsPressed: number[];
}

let liveControllerState: GameControllerState = {buttonsPressed: []};
let oldControllerState: GameControllerState = {buttonsPressed: []};

export async function initializeControllerState(){
    const controller = new GameController()
    await controller.init();

    controller.on('button', (btn) => {
        const button: {name: string, index: number} = JSON.parse(btn);

        if(!liveControllerState.buttonsPressed.includes(button.index)){
            liveControllerState.buttonsPressed.push(button.index);
        }
    })
}

export function updateControllerState(){
    oldControllerState.buttonsPressed = [...liveControllerState.buttonsPressed];
    liveControllerState.buttonsPressed = [];

    return oldControllerState;
}
