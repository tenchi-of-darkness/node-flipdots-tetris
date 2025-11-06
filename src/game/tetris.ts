import {Pieces, PiecesKeyType} from "./pieces.js";
import {getRandomPiece, getRandomRotation} from "./random.js";
import {canMovePiece, canRotatePiece, MovablePiece, PlacedBlocks, pushPieceBlocks} from "./collision.js";
import {getControllerIndexFromXbox, GamepadState} from "../input/index.js";

const PieceStartingLocation = {x: 4, y: 0}
const BOARD_WIDTH = 10;

const buttonMapping = {
    left: "D_PAD_LEFT",
    right: "D_PAD_RIGHT",
    hardDrop: "D_PAD_UP",
    softDrop: "D_PAD_DOWN",
    rotateCW: "B",
    rotateCCW: "A",
};

type ButtonStates = Record<keyof typeof buttonMapping, boolean>;

export interface GameData {
    currentPiece: {
        x: number;
        y: number;
        rotation: number;
        piece: { x: number, y: number }[][];
    };
    nextPiece: {
        rotation: number;
        piece: { x: number, y: number }[][];
    };
    blockGrid: PlacedBlocks
    score: number;
    level: number;
    lines: number;
}

export class TetrisGameAdapter {
    private game: TetrisGame = new TetrisGame();

    private lastButtonStates: ButtonStates = {
        left: false,
        right: false,
        hardDrop: false,
        softDrop: false,
        rotateCW: false,
        rotateCCW: false,
    };

    executeTick(controllerState: GamepadState): GameData {
        if (this.game.gameOver) {
            this.game = new TetrisGame();
        }

        const {moveHorizontal, moveRotation, dropHard, dropSoft} = this.handleInput(controllerState);

        this.game.executeTick(moveHorizontal, moveRotation, dropSoft, dropHard);

        return {
            currentPiece: {
                x: this.game.currentPiece.x,
                y: this.game.currentPiece.y,
                rotation: this.game.currentPiece.rotation,
                piece: Pieces[this.game.currentPiece.type]
            },
            nextPiece: {rotation: this.game.nextPiece.rotation, piece: Pieces[this.game.nextPiece.type]},
            blockGrid: this.game.placedBlocks,
            score: this.game.score,
            level: this.game.level,
            lines: this.game.lines,
        }
    }

    private handleInput(controllerState: GamepadState) {
        const currentButtonStates = Object.fromEntries(
            Object.entries(buttonMapping).map(([action, buttonName]) => [
                action,
                controllerState.buttonsPressed.includes(getControllerIndexFromXbox(buttonName))
            ])
        ) as ButtonStates;

        const wasJustPressed = (action: keyof ButtonStates): boolean => {
            return currentButtonStates[action] && !this.lastButtonStates[action];
        };

        let moveHorizontal = 0;
        if (wasJustPressed('right')) {
            moveHorizontal = 1;
        } else if (wasJustPressed('left')) {
            moveHorizontal = -1;
        }

        let moveRotation = 0;
        if (wasJustPressed('rotateCW')) {
            moveRotation = 1;
        } else if (wasJustPressed('rotateCCW')) {
            moveRotation = -1;
        }
        
        const dropHard = currentButtonStates.hardDrop;
        const dropSoft = currentButtonStates.softDrop;

        this.lastButtonStates = currentButtonStates;

        return {moveHorizontal, moveRotation, dropHard, dropSoft};
    }
}

const ticksPerDrop = {
    normal: 5,
    soft: 3,
    hard: 1,
};

export class TetrisGame {
    gameOver: boolean = false;
    private ticks: number = 0;
    private _placedBlocks: PlacedBlocks = [];
    private _currentPiece: MovablePiece;
    private _nextPiece: { rotation: number; type: PiecesKeyType };

    private _score: number = 0;
    private _level: number = 1;
    private _lines: number = 0;

    constructor() {
        this._currentPiece = this.createNewPiece();
        this._nextPiece = this.createNewPiece();
    }

    get placedBlocks() { return this._placedBlocks; }
    get currentPiece() { return this._currentPiece; }
    get nextPiece() { return this._nextPiece; }
    get score() { return this._score; }
    get level() { return this._level; }
    get lines() { return this._lines; }

    executeTick(moveX: number, rotateMove: number, dropSoft: boolean, dropHard: boolean) {
        this.ticks++;

        this.handlePlayerInput(moveX, rotateMove);

        let actualTicksPerDrop = ticksPerDrop.normal;
        if (dropHard) {
            actualTicksPerDrop = ticksPerDrop.hard;
        } else if (dropSoft) {
            actualTicksPerDrop = ticksPerDrop.soft;
        }

        if (this.ticks <= actualTicksPerDrop) {
            return;
        }

        this.drop();

        this.ticks = 0;
    }

    private handlePlayerInput(moveX: number, rotateMove: number) {
        if (canMovePiece(moveX, 0, this.currentPiece, this._placedBlocks)) {
            this.currentPiece.x += moveX;
        }
        if (canRotatePiece(rotateMove, this.currentPiece, this._placedBlocks)) {
            this.currentPiece.rotation = (this.currentPiece.rotation + rotateMove + 4) % 4;
        }
    }

    private drop() {
        if (canMovePiece(0, 1, this.currentPiece, this._placedBlocks)) {
            this.currentPiece.y++;
        } else {
            pushPieceBlocks(this.currentPiece, this._placedBlocks);

            this.clearLines();

            this.spawnNewPiece();

            if (!canMovePiece(0, 1, this.currentPiece, this._placedBlocks)) {
                this.gameOver = true;
            }
        }
    }

    private clearLines() {
        const boardHeight = 27;

        const fullLines = Array.from({length: boardHeight}, (_, i) => i)
            .filter(y => this._placedBlocks.filter(b => b.y === y).length === BOARD_WIDTH);

        if (fullLines.length > 0) {
            this._lines += fullLines.length;
            this.updateScore(fullLines.length);

            const newPlacedBlocks: PlacedBlocks = [];
            this._placedBlocks
                .filter(block => !fullLines.includes(block.y))
                .forEach(block => {
                    const linesClearedBelow = fullLines.filter(y => y > block.y).length;
                    newPlacedBlocks.push({x: block.x, y: block.y + linesClearedBelow});
                });
            this._placedBlocks = newPlacedBlocks;
        }
    }

    private updateScore(clearedLines: number) {
        const lineScores = [0, 40, 100, 300, 1200];
        const scoreForLines = lineScores[Math.min(clearedLines, lineScores.length - 1)];
        this._score += scoreForLines * this._level;
        this._level = Math.floor(this._lines / 10) + 1; // Level up every 10 lines
    }

    private spawnNewPiece() {
        this._currentPiece = {
            ...PieceStartingLocation,
            rotation: this._nextPiece.rotation,
            type: this._nextPiece.type,
        }
        this._nextPiece = this.createNewPiece();
    }

    private createNewPiece(): MovablePiece {
        return {
            ...PieceStartingLocation,
            rotation: getRandomRotation(),
            type: getRandomPiece(),
        }
    }
}
