"use client";

import { buildDeadlinesIcs } from "@/lib/calendar/ics";

export function DeadlinesCalendarExport() {
  function exportCalendar() {
    const ics = buildDeadlinesIcs(new Date());
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "accounting-learning-hub-deadlines.ics";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={exportCalendar}
      className="rounded-md bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
    >
      加入行事曆（.ics）
    </button>
  );
}
