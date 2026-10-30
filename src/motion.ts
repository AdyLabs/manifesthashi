/*
  Motion tokens.
  Observed on apple.com (REA capture ev_8d72a379…, overview.built.css sha256 63fa1f70b2a0…):
    timed animations use cubic-bezier(0.42, 0, 0.58, 1) over 1s with staggered delays;
    small UI transitions use `ease` at 0.3s; slides use plain translateY.
  Not observed (stylesheet over capture budget): Apple's scroll-reveal code. Values below for
  reveals are our design choice in the same spirit: no springs, no overshoot, long smooth curves.
*/
export const APPLE_IN_OUT = [0.42, 0, 0.58, 1] as const; // observed
export const CSS_EASE = [0.25, 0.1, 0.25, 1] as const; // observed as `ease`; good for entrances
export const DUR = 1; // observed base duration (s)
export const STAGGER = 0.12;
