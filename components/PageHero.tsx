import type { ReactNode } from "react";

/** The river-teal title band at the top of inner pages. */
export default function PageHero({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro?: string; children?: ReactNode }) {
  return (
    <section className="ripples relative overflow-hidden bg-river text-white">
      <div className="container-x relative pb-12 pt-[calc(72px+3.5rem)] sm:pb-16">
        <p className="eyebrow eyebrow-on-dark rise rise-1">{eyebrow}</p>
        <h1 className="font-display rise rise-2 mt-4 max-w-3xl text-[2.3rem] font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-[56px]">{title}</h1>
        {intro ? <p className="rise rise-3 mt-4 max-w-xl text-[17px] leading-relaxed text-white/80">{intro}</p> : null}
        {children}
      </div>
    </section>
  );
}
