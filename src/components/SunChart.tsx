import { useRef, useEffect, useCallback, useState } from "react";
import type { DayData } from "../lib/useSunData";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const MONTH_NAMES_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

interface Props {
  days: DayData[];
  scrubIndex: number;
  onScrub: (index: number) => void;
  showGrid: boolean;
  twelveHour: boolean;
}

export default function SunChart({ days, scrubIndex, onScrub, showGrid, twelveHour }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [focusedMonth, setFocusedMonth] = useState<number | null>(null);

  // Compute xscale + xOffset from canvas size and zoom state
  function getScaleOffset(cssW: number) {
    const totalDays = days.length;
    let xscale = cssW / totalDays;
    let xOffset = 0;
    if (focusedMonth !== null) {
      const startIdx = days.findIndex((d) => d.month === focusedMonth);
      const endIdx = days.findLastIndex((d) => d.month === focusedMonth);
      const daysInMonth = endIdx - startIdx + 1;
      xscale = cssW / daysInMonth;
      xOffset = -startIdx * xscale;
    }
    return { xscale, xOffset };
  }

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || days.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const cssW = canvas.clientWidth;
    const cssH = canvas.clientHeight;

    if (canvas.width !== cssW * dpr || canvas.height !== cssH * dpr) {
      canvas.width = cssW * dpr;
      canvas.height = cssH * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, cssW, cssH);

    const totalDays = days.length;
    const yscale = cssH / 1440;
    const { xscale, xOffset } = getScaleOffset(cssW);

    // Draw sunrise/sunset filled band
    ctx.beginPath();
    ctx.moveTo(xOffset, days[0].rise * yscale);
    for (let i = 1; i < totalDays; i++) {
      ctx.lineTo(i * xscale + xOffset, days[i].rise * yscale);
    }
    ctx.lineTo((totalDays - 1) * xscale + xOffset, days[totalDays - 1].set * yscale);
    for (let i = totalDays - 2; i >= 0; i--) {
      ctx.lineTo(i * xscale + xOffset, days[i].set * yscale);
    }
    ctx.closePath();
    ctx.fillStyle = "#7bbbd4";
    ctx.fill();

    if (showGrid) drawGrid(ctx, days, cssW, cssH, xscale, xOffset, focusedMonth !== null);

    drawScrubber(ctx, days, scrubIndex, cssW, cssH, xscale, xOffset, yscale, twelveHour);

    ctx.restore();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days, showGrid, focusedMonth, scrubIndex, twelveHour]);

  useEffect(() => { draw(); }, [draw]);

  useEffect(() => {
    const ro = new ResizeObserver(() => draw());
    if (canvasRef.current) ro.observe(canvasRef.current);
    return () => ro.disconnect();
  }, [draw]);

  // Map scrubIndex to 0-100 range value for the hidden input
  const scrubberPercent = (() => {
    if (days.length === 0) return 0;
    if (focusedMonth !== null) {
      const startIdx = days.findIndex((d) => d.month === focusedMonth);
      const endIdx = days.findLastIndex((d) => d.month === focusedMonth);
      const clampedIdx = Math.max(startIdx, Math.min(endIdx, scrubIndex));
      return ((clampedIdx - startIdx) / (endIdx - startIdx)) * 100;
    }
    return (scrubIndex / (days.length - 1)) * 100;
  })();

  function handleRangeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const pct = Number(e.target.value) / 100;
    if (focusedMonth !== null) {
      const startIdx = days.findIndex((d) => d.month === focusedMonth);
      const endIdx = days.findLastIndex((d) => d.month === focusedMonth);
      onScrub(Math.round(startIdx + pct * (endIdx - startIdx)));
    } else {
      onScrub(Math.round(pct * (days.length - 1)));
    }
  }

  return (
    <div className="chart-wrapper">
      <div className="zoom-controls">
        <button
          className={focusedMonth === null ? "zoom-btn active" : "zoom-btn"}
          onClick={() => setFocusedMonth(null)}
        >
          Year
        </button>
        {MONTH_NAMES.map((name, i) => (
          <button
            key={name}
            className={focusedMonth === i ? "zoom-btn active" : "zoom-btn"}
            onClick={() => {
              setFocusedMonth(i);
              const idx = days.findIndex((d) => d.month === i);
              if (idx >= 0) onScrub(idx);
            }}
          >
            {name.slice(0, 3)}
          </button>
        ))}
      </div>

      <div className="canvas-container">
        <canvas ref={canvasRef} className="sun-canvas" />
        {/* Transparent range input handles drag/click; canvas draws the visual */}
        <input
          type="range"
          className="scrubber"
          min={0}
          max={100}
          step={0.01}
          value={scrubberPercent}
          onChange={handleRangeChange}
        />
      </div>
    </div>
  );
}

function drawScrubber(
  ctx: CanvasRenderingContext2D,
  days: DayData[],
  scrubIndex: number,
  cssW: number,
  cssH: number,
  xscale: number,
  xOffset: number,
  yscale: number,
  twelveHour: boolean,
) {
  const day = days[scrubIndex];
  if (!day) return;

  const x = Math.round(scrubIndex * xscale + xOffset) + 0.5;

  // Vertical scrubber line
  ctx.beginPath();
  ctx.moveTo(x, 0);
  ctx.lineTo(x, cssH);
  ctx.strokeStyle = "rgba(255,255,255,0.85)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.lineWidth = 1;

  const riseY = day.rise * yscale;
  const setY = day.set * yscale;

  const riseLabel = twelveHour ? day.risef : day.risef24;
  const setLabel = twelveHour ? day.setf : day.setf24;

  drawTimeLabel(ctx, "Rise", riseLabel, x, riseY, cssW, false);
  drawTimeLabel(ctx, "Set", setLabel, x, setY, cssW, true);
}

function drawTimeLabel(
  ctx: CanvasRenderingContext2D,
  kind: string,
  time: string,
  x: number,
  y: number,
  cssW: number,
  isSet: boolean,
) {
  const PAD = 5;
  const LINE_H = 14;
  const labelFont = "bold 12px Arial";
  const kindFont = "9px Arial";

  ctx.font = labelFont;
  const timeW = ctx.measureText(time).width;
  ctx.font = kindFont;
  const kindW = ctx.measureText(kind.toUpperCase()).width;
  const boxW = Math.max(timeW, kindW) + PAD * 2;
  const boxH = LINE_H * 2 + PAD * 2;

  // Flip to left side when close to right edge
  const toRight = x + 8 + boxW < cssW;
  const boxX = toRight ? x + 8 : x - 8 - boxW;
  const boxY = Math.max(4, Math.min(cssW - boxH - 4, y - boxH / 2));

  // Background pill
  ctx.fillStyle = isSet ? "rgba(20,60,80,0.88)" : "rgba(20,80,40,0.88)";
  roundRect(ctx, boxX, boxY, boxW, boxH, 4);
  ctx.fill();

  // Dot on the line at the exact time Y
  ctx.beginPath();
  ctx.arc(x, y, 4, 0, Math.PI * 2);
  ctx.fillStyle = isSet ? "#7bbbd4" : "#79d177";
  ctx.fill();

  // "RISE" / "SET" label in muted color
  ctx.font = kindFont;
  ctx.fillStyle = isSet ? "rgba(140,200,220,0.8)" : "rgba(140,220,140,0.8)";
  ctx.fillText(kind.toUpperCase(), boxX + PAD, boxY + PAD + 9);

  // Time value
  ctx.font = labelFont;
  ctx.fillStyle = "#ffffff";
  ctx.fillText(time, boxX + PAD, boxY + PAD + 9 + LINE_H);
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawGrid(
  ctx: CanvasRenderingContext2D,
  days: DayData[],
  cssW: number,
  cssH: number,
  xscale: number,
  xOffset: number,
  zoomed: boolean
) {
  const totalDays = days.length;

  ctx.beginPath();
  for (let i = 1; i < 24; i++) {
    if (i % 3 === 0) {
      const y = Math.floor((i * cssH) / 24) + 0.5;
      ctx.moveTo(0, y);
      ctx.lineTo(cssW, y);
    }
  }
  ctx.strokeStyle = "rgba(0,0,0,0.1)";
  ctx.stroke();

  let daysInMonth = 0;
  for (let i = 1; i < totalDays; i++) {
    daysInMonth++;
    const x = Math.floor(i * xscale + xOffset) + 0.5;

    if (zoomed) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, cssH);
      ctx.strokeStyle = "rgba(255,255,255,0.07)";
      ctx.stroke();

      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.font = "11px Arial";
      const label = String(days[i - 1].day);
      const w = ctx.measureText(label).width;
      ctx.fillText(label, i * xscale + xOffset - xscale / 2 - w / 2, 40);
    }

    if (days[i].month !== days[i - 1].month) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, cssH);
      ctx.strokeStyle = "rgba(255,255,255,0.3)";
      ctx.stroke();

      const colW = daysInMonth * xscale;
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.font = "bold 11px Arial";
      const fullName = MONTH_NAMES[days[i - 1].month];
      const shortName = MONTH_NAMES_SHORT[days[i - 1].month];
      const monthLabel = ctx.measureText(fullName).width + 8 <= colW ? fullName : shortName;
      const mw = ctx.measureText(monthLabel).width;
      ctx.fillText(monthLabel, i * xscale + xOffset - colW / 2 - mw / 2, 20);
      daysInMonth = 0;
    }

    if (i === totalDays - 1) {
      const decColW = (daysInMonth + 1) * xscale;
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.font = "bold 11px Arial";
      const monthLabel = ctx.measureText("December").width + 8 <= decColW ? "December" : "Dec";
      const mw = ctx.measureText(monthLabel).width;
      ctx.fillText(monthLabel, (i + 1) * xscale + xOffset - decColW / 2 - mw / 2, 20);
    }
  }
}
