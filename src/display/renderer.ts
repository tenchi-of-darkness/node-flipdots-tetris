// src/display/renderer.ts
import {Canvas, CanvasRenderingContext2D as NodeCanvasContext, createCanvas} from "canvas";
import {Display} from "@owowagency/flipdot-emu";
import fs from "node:fs";
import path from "node:path";
import {GameData} from "../game/index.js";
import {LAYOUT} from "../config/index.js";
import {drawText} from "./utils.js";
import {StartScreenAnimator} from "./owow-animation.js";

function textWidth(text: string): number {
    return text.length * 6 - 1;
}

/**
 * The Renderer class is responsible for all drawing operations. It takes game state data
 * and renders it to an in-memory canvas. Depending on the mode (dev or prod),
 * it will either save the canvas as a PNG file for web preview or send the data
 * to a physical flip-dot display.
 */
export class Renderer {
    private readonly display: Display;
    private readonly canvas: Canvas;
    private readonly ctx: NodeCanvasContext;
    private readonly isDev: boolean;
    private readonly outputDir = "./output";
    private readonly startScreenAnimator: StartScreenAnimator;
    private blinkCounter = 0;

    constructor(isDev: boolean) {
        this.isDev = isDev;
        this.display = this.createDisplay();
        this.canvas = createCanvas(this.display.width, this.display.height);
        this.ctx = this.canvas.getContext("2d");
        this.startScreenAnimator = new StartScreenAnimator();
        this.initialize();
    }

    /**
     * The main rendering function, called on every frame.
     * @param gameData An array of game data objects, one for each active player.
     */
    public renderUnpaused(gameData: GameData[]) {
        this.renderGame(gameData, false);
        this.drawScores(gameData);
        this.finalizeFrame();
    }

    public renderPaused(gameData: GameData[], pauseSelection: "restart" | "quit") {
        this.renderGame(gameData, true);
        this.drawPause(pauseSelection, gameData.length === 2);
        this.finalizeFrame();
    }

    public getWidth(): number {
        return this.display.width;
    }

    public getHeight(): number {
        return this.display.height;
    }

    /**
     * Configures and creates the flip-dot display emulator instance.
     * The transport method (IP for dev, Serial for prod) is chosen based on the isDev flag.
     */
    private createDisplay(): Display {
        return new Display({
            layout: LAYOUT,
            panelWidth: 28,
            isMirrored: true,
            transport: this.isDev ? {
                type: 'ip',
                host: '127.0.0.1',
                port: 3000
            } : {
                type: 'serial',
                path: '/dev/ttyACM0',
                baudRate: 57600
            }
        });
    }

    private initialize() {
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, {recursive: true});
        }

        this.ctx.imageSmoothingEnabled = false;
        this.ctx.textBaseline = "top";
    }

    private renderGame(gameData: GameData[], paused: boolean) {
        this.blinkCounter++;
        if (gameData.length === 1) {
            // --- NAME ENTRY SCREEN ---
            if (gameData[0].enteringName) {
                this.drawNameEntryScreen(gameData[0]);
                return;
            }

            // --- LEADERBOARD SCREEN ---
            if (gameData[0].showLeaderboard) {
                this.drawLeaderboardScreen(gameData[0]);
                return;
            }
        }

        this.clearCanvas();
        this.prepareContext();

        if (!gameData || gameData.length === 0) {
            this.startScreenAnimator.update(this.ctx);
            return;
        }


        // Draw each active game board.
        for (let i = 0; i < gameData.length; i++) {
            const boardX = 1 + i * 70;
            this.drawBoard(gameData, boardX, i, paused);
        }
    }

    private drawPause(pauseSelection: "restart" | "quit", isMultiplayer: boolean) {
        if (isMultiplayer) {
            this.drawTwoPlayerPauseMenu(pauseSelection);
        } else {
            this.drawSinglePauseMenu(pauseSelection);
        }
    }

    private drawStartScreen(): void {
        this.ctx.textAlign = 'center';
        const cx = 12;
        const cy = 7;
        drawText(this.ctx, 'PRESS ', cx + 15, cy);
        drawText(this.ctx, 'ANY BUTTON', cx, cy + 7);
    }

    private clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = "#000";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    private prepareContext() {
        this.ctx.fillStyle = "#fff";
        this.ctx.strokeStyle = "#fff";
    }

    private drawBoard(gameData: GameData[], boardX: number, i: number, paused: boolean) {
        if (gameData.length > 1) {
            if (gameData[0].gameOver && gameData[1].gameOver) {
                if (paused) return;
                if (i === 0) {
                    drawText(this.ctx, 'GAME', 30, 12);
                    drawText(this.ctx, 'OVER', 30, 20);
                }
                return;
            }
        }

        if (gameData[i].gameOver) {
            if (gameData.length === 1) {
                drawText(this.ctx, 'GAME', 3, 8);
                drawText(this.ctx, 'OVER', 3, 16);
                return;
            }

            if (paused) return;

            const textX = i === 0 ? 10 : 51;
            const playerLabelX = i === 0 ? 16 : 57;
            const player = i === 0 ? 'P1' : 'P2';
            drawText(this.ctx, player, playerLabelX, 1);
            drawText(this.ctx, 'GAME', textX, 8);
            drawText(this.ctx, 'OVER', textX, 15);
            return;
        }

        this.drawBoardOutline(boardX);
        const {x, y, rotation, piece} = gameData[i].currentPiece;
        this.drawMovingPiece(boardX, x, y, piece[rotation]);
        this.drawPlacedBlocks(boardX, gameData[i].blockGrid);

        // Only draw next piece if the game is NOT paused
        if (!paused) {
            if (gameData.length === 1) {
                this.ctx.fillRect(boardX + 20, 0, 1, 8);
                this.ctx.fillRect(boardX + 12, 8, 9, 1);
                this.drawNextPiece(gameData[i].nextPiece, boardX + 15, 3);
            } else if (gameData.length === 2) {
                if (i === 0) {
                    this.drawNextPiece(gameData[i].nextPiece, boardX + 15, 2);
                } else {
                    this.drawNextPiece(gameData[i].nextPiece, boardX - 6, 2);
                }
            }
        }
    }

    private drawBoardOutline(x: number) {
        this.ctx.fillRect(x, 0, 12, 28);
        this.ctx.clearRect(x + 1, 0, 10, 27);
    }

    private drawMovingPiece(boardX: number, x: number, y: number, pieceParts: {
        x: number,
        y: number
    }[]) {
        pieceParts.forEach((piece) => {
            this.ctx.fillRect(boardX + x + 1 + piece.x, y + piece.y, 1, 1);
        });
    }

    private drawNextPiece(nextPiece: {
        rotation: number,
        piece: any[][]
    }, x: number, y: number) {
        const shape = nextPiece.piece[nextPiece.rotation];

        shape.forEach(part => {
            this.ctx.fillRect(x + part.x, y + part.y, 1, 1);
        });
    }

    private drawPlacedBlocks(boardX: number, blockGrid: any[]) {
        blockGrid.forEach((block) => {
            this.ctx.fillRect(boardX + 1 + block.x, block.y, 1, 1);
        });
    }

    private getPauseMenuData(pauseSelection: "restart" | "quit") {
        const pauseText = "PAUSED";
        const restartText = "RESTART";
        const quitText = "QUIT";

        const lines = [
            pauseText,
            `${pauseSelection === "restart" ? "-" : " "}${restartText}`,
            `${pauseSelection === "quit" ? "-" : " "}${quitText}`,
        ];

        return {
            lines: lines,
            maxWidth: Math.max(...lines.map(textWidth))
        };
    }

    private drawPauseMenuLines(lines: string[], startX: number, baseY: number) {
        drawText(this.ctx, lines[0], startX, baseY);
        drawText(this.ctx, lines[1], startX, baseY + 8);
        drawText(this.ctx, lines[2], startX, baseY + 16);
    }

    private drawSinglePauseMenu(pauseSelection: "restart" | "quit") {
        const data = this.getPauseMenuData(pauseSelection);

        const startX = Math.floor((this.display.width - data.maxWidth) / 1.2);
        const baseY = Math.floor(this.display.height / 2) - 10;

        this.drawPauseMenuLines(data.lines, startX, baseY);
    }

    private drawTwoPlayerPauseMenu(pauseSelection: "restart" | "quit") {
        const data = this.getPauseMenuData(pauseSelection);

        const startX = Math.floor((this.display.width - data.maxWidth) / 2);
        const baseY = 2;

        this.drawPauseMenuLines(data.lines, startX, baseY);
    }

    private drawScores(gameData: GameData[]) {
        if(gameData.some(x => x.enteringName || x.showLeaderboard)) return;

        if (gameData.length === 2) {
            this.drawTwoPlayerScore(gameData[0], gameData[1]);
        } else if (gameData.length === 1) {
            this.drawSinglePlayerScore(gameData[0]);
        }
    }

    private drawSinglePlayerScore(gameData: GameData) {
        drawText(this.ctx, "SCORE", 30, 8);
        drawText(this.ctx, `${gameData.score}`, 30, 16);
    }

    private drawTwoPlayerScore(gameData1: GameData, gameData2: GameData) {
        if (gameData1.gameOver && gameData2.gameOver) {
            let score1X = 10;
            if (gameData1.score >= 10) score1X = 7;
            if (gameData1.score >= 100) score1X = 5;
            if (gameData1.score >= 1000) score1X = 1;

            let score2X = 69;
            if (gameData2.score >= 10) score2X = 66;
            if (gameData2.score >= 100) score2X = 64;
            if (gameData2.score >= 1000) score2X = 60;

            if (gameData1.score > gameData2.score) {
                drawText(this.ctx, "P1 WINS", 21, 1);
            } else if (gameData2.score > gameData1.score) {
                drawText(this.ctx, "P2 WINS", 21, 1);
            } else {
                drawText(this.ctx, "DRAW", 30, 2);
            }

            drawText(this.ctx, 'P1', 7, 12);
            drawText(this.ctx, `${gameData1.score}`, score1X, 20);
            drawText(this.ctx, 'P2', 66, 12);
            drawText(this.ctx, `${gameData2.score}`, score2X, 20);

            return;
        }

        drawText(this.ctx, "SCORE", 27, 1);
        drawText(this.ctx, `${gameData1.score}`, 15, 10);
        drawText(this.ctx, `${gameData2.score}`, 45, 10);
        this.ctx.fillRect(42, 7, 1, 21);
        this.ctx.fillRect(14, 7, 56, 1);
    }

    private drawNameEntryScreen(gameData: GameData) {
        this.clearCanvas();
        this.prepareContext();
        drawText(this.ctx, "ENTER NAME", 10, 7);

        const name = gameData.playerName;
        const index = gameData.nameIndex;

        const baseX = 30;
        const y = 16;
        const underlineY = y + 2;

        for (let i = 0; i < 3; i++) {
            let letter = name[i];

            if (i !== index) {
                letter = letter.toUpperCase();
            }

            drawText(this.ctx, letter, baseX + i * 8, y);
        }

        for (let i = 0; i < 3; i++) {
            const x = baseX + i * 8;

            const isBlinkOn = Math.floor(this.blinkCounter / 8) % 2 === 0;

            if (i === index) {
                if (isBlinkOn) {
                    drawText(this.ctx, "_", x, underlineY);
                }
            } else {
                drawText(this.ctx, "_", x, underlineY);
            }
        }
    }

    private drawLeaderboardScreen(gameData: GameData) {
        this.clearCanvas();
        this.prepareContext();

        const scores = gameData.highscores;

        drawText(this.ctx, "TOP", 2, 1);
        drawText(this.ctx, "NAME", 23, 1);
        drawText(this.ctx, "SCORE", 52, 1);

        const labels = ["1", "2", "3"];
        let y = 8;

        for (let i = 0; i < 3; i++) {
            const entry = scores[i] ?? {name: "---", score: 0};

            drawText(this.ctx, labels[i], 2, y);
            drawText(this.ctx, entry.name, 23, y);
            drawText(this.ctx, `${entry.score}`, 52, y);

            y += 7;
        }

        this.finalizeFrame();
    }

    private finalizeFrame() {
        this.convertToBlackAndWhite();

        if (this.isDev) {
            this.writePngForPreview();
        } else {
            this.flushToDisplay();
        }
    }

    private convertToBlackAndWhite() {
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
            const color = brightness > 127 ? 255 : 0;
            data[i] = data[i + 1] = data[i + 2] = color;
            data[i + 3] = 255;
        }
        this.ctx.putImageData(imageData, 0, 0);
    }

    private writePngForPreview() {
        const filename = path.join(this.outputDir, "frame.png");
        const buffer = this.canvas.toBuffer("image/png");
        fs.writeFileSync(filename, buffer);
    }

    private flushToDisplay() {
        const imageData = this.ctx.getImageData(0, 0, this.display.width, this.display.height);
        this.display.setImageData(imageData);
        if (this.display.isDirty()) {
            this.display.flush();
        }
    }
}
