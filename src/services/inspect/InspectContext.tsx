import React, { createContext, useContext, useMemo, useState } from "react";
import { InspectTarget } from "./types";

type InspectCtx = {
  target: InspectTarget | null;
  openInspect: (t: InspectTarget) => void;
  closeInspect: () => void;
};

const Ctx = createContext<InspectCtx | null>(null);

export const InspectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [target, setTarget] = useState<InspectTarget | null>(null);

  const value = useMemo<InspectCtx>(() => ({
    target,
    openInspect: (t) => setTarget(t),
    closeInspect: () => setTarget(null),
  }), [target]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export function useInspect() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useInspect must be used inside InspectProvider");
  return v;
}
