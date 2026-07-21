// Mirrors the billing-cycle math in the backend services (Create_Company,
// Quiz_Generation, Quiz_Result) so the admin panel can preview/compute the
// same period-anchored dates without a round trip.

export const BILLING_CYCLE_MONTHS: Record<string, number> = {
  monthly: 1,
  quarterly: 3,
  half_yearly: 6,
  yearly: 12,
};

export function addMonths(d: Date, months: number): Date {
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth();
  const day = d.getUTCDate();
  const targetMonthIndex = month + months;
  const targetYear = year + Math.floor(targetMonthIndex / 12);
  const targetMonth = ((targetMonthIndex % 12) + 12) % 12;
  const lastDayOfTargetMonth = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
  const clampedDay = Math.min(day, lastDayOfTargetMonth);
  return new Date(Date.UTC(targetYear, targetMonth, clampedDay));
}

export function computePeriodEnd(start: Date, billingCycle: string): Date {
  const months = BILLING_CYCLE_MONTHS[billingCycle] ?? 1;
  return addMonths(start, months);
}
