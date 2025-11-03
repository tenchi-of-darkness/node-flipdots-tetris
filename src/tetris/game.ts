import {Pieces, PiecesKeyType} from "./pieces.js";
import {getRandomPiece, getRandomRotation} from "./random.js";
import {canMovePiece, canRotatePiece, MovablePiece, PlacedBlocks, pushPieceBlocks} from "./collision.js";
import {getControllerIndexFromXbox} from "../controller/game-controller.js";
import {GameControllerState} from "../controller/controller-manager.js";

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

export class Game {
    private tetris: TetrisLogic = new TetrisLogic();

    private lastButtonStates: ButtonStates = {
        left: false,
        right: false,
        hardDrop: false,
        softDrop: false,
        rotateCW: false,
        rotateCCW: false,
    };

    executeTick(controllerState: GameControllerState): GameData {
        if (this.tetris.gameOver) {
            this.tetris = new TetrisLogic();
        }

        let {moveHorizontal, moveRotation, dropHard, dropSoft} = this.handleInput(controllerState);

        this.tetris.executeTick(moveHorizontal, moveRotation, dropSoft, dropHard);

        return {
            currentPiece: {
                x: this.tetris.currentPiece.x,
                y: this.tetris.currentPiece.y,
                rotation: this.tetris.currentPiece.rotation,
                piece: Pieces[this.tetris.currentPiece.type]
            },
            nextPiece: {rotation: this.tetris.nextPiece.rotation, piece: Pieces[this.tetris.nextPiece.type]},
            blockGrid: this.tetris.placedBlocks,
            score: this.tetris.score,
            level: this.tetris.level,
            lines: this.tetris.lines,
        }
    }

    private handleInput(controllerState: GameControllerState) {
        const currentButtonStates = Object.fromEntries(
            Object.entries(buttonMapping).map(([action, buttonName]) => [
                action,
                controllerState.buttonsPressed.includes(getControllerIndexFromXbox(buttonName))
            ])
        ) as ButtonStates;

        const wasJustPressed = (action: keyof ButtonStates): boolean => {
            return currentButtonStates[action] && !this.lastButtonStates[action];
        };

        let moveHorizontal: number;
        if (wasJustPressed('right')) {
            moveHorizontal = 1;
        } else {
            moveHorizontal = wasJustPressed('left') ? -1 : 0;
        }
        let moveRotation: number;
        if (wasJustPressed('rotateCW')) {
            moveRotation = 1;
        } else {
            moveRotation = wasJustPressed('rotateCCW') ? -1 : 0;
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
    hard: 1
};

export class TetrisLogic {
    gameOver: boolean = false;
    private ticks: number = 0;
    private _placedBlocks: PlacedBlocks = [];
    private _currentPiece: MovablePiece = {
        ...PieceStartingLocation,
        rotation: getRandomRotation(),
        type: getRandomPiece(),
    }
    private _nextPiece: { rotation: number; type: PiecesKeyType } = {
        rotation: getRandomRotation(),
        type: getRandomPiece(),
    }

    private _score: number = 0;
    private _level: number = 1;
    private _lines: number = 0;

    get placedBlocks() {
        return this._placedBlocks;
    }

    get currentPiece() {
        return this._currentPiece
    }

    get nextPiece() {
        return this._nextPiece;
    }

    get score() {
        return this._score;
    }

    get level() {
        return this._level;
    }

    get lines() {
        return this._lines;
    }

    executeTick(moveX: number, rotateMove: number, dropSoft: boolean, dropHard: boolean) {
        this.ticks++;

        this.tick(moveX, rotateMove);

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

    private tick(moveX: number, rotateMove: number) {
        if (canMovePiece(moveX, 0, this.currentPiece, this._placedBlocks)) {
            this.currentPiece.x = this.currentPiece.x + moveX;
        }
        if (canRotatePiece(rotateMove, this.currentPiece, this._placedBlocks)) {
            this.currentPiece.rotation = (this.currentPiece.rotation + rotateMove + 4) % 4;
        }
    }

    private drop() {
        if (canMovePiece(0, 1, this.currentPiece, this._placedBlocks)) {
            this.currentPiece.y = this.currentPiece.y + 1;
        } else {
            pushPieceBlocks(this.currentPiece, this._placedBlocks);

            this.clearLines();

            this.resetPiece();

            if (!canMovePiece(0, 1, this.currentPiece, this._placedBlocks)) {
                this.gameOver = true;
            }
        }
    }

    private clearLines() {
        while (true) {
            const boardHeight = 27;
            const boardWidth = 10;

            const fullLines = Array.from({length: boardHeight}, (_, i) => i)
                .filter(y => this._placedBlocks.filter(b => b.y === y).length === boardWidth);

            if (fullLines.length === 0) {
                break;
            }

            this._lines += fullLines.length;
            this.updateScore(fullLines.length);

            const newPlacedBlocks: PlacedBlocks = [];
            let newY = boardHeight - 1;
            for (let y = boardHeight - 1; y >= 0; y--) {
                if (!fullLines.includes(y)) {
                    this._placedBlocks.filter(b => b.y === y).forEach(b => {
                        newPlacedBlocks.push({x: b.x, y: newY});
                    });
                    newY--;
                }
            }
            this._placedBlocks = newPlacedBlocks;
        }
    }

    private updateScore(clearedLines: number) {
        const lineScores = [0, 40, 100, 300, 1200]; // For 0, 1, 2, 3, 4 lines
        const score = clearedLines >= lineScores.length ? lineScores[lineScores.length - 1] : lineScores[clearedLines];
        this._score += score * this._level;
        this._level = Math.floor(this._lines / 10) + 1;
    }

    private resetPiece() {
        this._currentPiece = {
            ...PieceStartingLocation,
            rotation: this._nextPiece.rotation,
            type: this._nextPiece.type,
        }

        this._nextPiece = {

            rotation: getRandomRotation(),
            type: getRandomPiece(),
        }
    }
}