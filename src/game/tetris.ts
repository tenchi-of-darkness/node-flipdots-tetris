import { Pieces, PiecesKeyType } from "./pieces.js";
import { getRandomPiece, getRandomRotation } from "./random.js";
import { canMovePiece, canRotatePiece, MovablePiece, PlacedBlocks, pushPieceBlocks } from "./collision.js";
import { getControllerIndexFromXbox, GamepadState } from "../input/index.js";
import { loadHighscores, saveHighscores, ScoreEntry } from "./highscore.js";

type ScreenState = "PLAYING" | "GAME_OVER" | "LEADERBOARD";

const PieceStartingLocation = { x: 4, y: 0 }
const BOARD_WIDTH = 10;

const buttonMapping = {
    left: "D_PAD_LEFT",
    right: "D_PAD_RIGHT",
    hardDrop: "D_PAD_UP",
    softDrop: "D_PAD_DOWN",
    rotateCW: "B",
    rotateCCW: "A",
    restart: "Y",
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
    highscores: ScoreEntry[];   // <-- dit is nu de lijst met 3 scores
    level: number;
    lines: number;
    gameOver?: boolean;
    showLeaderboard?: boolean;

}

export class TetrisGameAdapter {
    private game: TetrisGame = new TetrisGame();
    
    private screenState: ScreenState = "PLAYING";

    private lastButtonStates: ButtonStates = {
        left: false,
        right: false,
        hardDrop: false,
        softDrop: false,
        rotateCW: false,
        rotateCCW: false,
        restart: false,
    };


    private buildGameData(extra: any = {}): GameData {
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
highscores: this.game.highscores,
        level: this.game.level,
        lines: this.game.lines,
        gameOver: this.game.gameOver,
        showLeaderboard: this.game.showLeaderboard,   // <-- BELANGRIJK
        ...extra
    };
}


    executeTick(controllerState: GamepadState): GameData {
    const input = this.handleInput(controllerState);

    // --- STATE: PLAYING ---
    if (this.screenState === "PLAYING") {
        this.game.executeTick(input.moveHorizontal, input.moveRotation, input.dropSoft, input.dropHard);

        if (this.game.gameOver) {
            this.screenState = "GAME_OVER";
        }

        return this.buildGameData();
    }

    // --- STATE: GAME OVER (eerste scherm) ---
    if (this.screenState === "GAME_OVER") {
        if (input.restartPressed) {
            this.game.showLeaderboard = true;   // <-- ACTIVATE
            this.screenState = "LEADERBOARD"; 
  // → eerst leaderboard scherm
        }

        return this.buildGameData();
    }

    // --- STATE: LEADERBOARD ---
    if (this.screenState === "LEADERBOARD") {
        if (input.restartPressed) {
            // nieuwe game starten
            this.game = new TetrisGame();
            this.game.showLeaderboard = false;   // <-- RESET
            this.screenState = "PLAYING";
        }

        return this.buildGameData({ showLeaderboard: true });
    }

    return this.buildGameData();
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

        const restartPressed = wasJustPressed('restart');

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

        const dropSoft = currentButtonStates.softDrop;

        this.lastButtonStates = currentButtonStates;

        return { moveHorizontal, moveRotation, dropHard, dropSoft, restartPressed };
    }
}

function getTicksPerDrop(level: number, dropType: keyof typeof ticksPerDropBase): number {
    const base = ticksPerDropBase[dropType];
    if (base === 0) {
        return 0;
    }
    const speedIncrease = Math.min(level - 1, 20);
    return Math.max(1, base - Math.floor(speedIncrease / 2));
}

const ticksPerDropBase = {
    normal: 20,
    soft: 3,
    hard: 0,
};

let newGameIndex = 0;

export class TetrisGame {
    gameOver: boolean = false;
    showLeaderboard: boolean = false;

    private _highscores: ScoreEntry[] = loadHighscores();
    private ticks: number = 0;
    private _placedBlocks: PlacedBlocks = [];
    private _currentPiece: MovablePiece;
    private _nextPiece: { rotation: number; type: PiecesKeyType };

    private _score: number = 0;
    private _level: number = 1;
    private _lines: number = 0;

    public _gameIndex = newGameIndex++;

    constructor() {
        this._currentPiece = this.createNewPiece();
        this._nextPiece = this.createNewPiece();
    }

    get placedBlocks() {
        return this._placedBlocks;
    }

    get currentPiece() {
        return this._currentPiece;
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

    get highscores() {
        return this._highscores;
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
                if (!this.drop()) {
                    return;
                }
            }
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
            return true
        } else {
            pushPieceBlocks(this.currentPiece, this._placedBlocks);

            this.clearLines();

            this.spawnNewPiece();

            if (!canMovePiece(0, 1, this.currentPiece, this._placedBlocks)) {

    // Update top 3 highscores
    this.updateHighscores();

    // Game eindigt
    this.gameOver = true;
    this.showLeaderboard = false;

}

            return false;
        }
    }

    private clearLines() {
        const boardHeight = 27;

        const fullLines = Array.from({ length: boardHeight }, (_, i) => i)
            .filter(y => this._placedBlocks.filter(b => b.y === y).length === BOARD_WIDTH);

        if (fullLines.length > 0) {
            this._lines += fullLines.length;
            this.updateScore(fullLines.length);

            const newPlacedBlocks: PlacedBlocks = [];
            this._placedBlocks
                .filter(block => !fullLines.includes(block.y))
                .forEach(block => {
                    const linesClearedBelow = fullLines.filter(y => y > block.y).length;
                    newPlacedBlocks.push({ x: block.x, y: block.y + linesClearedBelow });
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
            type: getRandomPiece(this._gameIndex),
        }
    }
    private updateHighscores() {
    const playerName = "AAA";  // TODO: later naam-invoer maken

    // Voeg nieuwe score toe
    this._highscores.push({
        name: playerName,
        score: this._score,
    });

    // Sorteer desc op score
    this._highscores.sort((a, b) => b.score - a.score);

    // Hou alleen top 3
    this._highscores = this._highscores.slice(0, 3);

    // Sla op in JSON
    saveHighscores(this._highscores);
}

}