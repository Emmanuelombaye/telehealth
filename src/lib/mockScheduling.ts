/** Demo scheduling — no external Calendly/Cal.com iframe. Set VITE_USE_LIVE_SCHEDULING=true for production URLs. */
export function isMockSchedulingEnabled(): boolean {
  return import.meta.env.VITE_USE_LIVE_SCHEDULING !== "true";
}

export type MockSchedulingSlot = {
  id: string;
  label: string;
  dayLabel: string;
  timeLabel: string;
  isoStart: string;
};

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function formatDay(d: Date): string {
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function formatTime(h: number, m: number): string {
  const t = new Date();
  t.setHours(h, m, 0, 0);
  return t.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

/** Static demo slots for enrollment + appointments (no network). */
export function getMockSchedulingSlots(count = 8): MockSchedulingSlot[] {
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  const times: [number, number][] = [
    [9, 0],
    [10, 30],
    [13, 0],
    [15, 30],
    [17, 0],
  ];
  const slots: MockSchedulingSlot[] = [];
  let dayOffset = 1;
  while (slots.length < count && dayOffset < 14) {
    const day = addDays(base, dayOffset);
    if (day.getDay() === 0 || day.getDay() === 6) {
      dayOffset++;
      continue;
    }
    for (const [h, m] of times) {
      if (slots.length >= count) break;
      const start = new Date(day);
      start.setHours(h, m, 0, 0);
      const dayLabel = formatDay(start);
      const timeLabel = formatTime(h, m);
      slots.push({
        id: `mock-${start.toISOString()}`,
        label: `${dayLabel} · ${timeLabel}`,
        dayLabel,
        timeLabel,
        isoStart: start.toISOString(),
      });
    }
    dayOffset++;
  }
  return slots;
}

export const MOCK_SCHEDULING_PROVIDER_LABEL = "Demo scheduler";
