import {Pieces, PiecesKeyType} from "./pieces.js";

let currentBag: PiecesKeyType[] = [];

const shuffleBag = <T>(array: T[]): T[] => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

export const getRandomPiece = (): PiecesKeyType => {
    if (currentBag.length === 0) {
        const pieceTypes = Object.keys(Pieces) as PiecesKeyType[];
        currentBag = shuffleBag(pieceTypes);
    }
    return currentBag.pop()!;
}

export const getRandomRotation = () => {
    return Math.floor(Math.random() * 4);
}