import {Pieces, PiecesKeyType} from "./pieces.js";

export const getRandomPiece = () => {
    const pieceTypes = Object.keys(Pieces);

    const randomType = Math.floor(Math.random() * pieceTypes.length);

    const keyAny: any = pieceTypes[randomType];
    const key: PiecesKeyType = keyAny;

    return key
}

export const getRandomRotation = () => {
    return Math.floor(Math.random()*4);
}