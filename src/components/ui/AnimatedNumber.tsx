"use client";

import { useEffect, useRef, useState } from "react";

/** Compteur animé (micro-animation à l'apparition et lors des changements de valeur). */
export function AnimatedNumber({
  value,
  format = (v) => Math.round(v).toLocaleString("fr-FR"),
  duration = 900,
}: {
  value: number;
  format?: (value: number) => string;
  duration?: number;
}) {
  const [display, setDisplay] = useState(0);
  const from = useRef(0);

  useEffect(() => {
    const start = performance.now();
    const origin = from.current;
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const current = origin + (value - origin) * eased;
      setDisplay(current);
      if (t < 1) frame = requestAnimationFrame(tick);
      else from.current = value;
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      from.current = value;
    };
  }, [value, duration]);

  return <span className="tabular">{format(display)}</span>;
}
