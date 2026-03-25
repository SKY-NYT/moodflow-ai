import type { PropsWithChildren } from "react";

export function Shell({ children }: PropsWithChildren) {
  return (
    <div className="h-screen overflow-x-hidden bg-(--bg-page) text-(--text-primary)">
      <div className="mx-auto flex h-screen min-w-0 w-full max-w-7xl flex-col px-3 py-3 sm:px-5 sm:py-4 lg:px-8">
        {children}
      </div>
    </div>
  );
}
