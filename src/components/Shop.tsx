import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { HeartIcon } from "@phosphor-icons/react";
import type { Piece } from "../data";
import { APPLE_IN_OUT, CSS_EASE, DUR, STAGGER } from "../motion";

export type Filter = "all" | "figure" | "abstract" | "saved";

const tabs: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "figure", label: "Figures" },
  { id: "abstract", label: "Abstract" },
  { id: "saved", label: "Saved" },
];

function Card({ p, i, saved, onToggle, onOpen }: { p: Piece; i: number; saved: boolean; onToggle: () => void; onOpen: () => void }) {
  const reduce = useReducedMotion();
  return (
    <motion.article
      layout={!reduce}
      initial={reduce ? false : { y: 44, scale: 0.985 }}
      whileInView={{ y: 0, scale: 1 }}
      exit={reduce ? undefined : { opacity: 0, transition: { duration: 0.35, ease: CSS_EASE } }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: DUR, delay: (i % 2) * STAGGER, ease: CSS_EASE, layout: { duration: 0.7, ease: APPLE_IN_OUT } }}
      className="flex min-w-0 flex-col"
    >
      <div className="wall relative aspect-[4/5] w-full max-w-full overflow-hidden border border-[#1b2b2f]">
        <button
          type="button"
          onClick={onOpen}
          aria-label={`View ${p.title} larger`}
          className="group absolute inset-0 flex cursor-zoom-in items-center justify-center border-0 bg-transparent p-[9%]"
        >
          <img
            src={p.src}
            alt={p.alt}
            loading="lazy"
            className="canvas-shadow h-full w-full object-contain transition-transform duration-700 [transition-timing-function:cubic-bezier(.42,0,.58,1)] group-hover:scale-[1.03]"
          />
        </button>
        <motion.button
          type="button"
          onClick={onToggle}
          aria-pressed={saved}
          aria-label={saved ? `Remove ${p.title} from saved` : `Save ${p.title}`}
          whileTap={reduce ? undefined : { scale: 0.86 }}
          animate={reduce ? undefined : saved ? { scale: [1, 1.14, 1] } : { scale: 1 }}
          transition={{ duration: 0.45, ease: APPLE_IN_OUT }}
          className={`orb absolute right-2 top-2 h-8 w-8 cursor-pointer sm:right-3 sm:top-3 sm:h-9 sm:w-9 ${saved ? "orb-on" : ""}`}
        >
          <HeartIcon weight={saved ? "fill" : "regular"} className="h-[52%] w-[52%]" aria-hidden="true" />
        </motion.button>
      </div>
      <div className="grid min-w-0 gap-0.5 px-0.5 pt-3">
        <span className={`font-pixel text-[11px] ${p.status === "wip" ? "text-chrome/70" : "text-aqua"}`}>{p.tag}</span>
        <span className="text-[0.92rem] font-semibold leading-snug sm:text-[1rem]">{p.title}</span>
        <span className="text-[0.82rem] text-mute sm:text-[0.92rem]">{p.medium}</span>
        <span className="mt-1 text-[0.92rem] font-bold sm:text-[1rem]">{p.price}</span>
      </div>
    </motion.article>
  );
}

export function Shop({
  pieces, filter, setFilter, saved, toggle, onOpen,
}: {
  pieces: Piece[]; filter: Filter; setFilter: (f: Filter) => void; saved: Set<string>; toggle: (id: string) => void; onOpen: (p: Piece) => void;
}) {
  const reduce = useReducedMotion();
  const shown = pieces.filter((p) => (filter === "all" ? true : filter === "saved" ? saved.has(p.id) : p.category === filter));

  return (
    <section id="shop" aria-labelledby="shopTitle" className="wrap py-14 md:py-20">
      <div className="mx-auto max-w-[760px]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 id="shopTitle" className="m-0 font-display text-[clamp(1.7rem,4.6vw,2.5rem)] font-bold leading-[1.05]">New arrivals</h2>
        <span className="font-pixel text-[12px] text-mute" aria-live="polite">{shown.length} {shown.length === 1 ? "piece" : "pieces"}</span>
      </div>

      <div role="group" aria-label="Filter paintings" className="mb-6 mt-5 flex gap-0.5 overflow-x-auto border-b border-line">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            aria-pressed={filter === t.id}
            onClick={() => setFilter(t.id)}
            className={`relative cursor-pointer whitespace-nowrap border-0 bg-transparent px-3 pb-2.5 pt-2 font-display text-[0.8rem] font-bold transition-colors ${filter === t.id ? "text-ink" : "text-mute hover:text-ink"}`}
          >
            {t.label}
            {t.id === "saved" && saved.size > 0 && <span className="ml-1.5 font-pixel text-[11px] text-aqua">{saved.size}</span>}
            {filter === t.id && (
              <motion.span layoutId={reduce ? undefined : "tab-underline"} transition={{ duration: 0.55, ease: APPLE_IN_OUT }} className="absolute inset-x-2 bottom-[-1px] h-[2px] bg-cyan" />
            )}
          </button>
        ))}
      </div>

      <motion.div layout={!reduce} transition={{ layout: { duration: 0.7, ease: APPLE_IN_OUT } }} className="grid grid-cols-2 gap-x-[clamp(10px,2.2vw,24px)] gap-y-[clamp(22px,3.6vw,40px)]">
        <AnimatePresence mode="popLayout" initial={false}>
          {shown.map((p, i) => (
            <Card key={p.id} p={p} i={i} saved={saved.has(p.id)} onToggle={() => toggle(p.id)} onOpen={() => onOpen(p)} />
          ))}
          {shown.length === 0 && (
            <motion.div
              key="empty"
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="col-span-2 grid justify-items-start gap-4 border border-dashed border-line px-6 py-12 md:px-10"
            >
              <HeartIcon size={28} className="text-aqua" aria-hidden="true" />
              <p className="m-0 max-w-[40ch] text-lg">Nothing saved yet. Tap the heart on any piece and it lands here, even after you leave.</p>
              <button type="button" className="btn btn-chrome" onClick={() => setFilter("all")}>See all pieces</button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      </div>
    </section>
  );
}
