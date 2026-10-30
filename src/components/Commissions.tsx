import { useEffect, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CheckIcon, CopyIcon, PencilSimpleIcon, SkullIcon } from "@phosphor-icons/react";
import { steps, tiers } from "../data";
import { APPLE_IN_OUT, CSS_EASE, DUR } from "../motion";

export type Prefill = { type: string; idea: string; nonce: number } | null;

const TYPES = ["Portrait or figure", "Pet portrait", "Abstract", "Buy a piece from the shop", "Something else"];
const SIZES = ["Not sure yet", "Small (up to 8 × 10 in)", "Medium (up to 16 × 20 in)", "Large (18 × 24 in and up)"];
const BUDGETS = ["Not sure", "Under $100", "$100 to $250", "$250 to $500", "$500 and up"];

type Errors = Partial<Record<"name" | "contact" | "idea" | "refs", string>>;

function Label({ htmlFor, children }: { htmlFor: string; children: ReactNode }) {
  return <label htmlFor={htmlFor} className="font-pixel text-[11px] text-chrome">{children}</label>;
}
function Err({ id, msg }: { id: string; msg?: string }) {
  return <p id={id} className="m-0 min-h-[1.1em] text-[13px] text-danger" aria-live="polite">{msg ?? ""}</p>;
}

export function Commissions({ prefill }: { prefill: Prefill }) {
  const reduce = useReducedMotion();
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [type, setType] = useState(TYPES[0]);
  const [size, setSize] = useState(SIZES[0]);
  const [budget, setBudget] = useState(BUDGETS[0]);
  const [idea, setIdea] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<Errors>({});
  const [summary, setSummary] = useState<string | null>(null);
  const [copied, setCopied] = useState<"idle" | "copied" | "selected">("idle");
  const nameRef = useRef<HTMLInputElement>(null);
  const preRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    if (!prefill) return;
    setSummary(null);
    setType(prefill.type);
    setIdea((cur) => (cur.trim() ? cur : prefill.idea));
    const t = window.setTimeout(() => nameRef.current?.focus({ preventScroll: true }), reduce ? 0 : 650);
    return () => window.clearTimeout(t);
  }, [prefill, reduce]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next: Errors = {};
    if (!name.trim()) next.name = "Add your name so Sal knows who's asking.";
    if (!contact.trim()) next.contact = "Add an email or Instagram handle so she can reply.";
    else if (!/@/.test(contact)) next.contact = "Use an email (you@site.com) or a handle that starts with @.";
    if (!idea.trim()) next.idea = "Describe what you want painted, even roughly.";
    if (files.length > 5) next.refs = "Pick your best five reference photos.";
    setErrors(next);
    if (Object.keys(next).length) {
      const first = (["name", "contact", "idea", "refs"] as const).find((k) => next[k]);
      document.getElementById(`f-${first}`)?.focus();
      return;
    }
    const refs = files.length ? `${files.map((f) => f.name).join(", ")} (attach these when you send)` : "none";
    setSummary(
      `COMMISSION REQUEST · manifesthashi\nName: ${name.trim()}\nReach me at: ${contact.trim()}\nRequest: ${type}\nSize: ${size}\nBudget: ${budget}\nReferences: ${refs}\n\n${idea.trim()}`,
    );
    setCopied("idle");
  };

  const copy = () => {
    if (!summary) return;
    navigator.clipboard.writeText(summary).then(
      () => { setCopied("copied"); window.setTimeout(() => setCopied("idle"), 1800); },
      () => {
        const r = document.createRange();
        if (preRef.current) { r.selectNodeContents(preRef.current); const s = getSelection(); s?.removeAllRanges(); s?.addRange(r); }
        setCopied("selected");
      },
    );
  };

  const fieldProps = (k: keyof Errors) => ({
    id: `f-${k}`,
    "aria-invalid": errors[k] ? true : undefined,
    "aria-describedby": `e-${k}`,
  });

  return (
    <section id="commissions" aria-labelledby="commTitle" className="bg-gradient-to-b from-espresso to-void to-70% py-16 md:py-24">
      <div className="wrap grid gap-12 lg:grid-cols-[5fr_6fr] lg:items-start lg:gap-14">
        <div className="min-w-0">
          <p className="m-0 mb-4 inline-flex items-center gap-2.5 font-pixel text-[12px] text-ink">
            <SkullIcon size={18} weight="fill" className="animate-[blink_1.8s_steps(2)_infinite] text-cyan [filter:drop-shadow(0_0_6px_#1ec8da)]" aria-hidden="true" />
            commissions open
          </p>
          <h2 id="commTitle" className="m-0 font-display text-[clamp(1.7rem,4.4vw,2.4rem)] font-bold leading-[1.1]">Get something painted for you</h2>
          <p className="mb-10 mt-4 max-w-[46ch] font-display text-[14px] leading-relaxed text-mute">
            Portraits, pets, abstracts in your colors, or an idea you can't quite describe yet. Tell Sal what you want and she'll quote it.
          </p>

          <h3 className="m-0 mb-2 font-pixel text-[13px] font-normal text-chrome">sizes</h3>
          <ul className="m-0 mb-10 list-none divide-y divide-line p-0">
            {tiers.map((t) => (
              <li key={t.name} className="flex items-baseline justify-between gap-4 py-3.5">
                <span className="grid">
                  <b className="font-display font-bold">{t.name}</b>
                  <small className="text-[13px] text-mute">{t.size}</small>
                </span>
                <span className="font-bold">from <span className="ph">$__</span></span>
              </li>
            ))}
          </ul>

          <h3 className="m-0 mb-4 font-pixel text-[13px] font-normal text-chrome">how it works</h3>
          <ol className="m-0 grid list-none gap-3.5 p-0">
            {steps.map((s, i) => (
              <li key={s} className="grid grid-cols-[30px_1fr] items-start gap-3">
                <span className="btn-gloss grid h-[30px] w-[30px] place-items-center rounded-full font-pixel text-[12px]" aria-hidden="true">{i + 1}</span>
                <p className="m-0 mt-1 font-display text-[14px] leading-relaxed">{s}</p>
              </li>
            ))}
          </ol>
        </div>

        <motion.div
          initial={reduce ? false : { y: 44, scale: 0.985 }}
          whileInView={{ y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: DUR, ease: CSS_EASE }}
          className="min-w-0 overflow-hidden rounded-win border border-black bg-[#0c1517] shadow-[0_0_0_1px_#33464b,0_30px_60px_-20px_rgba(0,0,0,.9)]"
          role="region"
          aria-label="Commission request form"
        >
          <div className="titlebar flex items-center justify-between gap-3 py-1.5 pl-3 pr-2">
            <span className="truncate font-pixel text-[12px] text-white [text-shadow:0_1px_0_#064b53]">commission_request.exe</span>
            <div className="flex shrink-0 gap-1" aria-hidden="true">
              <span className="winbtn"><span className="mb-1 block h-[2px] w-2 self-end bg-current" /></span>
              <span className="winbtn"><span className="block h-2 w-2 border-[1.5px] border-current" /></span>
              <span className="winbtn winbtn-close"><span className="font-bold leading-none">×</span></span>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            <AnimatePresence mode="wait" initial={false}>
              {summary === null ? (
                <motion.form key="form" noValidate onSubmit={submit} className="grid gap-4"
                  initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={reduce ? undefined : { opacity: 0 }} transition={{ duration: 0.5, ease: APPLE_IN_OUT }}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid min-w-0 gap-1.5">
                      <Label htmlFor="f-name">your name</Label>
                      <input ref={nameRef} {...fieldProps("name")} className="field" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
                      <Err id="e-name" msg={errors.name} />
                    </div>
                    <div className="grid min-w-0 gap-1.5">
                      <Label htmlFor="f-contact">email or instagram</Label>
                      <input {...fieldProps("contact")} className="field" placeholder="email or @handle" value={contact} onChange={(e) => setContact(e.target.value)} />
                      <Err id="e-contact" msg={errors.contact} />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid min-w-0 gap-1.5">
                      <Label htmlFor="f-type">what do you want</Label>
                      <select id="f-type" className="field" value={type} onChange={(e) => setType(e.target.value)}>
                        {TYPES.map((t) => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="grid min-w-0 gap-1.5">
                      <Label htmlFor="f-size">size</Label>
                      <select id="f-size" className="field" value={size} onChange={(e) => setSize(e.target.value)}>
                        {SIZES.map((t) => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid min-w-0 gap-1.5">
                    <Label htmlFor="f-idea">describe your idea</Label>
                    <textarea {...fieldProps("idea")} className="field min-h-[128px] resize-y" placeholder="Who or what is in it, colors, mood, where it'll hang" value={idea} onChange={(e) => setIdea(e.target.value)} />
                    <Err id="e-idea" msg={errors.idea} />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid min-w-0 gap-1.5">
                      <Label htmlFor="f-refs">reference photos</Label>
                      <input {...fieldProps("refs")} className="field" type="file" accept="image/*" multiple onChange={(e) => setFiles(Array.from(e.target.files ?? []))} />
                      <p className="m-0 text-[13px] text-mute">{files.length ? `${files.length} attached: ${files.map((f) => f.name).join(", ")}` : "Optional. Up to 5 images."}</p>
                      <Err id="e-refs" msg={errors.refs} />
                    </div>
                    <div className="grid min-w-0 content-start gap-1.5">
                      <Label htmlFor="f-budget">budget</Label>
                      <select id="f-budget" className="field" value={budget} onChange={(e) => setBudget(e.target.value)}>
                        {BUDGETS.map((t) => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <span className="text-[13px] text-mute">No payment now. Sal quotes first.</span>
                    <button type="submit" className="btn btn-gloss">Send request</button>
                  </div>
                </motion.form>
              ) : (
                <motion.div key="done" className="grid gap-4"
                  initial={reduce ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? undefined : { opacity: 0 }} transition={{ duration: 0.7, ease: APPLE_IN_OUT }}>
                  <p className="m-0 font-pixel text-[12px] text-aqua">request ready</p>
                  <p className="m-0">Copy this and send it to Sal at <span className="ph">sal's email or @handle</span> so she has everything in one message.</p>
                  <pre ref={preRef} className="m-0 max-h-[260px] overflow-auto whitespace-pre-wrap break-words rounded-ctl border border-[#2c3d41] bg-[#050809] p-3 font-display text-[12px] leading-relaxed text-aqua">{summary}</pre>
                  <div className="flex flex-wrap gap-3">
                    <button type="button" className="btn btn-gloss" onClick={copy}>
                      {copied === "copied" ? <CheckIcon size={18} weight="bold" aria-hidden="true" /> : <CopyIcon size={18} aria-hidden="true" />}
                      {copied === "copied" ? "Copied" : copied === "selected" ? "Selected, press copy" : "Copy request"}
                    </button>
                    <button type="button" className="btn btn-chrome" onClick={() => setSummary(null)}>
                      <PencilSimpleIcon size={18} aria-hidden="true" /> Edit
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
