function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function formatDate(year: number, month: number, day: number): string {
  return `${year}${pad(month)}${pad(day)}`;
}

function formatUtcTimestamp(date: Date): string {
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(
    date.getUTCHours(),
  )}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
}

function addDays(
  year: number,
  month: number,
  day: number,
  deltaDays: number,
): { year: number; month: number; day: number } {
  const d = new Date(year, month - 1, day);
  d.setDate(d.getDate() + deltaDays);
  return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
}

function allDayEvent(
  uid: string,
  dtstamp: string,
  year: number,
  month: number,
  day: number,
  summary: string,
  description: string,
  spanDays = 1,
): string {
  const end = addDays(year, month, day, spanDays);
  return [
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART;VALUE=DATE:${formatDate(year, month, day)}`,
    `DTEND;VALUE=DATE:${formatDate(end.year, end.month, end.day)}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    "END:VEVENT",
  ].join("\r\n");
}

function dailyReminderEvent(
  uid: string,
  dtstamp: string,
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  summary: string,
  description: string,
): string {
  return [
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${formatDate(year, month, day)}T${pad(hour)}${pad(minute)}00`,
    "RRULE:FREQ=DAILY",
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    "END:VEVENT",
  ].join("\r\n");
}

const VAT_FILING_MONTHS = [1, 3, 5, 7, 9, 11];

/**
 * 產生稅務申報期限與每日複習提醒的 .ics 行事曆內容（計畫 §7 未來擴充）。
 * 期限日期用固定公式（依 tax-parameters 的申報規則）算出，不解析自由文字。
 */
export function buildDeadlinesIcs(now: Date): string {
  const year = now.getFullYear();
  const dtstamp = formatUtcTimestamp(now);
  const events: string[] = [];

  for (const month of VAT_FILING_MONTHS) {
    events.push(
      allDayEvent(
        `vat-${year}-${month}@accounting-learning-hub`,
        dtstamp,
        year,
        month,
        15,
        "營業稅（401）申報截止",
        "雙月營業稅申報截止日；實際期限如遇假日順延請以國稅局公告為準。",
      ),
    );
  }

  events.push(
    allDayEvent(
      `income-tax-season-${year}@accounting-learning-hub`,
      dtstamp,
      year,
      5,
      1,
      "5 月報稅季：綜所稅／營所稅結算申報",
      "綜合所得稅與營利事業所得稅結算申報期間。",
      31,
    ),
  );

  events.push(
    allDayEvent(
      `withholding-filing-${year}@accounting-learning-hub`,
      dtstamp,
      year,
      1,
      31,
      "扣繳憑單彙報截止",
      "各類所得扣繳憑單彙報截止日。",
    ),
  );

  events.push(
    allDayEvent(
      `withholding-issue-${year}@accounting-learning-hub`,
      dtstamp,
      year,
      2,
      10,
      "扣繳憑單填發截止",
      "各類所得扣繳憑單填發納稅義務人截止日。",
    ),
  );

  events.push(
    dailyReminderEvent(
      "daily-review@accounting-learning-hub",
      dtstamp,
      now.getFullYear(),
      now.getMonth() + 1,
      now.getDate(),
      20,
      0,
      "今日複習提醒",
      "前往會計學習網站完成今日學習佇列（到期複習卡、錯題重練）。",
    ),
  );

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//會計學習網站//Study Calendar//ZH-TW",
    "CALSCALE:GREGORIAN",
    ...events,
    "END:VCALENDAR",
  ].join("\r\n");
}
