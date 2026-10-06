"use client";

import type { ReactNode } from "react";
import { AppStoreProvider, useStoreReady } from "@/lib/store/AppStore";
import { ToastProvider } from "./ui/Toast";
import { DemoProvider } from "./demo/DemoProvider";
import { DemoOverlay } from "./demo/DemoOverlay";

function DemoLayer() {
  const ready = useStoreReady();
  return ready ? <DemoOverlay /> : null;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <AppStoreProvider>
        <DemoProvider>
          {children}
          <DemoLayer />
        </DemoProvider>
      </AppStoreProvider>
    </ToastProvider>
  );
}
