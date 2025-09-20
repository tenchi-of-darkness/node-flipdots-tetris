import {Pieces, PiecesKeyType} from "./pieces.js";
import {getRandomPiece, getRandomRotation} from "./random.js";
import {canMovePiece, MovablePiece, PlacedBlocks, pushPieceBlocks} from "./collision.js";

const TimeAccumulatePerGameTick = 1;

const PieceStartingLocation = {x: 4, y: 0}

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
    //How long per game tick
    _tetris: TetrisLogic = new TetrisLogic();

    executeTick(): GameData {
        this._tetris.executeTick()
        if (this._tetris.gameOver) {
            this._tetris = new TetrisLogic()
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
}

const ticksPerDrop = 1;

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

    executeTick() {
        this._ticks++;

        this.tick();

        if (this._ticks <= ticksPerDrop) {
            return;
        }

        this.drop();

        this._ticks = 0;
    }

    private tick() {

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