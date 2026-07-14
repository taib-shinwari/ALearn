// ────────────────────────── audio ─────────────────────────────
let audioCtx: AudioContext | null = null;

export function playMoveSound(kind: "move" | "capture" = "move") {
  try {
    audioCtx ??= new (window.AudioContext || (window as any).webkitAudioContext)();
    const ctx = audioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = "triangle";
    osc.frequency.value = kind === "capture" ? 220 : 380;
    gain.gain.value = 0.0001;
    gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
    osc.start();
    osc.stop(ctx.currentTime + 0.13);
  } catch { /* noop */ }
}