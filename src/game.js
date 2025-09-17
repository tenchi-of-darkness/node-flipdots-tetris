import Pieces from '../src/pieces.js'

// let GameOver = false;
// var score = 0;
let CurrentPiece = [];
let CurrentPieceData = {x: 4, y: 0, rotation: 0}
let NextPiece = [];
let PlacedBlocks = [{x: 1, y: 26}, {x: 2, y: 26}, {x: 3, y: 26}, {x: 4, y: 26} ];
const placedPieces = [];

export const onGameStart = () => {
    CurrentPiece = Pieces.Z
    NextPiece = Pieces.Z
}

let timeAccumulate = 0;

export const executeGameLogic = ({deltaTime, elapsedTime}) => {
    timeAccumulate = timeAccumulate + deltaTime;

    console.log(timeAccumulate);
    console.log(CurrentPieceData);

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

const placePiece = (ctx, boardX, pieceParts, placedPieces) => {

}

const tetrisTime = () => {
    let shouldStop = false;
    console.log("EverySecond")

    for (let i = 0; i < CurrentPiece[CurrentPieceData.rotation].length; i++) {
        if (CurrentPiece[CurrentPieceData.rotation][i].y + CurrentPieceData.y > 25){
            shouldStop = true;
        }
    }

    if(!shouldStop){
        CurrentPieceData.y = CurrentPieceData.y + 1;
    }


    // placedPieces.push(CurrentPiece[CurrentPieceData.rotation].map(part => {
    //     return {x: part.x, y: part.y};
    // }));

}