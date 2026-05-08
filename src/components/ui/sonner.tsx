"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="light"
      position="top-right"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-ink group-[.toaster]:border-[rgba(16,44,75,0.08)] group-[.toaster]:shadow-card-hover group-[.toaster]:rounded-2xl",
          description: "group-[.toast]:text-muted",
          actionButton:
            "group-[.toast]:bg-accent group-[.toast]:text-white group-[.toast]:rounded-full",
          cancelButton:
            "group-[.toast]:bg-[rgba(16,44,75,0.06)] group-[.toast]:text-muted-strong group-[.toast]:rounded-full",
        },
      }}
      {...props}
    />
  );
}
