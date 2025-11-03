import {Canvas, CanvasRenderingContext2D, createCanvas, registerFont} from "canvas";
import {Display} from "@owowagency/flipdot-emu";
import fs from "node:fs";
import path from "node:path";
import {GameData} from "./tetris/game.js";
import {LAYOUT} from "./settings.js";

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

    private createDisplay(): Display {
        return new Display({
            layout: LAYOUT,
            panelWidth: 28,
            isMirrored: true,
            transport: !this.isDev ? {
                type: 'serial',
                path: '/dev/ttyACM0',
                baudRate: 57600
            } : {
                type: 'ip',
                host: '127.0.0.1',
                port: 3000
            }
        });
    }

    private initialize() {
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, {recursive: true});
        }

        this.registerFonts();

        this.ctx.imageSmoothingEnabled = false;
        this.ctx.font = "24px monospace";
        this.ctx.textBaseline = "top";
    }

    private registerFonts() {
        const fontsDir = path.resolve(import.meta.dirname, "../fonts");
        registerFont(path.join(fontsDir, "init-pidmobil-3-led-dotmap.ttf"), {family: "Dotmap"});
        registerFont(path.join(fontsDir, "OpenSans-Variable.ttf"), {family: "OpenSans"});
        registerFont(path.join(fontsDir, "PPNeueMontrealMono-Regular.ttf"), {family: "PPNeueMontreal"});
        registerFont(path.join(fontsDir, "Px437_ACM_VGA.ttf"), {family: "Px437_ACM_VGA"});
    }

    public render(gameData: GameData[]) {
        this.clearCanvas();

        this.ctx.fillStyle = "#fff";
        this.ctx.strokeStyle = "#fff";
        this.ctx.font = '10.1px monospace';

        // Draw games
        gameData.forEach((data, index) => {
            const boardX = 1 + index * 70;
            this.drawBoard(data, boardX);
        });

        // Draw score
        if (gameData.length === 2) {
            this.drawScores(gameData[0], gameData[1]);
        }

        this.finalizeFrame();
    }

    private clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = "#000";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    private drawBoard(gameData: GameData, boardX: number) {
        this.drawField(this.ctx, boardX);
        const {x, y, rotation, piece} = gameData.currentPiece;
        this.drawMovingPiece(this.ctx, boardX, x, y, piece[rotation]);
        this.drawBlockGrid(this.ctx, boardX, gameData.blockGrid);
    }

    private drawField(ctx: CanvasRenderingContext2D, x: number) {
        ctx.fillRect(x, 0, 12, 28);
        ctx.clearRect(x + 1, 0, 10, 27);
    }

    private drawMovingPiece(ctx: CanvasRenderingContext2D, boardX: number, x: number, y: number, pieceParts: { x: number, y: number }[]) {
        pieceParts.forEach((piece) => {
            ctx.fillRect(boardX + x + 1 + piece.x, y + piece.y, 1, 1);
        });
    }

    private drawBlockGrid(ctx: CanvasRenderingContext2D, boardX: number, blockGrid: any[]) {
        blockGrid.forEach((block) => {
            ctx.fillRect(boardX + 1 + block.x, block.y, 1, 1);
        });
    }

    private drawScores(gameData1: GameData, gameData2: GameData) {
        const scoreX = 26;
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`SCORE`, scoreX, -3);
        this.ctx.fillText(`${gameData1.score}`, scoreX - 13, 6);
        this.ctx.fillText(`${gameData2.score}`, scoreX + 16, 6);
        this.ctx.fillRect(scoreX + 15, 7, 1, 21);
        this.ctx.fillRect(scoreX - 12, 7, 56, 1);
    }

    private finalizeFrame() {
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
            const binary = brightness > 127 ? 255 : 0;
            data[i] = data[i + 1] = data[i + 2] = binary;
            data[i + 3] = 255;
        }
        this.ctx.putImageData(imageData, 0, 0);

        if (this.isDev) {
            const filename = path.join(this.outputDir, "frame.png");
            const buffer = this.canvas.toBuffer("image/png");
            fs.writeFileSync(filename, buffer);
        } else {
            const imageData = this.ctx.getImageData(0, 0, this.display.width, this.display.height);
            this.display.setImageData(imageData);
            if (this.display.isDirty()) {
                this.display.flush();
            }
        }
    }

    public getWidth(): number {
        return this.display.width;
    }

    public getHeight(): number {
        return this.display.height;
    }
}
