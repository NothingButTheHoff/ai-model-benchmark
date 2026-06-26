# Quick Verification Test

Run these tests in order to verify all core functionality works.

## 1. Initial State ✓
- Board shows all pieces in correct positions
- Turn indicator shows "White"
- No captured pieces shown
- Can click white pieces (they highlight)
- Cannot select black pieces

## 2. Basic Movement ✓
1. Click e2 white pawn → shows valid moves (e3, e4)
2. Click e4 → pawn moves
3. Turn changes to "Black"
4. Click e7 black pawn → shows valid moves
5. Click e5 → pawn moves

## 3. Capture
1. White: d2-d4
2. Black: c7-c5
3. White: d4xc5 (pawn captures)
4. Black pawn appears in "Black's Captures" sidebar
5. Turn switches correctly

## 4. En Passant
1. White: e2-e4
2. Black: a7-a6 (random move)
3. White: e4-e5
4. Black: d7-d5 (two squares, next to white pawn)
5. White: e5-d6 should be valid (en passant)
6. Click e5 pawn → d6 highlighted
7. Execute move → black pawn on d5 disappears

## 5. Castling - Kingside
1. Start new game
2. White: e2-e4
3. Black: e7-e5
4. White: Nf3
5. Black: Nc6
6. White: Bc4
7. Black: Bc5
8. White: click King on e1 → g1 should be highlighted (castling)
9. Click g1 → King moves to g1, Rook moves to f1

## 6. Check Detection
1. Set up position where black king is in check
2. "Black is in check!" message appears
3. Only moves that block/escape/capture are valid

## 7. Pawn Promotion
1. Advance white pawn to 8th rank
2. Dialog appears with 4 piece choices
3. Click Queen → pawn becomes Queen
4. Turn switches to Black

## 8. Persistence
1. Make several moves
2. Refresh page (Cmd+R / F5)
3. Game state preserved
4. Turn indicator correct
5. Captured pieces still shown

## 9. Reset
1. Click "Reset Game" button
2. Confirmation appears
3. Click OK
4. Board resets to starting position
5. Turn back to White
6. Captured pieces cleared

## Pass Criteria

All sections must work without errors. If any test fails:
- Check browser console for errors
- Verify which component/function is failing
- Fix and re-test

## Current Status

**Build:** ✓ Passes  
**Manual Tests:** Awaiting browser verification

## Known Good Behaviors

- Engine validates all moves before allowing them
- Can't select opponent pieces
- Can't move into check
- Special moves (en passant, castling) appear in valid moves
- Promotion dialog prevents other moves until resolved
