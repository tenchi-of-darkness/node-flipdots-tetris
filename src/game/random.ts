import {Pieces, PiecesKeyType} from "./pieces.js";

export const getRandomPiece = (): PiecesKeyType => {
    const pieceTypes = Object.keys(Pieces) as PiecesKeyType[];
    const randomTypeIndex = Math.floor(Math.random() * pieceTypes.length);
    return pieceTypes[randomTypeIndex];
}

export const getRandomRotation = () => {
    return Math.floor(Math.random()*4);
}
