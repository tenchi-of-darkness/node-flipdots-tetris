import {Pieces, PiecesKeyType} from "./pieces.js";
import {getRandomPiece, getRandomRotation} from "./random.js";
import {canMovePiece, canRotatePiece, MovablePiece, PlacedBlocks, pushPieceBlocks} from "./collision.js";
import {GamepadState, getControllerIndexFromXbox} from "../input/index.js";
import {nextLetter, prevLetter} from "./utils.js";
import {loadHighscores, saveHighscores, ScoreEntry} from "./highscore.js";

type ScreenState = "PLAYING" | "GAME_OVER" | "ENTER_NAME" | "LEADERBOARD";

const PieceStartingLocation = {x: 4, y: 0}
const BOARD_WIDTH = 10;

//
// CONTROLLER BUTTON MAPPING
//
const buttonMapping = {
    left: "D_PAD_LEFT",
    right: "D_PAD_RIGHT",
    hardDrop: "D_PAD_UP",
    softDrop: "D_PAD_DOWN",
    rotateCW: "A",
    rotateCCW: "B",
    restart: "Y",
    pause: "BUTTON_MENU",
};

type ButtonStates = Record<keyof typeof buttonMapping, boolean>;

//
// DATA NAAR RENDERER
//
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

    gameOver?: boolean;
    showLeaderboard?: boolean;
    highscores: ScoreEntry[];

    // Entering Name Data
    playerName: string;
    nameIndex: number;
    enteringName?: boolean;
}

//
// ★★★  TETRIS GAME ADAPTER  ★★★
// (Bestuurt schermen + input)
//
export class TetrisGameAdapter {
    private game: TetrisGame = new TetrisGame();

    private screenState: ScreenState = "PLAYING";

    // Entering Name variables
    private nameChars = ["A", "A", "A"];
    private nameIndex = 0;

    executeTick(controllerState: GamepadState, pauseAction?: "quit" | "restart"): GameData {
        const {
            moveHorizontal,
            moveRotation,
            dropHard,
            dropSoft,
            restartPressed,
            upPressed,
            downPressed,
            confirmPressed
        } = this.handleInput(controllerState);

        if (pauseAction === "restart") {
            this.game = new TetrisGame();
            this.screenState = "PLAYING";
        }

        if (pauseAction === "quit") {
            this.game.gameOver = true;
            this.screenState = "GAME_OVER";
        }

        switch (this.screenState) {
            case "PLAYING":
                this.game.executeTick(moveHorizontal, moveRotation, dropSoft, dropHard);

                if (this.game.gameOver) {
                    this.screenState = "GAME_OVER";
                }
                break;
            case "GAME_OVER":
                if (restartPressed) {
                    this.screenState = "ENTER_NAME";
                    this.nameChars = ["A", "A", "A"];
                    this.nameIndex = 0;
                }
                break;
            case "ENTER_NAME":
                // letter omhoog
                if (upPressed) {
                    this.nameChars[this.nameIndex] =
                        nextLetter(this.nameChars[this.nameIndex]);
                }

                // letter omlaag
                if (downPressed) {
                    this.nameChars[this.nameIndex] =
                        prevLetter(this.nameChars[this.nameIndex]);
                }

                // bevestig letter (A knop)
                if (confirmPressed) {
                    this.nameIndex++;

                    // Als 3 letters ingevuld → opslaan en naar leaderboard
                    if (this.nameIndex >= 3) {
                        this.game.updateHighscores(this.nameChars.join(""));
                        this.screenState = "LEADERBOARD";
                    }
                }
                break;
            case "LEADERBOARD":
                if (restartPressed) {
                    this.game = new TetrisGame();
                    this.screenState = "PLAYING";
                }
                break;
        }

        return {
            currentPiece: {
                x: this.game.currentPiece.x,
                y: this.game.currentPiece.y,
                rotation: this.game.currentPiece.rotation,
                piece: Pieces[this.game.currentPiece.type],
            },
            nextPiece: {
                rotation: this.game.nextPiece.rotation,
                piece: Pieces[this.game.nextPiece.type]
            },
            blockGrid: this.game.placedBlocks,
            score: this.game.score,

            level: this.game.level,
            lines: this.game.lines,
            gameOver: this.game.gameOver,
            showLeaderboard: this.screenState === "LEADERBOARD",
            highscores: this.game.highscores,

            // Entering Name Data
            playerName: this.nameChars.join(""),
            nameIndex: this.nameIndex,
            enteringName: this.screenState === "ENTER_NAME"
        }
    }


    //
    // Input handler
    //
    private handleInput(controllerState: GamepadState) {
        const currentButtonPresses = Object.fromEntries(
            Object.entries(buttonMapping).map(([action, buttonName]) => [
                action,
                controllerState.buttonsPressed.includes(getControllerIndexFromXbox(buttonName))
            ])
        ) as ButtonStates;

        const currentButtonClicks = Object.fromEntries(
            Object.entries(buttonMapping).map(([action, buttonName]) => [
                action,
                controllerState.buttonsClicked.includes(getControllerIndexFromXbox(buttonName))
            ])
        ) as ButtonStates;

        const wasJustPressed = (action: keyof ButtonStates): boolean => {
            return currentButtonClicks[action];
        };

        const restartPressed = wasJustPressed('restart');

        const upPressed = wasJustPressed("hardDrop");
        const downPressed = wasJustPressed("softDrop");
        const confirmPressed = wasJustPressed("rotateCW");

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

        let dropHard = false;
        if (wasJustPressed('hardDrop')) {
            dropHard = true;
        }

        const dropSoft = currentButtonPresses.softDrop;

        return {moveHorizontal, moveRotation, dropHard, dropSoft, restartPressed, upPressed, downPressed, confirmPressed};
    }
}


//
// ★★★  TETRIS GAME ENGINE  ★★★
//
let newGameIndex = 0;

export class TetrisGame {
    gameOver: boolean = false;
    showLeaderboard: boolean = false;
    public _gameIndex = newGameIndex++;
    private ticks: number = 0;

    constructor() {
        this._currentPiece = this.createNewPiece();
        this._nextPiece = this.createNewPiece();
    }

    private _highscores: ScoreEntry[] = loadHighscores();

    private _placedBlocks: PlacedBlocks = [];

    get placedBlocks() {
        return this._placedBlocks;
    }

    private _currentPiece: MovablePiece;

    get currentPiece() {
        return this._currentPiece;
    }

    private _nextPiece: { rotation: number; type: PiecesKeyType };

    get nextPiece() {
        return this._nextPiece;
    }

    private _score: number = 0;

    get score() {
        return this._score;
    }

    private _level: number = 1;

    get level() {
        return this._level;
    }

    private _lines: number = 0;

    get lines() {
        return this._lines;
    }

    executeTick(moveX: number, rotateMove: number, dropSoft: boolean, dropHard: boolean) {
        this.ticks++;

        this.handlePlayerInput(moveX, rotateMove);

        let dropType: keyof typeof ticksPerDropBase = 'normal';
        if (dropHard) dropType = 'hard';
        else if (dropSoft) dropType = 'soft';

        const actualTicksPerDrop = getTicksPerDrop(this._level, dropType);
        if (actualTicksPerDrop === 0) {
            while (true) {
                if (!this.drop()) return;
            }
        }

        if (this.ticks <= actualTicksPerDrop) return;

        this.drop();
        this.ticks = 0;
    }

    private handlePlayerInput(moveX: number, rotateMove: number) {
        if (canMovePiece(moveX, 0, this.currentPiece, this._placedBlocks))
            this.currentPiece.x += moveX;

        if (canRotatePiece(rotateMove, this.currentPiece, this._placedBlocks))
            this.currentPiece.rotation = (this._currentPiece.rotation + rotateMove + 4) % 4;
    }

    private drop() {
        if (canMovePiece(0, 1, this.currentPiece, this._placedBlocks)) {
            this.currentPiece.y++;
            return true;
        }

        pushPieceBlocks(this.currentPiece, this._placedBlocks);
        this.clearLines();
        this.spawnNewPiece();

        if (!canMovePiece(0, 1, this.currentPiece, this._placedBlocks)) {
            this.gameOver = true;
        }

        return false;
    }

    //
    // update highscores met NAAM
    //
    public updateHighscores(playerName: string) {
        this._highscores.push({name: playerName, score: this._score});

        this._highscores.sort((a, b) => b.score - a.score);
        this._highscores = this._highscores.slice(0, 3);

        saveHighscores(this._highscores);
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
        const scores = [0, 40, 100, 300, 1200];
        this._score += scores[Math.min(clearedLines, 4)] * this._level;
        this._level = Math.floor(this._lines / 10) + 1;
    }

    private spawnNewPiece() {
        this._currentPiece = {
            ...PieceStartingLocation,
            rotation: this._nextPiece.rotation,
            type: this._nextPiece.type,
        };
        this._nextPiece = this.createNewPiece();
    }

    private createNewPiece(): MovablePiece {
        return {
            ...PieceStartingLocation,
            rotation: getRandomRotation(),
            type: getRandomPiece(this._gameIndex),
        };
    }
}

//
// ticks per drop
//
function getTicksPerDrop(level: number, dropType: keyof typeof ticksPerDropBase): number {
    const base = ticksPerDropBase[dropType];
    if (base === 0) return 0;
    const speedIncrease = Math.min(level - 1, 20);
    return Math.max(1, base - Math.floor(speedIncrease / 2));
}

const ticksPerDropBase = {
    normal: 20,
    soft: 3,
    hard: 0,
};
