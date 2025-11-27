import { CanvasRenderingContext2D as NodeCanvasContext } from "canvas";
import { drawText } from "./utils.js";
import { FONT_5x5 } from "./font5x5.js";

type Tetromino = {
  x: number;
  y: number;
  rot: number;
  dx: number;
  dy: number;
  drot: number;
  blocks: { x: number; y: number }[];
};

export class StartScreenAnimator {
  private phase: "owow" | "explode" | "press" = "owow";
  private frame = 0;
  private tetros: Tetromino[] = [];

  constructor() {
    this.resetOWOW();
  }

  private resetOWOW() {
    this.tetros = this.makeTetrominosFromText("OWOW");
    this.phase = "owow";
    this.frame = 0;
  }

  private makeLetterBitmap(letter: string, scale = 3) {
    const base = FONT_5x5[letter] ?? FONT_5x5[" "];
    const bmp: number[][] = [];

    for (let y = 0; y < 5 * scale; y++) {
      bmp[y] = [];
      for (let x = 0; x < 5 * scale; x++) {
        const srcX = Math.floor(x / scale);
        const srcY = Math.floor(y / scale);
        const bit = (base[srcY] & (1 << (4 - srcX))) !== 0;
        bmp[y][x] = bit ? 1 : 0;
      }
    }
    return bmp;
  }

  private makeTetrominosFromText(text: string) {
    const tetros: Tetromino[] = [];
    let xOffset = 4;

    for (const ch of text) {
      const bmp = this.makeLetterBitmap(ch, 3);

      let pixels: { x: number; y: number }[] = [];

      for (let y = 0; y < bmp.length; y++) {
        for (let x = 0; x < bmp[0].length; x++) {
          if (bmp[y][x]) {
            pixels.push({
              x: xOffset + x,
              y: 6 + y,
            });
          }
        }
      }

      for (let i = 0; i < pixels.length; i += 4) {
        const group = pixels.slice(i, i + 4);
        tetros.push({
          x: 0,
          y: 0,
          rot: 0,
          dx: 0,
          dy: 0,
          drot: 0,
          blocks: group,
        });
      }

      xOffset += 20;
    }

    return tetros;
  }

  private explodeSetup() {
    for (const t of this.tetros) {
      t.dx = (Math.random() - 0.5) * 0.5;
      t.dy = (Math.random() - 1.2) * 0.5;
      t.drot = (Math.random() - 0.5) * 0.2;
    }
  }

  public update(ctx: NodeCanvasContext) {
    this.frame++;

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, 200, 200);
    ctx.fillStyle = "#fff";

    if (this.phase === "owow") {
      this.drawTetrominos(ctx);
      if (this.frame > 60) {
        this.explodeSetup();
        this.phase = "explode";
        this.frame = 0;
      }
    }

    else if (this.phase === "explode") {
      this.updateExplosionPhysics();
      this.drawTetrominos(ctx);

      if (this.frame > 50) {
        this.phase = "press";
        this.frame = 0;
      }
    }

    else if (this.phase === "press") {
      if (this.frame % 20 < 10) {
        drawText(ctx, "PRESS", 27, 8);
        drawText(ctx, "ANY BUTTON", 12, 16);
      }

      if (this.frame > 140) {
        this.resetOWOW();
      }
    }
  }

  private updateExplosionPhysics() {
    for (const t of this.tetros) {
      t.x += t.dx;
      t.y += t.dy;
      t.rot += t.drot;

      t.dy += 0.04;
    }
  }

  private drawTetrominos(ctx: NodeCanvasContext) {
    for (const t of this.tetros) {
      ctx.save();
      ctx.translate(t.x, t.y);
      ctx.rotate(t.rot);

      for (const b of t.blocks) {
        ctx.fillRect(b.x, b.y, 1, 1);
      }

      ctx.restore();
    }
  }
}