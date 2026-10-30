import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

/*
  Flowers framing the wordmark, from Sal's note: a 2008-style ornamental divider centred above the
  name (a flower with mirrored scroll lines that wave outward and curl into spirals, leaves and
  dots), plus a garland around the title: flowers at each end and the corners joined by thin
  curling tendrils. Drawn on a canvas that extends past the title on every side, so it follows the
  wordmark at any size. Static; fades in after the arrival intro. Decorative, hidden from readers.
*/
const TEAL = "#0cc4bb", AQUA = "#a2f2ee";

function flower(c: CanvasRenderingContext2D, x: number, y: number, r: number, rot: number) {
  c.save(); c.translate(x, y); c.rotate(rot);
  const g = c.createRadialGradient(0, 0, r * 0.05, 0, 0, r);
  g.addColorStop(0, "#17968f"); g.addColorStop(0.3, "#59d6cf"); g.addColorStop(0.7, "#a5eeeb"); g.addColorStop(1, "#bcf8f5");
  c.fillStyle = g; c.shadowColor = "rgba(1,5,5,.7)"; c.shadowBlur = r * 0.3; c.shadowOffsetY = r * 0.12;
  for (let p = 0; p < 5; p++) {
    c.rotate((Math.PI * 2) / 5);
    c.beginPath(); c.moveTo(0, 0);
    c.bezierCurveTo(r * 0.12, -r * 0.48, r * 0.78, -r * 0.44, r, -r * 0.03);
    c.bezierCurveTo(r * 0.72, r * 0.26, r * 0.22, r * 0.29, 0, 0); c.fill();
  }
  c.shadowBlur = 0; c.shadowOffsetY = 0;
  c.fillStyle = "#d9fffd"; c.strokeStyle = "#075b57"; c.lineWidth = Math.max(0.8, r * 0.06);
  c.beginPath(); c.arc(0, 0, Math.max(1.8, r * 0.14), 0, Math.PI * 2); c.fill(); c.stroke();
  c.restore();
}

function leaf(c: CanvasRenderingContext2D, x: number, y: number, ang: number, L: number) {
  c.save(); c.translate(x, y); c.rotate(ang);
  c.beginPath(); c.moveTo(0, 0);
  c.bezierCurveTo(L * 0.25, -L * 0.42, L * 0.8, -L * 0.3, L, 0);
  c.bezierCurveTo(L * 0.8, L * 0.22, L * 0.3, L * 0.3, 0, 0);
  c.fillStyle = TEAL; c.fill(); c.restore();
}

/* a line that waves outward and ends in a spiral curl; returns its points */
function scroll(x0: number, y0: number, dir: number, len: number, wave: number, curlDir: number) {
  const pts: [number, number][] = [];
  let x = x0, y = y0, a = dir > 0 ? 0 : Math.PI;
  const n = 90, step = len / n;
  for (let i = 0; i < n; i++) {
    const t = i / n;
    a += curlDir * (wave * Math.cos(t * Math.PI * 2.4) * 0.03 + (t > 0.62 ? (t - 0.62) * 0.55 : 0));
    x += Math.cos(a) * step; y += Math.sin(a) * step;
    pts.push([x, y]);
  }
  return pts;
}

function stroke(c: CanvasRenderingContext2D, pts: [number, number][], w: number) {
  c.beginPath(); c.moveTo(pts[0][0], pts[0][1]);
  for (const [x, y] of pts) c.lineTo(x, y);
  c.lineWidth = w; c.stroke();
}

export function TitleFrame({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    const c = cv?.getContext("2d");
    if (!cv || !c) return;
    const draw = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const W = cv.clientWidth, H = cv.clientHeight;
      if (!W || !H) return;
      cv.width = W * dpr; cv.height = H * dpr; c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.clearRect(0, 0, W, H);
      const narrow = window.innerWidth < 768;
      const s = narrow ? 0.72 : 1;
      // the title's own box inside the canvas (the canvas extends PAD past it)
      const padX = 46 * s, padTop = 62 * s, padBot = 26 * s;
      const L = padX, R = W - padX, T = padTop, B = H - padBot, midY = (T + B) / 2, cx = (L + R) / 2;
      c.lineCap = "round"; c.lineJoin = "round";
      c.strokeStyle = AQUA; c.shadowColor = "rgba(12,196,187,.6)"; c.shadowBlur = 6;

      // divider above the name: centre flower, mirrored scrolls curling outward, leaves and dots
      const fy = T - 30 * s, reach = Math.min(230 * s, (R - L) * 0.36);
      for (const dir of [-1, 1]) {
        const pts = scroll(cx + dir * 12 * s, fy, dir, reach, 1, dir > 0 ? 1 : -1);
        stroke(c, pts, 2 * s);
        const back = scroll(cx + dir * 10 * s, fy + 4 * s, dir, reach * 0.55, -1, dir > 0 ? -1 : 1);
        stroke(c, back, 1.3 * s);
        for (const f of [0.28, 0.5]) {
          const i = Math.floor(pts.length * f), [x, y] = pts[i], [px, py] = pts[i - 1];
          leaf(c, x, y, Math.atan2(y - py, x - px) + (f === 0.28 ? -1 : 1) * 0.9 * (dir > 0 ? 1 : -1), 13 * s);
        }
        c.fillStyle = AQUA;
        for (let k = 1; k <= 4; k++) { c.beginPath(); c.arc(cx + dir * (14 + k * 9) * s, fy - (10 + k * 3) * s, (2.4 - k * 0.4) * s, 0, Math.PI * 2); c.fill(); }
      }
      c.shadowBlur = 0;
      flower(c, cx, fy, 15 * s, 0.3);

      // garland: a flower at each end of the name, buds at the corners, tendrils hugging the box
      c.shadowBlur = 5;
      for (const side of [-1, 1]) {
        const ex = side < 0 ? L - 16 * s : R + 12 * s;
        // tendril from the end flower curling up toward the top corner
        const tPts: [number, number][] = [];
        for (let i = 0; i <= 60; i++) {
          const t = i / 60, ang = (side < 0 ? Math.PI * 1.5 : Math.PI * 1.5) + side * t * 2.2;
          const rr = (B - T) * 0.45 * (1 - t * 0.6);
          tPts.push([ex + side * -rr * 0.35 + Math.cos(ang) * rr * 0.3 * side, midY - t * (midY - T + 8 * s) + Math.sin(ang) * 4 * s]);
        }
        stroke(c, tPts, 1.5 * s);
        // tendril along the bottom edge toward the middle
        const bPts = scroll(ex, B + 6 * s, -side, (R - L) * 0.22, 0.8, side < 0 ? 1 : -1);
        stroke(c, bPts, 1.4 * s);
        const i = Math.floor(bPts.length * 0.4), [lx, ly] = bPts[i];
        leaf(c, lx, ly, side < 0 ? 0.6 : Math.PI - 0.6, 11 * s);
      }
      c.shadowBlur = 0;
      flower(c, L - 16 * s, midY, 19 * s, 0.1);
      flower(c, R + 12 * s, midY, 17 * s, 0.6);
      flower(c, L - 4 * s, T - 4 * s, 10 * s, 0.4);
      flower(c, R + 2 * s, B + 4 * s, 11 * s, 1.1);
    };
    draw();
    let lw = cv.clientWidth, lh = cv.clientHeight;
    const ro = new ResizeObserver(() => {
      if (Math.abs(cv.clientWidth - lw) < 2 && Math.abs(cv.clientHeight - lh) < 2) return;
      lw = cv.clientWidth; lh = cv.clientHeight; draw();
    });
    ro.observe(cv);
    document.fonts?.ready.then(draw);
    return () => ro.disconnect();
  }, []);

  return (
    <div className={`relative inline-block max-w-full ${className}`}>
      <canvas
        ref={ref}
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-[19px] -left-[33px] -right-[33px] -top-[45px] h-[calc(100%+64px)] w-[calc(100%+66px)] animate-[framein_1s_ease_1.4s_both] md:-bottom-[26px] md:-left-[46px] md:-right-[46px] md:-top-[62px] md:h-[calc(100%+88px)] md:w-[calc(100%+92px)]"
      />
      {children}
    </div>
  );
}
