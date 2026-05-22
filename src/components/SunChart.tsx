import { useRef, useEffect, useCallback, useState } from "react";
import type { DayData } from "../lib/useSunData";
import "./styles/SunChart.css";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const MONTH_NAMES_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// Vertical pixels reserved at the top for the floating UI overlay
const TOP_PAD = 210;

type GradCache = {
  days: DayData[];
  cssH: number;
  bg: CanvasGradient;
  band: CanvasGradient[];
  dawn: CanvasGradient[];
  dusk: CanvasGradient[];
};

interface Props {
  days: DayData[];
  scrubIndex: number;
  onScrub: (index: number) => void;
  showGrid: boolean;
  twelveHour: boolean;
  onToggleClock: () => void;
  onToggleGrid: () => void;
}

const TYPEFACE = "'Space Grotesk'";

export default function SunChart({ days, scrubIndex, onScrub, showGrid, twelveHour, onToggleClock, onToggleGrid }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const noiseRef = useRef<HTMLCanvasElement | null>(null);
  const starRef = useRef<HTMLCanvasElement | null>(null);
  const gradCacheRef = useRef<GradCache | null>(null);
  const [focusedMonth, setFocusedMonth] = useState<number | null>(null);

  function getScaleOffset(cssW: number) {
    const totalDays = days.length;
    let xscale = cssW / totalDays;
    let xOffset = 0;
    if (focusedMonth !== null) {
      const startIdx = days.findIndex((d) => d.month === focusedMonth);
      const endIdx = days.findLastIndex((d) => d.month === focusedMonth);
      xscale = cssW / (endIdx - startIdx + 1);
      xOffset = -startIdx * xscale;
    }
    return { xscale, xOffset };
  }

  function getNoise(cssW: number, cssH: number): HTMLCanvasElement {
    const w = Math.ceil(cssW);
    const h = Math.ceil(cssH);
    const cached = noiseRef.current;
    if (cached && cached.width === w && cached.height === h) return cached;

    const nc = document.createElement("canvas");
    nc.width = w;
    nc.height = h;
    const nctx = nc.getContext("2d")!;
    const img = nctx.createImageData(w, h);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const v = (Math.random() * 255) | 0;
      d[i] = v; d[i + 1] = v; d[i + 2] = v; d[i + 3] = 255;
    }
    nctx.putImageData(img, 0, 0);
    noiseRef.current = nc;
    return nc;
  }

  function getStars(cssW: number, cssH: number): HTMLCanvasElement {
    const w = Math.ceil(cssW);
    const h = Math.ceil(cssH);
    const cached = starRef.current;
    if (cached && cached.width === w && cached.height === h) return cached;

    const sc = document.createElement('canvas');
    sc.width = w;
    sc.height = h;
    const sctx = sc.getContext('2d')!;

    const starsFraction = (w * h) / 500;
    for (let i = 0; i < starsFraction; i++) {
      const xPos = random(2, w - 2);
      const yPos = randomBiased(-30, h + 30, 4);
      const alpha = random(0.15, 0.5);
      const size = random(1, 2);
      sctx.fillStyle = `oklch(0.90 0.10 ${random(100, 255)})`;
      sctx.globalAlpha = alpha;
      sctx.fillRect(xPos, yPos, size, size);
    }

    starRef.current = sc;
    return sc;
  }

  function random(min: number, max: number) {
    return min + Math.random() * (max - min);
  }

  function randomBiased(min: number, max: number, strength = 2) {
    const t = Math.random();
    const u = t < 0.5
      ? Math.pow(2 * t, strength) / 2
      : 1 - Math.pow(2 * (1 - t), strength) / 2;
    return min + u * (max - min);
  }

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const cssW = canvas.clientWidth;
    const cssH = canvas.clientHeight;

    if (canvas.width !== cssW * dpr || canvas.height !== cssH * dpr) {
      canvas.width = cssW * dpr;
      canvas.height = cssH * dpr;
      noiseRef.current = null;
      starRef.current = null;
      gradCacheRef.current = null;
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, cssW, cssH);

    const yscale = (cssH - TOP_PAD) / 1440;

    // ── Gradient cache — rebuild only when days or canvas height changes ──────
    const prevGrads = gradCacheRef.current;
    if (!prevGrads || prevGrads.days !== days || prevGrads.cssH !== cssH) {
      const topFrac = cssH > 0 ? TOP_PAD / cssH : 0;
      const toCanvasFrac = (f: number) => c01(topFrac + (1 - topFrac) * f);

      const avgRise = days.length > 0
        ? c01(days.reduce((s, d) => s + d.rise, 0) / days.length / 1440)
        : 0.25;
      const avgSet = days.length > 0
        ? c01(days.reduce((s, d) => s + d.set, 0) / days.length / 1440)
        : 0.75;

      const bg = ctx.createLinearGradient(0, 0, 0, cssH);
      bg.addColorStop(0,                                   "oklch(0.02 0.2 200)");
      bg.addColorStop(toCanvasFrac(c01(avgRise - 0.10)),  "oklch(0.15 0.08 240)");
      bg.addColorStop(toCanvasFrac(c01(avgSet  + 0.02)),  "oklch(0.06 0.2 320)");
      bg.addColorStop(1,                                   "oklch(0.01 0.2 200)");

      const band: CanvasGradient[] = [];
      const dawn: CanvasGradient[] = [];
      const dusk: CanvasGradient[] = [];
      const glow = 60;

      for (let i = 0; i < days.length; i++) {
        const riseY = TOP_PAD + days[i].rise * yscale;
        const setY  = TOP_PAD + days[i].set  * yscale;

        const g = ctx.createLinearGradient(0, riseY, 0, setY);
        g.addColorStop(0.00, "oklch(0.7022 0.1635 43.9)");
        g.addColorStop(0.08, "oklch(0.843 0.1307 79.12)");
        g.addColorStop(0.35, "oklch(0.7081 0.1241 231.16)");
        g.addColorStop(0.65, "oklch(0.7081 0.1241 231.16)");
        g.addColorStop(0.82, "oklch(0.8112 0.0282 177.55)");
        g.addColorStop(0.90, "oklch(0.7243 0.0301 46.81)");
        g.addColorStop(1.00, "oklch(0.4604 0.0561 268.74)");
        band.push(g);

        const dg = ctx.createLinearGradient(0, riseY - glow, 0, riseY + glow);
        dg.addColorStop(0,    "oklch(0.05 0.2 250 / 0)");
        dg.addColorStop(0.45, "oklch(0.85 0.2 50)");
        dg.addColorStop(0.80, "oklch(0.90 0.10 90 / 0.2)");
        dg.addColorStop(1,    "oklch(0.95 0.3 90 / 0)");
        dawn.push(dg);

        const sg2 = ctx.createLinearGradient(0, setY - glow, 0, setY + glow);
        sg2.addColorStop(0,    "rgba(230,80,360,0)");
        sg2.addColorStop(0.35, "rgba(230,80,330,0.2)");
        sg2.addColorStop(0.65, "oklch(0.11 0.25 250 / .75)");
        sg2.addColorStop(1,    "oklch(0.05 0.1 250 / 0)");
        dusk.push(sg2);
      }

      gradCacheRef.current = { days, cssH, bg, band, dawn, dusk };
    }
    const grads = gradCacheRef.current!;

    // ── Night sky background ──────────────────────────────────────────────────
    ctx.fillStyle = grads.bg;
    ctx.fillRect(0, 0, cssW, cssH);

    ctx.drawImage(getStars(cssW, cssH), 0, 0);

    if (days.length === 0) {
      ctx.globalAlpha = 0.05;
      ctx.drawImage(getNoise(cssW, cssH), 0, 0);
      ctx.globalAlpha = 1;
      ctx.restore();
      return;
    }

    const totalDays = days.length;
    const { xscale, xOffset } = getScaleOffset(cssW);

    // ── Day band: per-column gradient anchored to each day's rise/set Y ──────
    for (let i = 0; i < totalDays; i++) {
      const x = i * xscale + xOffset;
      if (x + xscale < 0 || x > cssW) continue;
      const riseY = TOP_PAD + days[i].rise * yscale;
      const setY  = TOP_PAD + days[i].set  * yscale;
      if (setY <= riseY) continue;
      ctx.fillStyle = grads.band[i];
      ctx.fillRect(x, riseY, xscale + 1, setY - riseY);
    }

    ctx.lineWidth = 1;

    // ── Per-column dawn / dusk glow ───────────────────────────────────────────
    const glow = 60;
    for (let i = 0; i < totalDays; i++) {
      const x = i * xscale + xOffset;
      if (x + xscale < 0 || x > cssW) continue;

      const riseY = TOP_PAD + days[i].rise * yscale;
      const setY  = TOP_PAD + days[i].set  * yscale;

      ctx.fillStyle = grads.dawn[i];
      ctx.fillRect(x, riseY - glow, xscale, glow * 2);

      ctx.fillStyle = grads.dusk[i];
      ctx.fillRect(x, setY - glow, xscale, glow * 2);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.beginPath();
      ctx.arc(x, riseY, 1, 0, 2 * Math.PI);
      ctx.fill();

      ctx.beginPath();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.arc(x, setY, 1, 0, 2 * Math.PI);
      ctx.fill();
    }

    // ── Grid ──────────────────────────────────────────────────────────────────
    if (showGrid) drawGrid(ctx, days, cssW, cssH, xscale, xOffset, focusedMonth !== null, TOP_PAD, yscale);

    // ── Scrubber ──────────────────────────────────────────────────────────────
    drawScrubber(ctx, days, scrubIndex, cssW, cssH, xscale, xOffset, yscale, twelveHour, TOP_PAD);

    // ── Noise texture ─────────────────────────────────────────────────────────
    ctx.globalAlpha = 0.05;
    ctx.drawImage(getNoise(cssW, cssH), 0, 0);
    ctx.globalAlpha = 1;

    ctx.restore();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days, showGrid, focusedMonth, scrubIndex, twelveHour]);

  useEffect(() => { draw(); }, [draw]);

  useEffect(() => {
    const ro = new ResizeObserver(() => draw());
    if (canvasRef.current) ro.observe(canvasRef.current);
    return () => ro.disconnect();
  }, [draw]);

  const scrubberPercent = (() => {
    if (days.length === 0) return 0;
    if (focusedMonth !== null) {
      const startIdx = days.findIndex((d) => d.month === focusedMonth);
      const endIdx   = days.findLastIndex((d) => d.month === focusedMonth);
      const clamped  = Math.max(startIdx, Math.min(endIdx, scrubIndex));
      return ((clamped - startIdx) / (endIdx - startIdx)) * 100;
    }
    return (scrubIndex / (days.length - 1)) * 100;
  })();

  function handleRangeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const pct = Number(e.target.value) / 100;
    if (focusedMonth !== null) {
      const startIdx = days.findIndex((d) => d.month === focusedMonth);
      const endIdx   = days.findLastIndex((d) => d.month === focusedMonth);
      onScrub(Math.round(startIdx + pct * (endIdx - startIdx)));
    } else {
      onScrub(Math.round(pct * (days.length - 1)));
    }
  }

  return (
    <div className="chart-wrapper">

      <canvas ref={canvasRef} className="sun-canvas" />
      {days.length > 0 && (
        <input
          type="range"
          className="scrubber"
          min={0}
          max={100}
          step={0.01}
          value={scrubberPercent}
          onChange={handleRangeChange}
        />
      )}

      <div className="zoom-controls">
        <button
          className={focusedMonth === null ? "btn btn--small btn--active" : "btn btn--small"}
          onClick={() => setFocusedMonth(null)}
        >
          Year
        </button>
        {MONTH_NAMES.map((name, i) => (
          <button
            key={name}
            className={focusedMonth === i ? "btn btn--small btn--active" : "btn btn--small"}
            onClick={() => {
              setFocusedMonth(i);
              const idx = days.findIndex((d) => d.month === i);
              if (idx >= 0) onScrub(idx);
            }}
          >
            {name.slice(0, 3)}
          </button>
        ))}
        <div className="zoom-sep" />
        <button className="btn btn--small" onClick={onToggleClock}>
          {twelveHour ? "24hr" : "12hr"}
        </button>
        <button className="btn btn--small" onClick={onToggleGrid}>
          {showGrid ? "No grid" : "Grid"}
        </button>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function c01(v: number) { return Math.max(0, Math.min(1, v)); }

// Kept for speed-based glow when re-enabled
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function glowPx(speed: number): number {
  return Math.max(8, Math.min(50, 16 / (speed * 0.25 + 0.18)));
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
  topPad: number,
) {
  const day = days[scrubIndex];
  if (!day) return;

  const x = Math.round(scrubIndex * xscale + xOffset) + 0.5;

  ctx.beginPath();
  ctx.moveTo(x, topPad);
  ctx.lineTo(x, cssH);
  ctx.strokeStyle = "rgba(255,255,255,0.85)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.lineWidth = 1;

  const riseLabel = twelveHour ? day.risef  : day.risef24;
  const setLabel  = twelveHour ? day.setf   : day.setf24;

  drawTimeLabel(ctx, "Rise", riseLabel, x, topPad + day.rise * yscale, cssW, cssH, false);
  drawTimeLabel(ctx, "Set",  setLabel,  x, topPad + day.set  * yscale, cssW, cssH, true);

  const midY = topPad + (day.rise + day.set) / 2 * yscale;
  drawScrubHandle(ctx, x, midY);
}

function drawScrubHandle(ctx: CanvasRenderingContext2D, x: number, cy: number) {
  const PW = 24;
  const PH = 14;
  const AR = 16;
  const AH = 7;

  ctx.beginPath();
  roundRect(ctx, x - PW, cy - PH, PW * 2, PH * 2, PH);
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  ctx.lineWidth = 1;

  ctx.beginPath();
  ctx.moveTo(x - AR,      cy);
  ctx.lineTo(x - AR + AH, cy - AH / 1.5);
  ctx.lineTo(x - AR + AH, cy + AH / 1.5);
  ctx.closePath();
  ctx.fillStyle = "rgba(255,255,255,0.80)";
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(x + AR,      cy);
  ctx.lineTo(x + AR - AH, cy - AH / 1.5);
  ctx.lineTo(x + AR - AH, cy + AH / 1.5);
  ctx.closePath();
  ctx.fill();
}

function drawTimeLabel(
  ctx: CanvasRenderingContext2D,
  kind: string,
  time: string,
  x: number,
  y: number,
  cssW: number,
  cssH: number,
  isSet: boolean,
) {
  const PAD = 6;
  const LINE_H = 16;

  ctx.font = `normal 14px ${TYPEFACE}`;
  const timeW = ctx.measureText(time).width;
  ctx.font = `11px ${TYPEFACE}`;
  const kindW = ctx.measureText(kind.toUpperCase()).width;
  const boxW = Math.max(timeW, kindW) + PAD * 4;
  const boxH = LINE_H * 2 + PAD * 2;

  const toRight = x + 8 + boxW < cssW;
  const boxX = toRight ? x + 8 : x - 8 - boxW;
  const boxY = Math.max(4, Math.min(cssH - boxH - 4, y - boxH / 2));

  ctx.fillStyle = "oklch(0.15 0.15 250 / 0.85)";
  roundRect(ctx, boxX, boxY, boxW, boxH, 8);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(x, y, 4, 0, Math.PI * 2);
  ctx.fillStyle = isSet ? "#fff" : "#333";
  ctx.fill();

  ctx.font = `11px ${TYPEFACE}`;
  ctx.fillStyle = '#fff';
  ctx.fillText(kind, boxX + PAD * 2, boxY + PAD + 11);

  ctx.font = `normal 14px ${TYPEFACE}`;
  ctx.fillStyle = "#ffffff";
  ctx.fillText(time, boxX + PAD * 2, boxY + PAD + 11 + LINE_H);
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
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
  zoomed: boolean,
  topPad: number,
  yscale: number,
) {
  const totalDays = days.length;

  // Horizontal hour lines — only within the chart band
  ctx.beginPath();
  for (let i = 1; i < 24; i++) {
    if (i % 3 === 0) {
      const y = Math.floor(topPad + i * 60 * yscale) + 0.5;
      ctx.moveTo(0, y);
      ctx.lineTo(cssW, y);
    }
  }
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.stroke();

  let daysInMonth = 0;
  for (let i = 1; i < totalDays; i++) {
    daysInMonth++;
    const x = Math.floor(i * xscale + xOffset) + 0.5;

    if (zoomed) {
      ctx.beginPath();
      ctx.moveTo(x, topPad);
      ctx.lineTo(x, cssH);
      ctx.strokeStyle = "rgba(255,255,255,0.07)";
      ctx.stroke();

      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.font = "11px ";
      const label = String(days[i - 1].day);
      const lw = ctx.measureText(label).width;
      ctx.fillText(label, i * xscale + xOffset - xscale / 2 - lw / 2, topPad + 20);
    }

    if (days[i].month !== days[i - 1].month) {
      ctx.beginPath();
      ctx.moveTo(x, topPad);
      ctx.lineTo(x, cssH);
      ctx.strokeStyle = "rgba(255,255,255,0.22)";
      ctx.stroke();

      const colW = daysInMonth * xscale;
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.font = `bold 11px ${TYPEFACE}`;
      const full  = MONTH_NAMES[days[i - 1].month];
      const short = MONTH_NAMES_SHORT[days[i - 1].month];
      const label = ctx.measureText(full).width + 8 <= colW ? full : short;
      const lw = ctx.measureText(label).width;
      ctx.fillText(label, i * xscale + xOffset - colW / 2 - lw / 2, topPad + 20);
      daysInMonth = 0;
    }

    if (i === totalDays - 1) {
      const decColW = (daysInMonth + 1) * xscale;
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.font = `bold 11px ${TYPEFACE}`;
      const label = ctx.measureText("December").width + 8 <= decColW ? "December" : "Dec";
      const lw = ctx.measureText(label).width;
      ctx.fillText(label, (i + 1) * xscale + xOffset - decColW / 2 - lw / 2, topPad + 20);
    }
  }
}
