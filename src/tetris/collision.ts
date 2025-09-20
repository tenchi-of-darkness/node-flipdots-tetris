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
        for (const block of placedBlocks) {
            if (pieceBlock.y + piece.y + yMove === block.y && pieceBlock.x + piece.x + xMove === block.x) {
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
