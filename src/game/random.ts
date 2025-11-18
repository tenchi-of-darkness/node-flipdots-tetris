import {Pieces, PiecesKeyType} from "./pieces.js";

let currentBags: PiecesKeyType[][] = [];

const shuffleBag = <T>(array: T[]): T[] => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

export const getRandomPiece = (index: number): PiecesKeyType => {
    if (!currentBags[index] || currentBags[index].length === 0) {
        const pieceTypes = Object.keys(Pieces) as PiecesKeyType[];
        currentBags[index] = shuffleBag(pieceTypes);
    }
    return currentBags[index].pop()!;
}

export const getRandomRotation = () => {
    return Math.floor(Math.random() * 4);
}