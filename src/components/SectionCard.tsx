import type { PropsWithChildren, ReactNode } from "react";

interface SectionCardProps extends PropsWithChildren {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function SectionCard({
  title,
  description,
  action,
  className = "",
  children,
}: SectionCardProps) {
  return (
    <section className={`min-w-0 ${className}`}>
      <div className="mb-4 flex items-start justify-between gap-4 border-b border-(--card-border) pb-3">
        <div>
          <h2 className="text-lg font-semibold text-(--text-primary)">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-sm text-(--text-muted)">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
