# manifesthashi

Website for **Sal** (she/her), a painter. Sells original paintings and takes commissions.
Muhammad is building it for her. Brand name is always lowercase: `manifesthashi`.

## Brief (from Sal, via Muhammad)

- Feel: retro 2000s internet, premium, with an alternative edge. Visitors should feel like they time-traveled back.
- Era: **late 2000s scene / Web 2.0** (around 2007 to 2009). Her favorite inspiration was dark: black or espresso grounds,
  electric cyan, flowing floral vines, chrome rings, plaid, glitter. Her least favorites were pale mint versions.
  The difference that matters is dark versus light, not the swirls.
- Paintings are shown **two side by side**, like the Nike app's product grid, on every screen size.
- A **commission** section where people request custom work.
- Vines and flowers should feel **flowy**. Motion should feel **Apple-smooth and premium without doing too much**.

## Commands

```bash
npm install
npm run dev            # local dev server
npm run build          # dist/ as separate files (relative paths, works on GitHub Pages)
npm run build:single   # dist/index.html, one self-contained file with the paintings inlined
npm run check:paintings  # validates paintings.json + art/ (the deploy runs this first)
```

Stack: React 19, TypeScript, Vite, Tailwind 3, Motion (`motion/react`), GSAP (arrival timeline only), Phosphor icons, Radix Dialog.

## Structure

```
paintings.json         the shop's paintings, in display order (first two are the hero). Edited by hand on github.com
art/                   painting photos, referenced by file name from paintings.json
scripts/check-paintings.mjs   plain-language validation of the two above; a failure stops the deploy
.github/workflows/deploy.yml  build + publish to GitHub Pages on every push to main
src/
  App.tsx              page shell, saved-hearts state, quick view, form prefill, footer
  data.ts              builds pieces from paintings.json + art/ (import.meta.glob); size tiers, commission steps, storage helper
  motion.ts            easing and duration tokens (see Motion below)
  boot.ts              GSAP arrival timeline: year, load bar, vines, http://www. swap, wordmark gleam
  index.css            design tokens and component classes (chrome, gloss buttons, plaid, OS window)
  components/
    TopBar.tsx         sticky old-browser bar: address field follows the section, year rolls 2026 to 2008
    Hero.tsx           chrome wordmark, two tilted paintings, scroll-linked drift
    Halftone.tsx       teal halftone dot field fading into black (static canvas)
    Lace.tsx           teal lace trim tile drawn once to a data URL; horizontal bands and vertical ribbons
    Vines.tsx          generative canvas vines (seeded), exposes seek(p); boot.ts grows them once, then they hold still
    Shop.tsx           filter tabs (All, Figures, Abstract, Saved) and the two-up grid
    QuickView.tsx      painting viewer in an old-OS window, prev/next, save, "Ask about this piece"
    Commissions.tsx    sizes, process, request form with per-field validation and copyable summary
design/
  logo-samples.html    six wordmark options to choose from (open in a browser)
  logo-rune.svg        hand-drawn rune-caps wordmark (option 1), black
  mh-rune.svg          matching "mh" monogram
```

## Design rules (keep these)

- **One dark theme**, set on purpose. `color-scheme: dark`. No light sections mid-page.
- **One accent: teal** `#0cc4bb` (hue 177, sampled from Sal's halftone reference, Oct 30; replaced the earlier cyan
  `#1ec8da`). Every cyan-family shade was moved to hue 177 at its old lightness. Aqua `#a2f2ee` is the light tint,
  deep `#079a93`, abyss `#093533`. Chrome `#c9d1d8` is the metal neutral. Void `#07090b`, espresso `#15100e`,
  text `#e9f2f2`, muted `#93abac`.
- **Halftone** (`components/Halftone.tsx`): teal dot fields that shrink into the black, in the hero corners and one
  corner each of the shop and commissions sections. Static, drawn once.
- **Lace trim** (`components/Lace.tsx`, Sal's lace-ribbon reference, our own drawing): bands under the hero, on both
  edges of the plaid, over the footer; vertical ribbons either side of the shop grid on desktop.
- **Shape lock:** painting frames are square-cornered (they are canvases). Controls (buttons, inputs, tabs) use 6px.
  Windows use 8px. Icon-only buttons are circles. Nothing else gets a radius.
- **Glow is rationed** to the wordmark, the year counter and the vines.
- Era details are used once each and kept small: plaid appears only as one band, the OS window chrome only on the form and viewer.
- Fonts: UnifrakturMaguntia is the logo (`font-logo`: hero wordmark, top bar "mh", footer), chosen from the logo canvas (option 4).
  Silkscreen (option 7) is every other piece of text on the site, body included (Sal's call, Oct 30). It has no true lowercase
  and runs wide, so keep body sizes around 14-16px with generous line height.
- Icons from Phosphor only. No emoji. No em dashes anywhere in site copy.
- Content stays visible at rest: scroll reveals move elements in from a visible state, never from opacity 0.
- Everything respects `prefers-reduced-motion`.
- Shop grid is always 2 columns and capped at 760px wide on desktop (Sal asked for smaller tiles).

## Motion

Values in `src/motion.ts`. Apple's site was inspected (captured Oct 2026):

- **Observed:** timed animations use `cubic-bezier(0.42, 0, 0.58, 1)` over 1s with staggered delays; small UI transitions use `ease` at 0.3s; slides use plain `translateY`.
- **Not observed:** Apple's scroll-reveal code (that stylesheet was too large to capture). The scroll drift and reveal distances here are our own choices in the same spirit.
- **Who animates what:** GSAP owns only the arrival sequence in `boot.ts` (one timeline, one clock, found via `data-boot` attributes, `gsap.matchMedia` for reduced motion). Motion owns everything else (entrances, layout, filters, dialogs). Never point both at the same property of the same element.
- House rules: no springs, no overshoot, no infinite loops except two tiny sparkles and the "commissions open" light.

## Open items (placeholders, need Sal's input)

- [x] **Logo:** classic blackletter (UnifrakturMaguntia) for the wordmark; Silkscreen for site headings.
- [ ] **Painting titles** are invented placeholders: Melt, Pour No. 1, Candy Static, Blue Hour (`paintings.json`).
- [ ] **Prices** show "Inquire". Commission tiers show `$__` (`Commissions.tsx`).
- [ ] **Sal's contact** (email or Instagram) is a placeholder in the form's success state.
- [ ] **The form does not send anything.** It builds a summary people copy. For real delivery, wire it to Formspree or similar.
- [ ] **Blue Hour** photo is blurry and the painting looks unfinished. It is labeled "in progress". Reshoot or replace.
- [ ] Reshoot all paintings flat, front-on, in daylight. Current images were straightened from angled wall photos.
- [ ] Before launch, consider self-hosting the Google Fonts instead of linking them.
- [ ] Confirm web licenses for any non-Google font Sal chooses.

## Hosting

GitHub Pages via `.github/workflows/deploy.yml` (repo Settings → Pages → Source: GitHub Actions). Every push to `main`
runs `check:paintings`, builds, and publishes `dist/` to https://adylabs.github.io/manifesthashi/. Paths are relative,
so the project subpath works. README.md has the non-developer guide for adding paintings; keep it in step with any
change to the paintings.json fields.

**Pushing:** Muhammad's standing instruction (Oct 30, 2026): commit and push every change to `main` (which deploys it)
without asking first, unless he says not to for that change. Check the deploy run's result after each push.
