import { Injectable } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class InstallmentGeneratorService {

  constructor(
    private fb: FormBuilder,
    private datePipe: DatePipe
  ) { }

  /**
   * Generates an installment plan for a single unit
   */
  generateInstallmentsForUnit(
    unitData: any,
    startDate: Date,
    endDate: Date,
    installmentPlan: string,
    revenueRecogPlan: string
  ): FormArray<FormGroup> {

    const BeforetaxAmount = Number(unitData.U_TotAfterDisc) || 0;
    const taxAmount = Number(unitData.U_TaxAmt) || 0;
    const AfterTax = Number(unitData.U_TotAfterTax) || 0;
    const taxRate = Number(unitData.U_TaxPrc) || 0;

    console.log(JSON.stringify(unitData))
    const installmentsArray = new FormArray<FormGroup>([]);

    if (installmentPlan.toLowerCase() === 'month days') {
      // ------------------- Month Days Logic -------------------
      const months: { dueDate: Date, days: number }[] = [];
      const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);

      while (current <= endDate) {
        const year = current.getFullYear();
        const month = current.getMonth();

        const monthStart = new Date(year, month, 1);
        const monthEnd = new Date(year, month + 1, 0);

        let days = monthEnd.getDate(); // full month by default

        // First month (partial)
        if (
          year === startDate.getFullYear() &&
          month === startDate.getMonth()
        ) {
          days = monthEnd.getDate() - startDate.getDate() + 1;
        }

        // Last month (partial)
        if (
          year === endDate.getFullYear() &&
          month === endDate.getMonth()
        ) {
          days = endDate.getDate();
        }

        months.push({
          dueDate: monthStart,
          days
        });

        current.setMonth(current.getMonth() + 1);
      }

      const totalDays = months.reduce((sum, m) => sum + m.days, 0);
      let runningBefore = 0;
      let runningTax = 0;

      let oneTimeUtility =
        unitData.AgreementUtilities
          .filter((u: any) => u.u_Occurance === 'One Time' || u.u_Occurance === 'OT')
          .reduce((s: number, u: any) => s + (u.amountAfterTax || 0), 0);

      let planUtility =
        unitData.AgreementUtilities
          .filter((u: any) => u.u_Occurance === 'Based On Plan')
          .reduce((s: number, u: any) => s + (u.amountAfterTax || 0), 0);

      const basedOnPlanAmount = +(planUtility / months.length).toFixed(2);

      let runningBefore1 = 0;
      let runningTax1 = 0;

      months.forEach((m, i) => {

        // raw calculated share
        let rawBefore = (BeforetaxAmount * m.days) / totalDays;
        let rawTax = (taxAmount * m.days) / totalDays;

        // convert to whole numbers
        let beforeTax = Math.floor(rawBefore);
        let tax = Math.floor(rawTax);

        const isLast = i === months.length - 1;

        // adjust last installment with remainder
        if (isLast) {
          beforeTax = BeforetaxAmount - runningBefore1;
          tax = taxAmount - runningTax1;
        }

        runningBefore1 += beforeTax;
        runningTax1 += tax;

        const afterTax = beforeTax + tax;
        const formattedDate = this.datePipe.transform(m.dueDate, 'yyyy-MM-dd');

        let applyUtilAmount = basedOnPlanAmount;
        if (i === 0) {
          applyUtilAmount += oneTimeUtility;
        }

        const group = this.fb.group({
          Name: [`${revenueRecogPlan}${i + 1}`, Validators.required],
          U_AGID: [unitData.U_AGID],
          U_InstID: [i + 1, Validators.required],
          U_GDate: [formattedDate, Validators.required],
          U_HDate: [''],
          U_AmtBeforeTax: [beforeTax, Validators.required],
          U_Tax: [tax],
          U_AmtAfterTax: [afterTax, Validators.required],
          U_PrcUnit: [
            Math.round((beforeTax / BeforetaxAmount) * 100),
            [Validators.min(0), Validators.max(100)]
          ],
          U_AmtRcvd: [0.0],
          U_ProfSent: ['N'],
          U_Lock: ['N'],
          U_Canceled: ['N'],
          U_UtilAmt: [applyUtilAmount],
          U_UtilDetail: ['']
        });

        installmentsArray.push(group);
      });

      return installmentsArray;
    }

    // ------------------- Regular Plan Logic -------------------
    let gapMonths = 1;
    switch (installmentPlan.toLowerCase()) {
      case 'monthly': gapMonths = 1; break;
      case 'quarterly': gapMonths = 3; break;
      case 'semi-annually':
      case 'semi-annual':
        gapMonths = 6; break;
      case 'annually': gapMonths = 12; break;
      default: gapMonths = 1; break;
    }

    const installmentDates: Date[] = [];
    if (installmentPlan.toLowerCase() == 'one time') {
      installmentDates.push(new Date(startDate));
    } else {
      this.pushDatesByMonths(installmentDates, startDate, endDate, gapMonths);
    }

    const installmentPct = +(100 / installmentDates.length).toFixed(2);
    
    let oneTimeUtility =
      unitData.AgreementUtilities
        .filter((u: any) => u.u_Occurance === 'One Time' || u.u_Occurance === 'OT')
        .reduce((s: any, u: any) => s + u.amountAfterTax, 0);

    let planUtility =
      unitData.AgreementUtilities
        .filter((u: any) => u.u_Occurance === 'Based On Plan')
        .reduce((s: any, u: any) => s + u.amountAfterTax, 0);
    let BasedOnPlanAmount = planUtility / installmentDates.length;
    let OneTimeUtilAmount = BasedOnPlanAmount + oneTimeUtility;
    let applyUtilAmount = 0;
    
    const totalInstallments = installmentDates.length;

    // base whole-number amounts
    const baseBeforeTax = Math.floor(BeforetaxAmount / totalInstallments);
    const baseTax = Math.floor(taxAmount / totalInstallments);
    const baseAfterTax = Math.floor(AfterTax / totalInstallments);

    // remainders
    const beforeTaxRemainder =
      BeforetaxAmount - baseBeforeTax * totalInstallments;
    const taxRemainder =
      taxAmount - baseTax * totalInstallments;
    const afterTaxRemainder =
      AfterTax - baseAfterTax * totalInstallments;

    installmentDates.forEach((date, index) => {

      const isLast = index === totalInstallments - 1;

      const beforeTax = isLast
        ? baseBeforeTax + beforeTaxRemainder
        : baseBeforeTax;

      const taxAmt = isLast
        ? baseTax + taxRemainder
        : baseTax;

      const afterTax = isLast
        ? baseAfterTax + afterTaxRemainder
        : baseAfterTax;

      const formattedDate = this.datePipe.transform(date, 'yyyy-MM-dd');

      const applyUtilAmount =
        index === 0 ? OneTimeUtilAmount : BasedOnPlanAmount;

      const group = this.fb.group({
        Name: [`${revenueRecogPlan}${index + 1}`, Validators.required],
        U_AGID: [unitData.U_AGID],
        U_InstID: [index + 1, Validators.required],
        U_GDate: [formattedDate, Validators.required],
        U_HDate: [''],
        U_AmtBeforeTax: [beforeTax, Validators.required],
        U_Tax: [taxAmt],
        U_AmtAfterTax: [afterTax, Validators.required],
        U_PrcUnit: [installmentPct, [Validators.min(0), Validators.max(100)]],
        U_AmtRcvd: [0.0],
        U_ProfSent: ['N'],
        U_Lock: ['N'],
        U_Canceled: ['N'],
        U_UtilAmt: [applyUtilAmount],
        U_UtilDetail: ['']
      });

      installmentsArray.push(group);
    });
    
    return installmentsArray;
  }

  /* ---------- Utility Methods ---------- */
  private pushDatesByMonths(arr: Date[], start: Date, end: Date, gapMonths: number) {
    const current = new Date(start);
    while (current <= end) {
      arr.push(new Date(current));
      current.setMonth(current.getMonth() + gapMonths);
    }
  }

  private monthDiff(d1: Date, d2: Date): number {
    return (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth()) + 1;
  }
  GenerateItemsCustomizePlan(
    CurrentInstallments: any,
    UnitData: any
  ) {
    
    UnitData.forEach((unitData: any) => {
      const BeforetaxAmount = Number(unitData.U_TotAfterDisc) || 0;
      const taxAmount = Number(unitData.U_TaxAmt) || 0;
      const AfterTax = Number(unitData.U_TotAfterTax) || 0;
      const taxRate = Number(unitData.U_TaxPrc) || 0;

      const installmentsArray = new FormArray<FormGroup>([]);
      const installmentDates: Date[] = [];
      const installmentPct = +(100 / CurrentInstallments.length).toFixed(2);

      let oneTimeUtility =
        unitData.AgreementUtilities
          .filter((u: any) => u.u_Occurance === 'One Time' || u.u_Occurance === 'OT')
          .reduce((s: any, u: any) => s + u.amountAfterTax, 0);

      let planUtility =
        unitData.AgreementUtilities
          .filter((u: any) => u.u_Occurance === 'Based On Plan')
          .reduce((s: any, u: any) => s + u.amountAfterTax, 0);
      let BasedOnPlanAmount = planUtility / CurrentInstallments.length;
      let OneTimeUtilAmount = BasedOnPlanAmount + oneTimeUtility;
      let applyUtilAmount = 0;

      CurrentInstallments.forEach((date: any, index: any) => {

        const beforeTax = +(BeforetaxAmount / CurrentInstallments.length).toFixed(2);
        const taxAmt = +(taxAmount / CurrentInstallments.length).toFixed(2);
        const afterTax = +(AfterTax / CurrentInstallments.length).toFixed(2);
        const formattedDate = this.datePipe.transform(date.U_GDate, 'yyyy-MM-dd');

        if (index == 0) {
          applyUtilAmount = OneTimeUtilAmount;
        } else {
          applyUtilAmount = BasedOnPlanAmount
        }
        const group = this.fb.group({
          Name: [`$Installment ${index + 1}`, Validators.required],
          U_AGID: [unitData.U_AGID],
          U_InstID: [index + 1, Validators.required],
          U_GDate: [formattedDate, Validators.required],
          U_HDate: [''],
          U_AmtBeforeTax: [beforeTax, Validators.required],
          U_Tax: [taxAmt],
          U_AmtAfterTax: [afterTax, Validators.required],
          U_PrcUnit: [installmentPct, [Validators.min(0), Validators.max(100)]],
          U_AmtRcvd: [0.0],
          U_ProfSent: ['N'],
          U_Lock: ['N'],
          U_Canceled: ['N'],
          U_UtilAmt: [applyUtilAmount],
          U_UtilDetail: ['']
        });

        installmentsArray.push(group);
      });

      unitData.AgreementItemInstallments = installmentsArray.value;
    });
    return UnitData;
  }
}
