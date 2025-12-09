import { CanvasRenderingContext2D as NodeCanvasContext } from "canvas";
import { FONT_5x5 } from "./font5x5.js";

export function drawChar(ctx: NodeCanvasContext, ch: string, x: number, y: number) {
    const bitmap = FONT_5x5[ch] || FONT_5x5[' '];
    bitmap.forEach((row, ry) => {
        for (let cx = 0; cx < 5; cx++) {
            if (row & (1 << (4 - cx))) {
                ctx.fillRect(x + cx, y + ry, 1, 1);
            }
        }
    });
}

export function drawText(ctx: NodeCanvasContext, text: string, x: number, y: number, spacing = 1) {
    for (let i = 0; i < text.length; i++) {
        drawChar(ctx, text[i], x + i * (5 + spacing), y);
    }
}