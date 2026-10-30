import * as Dialog from "@radix-ui/react-dialog";
import { motion, useReducedMotion } from "motion/react";
import { CaretLeftIcon, CaretRightIcon, HeartIcon, XIcon } from "@phosphor-icons/react";
import type { Piece } from "../data";
import { APPLE_IN_OUT } from "../motion";

export function QuickView({
  piece, pieces, onChange, onClose, saved, toggle, onAsk,
}: {
  piece: Piece | null; pieces: Piece[]; onChange: (p: Piece) => void; onClose: () => void;
  saved: Set<string>; toggle: (id: string) => void; onAsk: (p: Piece) => void;
}) {
  const reduce = useReducedMotion();
  const idx = piece ? pieces.findIndex((p) => p.id === piece.id) : -1;
  const go = (d: number) => onChange(pieces[(idx + d + pieces.length) % pieces.length]);
  const isSaved = piece ? saved.has(piece.id) : false;

  return (
    <Dialog.Root open={!!piece} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[rgba(3,7,7,.84)] backdrop-blur-[3px] duration-500 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content
          onKeyDown={(e) => { if (e.key === "ArrowRight") go(1); if (e.key === "ArrowLeft") go(-1); }}
          className="fixed left-1/2 top-1/2 z-50 max-h-[calc(100dvh-24px)] w-[min(1000px,calc(100vw-24px))] -translate-x-1/2 -translate-y-1/2 overflow-auto rounded-win border border-black bg-[#0b1414] text-ink shadow-[0_0_0_1px_#324c4b,0_40px_80px_rgba(0,0,0,.8)] focus:outline-none duration-500 [animation-timing-function:cubic-bezier(.42,0,.58,1)] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-[0.97]"
        >
          {piece && (
            <>
              <div className="titlebar flex items-center justify-between gap-3 py-3 pl-3 pr-1 md:py-1.5 md:pr-2">
                <span className="truncate font-pixel text-[12px] text-white [text-shadow:0_1px_0_#025753]">{piece.file}</span>
                <div className="flex shrink-0 items-center gap-1">
                  <span className="winbtn" aria-hidden="true"><span className="mb-1 block h-[2px] w-2 self-end bg-current" /></span>
                  {/* the visible close button is a small window control; the tappable area is a full 44px,
                      sized to fit inside the title bar so nothing clips it */}
                  <Dialog.Close className="-my-3 grid h-11 w-11 cursor-pointer place-items-center border-0 bg-transparent p-0 md:-my-1.5 md:h-8 md:w-8" aria-label="Close">
                    <span className="winbtn winbtn-close"><XIcon size={12} weight="bold" aria-hidden="true" /></span>
                  </Dialog.Close>
                </div>
              </div>
              <div className="grid md:grid-cols-[3fr_2fr]">
                <div className="wall relative grid min-h-[300px] place-items-center p-5 md:p-10">
                  <motion.img
                    key={piece.id}
                    src={piece.src}
                    alt={piece.alt}
                    initial={reduce ? false : { opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.7, ease: APPLE_IN_OUT }}
                    drag={reduce ? false : "x"}
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.35}
                    onDragEnd={(_, info) => { if (info.offset.x < -60) go(1); else if (info.offset.x > 60) go(-1); }}
                    className="canvas-shadow max-h-[64dvh] max-w-full touch-pan-y object-contain"
                  />
                </div>
                <div className="grid content-start gap-3 p-5 md:p-8">
                  <span className={`font-pixel text-[12px] ${piece.status === "wip" ? "text-chrome/70" : "text-aqua"}`}>{piece.tag}</span>
                  <Dialog.Title className="m-0 font-display text-[1.9rem] font-bold leading-[1.05]">{piece.title}</Dialog.Title>
                  <Dialog.Description className="m-0 text-mute">{piece.medium}</Dialog.Description>
                  <p className="m-0 text-xl font-bold">{piece.price}</p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    <button type="button" className="btn btn-gloss" onClick={() => onAsk(piece)}>Ask about this piece</button>
                    <button
                      type="button"
                      aria-pressed={isSaved}
                      onClick={() => toggle(piece.id)}
                      className={`orb h-[46px] w-[46px] cursor-pointer ${isSaved ? "orb-on" : ""}`}
                      aria-label={isSaved ? "Remove from saved" : "Save"}
                    >
                      <HeartIcon size={20} weight={isSaved ? "fill" : "regular"} aria-hidden="true" />
                    </button>
                  </div>
                  <div className="mt-6 flex items-center gap-2 border-t border-line pt-4">
                    <button type="button" onClick={() => go(-1)} className="orb hit h-11 w-11 shrink-0 cursor-pointer" aria-label="Previous piece"><CaretLeftIcon size={15} weight="bold" aria-hidden="true" /></button>
                    <button type="button" onClick={() => go(1)} className="orb hit h-11 w-11 shrink-0 cursor-pointer" aria-label="Next piece"><CaretRightIcon size={15} weight="bold" aria-hidden="true" /></button>
                    <span className="ml-2 text-sm text-mute">More from the shop<span className="md:hidden">, or swipe</span></span>
                  </div>
                </div>
              </div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
