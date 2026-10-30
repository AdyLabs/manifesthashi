import { useMemo } from "react";

/*
  Teal lace trim (Sal's reference: a scalloped floral lace ribbon). Our own drawing, not her photo:
  one 96x44 tile with scalloped edges, a hex net, a corded six-petal flower with an eyelet centre,
  two veined leaves, an S-scroll cord and a row of eyelets. Drawn once into a data URL at 2x and
  repeated with CSS, horizontally or (rotated) vertically. Static.
*/
const TW = 96, TH = 44;
const cache: Partial<Record<"x" | "y", string>> = {};

function drawTile(): HTMLCanvasElement {
  const cv = document.createElement("canvas");
  cv.width = TW * 2; cv.height = TH * 2;
  const c = cv.getContext("2d")!;
  c.scale(2, 2);
  const thread = "rgba(12,196,187,.92)", cord = "#a2f2ee";
  const S = 12, r = S / 2, top = 6, bot = TH - 6;

  // band outline: scallops along both edges
  const band = new Path2D();
  band.moveTo(0, top);
  for (let x = 0; x < TW; x += S) band.arc(x + r, top, r, Math.PI, 0);
  band.lineTo(TW, bot);
  for (let x = TW; x > 0; x -= S) band.arc(x - r, bot, r, 0, Math.PI);
  band.closePath();

  c.save();
  c.clip(band);
  // net: fine hex mesh
  c.strokeStyle = "rgba(12,196,187,.38)"; c.lineWidth = 0.5;
  for (let d = -TH; d < TW + TH; d += 4) {
    c.beginPath(); c.moveTo(d, 0); c.lineTo(d + TH * 0.58, TH); c.stroke();
    c.beginPath(); c.moveTo(d, 0); c.lineTo(d - TH * 0.58, TH); c.stroke();
  }
  // S-scroll cord linking the motifs, continuing into the next tile
  c.strokeStyle = cord; c.lineWidth = 1.5;
  c.beginPath(); c.moveTo(-4, 30); c.bezierCurveTo(10, 40, 16, 34, 20, 30);
  c.moveTo(32, 28); c.bezierCurveTo(44, 42, 50, 6, 70, 20); c.bezierCurveTo(80, 27, 90, 34, 100, 30); c.stroke();
  // flower: six corded petals around an eyelet
  c.save(); c.translate(26, 22);
  for (let p = 0; p < 6; p++) {
    c.rotate(Math.PI / 3);
    c.beginPath(); c.ellipse(6.5, 0, 6, 3.6, 0, 0, Math.PI * 2);
    c.fillStyle = thread; c.fill(); c.strokeStyle = cord; c.lineWidth = 0.8; c.stroke();
  }
  c.globalCompositeOperation = "destination-out";
  c.beginPath(); c.arc(0, 0, 2.6, 0, Math.PI * 2); c.fill();
  c.globalCompositeOperation = "source-over";
  c.strokeStyle = cord; c.lineWidth = 1; c.beginPath(); c.arc(0, 0, 2.6, 0, Math.PI * 2); c.stroke();
  c.restore();
  // two leaves with veins
  for (const [x, y, a] of [[56, 15, -0.5], [62, 30, 0.6]] as const) {
    c.save(); c.translate(x, y); c.rotate(a);
    c.beginPath(); c.moveTo(-7, 0); c.bezierCurveTo(-3, -5, 4, -5, 8, 0); c.bezierCurveTo(4, 4.5, -3, 4.5, -7, 0);
    c.fillStyle = thread; c.fill(); c.strokeStyle = cord; c.lineWidth = 0.8; c.stroke();
    c.beginPath(); c.moveTo(-6, 0); c.lineTo(7, 0); c.lineWidth = 0.6; c.stroke();
    c.restore();
  }
  // a smaller five-petal bud between the leaves and the eyelets
  c.save(); c.translate(44, 22);
  for (let p = 0; p < 5; p++) {
    c.rotate((Math.PI * 2) / 5);
    c.beginPath(); c.ellipse(3.6, 0, 3.4, 2.1, 0, 0, Math.PI * 2);
    c.fillStyle = thread; c.fill(); c.strokeStyle = cord; c.lineWidth = 0.6; c.stroke();
  }
  c.fillStyle = cord; c.beginPath(); c.arc(0, 0, 1, 0, Math.PI * 2); c.fill();
  c.restore();
  // wavy inner cords just inside each scalloped edge, the dense border real lace has
  c.strokeStyle = cord; c.lineWidth = 0.8;
  for (const y0 of [top + 3.5, bot - 3.5]) {
    c.beginPath();
    for (let x = 0; x <= TW; x += 1) {
      const y = y0 + Math.sin((x / S) * Math.PI * 2) * 1.2;
      if (x === 0) c.moveTo(x, y); else c.lineTo(x, y);
    }
    c.stroke();
  }
  // eyelets: punched holes ringed with cord
  for (const [x, y] of [[82, 13], [87, 22], [82, 31], [12, 12], [12, 32]] as const) {
    c.globalCompositeOperation = "destination-out";
    c.beginPath(); c.arc(x, y, 1.7, 0, Math.PI * 2); c.fill();
    c.globalCompositeOperation = "source-over";
    c.strokeStyle = cord; c.lineWidth = 0.9; c.beginPath(); c.arc(x, y, 1.7, 0, Math.PI * 2); c.stroke();
  }
  c.restore();
  // corded scalloped edge with picot dots
  const edges = new Path2D();
  for (let x = 0; x < TW; x += S) { edges.moveTo(x, top); edges.arc(x + r, top, r, Math.PI, 0); }
  for (let x = 0; x < TW; x += S) { edges.moveTo(x + S, bot); edges.arc(x + r, bot, r, 0, Math.PI); }
  c.strokeStyle = cord; c.lineWidth = 1.4; c.stroke(edges);
  c.fillStyle = cord;
  for (let x = 0; x < TW; x += S) {
    c.beginPath(); c.arc(x + r, 0.9, 0.9, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(x + r, TH - 0.9, 0.9, 0, Math.PI * 2); c.fill();
  }
  return cv;
}

function laceUrl(orient: "x" | "y") {
  if (cache[orient]) return cache[orient]!;
  const tile = drawTile();
  if (orient === "x") return (cache.x = tile.toDataURL());
  const v = document.createElement("canvas");
  v.width = tile.height; v.height = tile.width;
  const c = v.getContext("2d")!;
  c.translate(v.width, 0); c.rotate(Math.PI / 2); c.drawImage(tile, 0, 0);
  return (cache.y = v.toDataURL());
}

export function Lace({ orient = "x", className = "" }: { orient?: "x" | "y"; className?: string }) {
  const url = useMemo(() => laceUrl(orient), [orient]);
  const x = orient === "x";
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none [filter:drop-shadow(0_3px_4px_rgba(0,0,0,.65))] ${x ? "h-[44px] w-full" : "w-[44px]"} ${className}`}
      style={{
        backgroundImage: `url(${url})`,
        backgroundRepeat: x ? "repeat-x" : "repeat-y",
        backgroundSize: x ? `${TW}px ${TH}px` : `${TH}px ${TW}px`,
        backgroundPosition: "center",
      }}
    />
  );
}
