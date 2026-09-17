
export interface AgreementItem {
    u_TotAfterDisc: number;
    u_TaxPrc?: number;
    agreementUtilities?: UtilityItem[];
}

export interface UtilityItem {
    u_Occurance: 'One Time' | 'Based On Plan' | 'OT';
    u_TotAfterTax: number;
}

export interface AgreementJson {
    agreementItems: AgreementItem[];
    UnitList?: { AgreementUtilities: UtilityItem[] }[];
    TotalUnitAmount?: number;
    u_InstPlanID?: string;
    u_AgtSDate: string;
    u_AgtEDate: string;
    u_AGType?: number;
}

export interface InstallmentRow {
    Name: string;
    u_AGID: number | null;
    u_InstID: number;
    u_GDate: Date;
    u_HDate: string;
    u_AmtBeforeTax: number;
    u_Tax: number;
    u_AmtAfterTax: number;
    u_PrcUnit: number;
    u_AmtRcvd: number;
    u_ProfSent: string;
    u_Lock: string;
    u_Canceled: string;
    u_UtilAmt: number;
    u_UtilDetail: string;
}

/**
 * Generate a complete list of installments based on the
 * given agreement JSON, plan and dates.
 */
export function GenerateInstallmentsFromAgreement(
    agreement: AgreementJson,
    planOverride?: string
): InstallmentRow[] {
    const plan = planOverride ?? agreement.u_InstPlanID;
    //added time with date to avoide UTC conversion by Muhammad Maqbool 18-12-2025
    const now = new Date();
    let startDate = new Date(agreement.u_AgtSDate);
    startDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), now.getHours(), now.getMinutes(), now.getSeconds());
    let endDate = new Date(agreement.u_AgtEDate);
    endDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), now.getHours(), now.getMinutes(), now.getSeconds());

    if (!plan || !startDate || !endDate) return [];

    // ------------------------------
    // 1️⃣ Calculate totals from items
    // ------------------------------
    let totalBeforeTax = 0;
    let totalTaxAmount = 0;

    //   if (item.u_TaxPrc && item.u_TaxPrc < 0) {
    //         itemTax = parseFloat(((beforeTax * (item.u_TaxPrc || 0))).toFixed(2));
    //     } else {
    //         itemTax = parseFloat(((beforeTax * (item.u_TaxPrc || 0)) / 100).toFixed(2));
    //     }

    agreement.agreementItems.forEach(item => {
        const beforeTax = item.u_TotAfterDisc || 0;
        const itemTax = parseFloat(((beforeTax * (item.u_TaxPrc || 0)) / 100).toFixed(2));
        totalBeforeTax += beforeTax;
        totalTaxAmount += itemTax;
    });

    if (!totalBeforeTax) return [];

    const installments: InstallmentRow[] = [];

    // ---------- CUSTOMIZED ----------
    if (plan === 'Customized') {
        installments.push(createCustomInstallment(1, 100, totalBeforeTax, totalTaxAmount, startDate));
        return finalize(installments, agreement, totalBeforeTax, totalTaxAmount, plan, planOverride);
    }

    // ---------- ANNUALLY ----------
    if (plan === 'Annually') {
        
        const totalMonths = monthDiff(startDate, endDate);
        const fullYears = Math.floor(totalMonths / 12);
        const remainder = totalMonths % 12;
        const yearlyAmt = parseFloat(((totalBeforeTax / totalMonths) * 12).toFixed(2));
        // let current = new Date(startDate);
        // let instCounter = 1;

        // for (let y = 0; y < fullYears; y++) {
        //     installments.push(pushInstallmentRow(current, yearlyAmt, instCounter++, totalBeforeTax));
        //     current.setMonth(current.getMonth() + 12);
        // }
        let current = new Date(startDate);
        let instCounter = 1;

        for (let y = 0; y < fullYears; y++) {
            // clone the date BEFORE pushing
            const dueDate = new Date(current);

            installments.push(
                pushInstallmentRow(dueDate, yearlyAmt, instCounter++, totalBeforeTax)
            );
            // move to next year for the NEXT installment
            current.setMonth(current.getMonth() + 12);
        }

        if (remainder > 0) {
            const remainderAmt = parseFloat(((totalBeforeTax / totalMonths) * remainder).toFixed(2));
            installments.push(pushInstallmentRow(startDate, remainderAmt, instCounter++, totalBeforeTax));
        }

        return finalize(installments, agreement, totalBeforeTax, totalTaxAmount, plan, planOverride);
    }

    if (plan === 'Month Days') {

        const months: { dueDate: Date; days: number }[] = [];
        const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);

        let totalDays = 0;

        while (current <= endDate) {

            const year = current.getFullYear();
            const month = current.getMonth();
            //added time with date to avoide UTC conversion by Muhammad Maqbool 18-12-2025
            const monthStart = new Date(year, month, 1, now.getHours(), now.getMinutes(), now.getSeconds());
            const monthEnd = new Date(year, month + 1, 0, now.getHours(), now.getMinutes(), now.getSeconds());

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
                //dueDate: monthStart, // keep first day as due date
                dueDate: monthEnd, // keep end date as due date for reveneu
                days
            });

            totalDays += days;
            current.setMonth(current.getMonth() + 1);
        }

        // Step 2: weighted amount calculation (UNCHANGED)
        let runningTotal = 0;
        months.forEach((m, i) => {

            let monthlyAmt = (totalBeforeTax * m.days) / totalDays;
            monthlyAmt = parseFloat(monthlyAmt.toFixed(2));
            //console.log(totalBeforeTax+'-'+totalDays+'-'+m.days+'-'+monthlyAmt);
            // Adjust last installment for rounding
            if (i === months.length - 1) {
                const diff = parseFloat((totalBeforeTax - runningTotal - monthlyAmt).toFixed(2));
                //console.log(totalBeforeTax +'-'+ runningTotal +'-'+ monthlyAmt+'-'+diff);
                monthlyAmt += diff;
                //console.log('last installment='+monthlyAmt);
            }

            runningTotal += monthlyAmt;
            installments.push(
                pushInstallmentRow(m.dueDate, monthlyAmt, i + 1, totalBeforeTax)
            );
        });

        return finalize(installments, agreement, totalBeforeTax, totalTaxAmount, plan, planOverride);
    }


    // ---------- Other Plans ----------
    const installmentDates: Date[] = [];
    switch (plan) {
        case 'Semi-Annually':
        case 'Semi-Annual':
            pushDatesByMonths(installmentDates, startDate, endDate, 6); break;
        case 'Quarterly': pushDatesByMonths(installmentDates, startDate, endDate, 3); break;
        case 'One Time': installmentDates.push(startDate); break;
        default: pushDatesByMonths(installmentDates, startDate, endDate, 1); break; // monthly
    }

    const perInstallment = parseFloat((totalBeforeTax / installmentDates.length).toFixed(2));
    installmentDates.forEach((dueDate, i) =>
        installments.push(pushInstallmentRow(dueDate, perInstallment, i + 1, totalBeforeTax))
    );

    return finalize(installments, agreement, totalBeforeTax, totalTaxAmount, plan, planOverride);
}

/* ----------------- Helper Functions ----------------- */

function pushInstallmentRow(
    dueDate: Date,
    amtBeforeTax: number,
    index: number,
    totalBeforeTax: number
): InstallmentRow {

    const percentage = parseFloat(((amtBeforeTax / totalBeforeTax) * 100).toFixed(2));
    return {
        Name: `Installment ${index}`,
        u_AGID: null,
        u_InstID: index,
        u_GDate: dueDate,
        u_HDate: '',
        u_AmtBeforeTax: amtBeforeTax,
        u_Tax: 0,
        u_AmtAfterTax: amtBeforeTax,
        u_PrcUnit: percentage,
        u_AmtRcvd: 0.0,
        u_ProfSent: 'N',
        u_Lock: 'N',
        u_Canceled: 'N',
        u_UtilAmt: 0,
        u_UtilDetail: ''
    };
}

function createCustomInstallment(
    index: number,
    percentage: number,
    totalBeforeTax: number,
    totalTaxAmount: number,
    dueDate: Date
): InstallmentRow {
    const amtBeforeTax = parseFloat(((totalBeforeTax * percentage) / 100).toFixed(2));
    return pushInstallmentRow(dueDate, amtBeforeTax, index, totalBeforeTax);
}

function monthDiffOld(d1: Date, d2: Date): number {
    return (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth()) + 1;
}
function monthDiff(d1: Date, d2: Date): number {
    let months =
        (d2.getFullYear() - d1.getFullYear()) * 12 +
        (d2.getMonth() - d1.getMonth());

    // If end day is before start day, last month is not complete
    if (d2.getDate() < d1.getDate()) {
        months--;
    }

    return months + 1; // inclusive count
}


function pushDatesByMonths(arr: Date[], start: Date, end: Date, gapMonths: number) {
    const current = new Date(start);
    while (current <= end) {
        arr.push(new Date(current));
        current.setMonth(current.getMonth() + gapMonths);
    }
}


function finalize(
    installments: InstallmentRow[],
    agreement: AgreementJson,
    totalBeforeTax: number,
    totalTaxAmount: number,
    plan?: string,// pass plan here,
    planOverride?: string
): InstallmentRow[] {

    if (!installments.length) return [];

    const isMaintenance = agreement.u_AGType === 3;
    const num = installments.length;

    if (!isMaintenance && plan !== 'Month Days') {
        // Only apply equal distribution for non-MonthDays
        let totalPct = 0;
        for (let i = 0; i < num - 1; i++) totalPct += installments[i].u_PrcUnit;
        const last = installments[num - 1];
        last.u_PrcUnit = parseFloat((100 - totalPct).toFixed(2));
        last.u_AmtBeforeTax = parseFloat(((totalBeforeTax * last.u_PrcUnit) / 100).toFixed(2));

        const baseAmt = Math.floor(totalBeforeTax / num);
        const amtRemainder = totalBeforeTax - baseAmt * num;
        const baseTax = Math.floor(totalTaxAmount / num);
        const taxRemainder = totalTaxAmount - baseTax * num;
        
        if (!planOverride) {
            installments.forEach(inst => {
                inst.u_AmtBeforeTax = baseAmt;
                inst.u_Tax = baseTax;
                inst.u_AmtAfterTax = baseAmt + baseTax;
                inst.u_UtilAmt = 0;
            });
        } else {
            const tx = totalTaxAmount / num;
            installments.forEach(inst => {
                inst.u_Tax = tx;
            });
        }


        const lastInst = installments[num - 1];
        lastInst.u_AmtBeforeTax += amtRemainder;
        lastInst.u_Tax += taxRemainder;
        lastInst.u_AmtAfterTax = lastInst.u_AmtBeforeTax + lastInst.u_Tax;
    } else if (isMaintenance) {
        installments.forEach(inst => {
            inst.u_AmtBeforeTax = 0;
            inst.u_Tax = 0;
            inst.u_AmtAfterTax = 0;
            inst.u_UtilAmt = 0;
        });
    }
    if (!isMaintenance && plan == 'Month Days') {
        
        // Only apply equal distribution for non-MonthDays
        let totalPct = 0;
        for (let i = 0; i < num - 1; i++) totalPct += installments[i].u_PrcUnit;
        const last = installments[num - 1];
        last.u_PrcUnit = parseFloat((100 - totalPct).toFixed(2));
        //Commented by Muhammad Maqbool it should not multiply with percentage no change required 18-12-2025
        //last.u_AmtBeforeTax = parseFloat(((totalBeforeTax * last.u_PrcUnit) / 100).toFixed(2));
        //console.log('finalize -'+last.u_AmtBeforeTax);
        const baseAmt = Math.floor(totalBeforeTax / num);
        const amtRemainder = totalBeforeTax - baseAmt * num;
        const baseTax = Math.floor(totalTaxAmount / num);
        const taxRemainder = totalTaxAmount - baseTax * num;

        installments.forEach(inst => {
            //console.log('finalize amount -'+inst.u_AmtBeforeTax);
            inst.u_AmtBeforeTax = inst.u_AmtBeforeTax;
            if (planOverride) {
                const tx = totalTaxAmount / num;
                inst.u_Tax = tx;
            } else {
                inst.u_Tax = baseTax;
            }
            inst.u_Tax = baseTax;
            inst.u_AmtAfterTax = inst.u_AmtBeforeTax + baseTax;
            inst.u_UtilAmt = 0;
        });

        // const lastInst = installments[num - 1];
        // lastInst.u_AmtBeforeTax += amtRemainder;
        // lastInst.u_Tax += taxRemainder;
        // lastInst.u_AmtAfterTax = lastInst.u_AmtBeforeTax + lastInst.u_Tax;
    }

    // Utilities / OT / Based On Plan
    const allUtilities = (agreement.agreementItems ?? []).flatMap(item => item.agreementUtilities ?? []);
    allUtilities.forEach(u => {
        const totalUtil = Math.round(Number(u.u_TotAfterTax) || 0);
        if ((u.u_Occurance === 'One Time' || u.u_Occurance === 'OT') && installments.length) {
            installments[0].u_UtilAmt += totalUtil;
            installments[0].u_AmtAfterTax += totalUtil;
        } else if (u.u_Occurance === 'Based On Plan' && installments.length) {
            const baseUtil = Math.floor(totalUtil / num);
            const utilRemainder = totalUtil - baseUtil * num;
            installments.forEach(inst => {
                inst.u_UtilAmt += baseUtil;
                inst.u_AmtAfterTax += baseUtil;
            });
            installments[num - 1].u_UtilAmt += utilRemainder;
            installments[num - 1].u_AmtAfterTax += utilRemainder;
        }
    });

    installments.forEach(inst => {
        //Commented below lined to keep the rounding/decimal places by Muhammad Maqbool 18-12-2025
        if (planOverride) {
            inst.u_AmtBeforeTax = inst.u_AmtBeforeTax;
            inst.u_Tax = inst.u_Tax;
            inst.u_UtilAmt = inst.u_UtilAmt;
            inst.u_AmtAfterTax = inst.u_AmtBeforeTax + inst.u_Tax + inst.u_UtilAmt;
        } else {
            inst.u_AmtBeforeTax = Math.round(inst.u_AmtBeforeTax);
            inst.u_Tax = Math.round(inst.u_Tax);
            inst.u_UtilAmt = Math.round(inst.u_UtilAmt);
            inst.u_AmtAfterTax = Math.round(inst.u_AmtBeforeTax + inst.u_Tax + inst.u_UtilAmt);
        }


    });
    
    const totalAfterTax = (isMaintenance ? 0 : totalBeforeTax + totalTaxAmount) + allUtilities.reduce((sum, u) => sum + Math.round(Number(u.u_TotAfterTax) || 0), 0);

    const roundedSum = installments.reduce((sum, i) => sum + i.u_AmtAfterTax, 0);
    const diff = Math.round(totalAfterTax - roundedSum);
    if (diff !== 0) installments[num - 1].u_AmtAfterTax += diff;

    const beforeTax = installments.reduce((sum, i) => sum + i.u_AmtBeforeTax, 0);
    const beforeTaxdiff = Math.round(totalBeforeTax - beforeTax);
    if (beforeTaxdiff !== 0) installments[num - 1].u_AmtBeforeTax += beforeTaxdiff;

    const Tax = installments.reduce((sum, i) => sum + i.u_Tax, 0);
    const totalTax = Math.round(totalTaxAmount - Tax);
    if (totalTax !== 0) installments[num - 1].u_Tax += totalTax;

    return installments;
}


