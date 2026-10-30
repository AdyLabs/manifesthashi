import { useCallback, useEffect, useRef, useState } from "react";
import { runBoot } from "./boot";
import type { VinesHandle } from "./boot";
import { MotionConfig } from "motion/react";
import { TopBar } from "./components/TopBar";
import { Hero } from "./components/Hero";
import { Shop } from "./components/Shop";
import type { Filter } from "./components/Shop";
import { QuickView } from "./components/QuickView";
import { Commissions } from "./components/Commissions";
import { Lace } from "./components/Lace";
import type { Prefill } from "./components/Commissions";
import { pieces, store } from "./data";
import type { Piece } from "./data";

function Footer() {
  const [visits, setVisits] = useState(1);
  useEffect(() => {
    const v = store.get<number>("mh_visits", 0) + 1;
    store.set("mh_visits", v);
    setVisits(v);
  }, []);
  return (
    <>
    <Lace className="relative z-10 -mb-[22px]" />
    <footer className="border-t border-line bg-espresso">
      <div className="wrap grid gap-5 pb-[calc(32px+env(safe-area-inset-bottom,0px))] pt-8">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <span className="font-logo text-[2rem] leading-none">manifesthashi</span>
          <span className="font-pixel text-[11px] text-mute">
            you've stopped by <span className="text-cyan tabular-nums">{visits}</span> {visits === 1 ? "time" : "times"}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {["best viewed at 1024×768", "© 2026 manifesthashi"].map((b) => (
            <span key={b} className="rounded-[2px] border border-[#39454a] bg-gradient-to-b from-[#141d1d] to-[#0a0f0f] px-2 py-1 font-pixel text-[10px] text-chrome">{b}</span>
          ))}
        </div>
      </div>
    </footer>
    </>
  );
}

export default function App() {
  const [saved, setSaved] = useState<Set<string>>(() => new Set(store.get<string[]>("mh_saved", [])));
  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState<Piece | null>(null);
  const [prefill, setPrefill] = useState<Prefill>(null);
  const vines = useRef<VinesHandle>(null);

  useEffect(() => runBoot(vines.current), []);

  const toggle = useCallback((id: string) => {
    setSaved((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      store.set("mh_saved", [...next]);
      return next;
    });
  }, []);

  const ask = (p: Piece) => {
    setOpen(null);
    setPrefill({
      type: "Buy a piece from the shop",
      idea: p.status === "wip"
        ? `Hi Sal, I'd like to know when "${p.title}" is finished and what it will cost.`
        : `Hi Sal, I'm interested in "${p.title}". Is it still available, and what's the price?`,
      nonce: Date.now(),
    });
    window.setTimeout(() => document.getElementById("commissions")?.scrollIntoView({ behavior: "smooth" }), 80);
  };

  return (
    <MotionConfig reducedMotion="user">
      <TopBar saved={saved.size} />
      <main>
        <Hero pair={[pieces[0], pieces[1]]} onOpen={setOpen} vines={vines} />
        <Lace className="relative z-10 -my-[22px]" />
        <Shop pieces={pieces} filter={filter} setFilter={setFilter} saved={saved} toggle={toggle} onOpen={setOpen} />
        <Lace className="relative z-10 -mb-[10px]" />
        <div className="plaid h-[56px] border-y border-black shadow-[0_-1px_0_rgba(201,209,216,.12),0_1px_0_rgba(201,209,216,.12)]" aria-hidden="true" />
        <Lace className="relative z-10 -mt-[10px]" />
        <Commissions prefill={prefill} />
      </main>
      <Footer />
      <QuickView piece={open} pieces={pieces} onChange={setOpen} onClose={() => setOpen(null)} saved={saved} toggle={toggle} onAsk={ask} />
    </MotionConfig>
  );
}
