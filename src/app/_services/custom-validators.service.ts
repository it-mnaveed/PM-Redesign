import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function dateRangeValidator(startKey: string, endKey: string): ValidatorFn {
  
  return (group: AbstractControl): ValidationErrors | null => {
    const start = group.get(startKey)?.value;
    const end = group.get(endKey)?.value;

    // If either date is missing, don’t validate yet
    if (!start || !end) return null;

    const startDate = new Date(start);
    const endDate = new Date(end);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // strip time

    // ❌ Invalid date format check
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return { invalidDate: true };
    }

    // ❌ End date before start date
    if (endDate < startDate) {
      return { endBeforeStart: true };
    }

    // ❌ Start date in the past (if not allowed)
    // if (startDate < today) {
    //   return { startInPast: true };
    // }

    // ❌ End date equals start date (if not allowed)
    if (endDate.getTime() === startDate.getTime()) {
      return { sameDateNotAllowed: true };
    }

    // ❌ Agreement longer than 10 years (example rule)
    // const maxDurationYears = 10;
    // const diffYears = endDate.getFullYear() - startDate.getFullYear();
    // if (diffYears > maxDurationYears) {
    //   return { tooLong: true };
    // }

    return null; // ✅ All good
  };
}
