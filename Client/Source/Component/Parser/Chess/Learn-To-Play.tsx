// @/Component/Parser/Chess/Learn-To-Play.tsx

export type PieceColor = "w" | "b";
export type PieceType = "P" | "N" | "B" | "R" | "Q" | "K";

export interface PlacedPiece {
  id?: string;
  square: string;
  type: PieceType;
  color: PieceColor;
  themed?: boolean;
  hidden?: boolean;
}

export interface Arrow {
  from: string;
  to: string;
  color?: string;
}

export interface ParsedLessonStep {
  piece: PlacedPiece;
  extras: PlacedPiece[];
  stars: string[];
  intro: string;
  orientation: "white" | "black";
  randomStars?: number;
  done?: string;
  introArrows: Arrow[];
}

/**
 * Parses algebraic notation like "Ke1", "Ra1", or "e4" into a PlacedPiece object.
 */
export function parsePieceSpec(spec: string, color: PieceColor = "w"): PlacedPiece {
  const clean = String(spec).trim();
  const match = clean.match(/^([KQRBNkqrbn])?([a-h][1-8])$/i);

  if (!match) {
    console.warn(`[Lesson Parser] Invalid piece notation: "${spec}". Defaulting to Pawn on e4.`);
    return { square: "e4", type: "P", color };
  }

  const type = (match[1] ? match[1].toUpperCase() : "P") as PieceType;
  const square = match[2].toLowerCase();

  return { square, type, color };
}

/**
 * Normalizes array or comma-separated star notations into valid square lists.
 */
export function parseStars(starsArr: any): string[] {
  if (!starsArr) return [];
  const rawList = Array.isArray(starsArr) ? starsArr.flat(Infinity) : [starsArr];

  return rawList
    .flatMap((s) => String(s).split(","))
    .map((s) => s.trim().toLowerCase())
    .filter((s) => /^[a-h][1-8]$/.test(s));
}

/**
 * Calculates movement arrows showing the directions a piece can move along the board axes/diagonals.
 */
export function generateMovementArrows(pieceType: PieceType, fromSquare: string): Arrow[] {
  if (!fromSquare || fromSquare.length !== 2) return [];

  const file = fromSquare[0];
  const rank = parseInt(fromSquare[1], 10);
  const fileIdx = file.charCodeAt(0) - 97; // 0 (a) to 7 (h)
  const rankIdx = rank - 1;                // 0 (1) to 7 (8)

  const arrows: Arrow[] = [];
  const color = "hsl(var(--primary))";

  switch (pieceType) {
    case "R": {
      // Rook: 4 straight directions (top, bottom, right, left)
      if (rankIdx < 7) arrows.push({ from: fromSquare, to: `${file}8`, color });
      if (rankIdx > 0) arrows.push({ from: fromSquare, to: `${file}1`, color });
      if (fileIdx < 7) arrows.push({ from: fromSquare, to: `h${rank}`, color });
      if (fileIdx > 0) arrows.push({ from: fromSquare, to: `a${rank}`, color });
      break;
    }

    case "B": {
      // Bishop: 4 diagonal directions
      const tr = Math.min(7 - fileIdx, 7 - rankIdx); // top-right
      const tl = Math.min(fileIdx, 7 - rankIdx);     // top-left
      const br = Math.min(7 - fileIdx, rankIdx);     // bottom-right
      const bl = Math.min(fileIdx, rankIdx);         // bottom-left

      if (tr > 0) arrows.push({ from: fromSquare, to: `${String.fromCharCode(97 + fileIdx + tr)}${rank + tr}`, color });
      if (tl > 0) arrows.push({ from: fromSquare, to: `${String.fromCharCode(97 + fileIdx - tl)}${rank + tl}`, color });
      if (br > 0) arrows.push({ from: fromSquare, to: `${String.fromCharCode(97 + fileIdx + br)}${rank - br}`, color });
      if (bl > 0) arrows.push({ from: fromSquare, to: `${String.fromCharCode(97 + fileIdx - bl)}${rank - bl}`, color });
      break;
    }

    case "Q": {
      // Queen: Combination of Rook and Bishop arrows
      return [
        ...generateMovementArrows("R", fromSquare),
        ...generateMovementArrows("B", fromSquare),
      ];
    }

    case "K": {
      // King: 1-step outward arrows in surrounding squares
      const offsets = [
        [0, 1], [0, -1], [1, 0], [-1, 0],
        [1, 1], [1, -1], [-1, 1], [-1, -1]
      ];
      for (const [df, dr] of offsets) {
        const nf = fileIdx + df;
        const nr = rankIdx + dr;
        if (nf >= 0 && nf <= 7 && nr >= 0 && nr <= 7) {
          arrows.push({
            from: fromSquare,
            to: `${String.fromCharCode(97 + nf)}${nr + 1}`,
            color,
          });
        }
      }
      break;
    }

    default:
      break;
  }

  return arrows;
}

/**
 * Core Parser: Transforms raw step inputs into a strongly-typed ParsedLessonStep.
 */
export function parseLessonStep(raw: any): ParsedLessonStep | null {
  if (!raw) return null;

  // 1. Object format handling
  if (!Array.isArray(raw) && typeof raw === "object" && raw.piece) {
    const piece = typeof raw.piece === "string" ? parsePieceSpec(raw.piece) : raw.piece;
    const stars = parseStars(raw.stars);
    const customArrows = raw.introArrows ?? [];

    return {
      piece,
      extras: raw.extras ?? [],
      stars,
      intro: raw.intro ?? "",
      orientation: raw.orientation ?? "white",
      randomStars: raw.randomStars,
      done: raw.done,
      introArrows: customArrows.length > 0 ? customArrows : generateMovementArrows(piece.type, piece.square),
    };
  }

  // 2. Compact tuple format handling: [pieceSpec, starsArr, introKey, configObj?]
  if (Array.isArray(raw)) {
    const [pieceSpec, starsArr, introKey, config = {}] = raw;

    if (!pieceSpec || !introKey) {
      console.warn("[Lesson Parser] Invalid step tuple structure:", raw);
      return null;
    }

    const piece = parsePieceSpec(pieceSpec, config.color ?? "w");
    const stars = parseStars(starsArr);
    const customArrows = config.introArrows ?? [];

    return {
      piece,
      extras: config.extras ?? [],
      stars,
      intro: String(introKey),
      orientation: config.orientation ?? "white",
      randomStars: config.randomStars,
      done: config.doneKey ?? config.done,
      introArrows: customArrows.length > 0 ? customArrows : generateMovementArrows(piece.type, piece.square),
    };
  }

  return null;
}