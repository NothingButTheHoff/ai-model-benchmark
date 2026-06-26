// Correctness check: perft node counts.
// Start position: depth1=20, d2=400, d3=8902, d4=197281.
// "Kiwipete" position (heavy castling/en-passant/promotion): d1=48, d2=2039, d3=97862.
import { initialState, getAllLegalMoves, applyMove } from './src/engine/chess.js'

function perft(state, depth) {
  if (depth === 0) return 1
  let nodes = 0
  for (const move of getAllLegalMoves(state)) {
    nodes += perft(applyMove(state, move), depth - 1)
  }
  return nodes
}

// Minimal FEN parser → engine state (board, turn, castling, en passant).
function fromFEN(fen) {
  const [placement, turn, castle, ep] = fen.split(' ')
  const board = Array.from({ length: 8 }, () => Array(8).fill(null))
  placement.split('/').forEach((rowStr, r) => {
    let c = 0
    for (const ch of rowStr) {
      if (/\d/.test(ch)) c += +ch
      else {
        const color = ch === ch.toUpperCase() ? 'w' : 'b'
        board[r][c] = { type: ch.toLowerCase(), color }
        c++
      }
    }
  })
  let enPassant = null
  if (ep && ep !== '-') {
    const files = 'abcdefgh'
    enPassant = { r: 8 - +ep[1], c: files.indexOf(ep[0]) }
  }
  return {
    board,
    turn: turn === 'w' ? 'w' : 'b',
    castling: {
      wK: castle.includes('K'), wQ: castle.includes('Q'),
      bK: castle.includes('k'), bQ: castle.includes('q'),
    },
    enPassant,
    halfmove: 0,
    fullmove: 1,
    history: [],
    captured: { w: [], b: [] },
    status: 'ongoing',
    winner: null,
  }
}

const cases = [
  { name: 'start', state: initialState(), exp: { 1: 20, 2: 400, 3: 8902, 4: 197281 } },
  {
    name: 'kiwipete',
    state: fromFEN('r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq -'),
    exp: { 1: 48, 2: 2039, 3: 97862 },
  },
]

let ok = true
for (const { name, state, exp } of cases) {
  for (const d of Object.keys(exp).map(Number)) {
    const n = perft(state, d)
    const pass = n === exp[d]
    if (!pass) ok = false
    console.log(`${name} perft(${d}) = ${n}  expected ${exp[d]}  ${pass ? 'OK' : 'FAIL'}`)
  }
}
process.exit(ok ? 0 : 1)
