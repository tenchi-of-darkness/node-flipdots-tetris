import {Ticker} from "./ticker.js";
import {createCanvas, registerFont} from "canvas";
import fs from "node:fs";
import path from "node:path";
import {FPS, LAYOUT} from "./settings.js";
import {Display} from "@owowagency/flipdot-emu";
import "./preview.js";
import {executeGameLogic, onGameStart} from "./game.js";

const IS_DEV = process.argv.includes("--dev");

// Create display
const display = new Display({
    layout: LAYOUT,
    panelWidth: 28,
    isMirrored: true,
    transport: !IS_DEV ? {
        type: 'serial',
        path: '/dev/ttyACM0',
        baudRate: 57600
    } : {
        type: 'ip',
        host: '127.0.0.1',
        port: 3000
    }
});

const {width, height} = display;

// Create output directory if it doesn't exist
const outputDir = "./output";
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, {recursive: true});
}

registerFont(
    path.resolve(import.meta.dirname, "../fonts/init-pidmobil-3-led-dotmap.ttf"),
    {family: "Dotmap"},
);

// Register fonts
registerFont(
    path.resolve(import.meta.dirname, "../fonts/OpenSans-Variable.ttf"),
    {family: "OpenSans"},
);

registerFont(
    path.resolve(import.meta.dirname, "../fonts/PPNeueMontrealMono-Regular.ttf"),
    {family: "PPNeueMontreal"},
);
registerFont(path.resolve(import.meta.dirname, "../fonts/Px437_ACM_VGA.ttf"), {
    family: "Px437_ACM_VGA",
});

// Create canvas with the specified resolution
const canvas = createCanvas(width, height);
const ctx = canvas.getContext("2d");

// Disable anti-aliasing and image smoothing
ctx.imageSmoothingEnabled = false;
// Set a pixel-perfect monospace font
ctx.font = "24px monospace";
// Align text precisely to pixel boundaries
ctx.textBaseline = "top";

// Initialize the ticker at x frames per second
const ticker = new Ticker({fps: FPS});

const drawField = (ctx, x) => {
    ctx.fillRect(x, 0, 12, 28)
    ctx.clearRect(x + 1, 0, 10, 27)
}

const drawMovingPiece = (ctx, boardX, x, y, pieceParts) => {
    pieceParts.forEach((piece) => {
        ctx.fillRect(boardX + x + 1 + piece.x, y + piece.y, 1, 1)
    })
}

const drawBlockGrid = (ctx, boardX, blockGrid) => {
    blockGrid.forEach((block) => {
        ctx.fillRect(boardX + 1 + block.x, block.y, 1, 1)
    })
}

onGameStart();

ticker.start(({deltaTime, elapsedTime}) => {
    console.clear();
    console.time("Write frame");
    console.log(`Rendering a ${width}x${height} canvas`);
    console.log("View at http://localhost:3000/view");

    ctx.clearRect(0, 0, width, height);

    // Fill the canvas with a black background
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, width, height);

    const gameData = executeGameLogic({deltaTime, elapsedTime});

    // Display the word
    {
        ctx.fillStyle = "#fff";
        ctx.strokeStyle = "#fff";
        ctx.font = '14px Dotmap';

        //Field one
        drawField(ctx, 1);
        {
            const {x, y, rotation, piece} = gameData.currentPiece;
            drawMovingPiece(ctx, 1, x, y, piece[rotation]);
            drawBlockGrid(ctx, 1, gameData.blockGrid);
        }


        //Field two
        // drawField(ctx, 71);
    }

    // Convert image to binary (purely black and white) for flipdot display
    {
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            // Apply thresholding - any pixel above 127 brightness becomes white (255), otherwise black (0)
            const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
            const binary = brightness > 127 ? 255 : 0;
            data[i] = binary; // R
            data[i + 1] = binary; // G
            data[i + 2] = binary; // B
            data[i + 3] = 255; // The board is not transparent :-)
        }
        ctx.putImageData(imageData, 0, 0);
    }

    if (IS_DEV) {
        // Save the canvas as a PNG file
        const filename = path.join(outputDir, "frame.png");
        const buffer = canvas.toBuffer("image/png");
        fs.writeFileSync(filename, buffer);
    } else {
        const imageData = ctx.getImageData(0, 0, display.width, display.height);
        display.setImageData(imageData);
        if (display.isDirty()) {
            display.flush();
        }
    }

    console.log(`Eslapsed time: ${(elapsedTime / 1000).toFixed(2)}s`);
    console.log(`Delta time: ${deltaTime.toFixed(2)}ms`);
    console.timeEnd("Write frame");
});
