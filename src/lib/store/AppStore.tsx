"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from "react";
import type { AppData, ISODate, Scenario } from "../types";
import { createSeedData } from "../data/seed";
import { todayISO } from "../dates";
import { localPersistence } from "./persistence";
import { reducer, type Action } from "./reducer";

interface StoreValue {
  data: AppData;
  /** État initial de la démo (référence pour les indicateurs « vivants »). */
  seed: AppData;
  today: ISODate;
  dispatch: (action: Action) => void;
  reset: (scenario?: Scenario) => void;
}

const StoreContext = createContext<StoreValue | null>(null);
const ReadyContext = createContext(false);

type State = { data: AppData | null };

function rootReducer(state: State, action: Action | { type: "HYDRATE"; data: AppData }): State {
  if (action.type === "HYDRATE") return { data: action.data };
  if (!state.data) return state;
  return { data: reducer(state.data, action) };
}

/**
 * Store applicatif côté client.
 * Les données sont générées au montage (date du navigateur) puis persistées
 * localement : pas d'écart d'hydratation entre serveur et client.
 */
export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatchRaw] = useReducer(rootReducer, { data: null });
  const [today, setToday] = useState<ISODate>("");
  const hydrated = useRef(false);

  useEffect(() => {
    const day = todayISO();
    const stored = localPersistence.load();
    setToday(day);
    dispatchRaw({ type: "HYDRATE", data: stored && stored.seededOn === day ? stored : createSeedData(day, "standard") });
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (hydrated.current && state.data) localPersistence.save(state.data);
  }, [state.data]);

  const scenario = state.data?.scenario ?? "standard";
  const seed = useMemo(() => (today ? createSeedData(today, scenario) : null), [today, scenario]);

  const dispatch = useCallback((action: Action) => dispatchRaw(action), []);
  const reset = useCallback(
    (next: Scenario = "standard") => dispatchRaw({ type: "RESET", data: createSeedData(todayISO(), next) }),
    [],
  );

  const value = useMemo<StoreValue | null>(
    () => (state.data && seed ? { data: state.data, seed, today, dispatch, reset } : null),
    [state.data, seed, today, dispatch, reset],
  );

  return (
    <ReadyContext.Provider value={value !== null}>
      <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
    </ReadyContext.Provider>
  );
}

export function useStoreReady() {
  return useContext(ReadyContext);
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore doit être utilisé sous <StoreGate> (données non chargées).");
  return ctx;
}
