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
type Bloom = { x: number; y: number; r: number; rot: number; col: string; t: number; alpha: number; giant?: boolean };
type Dot = { x: number; y: number; r: number; col: string; t: number; alpha: number };
type Ring = { x: number; y: number; r: number; n: number; t: number; alpha: number; front?: boolean };
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
    const leafGap = col === "#0b6460" ? 70 : 26;
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
      scene.blooms.push({ x: px, y: py, r: (7 + R() * 5) * s, rot: R() * Math.PI, col: "#a2f2ee", t: start + dur, alpha });
    }
  };

  const deep = "#0b6460", cyan = "#0cc4bb", aqua = "#a2f2ee";
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
  Scene-era decor, from Sal's notes: wallpaper-style flowers at every swirl tip and along the vines,
  each sending out curling tendrils with leaves, plus one giant flower in the bottom-left corner; rings within rings (two big ones in the top-right and
  bottom-left corners, small ones throughout); floating glossy disks; tiny stars.
  Own seed, so the vine layout above stays exactly as it was. Decor keeps clear of the hero copy
  and the two paintings; corners and stars are allowed anywhere but the copy.
*/
function decorate(scene: Scene, W: number, H: number, narrow: boolean, s: number) {
  const R = rng(1987);
  const end = scene.end;
  // on phones the paintings sit behind the canvas anyway, so decor may run behind them and peek out
  // around their tilted edges; the copy zone stops short of the right edge so that strip can fill too
  const copy = narrow ? [0.0, 0.06, 0.86, 0.48] : [0.07, 0.2, 0.5, 0.82];
  const art = narrow ? [2, 2, 2, 2] : [0.52, 0.06, 0.93, 0.94];
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

  // flowers in the 2008 wallpaper style Sal sent: one at every swirl tip, a few more along the
  // stems, spaced so neighbours never pile up
  const roomFor = (x: number, y: number, r: number) => scene.blooms.every((b) => Math.hypot(b.x - x, b.y - y) > (b.r + r) * 0.85);
  for (const st of [...scene.strokes]) {
    const back = st.col === "#0b6460"; // faint back-layer vines get flowers too, so the left side isn't bare
    const [tx, ty] = st.pts[st.pts.length - 1];
    const tr = (back ? 26 : 32) * s + R() * 10 * s;
    if (roomFor(tx, ty, tr)) {
      scene.blooms.push({ x: tx, y: ty, r: tr, rot: R() * Math.PI, col: "#a2f2ee", t: st.start + st.dur, alpha: Math.min(1, st.alpha * 1.25) });
    }
    const i = Math.floor(st.pts.length * (0.3 + R() * 0.5));
    const [x, y] = st.pts[i], r = (24 + R() * 10) * s;
    if (R() < 0.7 && clear(x, y, r * 0.6) && roomFor(x, y, r)) {
      scene.blooms.push({ x, y, r, rot: R() * Math.PI, col: "#bcf8f5", t: st.start + (i / st.pts.length) * st.dur, alpha: Math.min(1, st.alpha * 1.25) });
    }
  }
  // a few standalone flowers in the open space the vines don't reach (top band, bottom middle,
  // the gap between copy and paintings), so flowers sit across the whole hero like the reference
  for (let i = 0; i < (narrow ? 5 : 5); i++) {
    const r = (28 + R() * 10) * s, p = spot((x, y) => clear(x, y, r * 0.9) && roomFor(x, y, r * 1.4));
    if (p) scene.blooms.push({ x: p[0], y: p[1], r, rot: R() * Math.PI, col: "#bcf8f5", t: when(), alpha: 0.9 });
  }
  // each flower branches out: two wavy tendrils that curl into a spiral, with a pair of leaves
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
      scene.strokes.push({ pts, start: t0, dur, col: "#a2f2ee", alpha: b.alpha * 0.85 });
      scene.end = Math.max(scene.end, t0 + dur);
      for (const [f, side] of [[0.3, 1], [0.55, -1]] as const) {
        const i = Math.floor(n * f), [px, py] = pts[i], prev = pts[Math.max(0, i - 1)];
        const ang = Math.atan2(py - prev[1], px - prev[0]);
        scene.leaves.push({ x: px, y: py, ang: ang + side * dir * 0.9, L: (8 + R() * 5) * s, col: "#0cc4bb", t: t0 + f * dur, alpha: b.alpha });
      }
    }
  }
  // rings within rings: two big ones in the corners, small ones throughout
  const big = (narrow ? 92 : 165) * s;
  scene.rings.push({ x: W * 0.985, y: H * 0.04, r: big, n: 7, t: end * 0.4, alpha: 0.6 });
  scene.rings.push({ x: W * 0.015, y: H * 0.96, r: big, n: 7, t: end * 0.5, alpha: 0.6, front: true }); // drawn over the giant flower (Sal)
  for (let i = 0; i < (narrow ? 8 : 12); i++) {
    const r = (6 + R() * 8) * s, p = spot((x, y) => clear(x, y, r + 6) && Math.hypot(x - W * 0.985, y - H * 0.04) > big + r && Math.hypot(x - W * 0.015, y - H * 0.96) > big + r);
    if (p) scene.rings.push({ x: p[0], y: p[1], r, n: 3, t: when(), alpha: 0.45 + R() * 0.3 });
  }
  // the giant corner flower, sitting in front of the bottom-left spiral like the reference
  scene.blooms.push({ x: W * (narrow ? 1.0 : 0.066), y: H * (narrow ? 0.5 : 0.875), r: (narrow ? 95 : 150) * s, rot: narrow ? 0.2 : -0.35, col: "#bcf8f5", t: end * 0.55, alpha: 1, giant: true });
  for (let i = 0; i < (narrow ? 6 : 10); i++) {
    const r = (5 + R() * 15) * s, p = spot((x, y) => clear(x, y, r + 8));
    if (p) scene.disks.push({ x: p[0], y: p[1], r, t: when(), alpha: 0.4 + R() * 0.35 });
  }
  // tiny stars everywhere except over the copy
  for (let i = 0; i < (narrow ? 36 : 55); i++) {
    const p = spot((x, y) => onCanvas(x, y, 4) && !inside(copy, x, y, 6));
    if (p) scene.stars.push({ x: p[0], y: p[1], r: (2 + R() * 3.5) * s, t: end * (0.2 + R() * 0.8), alpha: 0.5 + R() * 0.5 });
  }
}

/* a soft dark drop under decor, so pieces read as floating above the ground */
const liftShadow = (ctx: CanvasRenderingContext2D, d: number) => {
  ctx.shadowColor = "rgba(1,5,5,.75)"; ctx.shadowBlur = d * 2; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = d;
};
const noShadow = (ctx: CanvasRenderingContext2D) => { ctx.shadowBlur = 0; ctx.shadowOffsetY = 0; };

function render(ctx: CanvasRenderingContext2D, sc: Scene, T: number, glow: boolean) {
  ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.shadowColor = "rgba(12,196,187,.5)";
  for (const st of sc.strokes) {
    const local = clamp01((T - st.start) / st.dur);
    if (local <= 0) continue;
    const upto = Math.max(2, Math.floor(local * st.pts.length));
    ctx.globalAlpha = st.alpha; ctx.strokeStyle = st.col; ctx.shadowBlur = glow && st.col !== "#0b6460" ? 9 : 0;
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
    fill.addColorStop(0, "#a2f2ee"); fill.addColorStop(0.5, "#0cc4bb"); fill.addColorStop(1, "#066e69");
    liftShadow(ctx, Math.max(3, r * 0.45));
    ctx.fillStyle = fill; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
    noShadow(ctx);
    ctx.globalAlpha *= 0.55; ctx.fillStyle = "#ffffff"; // gloss highlight
    ctx.beginPath(); ctx.ellipse(-r * 0.25, -r * 0.42, r * 0.5, r * 0.26, -0.3, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  const drawRing = (g: Ring) => {
    const k = easeOut(clamp01((T - g.t) / 0.9)); if (k <= 0) return;
    ctx.save(); ctx.globalAlpha = g.alpha; ctx.translate(g.x, g.y); ctx.rotate(-Math.PI / 2);
    ctx.lineWidth = Math.max(2.6, g.r * 0.045);
    ctx.shadowColor = "rgba(12,196,187,.55)"; ctx.shadowBlur = glow ? 6 : 0;
    for (let i = 0; i < g.n; i++) {
      ctx.strokeStyle = i % 2 ? "#a2f2ee" : "#0cc4bb";
      ctx.beginPath(); ctx.arc(0, 0, g.r * (1 - i / (g.n + 0.6)), 0, Math.PI * 2 * k * (i % 2 ? -1 : 1), i % 2 === 1); ctx.stroke();
    }
    noShadow(ctx);
    ctx.fillStyle = "#a2f2ee"; ctx.beginPath(); ctx.arc(0, 0, Math.max(1.5, g.r * 0.08) * k, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  };
  for (const g of sc.rings) if (!g.front) drawRing(g);
  // flowers in the style of Sal's reference: broad pointed petals with a slight pinwheel twist,
  // dark teal at the throat fading to pale mint at the edge, a soft glow, a pale centre and long
  // stamens with dot tips. The giant corner flower adds a second petal layer and dark streaks.
  const petal = (L: number, w: number) => {
    ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.bezierCurveTo(L * 0.12, -w * 1.15, L * 0.78, -w * 1.05, L, -w * 0.08);
    ctx.bezierCurveTo(L * 0.72, w * 0.62, L * 0.22, w * 0.7, 0, 0);
  };
  // the giant corner flower is a stargazer-style lily, from Sal's reference: six long narrow
  // tepals with ruffled edges and a slight bend, silver-white throat fading to dark teal tips, a
  // pale stripe down each, dark speckles, curved stamens with dark pill anthers, a long pistil
  const stargazer = (b: Bloom, k: number) => {
    const L = b.r * 1.3 * k;
    const spots = rng(77);
    ctx.save(); ctx.globalAlpha = b.alpha; ctx.translate(b.x, b.y); ctx.rotate(b.rot + (1 - k) * 0.6);
    for (let p = 0; p < 6; p++) {
      const Lp = L * (p % 2 ? 0.9 : 1), w = Lp * 0.15, bend = (p % 2 ? -1 : 1) * 0.1;
      ctx.save(); ctx.rotate((p / 6) * Math.PI * 2 + (p % 2 ? 0.08 : 0));
      const edge = (side: number, u: number) => {
        const hw = w * Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.05)), 0.75) * (1 - 0.3 * u);
        const ruffle = u > 0.25 ? 1 + 0.14 * Math.sin(u * 22 + side) : 1;
        return [u * Lp, bend * Lp * u * u + side * hw * ruffle] as const;
      };
      const path = new Path2D();
      path.moveTo(0, 0);
      for (let i = 1; i <= 40; i++) { const [x, y] = edge(-1, i / 40); path.lineTo(x, y); }
      for (let i = 40; i >= 0; i--) { const [x, y] = edge(1, i / 40); path.lineTo(x, y); }
      path.closePath();
      const g = ctx.createLinearGradient(0, 0, Lp, 0);
      g.addColorStop(0, "#eaf7f6"); g.addColorStop(0.14, "#bfe6e4"); g.addColorStop(0.34, "#2fa3a0");
      g.addColorStop(0.7, "#0b5557"); g.addColorStop(1, "#06302f");
      liftShadow(ctx, b.r * 0.05);
      ctx.fillStyle = g; ctx.fill(path);
      noShadow(ctx);
      ctx.strokeStyle = "rgba(4,40,42,.65)"; ctx.lineWidth = 1.1; ctx.stroke(path);
      // pale centre stripe
      ctx.strokeStyle = "rgba(242,251,250,.5)"; ctx.lineWidth = Math.max(1.2, w * 0.16);
      ctx.beginPath(); ctx.moveTo(Lp * 0.05, 0);
      ctx.quadraticCurveTo(Lp * 0.4, bend * Lp * 0.16, Lp * 0.72, bend * Lp * 0.52); ctx.stroke();
      // speckles, denser toward the middle of the tepal
      ctx.fillStyle = "rgba(6,47,48,.72)";
      for (let i = 0; i < 34; i++) {
        const u = 0.14 + spots() * 0.62, v = (spots() * 2 - 1) * 0.75;
        if (Math.abs(v) < 0.14) continue;
        const [, yTop] = edge(-1, u), [, yBot] = edge(1, u), mid = (yTop + yBot) / 2;
        ctx.beginPath(); ctx.arc(u * Lp, mid + v * (yBot - yTop) / 2, Lp * (0.006 + spots() * 0.011), 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }
    // stamens and pistil
    for (let p = 0; p < 6; p++) {
      const an = (p / 6) * Math.PI * 2 + Math.PI / 6, sl = L * (0.5 + (p % 3) * 0.06), bendA = 0.25;
      const ex = Math.cos(an) * sl, ey = Math.sin(an) * sl;
      ctx.strokeStyle = "rgba(223,243,241,.9)"; ctx.lineWidth = Math.max(1, b.r * 0.012);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(Math.cos(an + bendA) * sl * 0.55, Math.sin(an + bendA) * sl * 0.55, ex, ey); ctx.stroke();
      ctx.fillStyle = "#0a3436";
      ctx.beginPath(); ctx.ellipse(ex, ey, L * 0.07, L * 0.017, an + 0.9, 0, Math.PI * 2); ctx.fill();
    }
    const pa = 0.5, pl = L * 0.62;
    ctx.strokeStyle = "rgba(233,250,248,.95)"; ctx.lineWidth = Math.max(1.4, b.r * 0.018);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(Math.cos(pa - 0.2) * pl * 0.5, Math.sin(pa - 0.2) * pl * 0.5, Math.cos(pa) * pl, Math.sin(pa) * pl); ctx.stroke();
    ctx.fillStyle = "#e9faf8";
    ctx.beginPath(); ctx.arc(Math.cos(pa) * pl, Math.sin(pa) * pl, Math.max(2, b.r * 0.03), 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  };
  for (const b of sc.blooms) {
    const k = easeOut(clamp01((T - b.t) / (b.giant ? 1.1 : 0.8))); if (k <= 0) continue;
    if (b.giant) { stargazer(b, k); continue; }
    const L = b.r * k, w = b.r * 0.42 * k, n = b.giant ? 6 : 5;
    ctx.save(); ctx.globalAlpha = b.alpha; ctx.translate(b.x, b.y); ctx.rotate(b.rot + (1 - k) * 0.7);
    const fill = ctx.createRadialGradient(0, 0, L * 0.05, 0, 0, L);
    fill.addColorStop(0, "#17968f"); fill.addColorStop(0.25, "#59d6cf"); fill.addColorStop(0.65, "#a5eeeb"); fill.addColorStop(1, b.col);
    if (b.giant) {
      // back layer, larger and dimmer, offset between the front petals
      ctx.save(); ctx.rotate(Math.PI / n); ctx.globalAlpha = b.alpha * 0.55;
      liftShadow(ctx, b.r * 0.06); ctx.fillStyle = fill;
      for (let p = 0; p < n; p++) { ctx.rotate((Math.PI * 2) / n); petal(L * 1.08, w * 1.05); ctx.fill(); }
      noShadow(ctx); ctx.restore();
    }
    liftShadow(ctx, Math.max(2, b.r * 0.12));
    ctx.fillStyle = fill;
    for (let p = 0; p < n; p++) { ctx.rotate((Math.PI * 2) / n); petal(L, w); ctx.fill(); }
    noShadow(ctx);
    // soft bloom of light over the petals once grown
    ctx.shadowColor = "rgba(162,242,238,.6)"; ctx.shadowBlur = glow ? (b.giant ? 22 : 9) : 0;
    ctx.strokeStyle = "rgba(233,255,254,.45)"; ctx.lineWidth = Math.max(0.6, b.r * 0.012);
    for (let p = 0; p < n; p++) { ctx.rotate((Math.PI * 2) / n); petal(L, w); ctx.stroke(); }
    ctx.shadowBlur = 0;
    if (b.giant) {
      ctx.strokeStyle = "rgba(2,36,34,.55)"; ctx.lineWidth = Math.max(0.8, b.r * 0.008);
      for (let p = 0; p < n; p++) {
        ctx.rotate((Math.PI * 2) / n);
        for (const [len, off] of [[0.62, -0.12], [0.72, 0], [0.55, 0.14]]) {
          ctx.beginPath(); ctx.moveTo(L * 0.08, 0); ctx.quadraticCurveTo(L * len * 0.5, w * off * 1.4, L * len, w * off); ctx.stroke();
        }
      }
    }
    // stamens: thin pale filaments with round tips
    const ns = b.giant ? 9 : 6;
    ctx.strokeStyle = "rgba(233,255,254,.8)"; ctx.fillStyle = "#e9fffe"; ctx.lineWidth = Math.max(0.6, b.r * 0.012);
    for (let p = 0; p < ns; p++) {
      const an = (p / ns) * Math.PI * 2 + 0.4, sl = L * (0.42 + (p % 3) * 0.08);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(an) * sl, Math.sin(an) * sl); ctx.stroke();
      ctx.beginPath(); ctx.arc(Math.cos(an) * sl, Math.sin(an) * sl, Math.max(1.2, b.r * 0.035), 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = "#d9fffd"; ctx.strokeStyle = "#075b57"; ctx.lineWidth = Math.max(0.8, b.r * 0.02);
    ctx.beginPath(); ctx.arc(0, 0, Math.max(2, b.r * 0.1), 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  for (const g of sc.rings) if (g.front) drawRing(g);
  for (const st of sc.stars) {
    const k = easeOut(clamp01((T - st.t) / 0.5)); if (k <= 0) continue;
    const r = st.r * k;
    ctx.save(); ctx.globalAlpha = st.alpha * k; ctx.translate(st.x, st.y);
    ctx.fillStyle = "#e9fffe"; ctx.shadowColor = "rgba(162,242,238,.8)"; ctx.shadowBlur = glow ? 5 : 0;
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
