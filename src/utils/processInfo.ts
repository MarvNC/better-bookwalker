export function processDate(dateString: string): Date {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    throw new Error("Invalid date");
  }
  return date;
}
/**
 * Some series have indexes like 100010001 we want to fix
 * @param seriesIndex
 * @example
 * 100010001 => 1
 */
export function processSeriesIndex(seriesIndex: number): number {
  return seriesIndex % 10000;
}

/**
 * YYYY-MM-DD
 * @param date
 * @returns
 */
export function formatDate(date: Date | undefined): string {
  if (!date) return "";
  return date.toISOString().split("T")[0];
}
