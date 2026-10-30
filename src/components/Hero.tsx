import { useRef } from "react";
import type { Ref } from "react";
import type { VinesHandle } from "../boot";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { Vines } from "./Vines";
import { Halftone } from "./Halftone";
import { APPLE_IN_OUT, CSS_EASE, DUR, STAGGER } from "../motion";
import type { Piece } from "../data";

function Sparkle({ className, delay }: { className: string; delay: number }) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute animate-[twinkle_3.6s_ease-in-out_infinite] ${className}`}
      style={{
        animationDelay: `${delay}s`,
        background:
          "radial-gradient(circle,#fff 0 1.5px,transparent 2.5px),linear-gradient(90deg,transparent 45%,#fff 50%,transparent 55%),linear-gradient(0deg,transparent 45%,#fff 50%,transparent 55%)",
        filter: "drop-shadow(0 0 4px #a2f2ee)",
      }}
    />
  );
}

export function Hero({ pair, onOpen, vines }: { pair: [Piece, Piece]; onOpen: (p: Piece) => void; vines: Ref<VinesHandle> }) {
  const reduce = !!useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  // scroll-linked drift: art rises a little faster than the page, vines lag behind
  const artY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -70]);
  const vineY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 50]);

  const up = (i: number) => ({
    initial: reduce ? false : { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: DUR, delay: 0.2 + i * STAGGER, ease: CSS_EASE },
  });
  const tilt = [-2.5, 2] as const;

  return (
    <section ref={ref} id="top" aria-labelledby="mark" className="relative overflow-hidden border-b border-line bg-void">
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(90% 80% at 80% 30%, rgba(12,196,187,.16), transparent 60%), radial-gradient(70% 70% at 0% 100%, rgba(9,53,51,.85), transparent 60%)",
        }}
      />
      <Halftone at={[1.02, -0.06]} reach={0.42} />
      <Halftone at={[-0.03, 1.06]} reach={0.36} />
      <motion.div aria-hidden="true" className="absolute inset-0" style={{ y: vineY }}>
        <Vines handle={vines} />
      </motion.div>
      {/* quiet zone so the vines never fight the copy */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(42% 46% at 22% 52%, rgba(7,9,11,.82), rgba(7,9,11,.4) 60%, transparent 100%)" }}
      />
      <div className="wrap relative grid items-center gap-10 pb-14 pt-12 md:pb-20 md:pt-16 lg:grid-cols-[1.05fr_1fr] lg:gap-8 lg:pb-24 lg:pt-20">
        <div className="min-w-0">
          <motion.h1
            id="mark"
            data-boot="mark"
            {...up(0)}
            className="chrome-text relative m-0 inline-block max-w-full pb-3 font-logo font-normal leading-[1.1] text-[clamp(3.2rem,14.5vw,5.5rem)] lg:text-[clamp(4.75rem,6.8vw,6.9rem)]"
          >
            manifesthashi
            <Sparkle className="right-[-3%] top-[6%] h-3.5 w-3.5" delay={0} />
            <Sparkle className="bottom-[18%] left-[40%] h-2.5 w-2.5" delay={1.6} />
          </motion.h1>
          <motion.p {...up(1)} className="mb-7 mt-4 max-w-[30ch] text-[1rem] leading-relaxed text-ink [text-shadow:0_1px_14px_#000] md:text-[1.1rem]">
            Paintings by Sal. Every piece exists once. Take one home, or have her paint one for you.
          </motion.p>
          <motion.div {...up(2)} className="flex flex-wrap gap-3">
            <a className="btn btn-gloss" href="#shop">Shop the work</a>
            <a className="btn btn-chrome" href="#commissions">Request a commission</a>
          </motion.div>
        </div>

        <motion.div style={{ y: artY }} className="grid min-w-0 grid-cols-2 items-start gap-4 sm:gap-6 lg:pl-6">
          {pair.map((p, i) => (
            <motion.button
              key={p.id}
              type="button"
              onClick={() => onOpen(p)}
              aria-label={`View ${p.title}`}
              className={`group block min-w-0 cursor-zoom-in border-0 bg-transparent p-0 text-left ${i === 1 ? "mt-10 sm:mt-14" : ""}`}
              initial={reduce ? false : { opacity: 0, y: 60, rotate: 0 }}
              animate={{ opacity: 1, y: 0, rotate: tilt[i] }}
              whileHover={reduce ? undefined : { rotate: 0, y: -8, transition: { duration: 0.7, ease: APPLE_IN_OUT } }}
              transition={{ duration: 1.4, delay: 0.45 + i * 0.18, ease: APPLE_IN_OUT }}
            >
              <img
                src={p.src}
                alt={p.alt}
                className="canvas-shadow block h-auto max-h-[300px] w-auto max-w-full sm:max-h-[420px] lg:max-h-[min(470px,62vh)]"
              />
              <span className="mt-3 block font-pixel text-[11px] text-chrome transition-colors duration-500 [text-shadow:0_0_4px_#07090b,0_0_10px_#07090b,0_0_18px_#07090b] group-hover:text-aqua">{p.title}</span>
            </motion.button>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
