import { useEffect } from "react";
import { useLocation } from "react-router";

/** Reset window and in-layout scroll containers (e.g. AppLayout main) on navigation. */
function scrollAllToTop() {
  window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
  for (const el of document.querySelectorAll("main")) {
    if (el.scrollTop > 0) el.scrollTop = 0;
  }
}

/**
 * Scroll to top when the route changes. Hash links scroll to the target section when present.
 */
export function ScrollToTop() {
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    if (typeof history !== "undefined" && "scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }
  }, []);

  useEffect(() => {
    if (hash) {
      const id = decodeURIComponent(hash.replace(/^#/, ""));
      requestAnimationFrame(() => {
        const target = document.getElementById(id);
        if (target) {
          target.scrollIntoView({ behavior: "instant", block: "start" });
          return;
        }
        scrollAllToTop();
      });
      return;
    }
    scrollAllToTop();
  }, [pathname, search, hash]);

  return null;
}
