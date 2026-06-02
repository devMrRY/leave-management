/**
 * Calculate number of working days (excluding weekends - Saturday and Sunday)
 */
export function calculateWorkingDays(startDate: Date, endDate: Date): {
  workingDays: number;
  weekendDays: number;
  skippedDates: string[];
} {
  const skippedDates: string[] = [];
  let workingDays = 0;
  let weekendDays = 0;

  const currentDate = new Date(startDate);
  currentDate.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  while (currentDate <= end) {
    const dayOfWeek = currentDate.getDay();
    const dateStr = currentDate.toISOString().split('T')[0];

    // 0 = Sunday, 6 = Saturday
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      weekendDays++;
      skippedDates.push(dateStr);
    } else {
      workingDays++;
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return { workingDays, weekendDays, skippedDates };
}

/**
 * Check if leave dates contain weekends
 */
export function hasWeekends(startDate: Date, endDate: Date): boolean {
  const currentDate = new Date(startDate);
  currentDate.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  while (currentDate <= end) {
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return true;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return false;
}
