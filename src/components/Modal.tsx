import { useEffect, type PropsWithChildren, type ReactNode } from "react";

interface ModalProps extends PropsWithChildren {
  title: string;
  open: boolean;
  onClose: () => void;
  footer?: ReactNode;
  panelClassName?: string;
  contentClassName?: string;
}

export function Modal({
  title,
  open,
  onClose,
  footer,
  panelClassName = "",
  contentClassName = "",
  children,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-70 grid place-items-center bg-black/35 px-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={onClose}
    >
      <div
        className={`w-full max-w-lg rounded-2xl border border-(--card-border) bg-(--surface) p-5 shadow-xl ${panelClassName}`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-xl font-semibold text-(--text-primary)">
            {title}
          </h3>
          <button
            type="button"
            aria-label="Close modal"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-(--card-border) text-sm text-(--text-muted) transition hover:bg-(--bg-soft)"
            onClick={onClose}
          >
            x
          </button>
        </div>
        <div
          className={`mt-3 text-sm leading-6 text-(--text-muted) ${contentClassName}`}
        >
          {children}
        </div>
        {footer ? (
          <div className="mt-5 flex flex-wrap justify-end gap-2">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}
