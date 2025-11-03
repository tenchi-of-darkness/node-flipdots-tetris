import {Pieces, PiecesKeyType} from "./pieces.js";

export interface MovablePiece {
    x: number;
    y: number;
    rotation: number;
    type: PiecesKeyType;
}

export const canMovePiece = (xMove: number, yMove: number, piece: MovablePiece, placedBlocks: PlacedBlocks) => {
    for (const pieceBlock of Pieces[piece.type][piece.rotation]) {
        if (pieceBlock.y + piece.y + yMove > 26){
            return false;
        }
        if (pieceBlock.x + piece.x + xMove < 0 || pieceBlock.x + piece.x + xMove > 9){
            return false;
        }
        for (const block of placedBlocks) {
            if (pieceBlock.y + piece.y + yMove === block.y && pieceBlock.x + piece.x + xMove === block.x) {
                return false;
            }
        }
    }
    return true;
}


export const canRotatePiece = (rotationMove: number, piece: MovablePiece, placedBlocks: PlacedBlocks) => {
    for (const pieceBlock of Pieces[piece.type][(piece.rotation + rotationMove+4)%4]) {
        if (pieceBlock.y + piece.y > 26){
            return false;
        }
        if (pieceBlock.x + piece.x < 0 || pieceBlock.x + piece.x > 9){
            return false;
        }
        for (const block of placedBlocks) {
            if (pieceBlock.y + piece.y === block.y && pieceBlock.x + piece.x === block.x) {
                return false;
            }
        }
    }
    return true;
}

export interface PlacedBlock {
    x: number;
    y: number;
}

export type PlacedBlocks = PlacedBlock[];

export const pushPieceBlocks = (piece: MovablePiece, placedBlocks: PlacedBlocks) => {
    placedBlocks.push(...Pieces[piece.type][piece.rotation].map(part => {
        return {x: part.x + piece.x, y: part.y + piece.y};
    }));
}
