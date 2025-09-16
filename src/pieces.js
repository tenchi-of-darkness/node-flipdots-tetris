const offsetPiece = (piece) => piece.map((c) => {
    return {...c, x: c.x-5}
})

const LPiece0 = offsetPiece([{ x: 5, y: 1 }, { x: 6, y: 1 }, { x: 7, y: 1 }, { x: 7, y: 0 }])
const LPiece1 = offsetPiece([{ x: 6, y: 0 }, { x: 6, y: 1 }, { x: 6, y: 2 }, { x: 7, y: 2 }])
const LPiece2 = offsetPiece([{ x: 5, y: 1 }, { x: 6, y: 1 }, { x: 7, y: 1 }, { x: 5, y: 2 }])
const LPiece3 = offsetPiece([{ x: 5, y: 0 }, { x: 6, y: 0 }, { x: 6, y: 1 }, { x: 6, y: 2 }])
const LPieces = [LPiece0, LPiece1, LPiece2, LPiece3]

const IPiece0 = offsetPiece([{x: 4, y: 1}, {x: 5, y: 1}, {x: 6, y: 1}, {x: 7, y: 1}])
const IPiece1 = offsetPiece([{x: 6, y: 0}, {x: 6, y: 1}, {x: 6, y: 2}, {x: 6, y: 3}])
const IPiece2 = offsetPiece([{x: 4, y: 1}, {x: 5, y: 1}, {x: 6, y: 1}, {x: 7, y: 1}])
const IPiece3 = offsetPiece([{x: 6, y: 0}, {x: 6, y: 1}, {x: 6, y: 2}, {x: 6, y: 3}])
const IPieces = [IPiece0, IPiece1, IPiece2, IPiece3]

const OPiece0 = offsetPiece([{ x: 5, y: 0 }, { x: 5, y: 1 }, { x: 6, y: 0 }, { x: 6, y: 1 }])
const OPiece1 = offsetPiece([{ x: 5, y: 0 }, { x: 5, y: 1 }, { x: 6, y: 0 }, { x: 6, y: 1 }])
const OPiece2 = offsetPiece([{ x: 5, y: 0 }, { x: 5, y: 1 }, { x: 6, y: 0 }, { x: 6, y: 1 }])
const OPiece3 = offsetPiece([{ x: 5, y: 0 }, { x: 5, y: 1 }, { x: 6, y: 0 }, { x: 6, y: 1 }])
const OPieces = [OPiece0, OPiece1, OPiece2, OPiece3]

const SPiece0 = offsetPiece([{ x: 5, y: 1 }, { x: 6, y: 1 }, { x: 6, y: 0 }, { x: 7, y: 0 }])
const SPiece1 = offsetPiece([{ x: 5, y: 0 }, { x: 5, y: 1 }, { x: 6, y: 1 }, { x: 6, y: 2 }])
const SPiece2 = offsetPiece([{ x: 5, y: 1 }, { x: 6, y: 1 }, { x: 6, y: 0 }, { x: 7, y: 0 }])
const SPiece3 = offsetPiece([{ x: 5, y: 0 }, { x: 5, y: 1 }, { x: 6, y: 1 }, { x: 6, y: 2 }])
const SPieces = [SPiece0, SPiece1, SPiece2, SPiece3]

const ZPiece0 = offsetPiece([{ x: 5, y: 0 }, { x: 6, y: 0 }, { x: 6, y: 1 }, { x: 7, y: 1 }])
const ZPiece1 = offsetPiece([{ x: 7, y: 0 }, { x: 7, y: 1 }, { x: 6, y: 1 }, { x: 6, y: 2 }])
const ZPiece2 = offsetPiece([{ x: 5, y: 0 }, { x: 6, y: 0 }, { x: 6, y: 1 }, { x: 7, y: 1 }])
const ZPiece3 = offsetPiece([{ x: 7, y: 0 }, { x: 7, y: 1 }, { x: 6, y: 1 }, { x: 6, y: 2 }])
const ZPieces = [ZPiece0, ZPiece1, ZPiece2, ZPiece3]

const TPiece0 = offsetPiece([{ x: 5, y: 1 }, { x: 6, y: 1 }, { x: 6, y: 0 }, { x: 7, y: 1 }])
const TPiece1 = offsetPiece([{ x: 6, y: 0 }, { x: 6, y: 1 }, { x: 6, y: 2 }, { x: 7, y: 1 }])
const TPiece2 =offsetPiece( [{ x: 5, y: 1 }, { x: 6, y: 1 }, { x: 7, y: 1 }, { x: 6, y: 2 }])
const TPiece3 = offsetPiece([{ x: 5, y: 1 }, { x: 6, y: 0 }, { x: 6, y: 1 }, { x: 6, y: 2 }])
const TPieces = [TPiece0, TPiece1, TPiece2, TPiece3]

const JPiece0 = offsetPiece([{ x: 5, y: 0 }, { x: 5, y: 1 }, { x: 6, y: 1 }, { x: 7, y: 1 }])
const JPiece1 = offsetPiece([{ x: 6, y: 0 }, { x: 6, y: 1 }, { x: 6, y: 2 }, { x: 7, y: 0 }])
const JPiece2 = offsetPiece([{ x: 5, y: 1 }, { x: 6, y: 1 }, { x: 7, y: 1 }, { x: 7, y: 2 }])
const JPiece3 = offsetPiece([{ x: 6, y: 0 }, { x: 6, y: 1 }, { x: 6, y: 2 }, { x: 5, y: 2 }])
const JPieces = [JPiece0, JPiece1, JPiece2, JPiece3]

export const Pieces = {L:LPieces, I:IPieces, O:OPieces, S:SPieces, Z:ZPieces, T:TPieces, J:JPieces};

export default Pieces;