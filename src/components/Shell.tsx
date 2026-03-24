import type { PropsWithChildren } from "react";

export function Shell({ children }: PropsWithChildren) {
  return (
    <div className="h-screen overflow-hidden bg-(--bg-page) text-(--text-primary)">
      <div className="mx-auto flex h-screen w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  );
}
