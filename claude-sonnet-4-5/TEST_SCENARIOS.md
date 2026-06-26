# Manual Test Scenarios

## Basic Movement Tests

### 1. Pawn Movement
- [x] White pawn moves 1 square forward
- [x] White pawn moves 2 squares from starting position
- [x] Black pawn moves 1 square forward  
- [x] Black pawn moves 2 squares from starting position
- [x] Pawn blocked by piece can't move
- [x] Pawn can capture diagonally

### 2. Piece Movement
- [x] Knight moves in L-shape
- [x] Bishop moves diagonally
- [x] Rook moves horizontally/vertically
- [x] Queen moves in all directions
- [x] King moves one square in any direction

### 3. Capture
- [x] Piece captures opponent piece
- [x] Captured piece appears in captured list
- [x] Can't capture own piece

## Special Move Tests

### 4. En Passant
- [ ] White pawn advances 2 squares past black pawn
- [ ] Black pawn can capture en passant
- [ ] En passant only valid immediately after 2-square move
- [ ] Black pawn advances 2 squares past white pawn
- [ ] White pawn can capture en passant

### 5. Castling - Kingside
- [ ] White can castle kingside when conditions met
- [ ] Black can castle kingside when conditions met
- [ ] Can't castle if king has moved
- [ ] Can't castle if rook has moved
- [ ] Can't castle if pieces between king and rook
- [ ] Can't castle out of check
- [ ] Can't castle through attacked square

### 6. Castling - Queenside
- [ ] White can castle queenside when conditions met
- [ ] Black can castle queenside when conditions met
- [ ] Same blocking conditions as kingside

### 7. Pawn Promotion
- [ ] White pawn reaches rank 8
- [ ] Promotion dialog appears
- [ ] Can select Queen
- [ ] Can select Rook
- [ ] Can select Bishop
- [ ] Can select Knight
- [ ] Promoted piece has correct color and type

## Game State Tests

### 8. Check Detection
- [ ] "Check" message appears when king in check
- [ ] King can't move into check
- [ ] Only moves that resolve check are valid
- [ ] Can block check
- [ ] Can capture checking piece

### 9. Checkmate
- [ ] Checkmate detected correctly
- [ ] "Checkmate" message shows winner
- [ ] No valid moves available

### 10. Stalemate
- [ ] Stalemate detected when no legal moves but not in check
- [ ] "Stalemate" message appears
- [ ] Game ends in draw

## UI/Persistence Tests

### 11. Turn Indicator
- [x] Shows "White's turn" at start
- [x] Switches to "Black's turn" after white moves
- [x] Alternates correctly

### 12. Valid Move Highlighting
- [x] Selected piece highlighted
- [x] Valid destination squares highlighted
- [x] Deselects when clicking selected piece again

### 13. Persistence
- [ ] Make several moves
- [ ] Refresh page
- [ ] Game state preserved
- [ ] Turn indicator correct
- [ ] Captured pieces preserved

### 14. Reset
- [ ] Click Reset Game
- [ ] Confirmation dialog appears
- [ ] Cancel keeps game
- [ ] Confirm resets board
- [ ] New game starts fresh

## Edge Cases

### 15. Invalid Moves
- [x] Can't select opponent's pieces
- [x] Can't move to invalid square
- [x] Can't move when in checkmate
- [x] Can't make move that leaves king in check

### 16. Rook Capture Affects Castling
- [ ] Capture white's a1 rook
- [ ] White can't castle queenside
- [ ] White can still castle kingside
- [ ] Capture white's h1 rook  
- [ ] White can't castle kingside

## Testing Status

**Legend:**
- [x] Verified working in code review
- [ ] Needs browser testing

**Next Steps:**
1. Run through unchecked scenarios in browser
2. Fix any bugs found
3. Update this document with results
