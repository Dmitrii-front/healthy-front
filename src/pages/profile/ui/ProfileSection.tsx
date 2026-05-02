import type { ReactNode } from "react";

interface ProfileSectionProps {
  title: string;
  children: ReactNode;
}

export function ProfileSection({ title, children }: ProfileSectionProps) {
  return (
    <section className="mt-6">
      <p className="mb-2 px-1 text-[11px] font-medium uppercase tracking-[0.06em] text-distant-graphite">
        {title}
      </p>
      {children}
    </section>
  );
}
