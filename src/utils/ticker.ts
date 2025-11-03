type TickerCallback =  ({ deltaTime, elapsedTime }: {deltaTime: number, elapsedTime: number}) => void;

export class Ticker {
    private readonly fps: number;
    private callback: null | TickerCallback;
    private isRunning: boolean;
    private lastFrameTime: number;
    private readonly frameInterval: number;
	constructor(options = {fps: 60}) {
		this.fps = options.fps;
		this.callback = null;
		this.isRunning = false;
		this.lastFrameTime = 0;
		this.frameInterval = 1000 / this.fps;
	}

	start(callback: ({ deltaTime, elapsedTime }: { deltaTime: number; elapsedTime: number; }) => void) {
		if (this.isRunning) return;

		this.callback = callback;
		this.isRunning = true;
		this.lastFrameTime = performance.now();

		this._tick();

		return this;
	}

	_tick() {
		if (!this.isRunning) return;

		const now = performance.now();
		const timeDelta = now - this.lastFrameTime;

		if (timeDelta >= this.frameInterval) {
			this.lastFrameTime = now - (timeDelta % this.frameInterval);

			const normalizedDelta = timeDelta / this.frameInterval;

			if (this.callback) {
				this.callback({
					deltaTime: normalizedDelta,
					elapsedTime: now,
				});
			}
		}

		setImmediate(() => this._tick());
	}
}
