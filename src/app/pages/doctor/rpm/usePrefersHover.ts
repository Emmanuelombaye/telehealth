import { useEffect, useState } from "react";

/** True on desktop with a fine pointer — safe for hover-open panels */
export function usePrefersHover(): boolean {
  const [prefersHover, setPrefersHover] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  });

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const onChange = () => setPrefersHover(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return prefersHover;
}
