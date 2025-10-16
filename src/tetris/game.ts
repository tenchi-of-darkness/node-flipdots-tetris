import {Pieces, PiecesKeyType} from "./pieces.js";
import {getRandomPiece, getRandomRotation} from "./random.js";
import {canMovePiece, canRotatePiece, MovablePiece, PlacedBlocks, pushPieceBlocks} from "./collision.js";
import GameController, {getControllerIndexFromXbox} from "../controller/game-controller.js";
import {GameControllerState} from "../controller/controller-state.js";

const PieceStartingLocation = {x: 4, y: 0}

const buttonMapping = {
    left: "D_PAD_LEFT",
    right: "D_PAD_RIGHT",
    hardDrop: "D_PAD_UP",
    softDrop: "D_PAD_DOWN",
    rotateCW: "B",       // Clockwise
    rotateCCW: "A",      // Counter-clockwise
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
}

export class Game {
    _tetris: TetrisLogic = new TetrisLogic();

    _lastButtonStates: ButtonStates = {
        left: false,
        right: false,
        hardDrop: false,
        softDrop: false,
        rotateCW: false,
        rotateCCW: false,
    };

    executeTick(controllerState: GameControllerState): GameData {
        let {moveX, rotateMove, dropHard, dropSoft} = this.handleInput(controllerState);

        this._tetris.executeTick(moveX, rotateMove, dropSoft, dropHard);
        if (this._tetris.gameOver) {
            this._tetris = new TetrisLogic();
        }

        return {
            currentPiece: {
                x: this._tetris._currentPiece.x,
                y: this._tetris._currentPiece.y,
                rotation: this._tetris._currentPiece.rotation,
                piece: Pieces[this._tetris._currentPiece.type]
            },
            nextPiece: {rotation: this._tetris._nextPiece.rotation, piece: Pieces[this._tetris._nextPiece.type]},
            blockGrid: this._tetris._placedBlocks,
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
            return currentButtonStates[action] && !this._lastButtonStates[action];
        };

        const moveX = wasJustPressed('right') ? 1 : wasJustPressed('left') ? -1 : 0;
        const rotateMove = wasJustPressed('rotateCW') ? 1 : wasJustPressed('rotateCCW') ? -1 : 0;

        const dropHard = currentButtonStates.hardDrop;
        const dropSoft = currentButtonStates.softDrop;

        this._lastButtonStates = currentButtonStates;

        return { moveX, rotateMove, dropHard, dropSoft };
    }
}

const ticksPerDrop = {
    normal: 1,
    soft: 3,
    hard: 5
};

export class TetrisLogic {
    gameOver: boolean = false;
    _ticks: number = 0;
    _placedBlocks: PlacedBlocks = [];
    _currentPiece: MovablePiece = {
        ...PieceStartingLocation,
        rotation: getRandomRotation(),
        type: getRandomPiece(),
    }

    _nextPiece: { rotation: number; type: PiecesKeyType } = {
        rotation: getRandomRotation(),
        type: getRandomPiece(),
    }

    _movementCounter: number = 0;

    executeTick(moveX: number, rotateMove: number, dropSoft: boolean, dropHard: boolean) {
        this._ticks++;

        this.tick(moveX, rotateMove);

        let actualTicksPerDrop = ticksPerDrop.normal;

        if (dropHard) {
            actualTicksPerDrop = ticksPerDrop.hard;
        } else if (dropSoft) {
            actualTicksPerDrop = ticksPerDrop.soft;
        }

        if (this._ticks <= actualTicksPerDrop) {
            return;
        }

        this.drop();

        this._ticks = 0;
    }

    private tick(moveX: number, rotateMove: number) {
        this._movementCounter++;

        if (canMovePiece(moveX, 0, this._currentPiece, this._placedBlocks)) {
            this._currentPiece.x = this._currentPiece.x + moveX;
        }
        if (canRotatePiece(rotateMove, this._currentPiece, this._placedBlocks)) {
            this._currentPiece.rotation = (this._currentPiece.rotation + rotateMove + 4) % 4;
        }
    }

    private drop() {
        if (canMovePiece(0, 1, this._currentPiece, this._placedBlocks)) {
            this._currentPiece.y = this._currentPiece.y + 1;
        } else {
            pushPieceBlocks(this._currentPiece, this._placedBlocks);

            this.resetPiece();

            if (!canMovePiece(0, 1, this._currentPiece, this._placedBlocks)) {
                this.gameOver = true;
            }
        }
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