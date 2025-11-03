import puppeteer, { Browser, Page } from 'puppeteer';
import { EventEmitter } from 'events';

// To use a JSON import, you need to enable `resolveJsonModule` in your tsconfig.json
import buttons from './xbox-buttons.json' with { type: "json" };

declare global {
    interface Window {
        sendEventToProcessHandle: (event: string, msg: any) => void;
        consoleLog: (e: string) => void;
    }
}

export function getControllerXboxString(index: number) {
    return buttons[index];
}

export function getControllerIndexFromXbox(xboxString: string) {
    return buttons.indexOf(xboxString);
}

export default class GameController {
    // Use private for internal properties and public readonly for constants
    private eventEmitter: EventEmitter;
    public readonly SIGNAL_POLL_INTERVAL_MS: number = 50;
    public readonly THUMBSTICK_NOISE_THRESHOLD: number = 0.15;

    constructor() {
        this.eventEmitter = new EventEmitter();
    }

    /**
     * Registers a listener for a specific controller event.
     * @param event The name of the event to listen for.
     * @param cb The callback function to execute. It receives a stringified JSON payload.
     */
    public on(event: string, cb: (payload: string) => void): void {
        this.eventEmitter.on(event, cb);
    }

    /**
     * Initializes the Puppeteer instance and starts listening for gamepad events.
     */
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

            window.addEventListener("gamepadconnected", (e: GamepadEvent) => {
                let gp = navigator.getGamepads()[e.gamepad.index];

                if (!gp) return; // Type guard

                window.sendEventToProcessHandle('GAMEPAD_CONNECTED', { index: gp.index, id: gp.id });
                window.consoleLog(`Gamepad connected at index ${gp.index}: ${gp.id}.`);

                intervals[e.gamepad.index] = window.setInterval(() => {
                    gp = navigator.getGamepads()[e.gamepad.index];
                    if (!gp) return;

                    const axesSum = gp.axes.reduce((sum, axis) => sum + Math.abs(axis), 0);
                    if (axesSum > noiseThreshold) {
                        window.sendEventToProcessHandle('thumbsticks', { axes: gp.axes, gamepad: gp.index });
                    }

                    for (let i = 0; i < gp.buttons.length; i++) {
                        if (gp.buttons[i].pressed) {
                            const buttonName = buttons[i] || `Button ${i}`;
                            window.sendEventToProcessHandle(buttonName, { pressed: true, gamepad: gp.index });
                            window.sendEventToProcessHandle('button', { name: buttonName, index: i, gamepad: gp.index });
                        }
                    }
                }, pollInterval);
            });

            window.addEventListener("gamepaddisconnected", (e: GamepadEvent) => {
                window.sendEventToProcessHandle('GAMEPAD_DISCONNECTED', { index: e.gamepad.index });
                window.consoleLog(`Gamepad disconnected at index ${e.gamepad.index}`);
                clearInterval(intervals[e.gamepad.index]);
                delete intervals[e.gamepad.index];
            });
        }, {buttons, pollInterval: this.SIGNAL_POLL_INTERVAL_MS, noiseThreshold: this.THUMBSTICK_NOISE_THRESHOLD});
    }
}