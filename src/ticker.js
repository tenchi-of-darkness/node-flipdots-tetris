/**
 * Ticker - A requestAnimationFrame-like solution for Node.js
 * with controllable framerate
 */
export class Ticker {
	constructor(options = {}) {
		this.fps = options.fps || 60;
		this.callback = null;
		this.isRunning = false;
		this.lastFrameTime = 0;
		this.frameInterval = 1000 / this.fps;
	}

	start(callback) {
		if (this.isRunning) return;

		this.callback = callback;
		this.isRunning = true;
		this.lastFrameTime = performance.now();

		this._tick();

		return this;
	}

	stop() {
		this.isRunning = false;
		return this;
	}

	_tick() {
		if (!this.isRunning) return;

		const now = performance.now();
		const timeDelta = now - this.lastFrameTime;

		if (timeDelta >= this.frameInterval) {
			// Adjust for drifting
			this.lastFrameTime = now - (timeDelta % this.frameInterval);

			// Calculate normalized delta (1.0 = exact frame rate)
			const normalizedDelta = timeDelta / this.frameInterval;

			if (this.callback) {
				this.callback({
					deltaTime: normalizedDelta,
					elapsedTime: now,
				});
			}
		}

		// Use setImmediate for better performance in Node.js
		setImmediate(() => this._tick());
	}
}
