import React from "react";
import { Button } from "@/Component/UI/Button";
import {
  RotateCcw,
  Flag,
  Lightbulb,
  Sparkles,
  Eye,
  Play,
  Plus,
} from "lucide-react";

interface GameControlButtonsProps {
  isGameOver: boolean;
  live: boolean;
  hasMoves: boolean;
  engineEnabled: boolean;
  analysing: { done: number; total: number } | null;
  analysisView: "play" | "analysis" | "review";
  hasAnalysis: boolean;
  onStartAnalysis: () => void;
  onReview: () => void;
  onShowHint: () => void;
  onUndo: () => void;
  onResign: () => void;
  onRematch: () => void;
  onNewGame: () => void;
  compact?: boolean;
}

export const GameControlButtons: React.FC<GameControlButtonsProps> = ({
  isGameOver,
  live,
  hasMoves,
  engineEnabled,
  analysing,
  analysisView,
  hasAnalysis,
  onStartAnalysis,
  onReview,
  onShowHint,
  onUndo,
  onResign,
  onRematch,
  onNewGame,
  compact = false,
}) => {
  // ── Compact Mobile Horizontal Mode ──────────────────────────────────────────
  if (compact) {
    return (
      <div className="flex items-center justify-between gap-1.5 w-full">
        {isGameOver ? (
          <>
            <Button
              variant="default"
              size="sm"
              onClick={onRematch}
              className="flex-1 text-xs gap-1 py-1 h-8"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Rematch
            </Button>
            {hasMoves && !hasAnalysis && (
              <Button
                variant="outline"
                size="sm"
                onClick={onStartAnalysis}
                disabled={!!analysing}
                className="flex-1 text-xs gap-1 py-1 h-8"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {analysing ? `${analysing.done}/${analysing.total}` : "Analyze"}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onNewGame}
              className="text-xs gap-1 py-1 h-8 px-2"
            >
              <Plus className="w-3.5 h-3.5" />
              New
            </Button>
          </>
        ) : (
          <>
            {engineEnabled && live && (
              <Button
                variant="outline"
                size="sm"
                onClick={onShowHint}
                className="flex-1 text-xs gap-1 py-1 h-8"
              >
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                Hint
              </Button>
            )}
            {live && hasMoves && (
              <Button
                variant="outline"
                size="sm"
                onClick={onUndo}
                className="flex-1 text-xs gap-1 py-1 h-8"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Undo
              </Button>
            )}
            {live && (
              <Button
                variant="destructive"
                size="sm"
                onClick={onResign}
                className="flex-1 text-xs gap-1 py-1 h-8"
              >
                <Flag className="w-3.5 h-3.5" />
                Resign
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onNewGame}
              className="text-xs gap-1 py-1 h-8 px-2"
            >
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </>
        )}
      </div>
    );
  }

  // ── Standard Vertical Desktop Mode ─────────────────────────────────────────
  return (
    <div className="flex flex-col gap-2 w-full">
      {isGameOver ? (
        <>
          <Button variant="default" onClick={onRematch} className="w-full gap-2">
            <RotateCcw className="w-4 h-4" />
            Rematch
          </Button>

          {hasMoves && !hasAnalysis && (
            <Button
              variant="outline"
              onClick={onStartAnalysis}
              disabled={!!analysing}
              className="w-full gap-2"
            >
              <Sparkles className="w-4 h-4 text-purple-400" />
              {analysing
                ? `Analyzing (${analysing.done}/${analysing.total})...`
                : "Analyze Game"}
            </Button>
          )}

          {hasAnalysis && analysisView !== "review" && (
            <Button variant="outline" onClick={onReview} className="w-full gap-2">
              <Eye className="w-4 h-4" />
              Review Game
            </Button>
          )}

          <Button variant="ghost" onClick={onNewGame} className="w-full gap-2">
            <Plus className="w-4 h-4" />
            New Setup
          </Button>
        </>
      ) : (
        <>
          {engineEnabled && live && (
            <Button variant="outline" onClick={onShowHint} className="w-full gap-2">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              Get Hint
            </Button>
          )}

          {live && hasMoves && (
            <Button variant="outline" onClick={onUndo} className="w-full gap-2">
              <RotateCcw className="w-4 h-4" />
              Undo Move
            </Button>
          )}

          {live && (
            <Button variant="destructive" onClick={onResign} className="w-full gap-2">
              <Flag className="w-4 h-4" />
              Resign
            </Button>
          )}

          <Button variant="ghost" onClick={onNewGame} className="w-full gap-2">
            <Plus className="w-4 h-4" />
            New Game
          </Button>
        </>
      )}
    </div>
  );
};