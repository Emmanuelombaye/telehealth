export {};

declare global {
  interface Window {
    /** Refer.ly / affiliate attribution when present — called as `window.referly('convert', payload)` */
    referly?: (...args: unknown[]) => void;
  }
}
