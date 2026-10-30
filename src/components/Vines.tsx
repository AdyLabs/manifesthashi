import { useEffect, useImperativeHandle, useRef } from "react";
import type { Ref } from "react";
import type { VinesHandle } from "../boot";

/*
  Original generative vines. Long stems with gentle S-curves that only tighten into a spiral at
  the very tip, alternating teardrop leaves, a few five-petal blossoms, and dotted tendrils.
  They grow in once on load, driven by the arrival timeline in boot.ts, then hold still.
*/

function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (a: number, b: number, x: number) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);

type Stroke = { pts: [number, number, number][]; start: number; dur: number; col: string; alpha: number };
type Leaf = { x: number; y: number; ang: number; L: number; col: string; t: number; alpha: number };
type Bloom = { x: number; y: number; r: number; rot: number; col: string; t: number; alpha: number };
type Dot = { x: number; y: number; r: number; col: string; t: number; alpha: number };
type Ring = { x: number; y: number; r: number; n: number; t: number; alpha: number };
type Disk = { x: number; y: number; r: number; t: number; alpha: number };
type Star = { x: number; y: number; r: number; t: number; alpha: number };
type Scene = { strokes: Stroke[]; leaves: Leaf[]; blooms: Bloom[]; dots: Dot[]; rings: Ring[]; disks: Disk[]; stars: Star[]; end: number };

function build(W: number, H: number): Scene {
  const scene: Scene = { strokes: [], leaves: [], blooms: [], dots: [], rings: [], disks: [], stars: [], end: 0 };
  const narrow = W < 768;
  const s = narrow ? 0.7 : 1;
  const R = rng(2008);
  const SPEED = 520 * s; // px per second of growth

  const grow = (x: number, y: number, a: number, len: number, dir: number, w: number, depth: number, col: string, alpha: number, start: number, bloomTip: boolean) => {
    const step = 2.5 * s;
    const n = Math.max(12, Math.floor(len / step));
    const amp = (0.0035 + R() * 0.003) / s;           // gentle S-curve (radius ~150-300px)
    const freq = 0.55 + R() * 0.5;
    const phase = R() * Math.PI * 2;
    const tipCurl = bloomTip ? 0.006 / s : (0.028 + R() * 0.014) / s; // loose spiral at the end
    const pts: [number, number, number][] = [];
    for (let i = 0; i < n; i++) {
      const t = i / n;
      const k = dir * (amp * Math.sin(phase + t * Math.PI * 2 * freq) + tipCurl * smooth(0.68, 1, t) * (1 + t));
      a += k * step;
      x += Math.cos(a) * step; y += Math.sin(a) * step;
      pts.push([x, y, Math.max(0.8 * s, w * (1 - Math.pow(t, 1.4) * 0.88))]);
    }
    const dur = len / SPEED;
    scene.strokes.push({ pts, start, dur, col, alpha });
    scene.end = Math.max(scene.end, start + dur);

    // alternating leaves along the first 80%
    let side = R() < 0.5 ? 1 : -1;
    const leafGap = col === "#0f5560" ? 70 : 26;
    for (let i = Math.floor(n * 0.1); i < n * 0.8; i += Math.floor((leafGap + R() * 22) / step)) {
      const [px, py] = pts[i];
      const prev = pts[Math.max(0, i - 1)];
      const ang = Math.atan2(py - prev[1], px - prev[0]);
      scene.leaves.push({ x: px, y: py, ang: ang + side * (0.75 + R() * 0.35), L: (11 + R() * 9) * s * (0.55 + w / 7), col, t: start + (i / n) * dur, alpha });
      side = -side;
    }
    // branches
    if (depth > 0) {
      const count = 2 + Math.floor(R() * 2);
      for (let b = 0; b < count; b++) {
        const i = Math.floor(n * (0.22 + (b / count) * 0.5 + R() * 0.08));
        const [px, py] = pts[i];
        const prev = pts[i - 1];
        const ang = Math.atan2(py - prev[1], px - prev[0]);
        grow(px, py, ang - dir * (0.45 + R() * 0.4), len * (0.32 + R() * 0.2), -dir, w * 0.62, depth - 1, col, alpha, start + (i / n) * dur, depth === 1 && R() < 0.5);
      }
    }
    // dotted tendril off the middle of some stems
    if (R() < 0.5) {
      const i = Math.floor(n * (0.4 + R() * 0.2));
      let [dx, dy] = pts[i];
      const prev = pts[i - 1];
      let da = Math.atan2(dy - prev[1], dx - prev[0]) + dir * 0.9;
      const m = 30;
      for (let j = 0; j < m; j++) {
        da += -dir * (0.02 + (j / m) * 0.09);
        dx += Math.cos(da) * 7 * s; dy += Math.sin(da) * 7 * s;
        if (j % 2 === 0) scene.dots.push({ x: dx, y: dy, r: Math.max(0.9, 3 * (1 - j / m)) * s, col, t: start + (i / n) * dur + j * 0.025, alpha });
      }
    }
    if (bloomTip) {
      const [px, py] = pts[pts.length - 1];
      scene.blooms.push({ x: px, y: py, r: (7 + R() * 5) * s, rot: R() * Math.PI, col: "#a6eee0", t: start + dur, alpha });
    }
  };

  const deep = "#0f5560", cyan = "#1ec8da", aqua = "#a6eee0";
  // back layer: long, faint
  grow(W * 1.03, H * 0.98, -2.6, Math.max(W, H) * 0.95, -1, 7 * s, 2, deep, narrow ? 0.35 : 0.55, 0, false);
  grow(W * 0.58, -H * 0.04, 1.8, H * 1.15, 1, 5 * s, 1, deep, narrow ? 0.3 : 0.5, 0.15, false);
  // front layer
  grow(W * 1.02, H * 0.72, -2.85, W * (narrow ? 0.6 : 0.46), -1, 4.4 * s, 2, cyan, narrow ? 0.5 : 0.85, 0.2, false);
  grow(W * 0.995, H * 0.01, 2.4, W * (narrow ? 0.5 : 0.32), 1, 3.4 * s, 1, aqua, narrow ? 0.45 : 0.8, 0.35, true);
  grow(-W * 0.01, H * 1.01, narrow ? -0.7 : -1.25, narrow ? W * 0.42 : H * 0.42, 1, 3 * s, narrow ? 1 : 0, cyan, narrow ? 0.45 : 0.7, 0.5, true);
  decorate(scene, W, H, narrow, s);
  return scene;
}

/*
  Scene-era decor, from Sal's notes: lilies along the vines and at every swirl tip, each lily
  sending out curling tendrils with leaves; rings within rings (two big ones in the top-right and
  bottom-left corners, small ones throughout); floating glossy disks; tiny stars.
  Own seed, so the vine layout above stays exactly as it was. Decor keeps clear of the hero copy
  and the two paintings; corners and stars are allowed anywhere but the copy.
*/
function decorate(scene: Scene, W: number, H: number, narrow: boolean, s: number) {
  const R = rng(1987);
  const end = scene.end;
  const copy = narrow ? [0.0, 0.06, 1.0, 0.46] : [0.07, 0.2, 0.5, 0.82];
  const art = narrow ? [0.0, 0.47, 1.0, 0.97] : [0.52, 0.06, 0.93, 0.94];
  const inside = (r: number[], x: number, y: number, pad: number) => x > r[0] * W - pad && x < r[2] * W + pad && y > r[1] * H - pad && y < r[3] * H + pad;
  const onCanvas = (x: number, y: number, pad: number) => x > pad && x < W - pad && y > pad && y < H - pad;
  const clear = (x: number, y: number, pad: number) => onCanvas(x, y, pad) && !inside(copy, x, y, pad) && !inside(art, x, y, pad);
  const spot = (ok: (x: number, y: number) => boolean) => {
    for (let i = 0; i < 120; i++) {
      const x = R() * W, y = R() * H;
      if (ok(x, y)) return [x, y] as const;
    }
    return null;
  };
  const when = () => end * (0.35 + R() * 0.6);

  // lilies on the front stems, plus one at every swirl tip
  for (const st of [...scene.strokes]) {
    if (st.col === "#0f5560") continue;
    for (let k = 0; k < 3; k++) {
      const i = Math.floor(st.pts.length * (0.25 + R() * 0.6));
      const [x, y] = st.pts[i];
      if (R() < 0.55 && clear(x, y, 10)) {
        scene.blooms.push({ x, y, r: (13 + R() * 6) * s, rot: R() * Math.PI, col: R() < 0.5 ? "#a6eee0" : "#e9fffb", t: st.start + (i / st.pts.length) * st.dur, alpha: st.alpha });
      }
    }
    const [tx, ty] = st.pts[st.pts.length - 1];
    if (!scene.blooms.some((b) => Math.hypot(b.x - tx, b.y - ty) < 8)) {
      scene.blooms.push({ x: tx, y: ty, r: (16 + R() * 6) * s, rot: R() * Math.PI, col: "#a6eee0", t: st.start + st.dur, alpha: st.alpha });
    }
  }
  // each lily branches out: two wavy tendrils that curl into a spiral, with a pair of leaves
  for (const b of [...scene.blooms]) {
    if (inside(copy, b.x, b.y, 0)) continue;
    for (let k = 0; k < 2; k++) {
      let a = b.rot + k * Math.PI + (R() - 0.5) * 1.2;
      const dir = R() < 0.5 ? 1 : -1;
      const len = (55 + R() * 60) * s, step = 2 * s, n = Math.floor(len / step);
      let x = b.x, y = b.y;
      const pts: [number, number, number][] = [];
      for (let i = 0; i < n; i++) {
        const t = i / n;
        a += dir * (0.035 * Math.sin(t * Math.PI * 3) + 0.28 * smooth(0.5, 1, t) * (1 + t)) * step / s * 0.5;
        x += Math.cos(a) * step; y += Math.sin(a) * step;
        pts.push([x, y, Math.max(0.6, 1.6 * s * (1 - t * 0.7))]);
      }
      const t0 = b.t + 0.15, dur = len / (320 * s);
      scene.strokes.push({ pts, start: t0, dur, col: "#a6eee0", alpha: b.alpha * 0.85 });
      scene.end = Math.max(scene.end, t0 + dur);
      for (const [f, side] of [[0.3, 1], [0.55, -1]] as const) {
        const i = Math.floor(n * f), [px, py] = pts[i], prev = pts[Math.max(0, i - 1)];
        const ang = Math.atan2(py - prev[1], px - prev[0]);
        scene.leaves.push({ x: px, y: py, ang: ang + side * dir * 0.9, L: (8 + R() * 5) * s, col: "#1ec8da", t: t0 + f * dur, alpha: b.alpha });
      }
    }
  }
  // rings within rings: two big ones in the corners, small ones throughout
  const big = (narrow ? 92 : 165) * s;
  scene.rings.push({ x: W * 0.985, y: H * 0.04, r: big, n: 7, t: end * 0.4, alpha: 0.6 });
  scene.rings.push({ x: W * 0.015, y: H * 0.96, r: big, n: 7, t: end * 0.5, alpha: 0.6 });
  for (let i = 0; i < (narrow ? 5 : 12); i++) {
    const r = (6 + R() * 8) * s, p = spot((x, y) => clear(x, y, r + 6) && Math.hypot(x - W * 0.985, y - H * 0.04) > big + r && Math.hypot(x - W * 0.015, y - H * 0.96) > big + r);
    if (p) scene.rings.push({ x: p[0], y: p[1], r, n: 3, t: when(), alpha: 0.45 + R() * 0.3 });
  }
  for (let i = 0; i < (narrow ? 4 : 10); i++) {
    const r = (5 + R() * 15) * s, p = spot((x, y) => clear(x, y, r + 8));
    if (p) scene.disks.push({ x: p[0], y: p[1], r, t: when(), alpha: 0.4 + R() * 0.35 });
  }
  // tiny stars everywhere except over the copy
  for (let i = 0; i < (narrow ? 22 : 55); i++) {
    const p = spot((x, y) => onCanvas(x, y, 4) && !inside(copy, x, y, 6));
    if (p) scene.stars.push({ x: p[0], y: p[1], r: (2 + R() * 3.5) * s, t: end * (0.2 + R() * 0.8), alpha: 0.5 + R() * 0.5 });
  }
}

/* a soft dark drop under decor, so pieces read as floating above the ground */
const liftShadow = (ctx: CanvasRenderingContext2D, d: number) => {
  ctx.shadowColor = "rgba(1,4,5,.75)"; ctx.shadowBlur = d * 2; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = d;
};
const noShadow = (ctx: CanvasRenderingContext2D) => { ctx.shadowBlur = 0; ctx.shadowOffsetY = 0; };

function render(ctx: CanvasRenderingContext2D, sc: Scene, T: number, glow: boolean) {
  ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.shadowColor = "rgba(30,200,218,.5)";
  for (const st of sc.strokes) {
    const local = clamp01((T - st.start) / st.dur);
    if (local <= 0) continue;
    const upto = Math.max(2, Math.floor(local * st.pts.length));
    ctx.globalAlpha = st.alpha; ctx.strokeStyle = st.col; ctx.shadowBlur = glow && st.col !== "#0f5560" ? 9 : 0;
    // smooth path in short constant-width runs (midpoint quadratic curves)
    const run = 6;
    for (let i = 1; i < upto; i += run) {
      const end = Math.min(upto - 1, i + run);
      ctx.beginPath();
      ctx.moveTo(st.pts[i - 1][0], st.pts[i - 1][1]);
      for (let j = i; j < end; j++) {
        const [x0, y0] = st.pts[j], [x1, y1] = st.pts[j + 1];
        ctx.quadraticCurveTo(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      }
      ctx.lineTo(st.pts[end][0], st.pts[end][1]);
      ctx.lineWidth = st.pts[i][2];
      ctx.stroke();
    }
  }
  ctx.shadowBlur = 0;
  for (const l of sc.leaves) {
    const k = easeOut(clamp01((T - l.t) / 0.5)); if (k <= 0) continue;
    const L = l.L * k;
    ctx.save(); ctx.globalAlpha = l.alpha; ctx.translate(l.x, l.y); ctx.rotate(l.ang);
    ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.bezierCurveTo(L * 0.25, -L * 0.42, L * 0.8, -L * 0.3, L, 0);
    ctx.bezierCurveTo(L * 0.8, L * 0.22, L * 0.3, L * 0.3, 0, 0);
    ctx.fillStyle = l.col; ctx.fill(); ctx.restore();
  }
  for (const g of sc.disks) {
    const k = easeOut(clamp01((T - g.t) / 0.6)); if (k <= 0) continue;
    const r = g.r * k;
    ctx.save(); ctx.globalAlpha = g.alpha * k; ctx.translate(g.x, g.y);
    const fill = ctx.createLinearGradient(0, -r, 0, r);
    fill.addColorStop(0, "#a6eee0"); fill.addColorStop(0.5, "#1ec8da"); fill.addColorStop(1, "#0b5f69");
    liftShadow(ctx, Math.max(3, r * 0.45));
    ctx.fillStyle = fill; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
    noShadow(ctx);
    ctx.globalAlpha *= 0.55; ctx.fillStyle = "#ffffff"; // gloss highlight
    ctx.beginPath(); ctx.ellipse(-r * 0.25, -r * 0.42, r * 0.5, r * 0.26, -0.3, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  for (const g of sc.rings) {
    const k = easeOut(clamp01((T - g.t) / 0.9)); if (k <= 0) continue;
    ctx.save(); ctx.globalAlpha = g.alpha; ctx.translate(g.x, g.y); ctx.rotate(-Math.PI / 2);
    ctx.lineWidth = Math.max(1.6, g.r * 0.028);
    ctx.shadowColor = "rgba(30,200,218,.55)"; ctx.shadowBlur = glow ? 6 : 0;
    for (let i = 0; i < g.n; i++) {
      ctx.strokeStyle = i % 2 ? "#a6eee0" : "#1ec8da";
      ctx.beginPath(); ctx.arc(0, 0, g.r * (1 - i / (g.n + 0.6)), 0, Math.PI * 2 * k * (i % 2 ? -1 : 1), i % 2 === 1); ctx.stroke();
    }
    noShadow(ctx);
    ctx.fillStyle = "#a6eee0"; ctx.beginPath(); ctx.arc(0, 0, Math.max(1.5, g.r * 0.08) * k, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  // lilies, drawn like the real flower seen from above: three broad back tepals, three front
  // tepals, each shaded from a dark throat to a pale recurved tip, with a midrib, freckles near
  // the throat, a pale rim, six long curved stamens and a three-lobed pistil
  const tepal = (L: number, w: number) => {
    ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.bezierCurveTo(L * 0.28, -w * 1.05, L * 0.76, -w * 0.95, L * 0.98, -w * 0.2);
    ctx.quadraticCurveTo(L * 1.08, w * 0.1, L * 0.9, w * 0.34); // tip curls back
    ctx.bezierCurveTo(L * 0.72, w, L * 0.28, w * 1.05, 0, 0);
  };
  for (const b of sc.blooms) {
    const k = easeOut(clamp01((T - b.t) / 0.8)); if (k <= 0) continue;
    const L = b.r * 1.4 * k, w = b.r * 0.4 * k;
    ctx.save(); ctx.globalAlpha = b.alpha; ctx.translate(b.x, b.y); ctx.rotate(b.rot + (1 - k) * 0.9);
    const shade = (light: string, mid: string) => {
      const g = ctx.createLinearGradient(0, 0, L, 0);
      g.addColorStop(0, "#073a40"); g.addColorStop(0.28, mid); g.addColorStop(0.75, light); g.addColorStop(1, "#f2fffd");
      return g;
    };
    // back tepals: broader, a little shorter and darker, on a soft drop shadow
    liftShadow(ctx, Math.max(2, b.r * 0.28));
    ctx.fillStyle = shade("#7fdfe0", "#0f8d9b");
    for (let p = 0; p < 3; p++) { ctx.rotate((Math.PI * 2) / 3); tepal(L * 0.9, w * 1.15); ctx.fill(); }
    noShadow(ctx);
    // front tepals
    ctx.rotate(Math.PI / 3 + 0.06);
    ctx.fillStyle = shade(b.col, "#18b3c3");
    ctx.shadowColor = "rgba(166,238,224,.55)"; ctx.shadowBlur = glow ? 7 : 0;
    for (let p = 0; p < 3; p++) { ctx.rotate((Math.PI * 2) / 3); tepal(L, w); ctx.fill(); }
    ctx.shadowBlur = 0;
    for (let p = 0; p < 3; p++) {
      ctx.rotate((Math.PI * 2) / 3);
      tepal(L, w); ctx.strokeStyle = "rgba(242,255,253,.6)"; ctx.lineWidth = 0.7; ctx.stroke(); // rim
      ctx.strokeStyle = "rgba(7,58,64,.55)"; ctx.lineWidth = Math.max(0.7, b.r * 0.05); // midrib
      ctx.beginPath(); ctx.moveTo(L * 0.12, 0); ctx.quadraticCurveTo(L * 0.55, -w * 0.1, L * 0.86, w * 0.02); ctx.stroke();
      ctx.fillStyle = "rgba(7,58,64,.7)"; // freckles near the throat
      for (const [fx, fy] of [[0.24, -0.32], [0.33, 0.28], [0.4, -0.18], [0.3, 0.05], [0.46, 0.2]]) {
        ctx.beginPath(); ctx.arc(L * fx, w * fy, Math.max(0.6, b.r * 0.045), 0, Math.PI * 2); ctx.fill();
      }
    }
    // stamens curve outward; anthers sit across the filament tips
    ctx.lineWidth = Math.max(0.6, b.r * 0.035);
    for (let p = 0; p < 6; p++) {
      const an = (p / 6) * Math.PI * 2 + 0.3, sl = L * 0.78, bend = 0.22;
      const ex = Math.cos(an) * sl, ey = Math.sin(an) * sl;
      ctx.strokeStyle = "rgba(233,255,251,.85)";
      ctx.beginPath(); ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(Math.cos(an + bend) * sl * 0.5, Math.sin(an + bend) * sl * 0.5, ex, ey); ctx.stroke();
      ctx.fillStyle = "#0b2e33";
      ctx.beginPath(); ctx.ellipse(ex, ey, Math.max(1, b.r * 0.13), Math.max(0.6, b.r * 0.05), an + Math.PI / 2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = "#a6eee0"; // pistil
    for (let p = 0; p < 3; p++) {
      const an = (p / 3) * Math.PI * 2;
      ctx.beginPath(); ctx.arc(Math.cos(an) * b.r * 0.08, Math.sin(an) * b.r * 0.08, Math.max(0.8, b.r * 0.07), 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }
  for (const st of sc.stars) {
    const k = easeOut(clamp01((T - st.t) / 0.5)); if (k <= 0) continue;
    const r = st.r * k;
    ctx.save(); ctx.globalAlpha = st.alpha * k; ctx.translate(st.x, st.y);
    ctx.fillStyle = "#e9fffb"; ctx.shadowColor = "rgba(166,238,224,.8)"; ctx.shadowBlur = glow ? 5 : 0;
    ctx.beginPath(); // four-point twinkle
    ctx.moveTo(0, -r); ctx.quadraticCurveTo(0, 0, r, 0); ctx.quadraticCurveTo(0, 0, 0, r);
    ctx.quadraticCurveTo(0, 0, -r, 0); ctx.quadraticCurveTo(0, 0, 0, -r); ctx.fill();
    ctx.restore();
  }
  for (const d of sc.dots) {
    const k = clamp01((T - d.t) / 0.3); if (k <= 0) continue;
    ctx.globalAlpha = d.alpha * k; ctx.fillStyle = d.col;
    ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

export function Vines({ className = "", handle }: { className?: string; handle?: Ref<VinesHandle> }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const draw = useRef<(p: number) => void>(() => {});
  // growth progress lives here, so a resize mid-growth redraws at the same point
  const progress = useRef(0);

  useImperativeHandle(handle, () => ({
    seek: (p: number) => { progress.current = p; draw.current(p); },
  }), []);

  useEffect(() => {
    const cv = ref.current;
    const ctx = cv?.getContext("2d");
    if (!cv || !ctx) return;
    let scene: { W: number; H: number; sc: Scene; total: number } | null = null;

    const setup = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const W = cv.clientWidth, H = cv.clientHeight;
      if (!W || !H) { scene = null; return; }
      cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const sc = build(W, H);
      scene = { W, H, sc, total: sc.end + 0.8 };
    };
    // p is already eased by the timeline; glow switches on once fully grown
    draw.current = (p: number) => {
      if (!scene) return;
      ctx.clearRect(0, 0, scene.W, scene.H);
      render(ctx, scene.sc, p * scene.total, p >= 1);
    };

    setup();
    draw.current(progress.current);
    let t: number | undefined;
    let lastW = cv.clientWidth;
    const ro = new ResizeObserver(() => {
      if (Math.abs(cv.clientWidth - lastW) < 2) return; lastW = cv.clientWidth;
      window.clearTimeout(t); t = window.setTimeout(() => { setup(); draw.current(progress.current); }, 120);
    });
    ro.observe(cv);
    return () => { ro.disconnect(); window.clearTimeout(t); draw.current = () => {}; };
  }, []);

  return <canvas ref={ref} aria-hidden="true" className={`pointer-events-none absolute inset-0 h-full w-full ${className}`} />;
}
