import { type RefObject, useEffect } from "react";

const MAX_TILT_DEG = 10;

/**
 * Wires the transitions-dev card-tilt orchestration onto every `.t-tilt` /
 * `.t-tilt-card` pair inside a container, so a list of cards only needs one
 * hook call instead of one per card.
 */
export function useTiltGroup(containerRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduce.matches) return;

    const wrappers = Array.from(container.querySelectorAll<HTMLElement>(".t-tilt"));
    const cleanups: Array<() => void> = [];

    for (const tilt of wrappers) {
      const card = tilt.querySelector<HTMLElement>(".t-tilt-card");
      if (!card) continue;

      const reset = () => {
        tilt.classList.remove("is-hover");
        card.classList.remove("is-tilting");
        card.style.setProperty("--tilt-rx", "0deg");
        card.style.setProperty("--tilt-ry", "0deg");
      };

      const track = (e: PointerEvent) => {
        const r = tilt.getBoundingClientRect();
        const px = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
        const py = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
        tilt.classList.add("is-hover");
        card.classList.add("is-tilting");
        card.style.setProperty("--tilt-ry", `${((px - 0.5) * MAX_TILT_DEG).toFixed(2)}deg`);
        card.style.setProperty("--tilt-rx", `${((0.5 - py) * MAX_TILT_DEG).toFixed(2)}deg`);
        card.style.setProperty("--tilt-gx", `${(px * 100).toFixed(1)}%`);
        card.style.setProperty("--tilt-gy", `${(py * 100).toFixed(1)}%`);
      };

      const onLeave = (e: PointerEvent) => {
        if (e.pointerType === "mouse") reset();
      };

      tilt.addEventListener("pointermove", track);
      tilt.addEventListener("pointerup", reset);
      tilt.addEventListener("pointercancel", reset);
      tilt.addEventListener("pointerleave", onLeave);

      cleanups.push(() => {
        tilt.removeEventListener("pointermove", track);
        tilt.removeEventListener("pointerup", reset);
        tilt.removeEventListener("pointercancel", reset);
        tilt.removeEventListener("pointerleave", onLeave);
      });
    }

    return () => {
      for (const cleanup of cleanups) cleanup();
    };
  }, [containerRef]);
}
