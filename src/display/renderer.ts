// src/display/renderer.ts
import {Canvas, CanvasRenderingContext2D, createCanvas} from "canvas";
import {Display} from "@owowagency/flipdot-emu";
import fs from "node:fs";
import path from "node:path";
import {GameData} from "../game/index.js";
import {LAYOUT} from "../config/index.js";
import { FONT_5x5 } from "./font5x5.js";

function drawChar(ctx: CanvasRenderingContext2D, ch: string, x: number, y: number) {
    const bitmap = FONT_5x5[ch] || FONT_5x5[' '];
    bitmap.forEach((row, ry) => {
        for (let cx = 0; cx < 5; cx++) {
            if (row & (1 << (4 - cx))) {
                ctx.fillRect(x + cx, y + ry, 1, 1);
            }
        }
    });
}

function drawText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, spacing = 1) {
    for (let i = 0; i < text.length; i++) {
        drawChar(ctx, text[i], x + i * (5 + spacing), y);
    }
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
    private readonly ctx: CanvasRenderingContext2D;
    private readonly isDev: boolean;
    private readonly outputDir = "./output";

    constructor(isDev: boolean) {
        this.isDev = isDev;
        this.display = this.createDisplay();
        this.canvas = createCanvas(this.display.width, this.display.height);
        this.ctx = this.canvas.getContext("2d");
        this.initialize();
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

    /**
     * Sets up the canvas context and registers custom fonts.
     */
    private initialize() {
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, {recursive: true});
        }


        this.ctx.imageSmoothingEnabled = false;
        this.ctx.textBaseline = "top";
    }

    /**
     * Loads and registers all custom fonts from the /fonts directory.
     */

    /**
     * The main rendering function, called on every frame.
     * @param gameData An array of game data objects, one for each active player.
     */
    public render(gameData: GameData[]) {
        this.clearCanvas();
        this.prepareContext();

        // logic: if no TetrisGameAdapter exists for any controller, gameData is empty.
        if (!gameData || gameData.length === 0) {
            this.drawStartScreen();
            this.finalizeFrame();
            return;
        }

        // Draw each active game board.
        gameData.forEach((data, index) => {
            const boardX = 1 + index * 70;
            this.drawBoard(data, boardX);
        });

        // Draw the score display.
        this.drawScores(gameData);

        this.finalizeFrame();
    }

    private drawStartScreen(): void {
        this.ctx.textAlign = 'center';
        const cx = 12;
        const cy = 7;
        drawText(this.ctx, 'PRESS ', cx+15, cy);
        drawText(this.ctx,'ANY BUTTON', cx, cy+7);
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

   private drawBoard(gameData: GameData, boardX: number) {
        this.drawBoardOutline(this.ctx, boardX);
        const {x, y, rotation, piece} = gameData.currentPiece;
        this.drawMovingPiece(this.ctx, boardX, x, y, piece[rotation]);
        this.drawPlacedBlocks(this.ctx, boardX, gameData.blockGrid);
    }

    private drawBoardOutline(ctx: CanvasRenderingContext2D, x: number) {
        ctx.fillRect(x, 0, 12, 28);
        ctx.clearRect(x + 1, 0, 10, 27);
    }

    private drawMovingPiece(ctx: CanvasRenderingContext2D, boardX: number, x: number, y: number, pieceParts: {
        x: number,
        y: number
    }[]) {
        pieceParts.forEach((piece) => {
            ctx.fillRect(boardX + x + 1 + piece.x, y + piece.y, 1, 1);
        });
    }

    private drawPlacedBlocks(ctx: CanvasRenderingContext2D, boardX: number, blockGrid: any[]) {
        blockGrid.forEach((block) => {
            ctx.fillRect(boardX + 1 + block.x, block.y, 1, 1);
        });
    }

    private drawScores(gameData: GameData[]) {
        if (gameData.length === 2) {
            this.drawTwoPlayerScore(gameData[0], gameData[1]);
        } else if (gameData.length === 1) {
            this.drawSinglePlayerScore(gameData[0]);
        }
    }

    private drawSinglePlayerScore(gameData: GameData) {
        //singele player pause
    if (gameData.paused) {
        const cx = Math.floor(this.display.width / 2);

        const pauseText = "PAUSED";
        const restartText = "RESTART";
        const quitText = "QUIT";

        const baseY = 3;
        const pauseWidth = pauseText.length * 6 - 1;
        const startX = Math.floor((this.display.width - pauseWidth) / 2);

        //PAUSED
        drawText(this.ctx, pauseText, startX, baseY);

        //menu options
        const restartPrefix = gameData.pauseSelection === 'restart' ? '>' : ' ';
        const quitPrefix = gameData.pauseSelection === 'quit' ? '>' : ' ';

        drawText(this.ctx, `${restartPrefix}${restartText}`, startX, baseY + 8);
        drawText(this.ctx, `${quitPrefix}${quitText}`, startX, baseY + 16);

        return;
    }

    //single player score
    const scoreX = 45;
    const textY = 5;

    drawText(this.ctx, "SCORE", scoreX - 15, textY);
    drawText(this.ctx, `${gameData.score}`, scoreX - 15, textY + 8);
}


    private drawTwoPlayerScore(gameData1: GameData, gameData2: GameData) {
        //two player pause
    if (gameData1.paused || gameData2.paused) {
        const pauseText = "PAUSED";
        const restartText = "RESTART";
        const quitText = "QUIT";

        const centerWidth = this.display.width;
        const pauseWidth = pauseText.length * 6 - 1;
        const startX = Math.floor((centerWidth - pauseWidth) / 2);

        //choose selection from player 1 if available, else from player 2
        const selection = gameData1.pauseSelection ?? gameData2.pauseSelection ?? 'restart';

        const restartPrefix = selection === 'restart' ? '>' : ' ';
        const quitPrefix = selection === 'quit' ? '>' : ' ';
        const baseY = 0;

        drawText(this.ctx, pauseText, startX, baseY + 1);
        drawText(this.ctx, `${restartPrefix}${restartText}`, startX, baseY + 9);
        drawText(this.ctx, `${quitPrefix}${quitText}`, startX, baseY + 17);
        return;
    }

    //2-player score
    const scoreX = 26;
    drawText(this.ctx, "SCORE", scoreX + 1, 1);
    drawText(this.ctx, `${gameData1.score}`, scoreX - 12, 9);
    drawText(this.ctx, `${gameData2.score}`, scoreX + 17, 9);
    this.ctx.fillRect(scoreX + 15, 7, 1, 21);
    this.ctx.fillRect(scoreX - 12, 7, 56, 1);
}


    /**
     * After all drawing is done, this function processes the canvas.
     * It converts the image to black and white and then either writes it
     * to a file (dev) or sends it to the flip-dot display (prod).
     */
    private finalizeFrame() {
        this.convertToBlackAndWhite();

        if (this.isDev) {
            this.writePngForPreview();
        } else {
            this.flushToDisplay();
        }
    }

    /**
     * Converts the canvas image to be purely black and white, which is what the
     * flip-dot display requires.
     */
    private convertToBlackAndWhite() {
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            // Simple brightness check
            const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
            const color = brightness > 127 ? 255 : 0;
            data[i] = data[i + 1] = data[i + 2] = color;
            data[i + 3] = 255; // Alpha
        }
        this.ctx.putImageData(imageData, 0, 0);
    }

    /**
     * Saves the current canvas state to a PNG file for the web preview.
     */
    private writePngForPreview() {
        const filename = path.join(this.outputDir, "frame.png");
        const buffer = this.canvas.toBuffer("image/png");
        fs.writeFileSync(filename, buffer);
    }

    /**
     * Sends the image data to the physical flip-dot display.
     */
    private flushToDisplay() {
        const imageData = this.ctx.getImageData(0, 0, this.display.width, this.display.height);
        this.display.setImageData(imageData);
        if (this.display.isDirty()) {
            this.display.flush();
        }
    }

    public getWidth(): number {
        return this.display.width;
    }

    public getHeight(): number {
        return this.display.height;
    }
}
