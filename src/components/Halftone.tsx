import { useEffect, useRef } from "react";

/*
  Teal halftone, from Sal's reference: a grid of dots that are large and touching near the
  origin and shrink to nothing as they spread out into the black. Drawn once (and on resize),
  never animated. `at` is the origin as a fraction of the box (0..1, may sit outside it),
  `reach` is how far the dots travel, as a fraction of the box's longer side.
*/
export function Halftone({
  at, reach, cell = 14, alpha = 0.7, className = "",
}: { at: [number, number]; reach: number; cell?: number; alpha?: number; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [ax, ay] = at;

  useEffect(() => {
    const cv = ref.current;
    const ctx = cv?.getContext("2d");
    if (!cv || !ctx) return;
    const draw = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const W = cv.clientWidth, H = cv.clientHeight;
      if (!W || !H) return;
      cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const ox = ax * W, oy = ay * H, R = reach * Math.max(W, H) * (W < 768 ? 0.65 : 1); // keep phone copy clear
      const c = cell * (W < 768 ? 0.8 : 1);
      ctx.fillStyle = "#0cc4bb";
      for (let y = c / 2; y < H; y += c) {
        // offset every other row, like printed halftone
        const shift = Math.round(y / c) % 2 ? c / 2 : 0;
        for (let x = c / 2 + shift; x < W; x += c) {
          const t = 1 - Math.hypot(x - ox, y - oy) / R;
          if (t <= 0) continue;
          const r = c * 0.5 * Math.pow(t, 0.85);
          if (r < 0.4) continue;
          ctx.globalAlpha = alpha * (0.35 + 0.65 * t);
          ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    };
    draw();
    let lastW = cv.clientWidth, lastH = cv.clientHeight;
    const ro = new ResizeObserver(() => {
      if (Math.abs(cv.clientWidth - lastW) < 2 && Math.abs(cv.clientHeight - lastH) < 2) return;
      lastW = cv.clientWidth; lastH = cv.clientHeight; draw();
    });
    ro.observe(cv);
    return () => ro.disconnect();
  }, [ax, ay, reach, cell, alpha]);

  return <canvas ref={ref} aria-hidden="true" className={`pointer-events-none absolute inset-0 h-full w-full ${className}`} />;
}
