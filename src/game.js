import Pieces from '../src/pieces.js'

let gameOver = false;
let CurrentPiece = [];
let CurrentPieceData = {x: 4, y: 0, rotation: 0}
let NextPiece = [];
let PlacedBlocks = [];

export const onGameStart = () => {
    const first = getRandomPiece();
    const next = getRandomPiece();

    CurrentPiece = Pieces[first.type];
    CurrentPieceData = { x: 4, y: 0, rotation: first.rotation};
    NextPiece = Pieces[next.type];
};

const spawnNextPiece = () => {
    const random = getRandomPiece();

    CurrentPiece = NextPiece;
    CurrentPieceData = { x: 4, y: 0, rotation: random.rotation };

    NextPiece = Pieces[random.type];
};


let timeAccumulate = 0;

export const executeGameLogic = ({deltaTime, elapsedTime}) => {
    timeAccumulate = timeAccumulate + deltaTime;

    if(timeAccumulate > 1){
        timeAccumulate -= 1;
        tetrisTime()
    }

    return {
        currentPiece: {x: CurrentPieceData.x, y: CurrentPieceData.y, rotation: CurrentPieceData.rotation, piece: CurrentPiece},
        nextPiece: {piece: NextPiece},
        blockGrid: PlacedBlocks,
    }
}

const userInput = (event) => {
    const arrows = { left: 37, up: 38, right: 39, down: 40};
    const actions = {
        [arrows.left]:  'moveLeft',
        [arrows.up]:    'moveDownSlightlyFaster',
        [arrows.right]: 'moveRight',
        [arrows.down]:  'moveDownFast'
    }
    if (actions[event.keyCode] !== undefined){ // ignore unmapped keys
        this.field.handle(actions[event.keyCode]);
    }
}

const moveRight = () => {
    this.x += 1;
}

const moveLeft = () => {
    this.x -= 1;
}

const moveDown = () => {
    this.y += 1;
}

const getRandomPiece = () => {
    const pieceTypes = Object.keys(Pieces);

    const randomType = Math.floor(Math.random() * pieceTypes.length);

    const randomRotation = Math.floor(Math.random()*4);

    return{
        type: pieceTypes[randomType],
        rotation: randomRotation,
    }
}

const placePiece = (ctx, boardX, pieceParts, placedPieces) => {

}

const canMovePiece = (xMove, yMove, piece) => {
    for (const pieceBlock of piece[CurrentPieceData.rotation]) {
        if (pieceBlock.y + CurrentPieceData.y + yMove > 26){
            return false;
        }
        for (const block of PlacedBlocks) {
            if (pieceBlock.y + CurrentPieceData.y + yMove === block.y && pieceBlock.x + CurrentPieceData.x + xMove === block.x) {
                return false;
            }
        }
    }
    return true;
}

const tetrisTime = () => {
    if(gameOver){
        PlacedBlocks = [];
        spawnNextPiece()
        gameOver = false;
    }


    console.log("EverySecond")

    if(canMovePiece(0, 1, CurrentPiece)){
        CurrentPieceData.y = CurrentPieceData.y + 1;
    }else{
        PlacedBlocks.push(...CurrentPiece[CurrentPieceData.rotation].map(part => {
            return {x: part.x + CurrentPieceData.x, y: part.y + CurrentPieceData.y};
        }));
        spawnNextPiece()
        if(!canMovePiece(0, 0, CurrentPiece)){
            gameOver = true;
        }
    }
}