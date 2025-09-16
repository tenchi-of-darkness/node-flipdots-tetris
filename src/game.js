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

    if(timeAccumulate > 30){
        timeAccumulate -= 30;
        tetrisTime()
    }

    return {
        currentPiece: {x: CurrentPieceData.x, y: CurrentPieceData.y, rotation: CurrentPieceData.rotation, piece: CurrentPiece},
        nextPiece: {piece: NextPiece},
        blockGrid: PlacedBlocks,
    }
}

const placePiece = (ctx, boardX, pieceParts, placedPieces) => {
    if(CurrentPieceData.y && PlacedBlocks >= 27){
        placedPieces.add;
    }

}

const tetrisTime = () => {
    console.log("EverySecond")

    CurrentPieceData.y = CurrentPieceData.y + 1;


}