import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";
import { ArrowClockwiseIcon, CaretLeftIcon, CaretRightIcon, HeartIcon } from "@phosphor-icons/react";

function Orbs() {
  return (
    <div className="hidden shrink-0 gap-1 md:flex" aria-hidden="true">
      <span className="orb h-7 w-7"><CaretLeftIcon size={13} weight="bold" /></span>
      <span className="orb h-7 w-7"><CaretRightIcon size={13} weight="bold" /></span>
      <span className="orb h-7 w-7"><ArrowClockwiseIcon size={13} weight="bold" /></span>
    </div>
  );
}

export function TopBar({ saved }: { saved: number }) {
  // year, scheme and load bar are driven by the arrival timeline in boot.ts
  const reduce = useReducedMotion();
  const [path, setPath] = useState("");

  useEffect(() => {
    const ids = ["top", "shop", "commissions"];
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => { if (e.isIntersecting) setPath(e.target.id === "top" ? "" : e.target.id); }),
      { rootMargin: "-45% 0px -50% 0px" },
    );
    ids.forEach((id) => { const el = document.getElementById(id); if (el) io.observe(el); });
    return () => io.disconnect();
  }, []);

  const links = (
    <nav aria-label="Main" className="flex items-center gap-1">
      <a href="#shop" className="rounded-ctl px-2.5 py-1.5 font-pixel text-[12px] text-chrome no-underline hover:bg-aqua hover:text-onCyan">shop</a>
      <a href="#commissions" className="rounded-ctl px-2.5 py-1.5 font-pixel text-[12px] text-chrome no-underline hover:bg-aqua hover:text-onCyan">commissions</a>
      <span className="ml-1 inline-flex items-center gap-1.5 rounded-ctl border border-line px-2.5 py-1 font-pixel text-[12px] text-aqua" title="Pieces you've saved">
        <HeartIcon size={13} weight={saved ? "fill" : "regular"} aria-hidden="true" />
        {saved}<span className="sr-only"> saved</span>
      </span>
    </nav>
  );

  return (
    <header className="sticky z-30 border-b border-black bg-gradient-to-b from-espresso to-[#0d0a09] shadow-[0_1px_0_rgba(201,209,216,.12),0_12px_30px_-12px_rgba(0,0,0,.8)]" style={{ top: "env(safe-area-inset-top, 0px)" }}>
      <div className="wrap flex flex-wrap items-center gap-x-3 gap-y-2 py-2.5 md:flex-nowrap">
        <a href="#top" className="order-1 md:order-none font-logo text-[1.6rem] leading-none text-ink no-underline">mh</a>
        <Orbs />
        <div className="order-3 flex h-8 min-w-0 basis-full items-center gap-2 overflow-hidden rounded-ctl border border-[#2a3236] bg-[#050607] px-3 font-pixel text-[11px] text-mute shadow-[inset_0_1px_3px_rgba(0,0,0,.8)] md:order-none md:basis-auto md:flex-1">
          <span className="truncate"><span data-boot="scheme">{reduce ? "http://www." : "https://"}</span><b className="font-normal text-aqua">manifesthashi</b>.com/{path}</span>
          <span className="ml-auto flex shrink-0 items-baseline gap-1.5">
            <span className="hidden lg:inline">now browsing in</span>
            <span data-boot="year" className="min-w-[4ch] text-[13px] tabular-nums text-cyan [text-shadow:0_0_8px_rgba(12,196,187,.6)]">{reduce ? 2008 : 2026}</span>
          </span>
        </div>
        <div className="order-2 ml-auto md:order-none md:ml-0">{links}</div>
      </div>
      <div
        data-boot="bar"
        aria-hidden="true"
        className="absolute inset-x-0 bottom-[-1px] h-[2px] origin-left scale-x-0 bg-gradient-to-r from-cyan-deep via-cyan to-aqua"
      />
    </header>
  );
}
