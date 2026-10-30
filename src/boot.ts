import { gsap } from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { APPLE_IN_OUT } from "./motion";

gsap.registerPlugin(CustomEase);
const apple = CustomEase.create("apple", APPLE_IN_OUT.join(","));

export type VinesHandle = { seek: (p: number) => void };

/*
  The arrival sequence, on one GSAP timeline so every part shares a single clock:
  the year rolls 2026 to 2008, the load bar fills, the vines grow with it. On landing,
  the address drops to http://www. and one gleam crosses the wordmark. Runs once.
  Elements are found by [data-boot] so TopBar and Hero stay unaware of each other.
*/
export function runBoot(vines: VinesHandle | null) {
  const q = (k: string) => document.querySelector<HTMLElement>(`[data-boot="${k}"]`);
  const year = q("year"), bar = q("bar"), scheme = q("scheme"), mark = q("mark");
  const clock = { year: 2026, grow: 0 };
  const landed = () => {
    if (year) year.textContent = "2008";
    if (scheme) scheme.textContent = "http://www.";
    vines?.seek(1);
  };

  const mm = gsap.matchMedia();
  mm.add(
    { full: "(prefers-reduced-motion: no-preference)", reduce: "(prefers-reduced-motion: reduce)" },
    (ctx) => {
      if (ctx.conditions?.reduce) {
        gsap.set(bar, { autoAlpha: 0 });
        landed();
        return;
      }
      const tl = gsap.timeline({ delay: 0.25, defaults: { duration: 2.6, ease: apple } });
      tl.to(clock, {
        year: 2008,
        onUpdate: () => { if (year) year.textContent = String(Math.round(clock.year)); },
      }, 0)
        .fromTo(bar, { scaleX: 0 }, { scaleX: 1 }, 0)
        .to(clock, { grow: 1, onUpdate: () => vines?.seek(clock.grow) }, 0)
        .add(landed)
        .to(bar, { autoAlpha: 0, duration: 0.6, ease: "power1.out" }, "+=0.2")
        .fromTo(mark, { "--gleam": "100%" }, { "--gleam": "0%", duration: 1.1, ease: "sine.inOut" }, "<-0.1");
      return () => landed();
    },
  );
  return () => mm.revert();
}
