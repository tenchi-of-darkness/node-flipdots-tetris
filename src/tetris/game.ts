import {Pieces, PiecesKeyType} from "./pieces.js";
import {getRandomPiece, getRandomRotation} from "./random.js";
import {canMovePiece, canRotatePiece, MovablePiece, PlacedBlocks, pushPieceBlocks} from "./collision.js";
import GameController, {getControllerIndexFromXbox} from "../controller/game-controller.js";
import {GameControllerState} from "../controller/controller-state.js";

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
    _tetris: TetrisLogic = new TetrisLogic();

    _leftPressed = false;
    _lastLeftPressed = false;
    _rightPressed = false;
    _lastRightPressed = false;
    _bPressed = false;
    _xPressed = false;
    _lastBPressed = false;
    _lastXPressed = false;

    executeTick(controllerState: GameControllerState): GameData {
        const currentLeftPress = controllerState.buttonsPressed.includes(getControllerIndexFromXbox("D_PAD_LEFT"))
        const currentRightPress = controllerState.buttonsPressed.includes(getControllerIndexFromXbox("D_PAD_RIGHT"))
        const currentBPress = controllerState.buttonsPressed.includes(getControllerIndexFromXbox("B"))
        const currentXPress = controllerState.buttonsPressed.includes(getControllerIndexFromXbox("X"))
        let moveX = 0;
        let rotateMove = 0;

        if(currentLeftPress && !this._leftPressed){
            this._leftPressed = true;
        }

        if(currentRightPress && !this._rightPressed){
            this._rightPressed = true;
        }

        if(currentBPress && !this._bPressed){
            this._bPressed = true;
        }

        if(currentXPress && !this._xPressed){
            this._xPressed = true;
        }

        if(this._leftPressed && !this._lastLeftPressed){
            moveX--;
        }

        if(!currentLeftPress){
            this._leftPressed = false;
        }

        if(this._rightPressed && !this._lastRightPressed){
            moveX++;
        }

        if(!currentRightPress){
            this._rightPressed = false;
        }

        if(this._bPressed && !this._lastBPressed){
            rotateMove++;
        }

        if(!currentBPress){
            this._bPressed = false;
        }

        if(this._xPressed && !this._lastXPressed){
            rotateMove--;
        }

        if(!currentXPress){
            this._xPressed = false;
        }

        this._tetris.executeTick(moveX, rotateMove)
        if (this._tetris.gameOver) {
            this._tetris = new TetrisLogic()
        }

        this._lastLeftPressed = this._leftPressed;
        this._lastRightPressed = this._rightPressed;
        this._lastBPressed = this._bPressed;
        this._lastXPressed = this._xPressed;

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

const ticksPerDrop = 5;
const ticksPerControl = 5;

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

    executeTick(moveX: number, rotateMove: number) {
        this._ticks++;

        this.tick(moveX, rotateMove);

        if (this._ticks <= ticksPerControl) {
            return;
        }

        if (this._ticks <= ticksPerDrop) {
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
            this._currentPiece.rotation = (this._currentPiece.rotation + rotateMove+4)%4;
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