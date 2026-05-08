"use client";

import type { ReactNode } from "react";

type PageHeaderProps = {
  eyebrow?: string;
  title: ReactNode;
  right?: ReactNode;
};

export function PageHeader({ eyebrow, title, right }: PageHeaderProps) {
  return (
    <header className="mt-1 flex flex-wrap items-center gap-3.5 border-b border-line/60 px-1 py-[18px]">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        {eyebrow ? (
          <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
            {eyebrow}
          </span>
        ) : null}
        <h1 className="m-0 font-display text-[clamp(20px,2vw,26px)] font-bold leading-tight tracking-tighter text-ink">
          {title}
        </h1>
      </div>
      {right ? <div className="flex flex-wrap items-center gap-2">{right}</div> : null}
    </header>
  );
}
