import puppeteer, { Browser, Page } from 'puppeteer';
import { EventEmitter } from 'events';
import buttons from './xbox-buttons.json' with { type: "json" };
import * as trace_events from "node:trace_events";

declare global {
    interface Window {
        sendEventToProcessHandle: (event: string, msg: any) => void;
        consoleLog: (e: string) => void;
    }
}

export function getControllerIndexFromXbox(xboxString: string) {
    return buttons.indexOf(xboxString);
}

type test = readonly GamepadButton[];

export default class GamepadService {
    private eventEmitter: EventEmitter;
    public readonly SIGNAL_POLL_INTERVAL_MS: number = 16;
    public readonly THUMBSTICK_NOISE_THRESHOLD: number = 0.15;

    constructor() {
        this.eventEmitter = new EventEmitter();
    }

    public on(event: string, cb: (payload: string) => void): void {
        this.eventEmitter.on(event, cb);
    }

    public async init(): Promise<void> {
        const browser: Browser = await puppeteer.launch();
        const page: Page = await browser.newPage();

        await page.exposeFunction('sendEventToProcessHandle', (event: string, msg: any) => {
            this.eventEmitter.emit(event, JSON.stringify(msg));
        });

        await page.exposeFunction('consoleLog', (e: string) => {
            console.log(`[Browser] ${e}`);
        });

        await page.evaluate(({buttons, pollInterval, noiseThreshold}) => {
            const intervals: Record<number, number> = {};

            let lastPressedButtons: test[] = [];

            const handleGamepadConnected = (e: GamepadEvent) => {
                let gp = navigator.getGamepads()[e.gamepad.index];

                if (!gp) return;

                window.sendEventToProcessHandle('GAMEPAD_CONNECTED', { index: gp.index, id: gp.id });
                window.consoleLog(`Gamepad connected at index ${gp.index}: ${gp.id}.`);

                intervals[e.gamepad.index] = window.setInterval(() => pollGamepad(gp.index), pollInterval);
            }

            const handleGamepadDisconnected = (e: GamepadEvent) => {
                window.sendEventToProcessHandle('GAMEPAD_DISCONNECTED', { index: e.gamepad.index });
                window.consoleLog(`Gamepad disconnected at index ${e.gamepad.index}`);
                clearInterval(intervals[e.gamepad.index]);
                delete intervals[e.gamepad.index];
            }

            const pollGamepad = (gamepadIndex: number) => {
                const gp = navigator.getGamepads()[gamepadIndex];
                if (!gp) return;

                const axesSum = gp.axes.reduce((sum, axis) => sum + Math.abs(axis), 0);
                if (axesSum > noiseThreshold) {
                    window.sendEventToProcessHandle('thumbsticks', { axes: gp.axes, gamepad: gp.index });
                }

                for (let i = 0; i < gp.buttons.length; i++) {
                    if (gp.buttons[i].pressed) {
                        const clicked = !lastPressedButtons[gamepadIndex][i].pressed;
                        const buttonName = buttons[i] || `Button ${i}`;
                        window.sendEventToProcessHandle(buttonName, { pressed: true, clicked: clicked, gamepad: gp.index });
                        window.sendEventToProcessHandle('button', { name: buttonName, index: i, gamepad: gp.index });
                    }
                }

                lastPressedButtons[gamepadIndex]=gp.buttons;
            }

            window.addEventListener("gamepadconnected", (e) => {
                if(e.gamepad.id.startsWith('PS5')) return;
                handleGamepadConnected(e)
            });
            window.addEventListener("gamepaddisconnected", (e) => {
                if(e.gamepad.id.startsWith('PS5')) return;
                handleGamepadDisconnected(e)
            });

        }, {buttons, pollInterval: this.SIGNAL_POLL_INTERVAL_MS, noiseThreshold: this.THUMBSTICK_NOISE_THRESHOLD});
    }
}
