// Highcharts area chart that visualises eval per move, styled after chess.com.
import { useMemo, useRef, useEffect } from "react";
import HighchartsReact from "highcharts-react-official";
import Highcharts from "highcharts";
import { Chess } from "chess.js";
import { evaluate } from "Client/Library/chessEngine";
import { CLASS_META, type PerMove } from "./classification";

interface Props {
  fens: string[];       // length = sans.length + 1
  perMove: PerMove[];
  currentIndex: number; // ply index currently viewed (-1 = start)
  onSelect?: (index: number) => void;
}

export function EvalChart({ fens, perMove, currentIndex, onSelect }: Props) {
  const evals = useMemo(() => {
    const out: number[] = [];
    for (let i = 1; i < fens.length; i++) {
      try { out.push(evaluate(new Chess(fens[i])) / 100); }
      catch { out.push(0); }
    }
    return out;
  }, [fens]);

  const chartRef = useRef<any>(null);
  const data = evals.map((v, i) => ({
    x: i + 1,
    y: Math.max(-8, Math.min(8, v)),
    color: perMove[i] ? CLASS_META[perMove[i].kind].color : "#888",
  }));

  const options: Highcharts.Options = useMemo(() => ({
    chart: {
      type: "area",
      backgroundColor: "transparent",
      height: 160,
      spacing: [6, 0, 0, 0],
      animation: false,
    },
    title: { text: undefined },
    credits: { enabled: false },
    legend: { enabled: false },
    xAxis: {
      visible: false,
      min: 0.5,
      max: Math.max(1, evals.length) + 0.5,
      plotLines: currentIndex >= 0 ? [{
        value: currentIndex + 1,
        color: "#22c55e",
        width: 2,
        zIndex: 5,
      }] : [],
    },
    yAxis: {
      min: -8, max: 8,
      gridLineColor: "rgba(255,255,255,0.06)",
      lineWidth: 0,
      tickWidth: 0,
      labels: { enabled: false },
      title: { text: undefined },
      plotLines: [{ value: 0, color: "rgba(255,255,255,0.25)", width: 1, zIndex: 4 }],
    },
    tooltip: {
      backgroundColor: "rgba(20,20,20,0.9)",
      borderRadius: 8,
      style: { color: "#fff", fontSize: "11px" },
      formatter(this: any) {
        const ply = (this.x ?? 0) - 1;
        const m = perMove[ply];
        const moveNum = Math.floor(ply / 2) + 1;
        const tag = ply % 2 === 0 ? `${moveNum}.` : `${moveNum}...`;
        const k = m ? CLASS_META[m.kind].label : "";
        return `<b>${tag} ${m?.san ?? ""}</b><br/>Eval: ${Number(this.y).toFixed(2)}<br/>${k}`;
      },
    },
    plotOptions: {
      area: {
        animation: false,
        marker: { enabled: true, radius: 3, lineWidth: 0 },
        lineColor: "rgba(255,255,255,0.5)",
        lineWidth: 1,
        fillColor: {
          linearGradient: { x1: 0, x2: 0, y1: 0, y2: 1 },
          stops: [
            [0, "rgba(255,255,255,0.95)"],
            [0.5, "rgba(255,255,255,0.5)"],
            [0.501, "rgba(0,0,0,0.5)"],
            [1, "rgba(0,0,0,0.95)"],
          ],
        },
        threshold: 0,
        states: { hover: { lineWidthPlus: 0 } },
        cursor: "pointer",
        point: {
          events: {
            click(this: any) { onSelect?.(this.x - 1); },
          },
        },
      },
    },
    series: [{
      type: "area",
      name: "Eval",
      data,
    }],
  }), [data, evals.length, currentIndex, perMove, onSelect]);

  // Force a redraw when current index changes (plotLine update path).
  useEffect(() => {
    const c = chartRef.current?.chart;
    if (!c || !c.xAxis || !c.xAxis[0]) return;
    try {
      c.xAxis[0].removePlotLine?.("cur");
      if (currentIndex >= 0) {
        c.xAxis[0].addPlotLine?.({ id: "cur", value: currentIndex + 1, color: "#22c55e", width: 2, zIndex: 5 });
      }
    } catch { /* chart torn down — ignore */ }
  }, [currentIndex]);

  return (
    <div className="rounded-[12px] overflow-hidden bg-neutral-900 px-1">
      <HighchartsReact ref={chartRef} highcharts={Highcharts} options={options} />
    </div>
  );
}
