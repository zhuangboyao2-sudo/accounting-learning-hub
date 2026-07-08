/** 距上次備份是否已超過 staleDays 天（從未備份過也視為過期）。 */
export function isBackupStale(lastBackupAt: string | undefined, now: Date, staleDays = 30): boolean {
  if (!lastBackupAt) return true;
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - staleDays);
  return new Date(lastBackupAt) < cutoff;
}
