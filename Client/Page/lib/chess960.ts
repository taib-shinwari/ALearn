// Generate a Chess960 (Fischer Random) starting FEN.
// Rules: bishops on opposite colors, king between rooks.
export function random960Fen(): string {
  const slots: (string | null)[] = Array(8).fill(null);
  // Place light & dark bishop
  const lightSquares = [1, 3, 5, 7]; // a=0 is dark; we use 0-indexed file: 0,2,4,6 dark / 1,3,5,7 light
  const darkSquares = [0, 2, 4, 6];
  slots[lightSquares[Math.floor(Math.random() * 4)]] = "B";
  slots[darkSquares[Math.floor(Math.random() * 4)]] = "B";
  // Queen
  let empty = slots.map((v, i) => v === null ? i : -1).filter(i => i >= 0);
  slots[empty[Math.floor(Math.random() * empty.length)]] = "Q";
  // Knights x2
  for (let n = 0; n < 2; n++) {
    empty = slots.map((v, i) => v === null ? i : -1).filter(i => i >= 0);
    slots[empty[Math.floor(Math.random() * empty.length)]] = "N";
  }
  // Remaining 3 slots: R K R (king between rooks)
  empty = slots.map((v, i) => v === null ? i : -1).filter(i => i >= 0);
  slots[empty[0]] = "R";
  slots[empty[1]] = "K";
  slots[empty[2]] = "R";
  const back = slots.join("");
  const pawns = "PPPPPPPP";
  const fen = `${back.toLowerCase()}/${pawns.toLowerCase()}/8/8/8/8/${pawns}/${back} w KQkq - 0 1`;
  return fen;
}
