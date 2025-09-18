import Pieces from '../src/pieces.js'

let CurrentPiece = [];
let CurrentPieceData = {x: 4, y: 0, rotation: 0}
let NextPiece = [];
let PlacedBlocks = [{x: 1, y: 26}, {x: 2, y: 26}, {x: 3, y: 26}, {x: 4, y: 26} ];

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

    console.log(timeAccumulate);
    console.log(CurrentPieceData);
    console.log(PlacedBlocks);

    if(timeAccumulate > 5){
        timeAccumulate -= 5;
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

const tetrisTime = () => {
    let shouldStop = false;
    console.log("EverySecond")


    for (let i = 0; i < CurrentPiece[CurrentPieceData.rotation].length; i++) {
        const yCurrent = CurrentPiece[CurrentPieceData.rotation][i].y;
        const xCurrent = CurrentPiece[CurrentPieceData.rotation][i].x;
        if (yCurrent + CurrentPieceData.y > 25){
            shouldStop = true;
            break;
        }
        for (let j = 0; j < PlacedBlocks.length; j++) {
            const block = PlacedBlocks[j];
            if (yCurrent + CurrentPieceData.y +1 === block.y && xCurrent + CurrentPieceData.x === block.x) {
                shouldStop = true;
                break;
            }
        }
    }

    if(!shouldStop){
        CurrentPieceData.y = CurrentPieceData.y + 1;
    }else{
        PlacedBlocks.push(...CurrentPiece[CurrentPieceData.rotation].map(part => {
            return {x: part.x + CurrentPieceData.x, y: part.y + CurrentPieceData.y};
        }));
        spawnNextPiece()
    }
}