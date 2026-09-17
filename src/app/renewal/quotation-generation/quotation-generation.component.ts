import { AfterViewInit, Component, ElementRef, OnInit, Renderer2, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { SharedService } from '../../_services/shared.service';
import { DataTableDirective } from 'angular-datatables';
import { elementAt, Subject } from 'rxjs';
import { SharedHelper } from '../../_Helper/SharedHelper';
import { FormLabelHelper } from '../../_Helper/form-lable-helper';
import { PermissionsSharingService } from '../../_services/permissionsharing.service';
import { GenerateInstallmentsFromAgreement } from '../../shared-module/plan-generated';
import { EnumService } from '../../_services/enum.service';
import { InstallmentGeneratorService } from '../../shared-module/installment-generator.service';

@Component({
  selector: 'app-quotation-generation',
  templateUrl: './quotation-generation.component.html',
  styleUrls: ['./quotation-generation.component.css']
})
export class QuotationGenerationComponent implements OnInit, AfterViewInit {

  @ViewChild(DataTableDirective, { static: false })
  dtElement!: DataTableDirective;

  dtOptions: DataTables.Settings = {};
  dtTrigger: Subject<any> = new Subject();


  form: FormGroup;
  submitted: boolean = false;
  loading: boolean = false;
  isUpdate: boolean = false;
  RolesList: any;
  searchData = "";
  RecordCount: any;
  showForm: boolean = false;
  addBreadcrumb: boolean = false;
  showHidetable: boolean = true;
  baseUrl: any = '/RoleManagement/';
  p: any;
  CurrentUserInfo: any | { Id: number; UserCode: string; FullName: string; RoleName: string; RoleID: number; UserImage: string; };
  SAPSettingList: any;
  AllowedPermissions: any;
  datePickerConfig: any;
  bsInlineValue = new Date();
  LovsList: any;
  AgreementTypeListVlaues: any;
  AgreementList: any = [];
  GenericForma: { DateFormate: string; };
  currentStep: number = 1;
  totalSteps = 2;
  selectedAgreementForQuotation: any = [];
  SelectedAgreementForUpdate: any = {
    agreementItems: [
      {
        agreementItemFacilities: [],
        agreementUtilities: []
      }
    ]

  };
  activeTab: string = 'UnitDetail';
  UnitactiveTab: string = 'Facilities';
  InstallmentPlanListValues: any;
  RevenueConfigPlanListValues: any;
  TaxCodesList: any;
  ItemsListData: any;
  UtilityItemsList: any;
  PropertyItemsList: any;
  Calculation: string;
  Utility: any;
  TaxCode: any;
  UtilityRates: any;
  Occurance: any;
  UtilityRateTotal: any;
  UtilityTax: any;
  UtilityAmountAfterTax: any;
  UtilityList: any;
  Amount: string;
  Facility: any;
  Quantity: any;
  Rate: any;
  UnitFacilityName: any;
  FacilitiesMasterList: any;
  selectedItem: any = {};
  UtilityCalculation: any;
  SelectedAgreement: any = {};
  agreementUtilities: any;
  agreementItemFacilities: any;
  showFacilitiesAnaUtilities: boolean;
  calculatedDiff: any = 0;
  constructor(
    private formBuilder: FormBuilder,
    private toastr: ToastrService,
    private _service: SharedService,
    private _sharedHelper: SharedHelper,
    private labelHelper: FormLabelHelper,
    private el: ElementRef,
    private renderer: Renderer2,
    private _permService: PermissionsSharingService,
    private enumService: EnumService,
    private installmentGeneratorService: InstallmentGeneratorService
  ) {
    this.AllowedPermissions = this._permService.getPermissions();
    this.datePickerConfig = this._sharedHelper.getDateConfiguration();
    this.GenericForma = this._sharedHelper.getGenericFormate();
  }
  ngAfterViewInit(): void {
    this.dtTrigger.next(null);
    this.labelHelper.markRequiredFields(this.form, this.el, this.renderer);
  }

  rerender(): void {
    if (this.dtTrigger.closed) return;   // avoid ObjectUnsubscribedError
    this.dtElement.dtInstance?.then(dtInstance => {
      dtInstance.destroy();
      this.dtTrigger.next(null);
    });
  }

  ngOnDestroy(): void {
    this.dtTrigger.unsubscribe();
  }
  ngOnInit(): void {

    this.CurrentUserInfo = this._sharedHelper.getCurrentUserInfo();
    this.dtOptions = {
      pagingType: 'full_numbers',
      pageLength: 10,
      processing: true,
      ordering: true,
      scrollX: true,
      autoWidth: false
    };


    this.form = this.formBuilder.group({
      Id: [0],
      EndDate: [new Date(), Validators.required],
      AgreementType: ['']
    });
    this.enumService.getAgreementTypes().subscribe(types => {
      this.AgreementTypeListVlaues = types;
    });
    this.GetLovs();
    this.GetTaxCodes();
    this.GetItemMasterData();
    this.GetMasterData();
    this.GetAgreementByAgreementType();
  }
  getStepClass(step: number) {
    if (step < this.currentStep) {
      return 'completed';
    } else if (step === this.currentStep) {
      return 'active';
    } else {
      return 'pending';
    }
  }
  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      if (this.currentStep === 1) {
        // wait for Angular to put the DOM back, then re-init DataTable
        setTimeout(() => this.rerender());
      }
    }
  }

  nextStep() {

    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
      if (this.currentStep === 2) {
        this.selectedAgreementForQuotation = this.AgreementList
          .filter((item: any) => item.isSelected);
        if (this.selectedAgreementForQuotation.length === 0) {
          this.toastr.warning("Please select atleast one agreement for quotation!", "Warning");
          this.currentStep = 1;
        }
        // wait for DOM to render the table, then re-init
        setTimeout(() => this.rerender());
      }
    }
  }
  FindDateDifference(start1: any, end1: any): boolean {
    const start = new Date(start1);
    const end = new Date(end1);

    if (end <= start) {
      this.toastr.warning('Agreement End Date must be after Start Date.');
      return false;
    }
    return true;
  }

  get f() { return this.form.controls; }
  onSubmit() {

    this.submitted = true;
    if (this.form.invalid) {
      return;
    }
    this.loading = true;
    let agType = this.form.value.AgreementType;
    let agDate = this.form.value.EndDate;

    this.GetAgreementByAgreementType(agDate, agType);
  }
  UpdateCalculationInCaseOfRent(singleItem: any = null): void {

    let upData = this.SelectedAgreementForUpdate;

    const basedOn = upData.u_MonthDay;
    const start = new Date(upData.u_AgtSDate)
    const end = new Date(upData.u_AgtEDate)

    // ✅ Basic validation
    if (!basedOn || !start || !end || upData.agreementItems.length === 0) {
      this.calculatedDiff = null;
      return;
    }

    // ✅ Only run for Rent type agreements
    if (String(upData.u_AGType ?? '') !== '2') return;

    const s = new Date(start);
    const e = new Date(end);
    if (isNaN(s.getTime()) || isNaN(e.getTime()) || e < s) {
      this.calculatedDiff = null;
      return;
    }
    if (singleItem) {
      let unit = singleItem;
      const yearlyValue = Number(unit.u_UnitSize || 0) * Number(unit.u_PerSQMRate || 0);
      if (yearlyValue <= 0) return;
      unit.u_YearlyRent = yearlyValue;

      let calcDiff = 0;
      let newTotal = 0;

      // ✅ Step 1: Calculate total rent for date range
      if (basedOn === 'Daily') {
        calcDiff = this.dateDiffInDaysInclusive(s, e);
        const dailyRent = yearlyValue / 365;
        newTotal = dailyRent * calcDiff;
      } else if (basedOn === 'Monthly') {
        calcDiff = this.monthDiffInclusive(s, e);
        const monthlyRent = yearlyValue / 12;
        newTotal = monthlyRent * calcDiff;
      } else {
        this.calculatedDiff = null;
        return;
      }

      this.calculatedDiff = calcDiff;

      // ✅ Step 2: Apply discount
      const discountPercent = Number(unit.u_DiscPrc || 0);
      const discountAmount = parseFloat(((newTotal * discountPercent) / 100).toFixed(2));
      const afterDiscount = parseFloat((newTotal - discountAmount).toFixed(2));

      // ✅ Step 3: Apply tax
      const taxPercent = Number(unit.u_TaxPrc || 0);
      const taxAmount = parseFloat(((afterDiscount * taxPercent) / 100).toFixed(2));
      const totalAfterTax = parseFloat((afterDiscount + taxAmount).toFixed(2));

      // ✅ Step 4: Update Unit fields
      unit.u_Total = parseFloat(newTotal.toFixed(2));
      unit.u_DiscAmt = discountAmount;
      unit.u_TotAfterDisc = afterDiscount;
      unit.u_TaxAmt = taxAmount;
      unit.u_TotAfterTax = totalAfterTax;

      return unit;
    }
    this.SelectedAgreementForUpdate.agreementItems.forEach((unit: any) => {

      // const yearlyValue = Number(unit.u_Total || 0);
      const yearlyValue = Number(unit.u_UnitSize || 0) * Number(unit.u_PerSQMRate || 0);
      if (yearlyValue <= 0) return;

      let calcDiff = 0;
      let newTotal = 0;

      // ✅ Step 1: Calculate total rent for date range
      if (basedOn === 'Daily') {
        calcDiff = this.dateDiffInDaysInclusive(s, e);
        const dailyRent = yearlyValue / 365;
        newTotal = dailyRent * calcDiff;
      } else if (basedOn === 'Monthly') {
        calcDiff = this.monthDiffInclusive(s, e);
        const monthlyRent = yearlyValue / 12;
        newTotal = monthlyRent * calcDiff;
      } else {
        this.calculatedDiff = null;
        return;
      }

      this.calculatedDiff = calcDiff;

      // ✅ Step 2: Apply discount
      const discountPercent = Number(unit.u_DiscPrc || 0);
      const discountAmount = parseFloat(((newTotal * discountPercent) / 100).toFixed(2));
      const afterDiscount = parseFloat((newTotal - discountAmount).toFixed(2));

      // ✅ Step 3: Apply tax
      const taxPercent = Number(unit.u_TaxPrc || 0);
      const taxAmount = parseFloat(((afterDiscount * taxPercent) / 100).toFixed(2));
      const totalAfterTax = parseFloat((afterDiscount + taxAmount).toFixed(2));

      // ✅ Step 4: Update Unit fields
      unit.u_Total = parseFloat(newTotal.toFixed(2));
      unit.u_DiscAmt = discountAmount;
      unit.u_TotAfterDisc = afterDiscount;
      unit.u_TaxAmt = taxAmount;
      unit.u_TotAfterTax = totalAfterTax;

    });

    this.GeneratePlanFromAgreement();

  }
  /** Days difference, inclusive (01-01 -> 01-01 = 1 day) */
  private dateDiffInDaysInclusive(a: Date, b: Date): number {
    const oneDay = 1000 * 60 * 60 * 24;
    const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
    const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
    return Math.floor((utcB - utcA) / oneDay) + 1;
  }
  private monthDiffInclusive(a: Date, b: Date): number {
    const yearDiff = b.getFullYear() - a.getFullYear();
    const monthDiff = b.getMonth() - a.getMonth();
    let months = yearDiff * 12 + monthDiff;

    // Add one only if end day is *after* start day (not equal)
    if (b.getDate() > a.getDate()) {
      months += 1;
    }

    return months;
  }
  GeneratePlanFromAgreement() {

    console.log(JSON.stringify(this.SelectedAgreementForUpdate))
    const installments = GenerateInstallmentsFromAgreement(
      this.SelectedAgreementForUpdate,
    );
    const recog = GenerateInstallmentsFromAgreement(
      this.SelectedAgreementForUpdate,
      this.SelectedAgreementForUpdate.u_RevRecPlanID
    );

    this.SelectedAgreementForUpdate.agreementInstallments = installments;
    if (this.SelectedAgreementForUpdate.u_AGType != 5) { //in case of off plan no need to generate invoices
      this.SelectedAgreementForUpdate.agreementRevenuRecPlans = recog;
    } else {
      this.SelectedAgreementForUpdate.agreementRevenuRecPlans = []
    }
    this.UpdateItemsIntallments();
  }
  UpdateItemsIntallments() {

    //let Agrdata: any = this.SelectedAgreementForUpdate;
    const startDate = new Date(this.SelectedAgreementForUpdate.u_AgtSDate);

    const endDate = new Date(this.SelectedAgreementForUpdate.u_AgtEDate);
    const plan = this.SelectedAgreementForUpdate.u_InstPlanID;

    this.SelectedAgreementForUpdate.agreementItems.forEach((element: any) => {
      
      let instData = {
        U_TotAfterDisc: element.u_TotAfterDisc,
        U_TaxAmt: element.u_TaxAmt,
        U_TotAfterTax: element.u_TotAfterTax,
        U_TaxPrc: element.u_TaxPrc,
        U_AGID: 0,
        AgreementUtilities: element.agreementUtilities,

      }
      const installments = this.installmentGeneratorService.generateInstallmentsForUnit(
        instData,
        startDate,
        endDate,
        plan,
        'Installment '
      );

      element.agreementItemInstallments = installments.value;
    });
  }
  UpdateAgreement() {


    if (!this.validateAgreementDates()) return;

    const updated = this.SelectedAgreementForUpdate;
    // find the index of the agreement in the list with the same id
    const idx = this.selectedAgreementForQuotation
      .findIndex((a: any) => a.id === updated.id);  // or a.Id if that's your property
    console.log(updated.u_AgtSDate + '-' + updated.u_AgtEDate);
    if (idx !== -1) {
      // replace the old agreement with the updated one
      this.selectedAgreementForQuotation[idx] = { ...updated };
    }
    ($('#detailModal') as any).modal('hide');
  }
  validateAgreementDates(): boolean {
    const start = new Date(this.SelectedAgreementForUpdate.u_AgtSDate);
    const end = new Date(this.SelectedAgreementForUpdate.u_AgtEDate);

    if (end <= start) {
      this.toastr.warning('Agreement End Date must be after Start Date.');
      return false;
    }
    return true;
  }

  GetSAPSetting() {

    let url = '/MasterData/GetSAPConnectionSettings';
    this._service.Get(url).subscribe({
      next: result => {
        if (result.status) {
          this.SAPSettingList = result.data;
          this.rerender();
        }
      },
      error: (err: any) => { },
    });
  }
  clearForm() {
    this.submitted = false;
    this.isUpdate = false;
    this.form.reset();
    this.selectedAgreementForQuotation = [];
    this.SelectedAgreementForUpdate = [];
    this.AgreementList = [];
    this.currentStep = 1;

  }
  Update(data: any) {

    this.form.patchValue({
      Id: data.id,
      SapUserName: data.sapUserName,
      SapPassword: data.sapPassword,
      SapServerAddress: data.sapServerAddress,
      SapDbName: data.sapDbName,
      SapDbType: data.sapDbType,
      DbUserName: data.dbUserName,
      DbPassword: data.dbPassword,
      DbName: data.dbName,
      DbServerName: data.dbServerName,
      ServiceLayerUrl: data.serviceLayerUrl,
      CreatedBy: data.createdBy,
      UpdatedBy: data.updatedBy,
      CreatedDate: data.createdDate,
      UpdatedDate: data.updatedDate
    });
  }
  GetLovs() {

    let url = '/MasterData/GetLovs?Form=SaleAgreement';
    this._service.Get(url).subscribe({
      next: result => {
        if (result.status) {
          this.LovsList = result.data;
          //this.AgreementTypeListVlaues = result.data.filter((item: any) => item.field === 'AgreementType');
          this.InstallmentPlanListValues = result.data.filter((item: any) => item.field === 'Installment Plan');
          this.RevenueConfigPlanListValues = result.data.filter((item: any) => item.field === 'Revenue Recog Plan');
        }
      },
      error: (err: any) => { },
    });
  }
  GetTaxCodes() {

    let url = '/MasterData/GetTaxCodes';
    this._service.Get(url).subscribe({
      next: result => {
        if (result.status) {
          this.TaxCodesList = result.data;

        }
      },
      error: (err: any) => { },
    });
  }
  GetAgreementList(Id: any = 0, isDetail = false) {

    let url = '/Agreement/agreement?Id=' + Id;
    this._service.Get(url).subscribe({
      next: result => {
        if (result.status) {
          if (Id > 0) {

            if (Array.isArray(result.data)) {
              if (isDetail) {
                this.SelectedAgreement = result.data[0] ?? {};
                ($('#PreviousdetailModal') as any).modal('show');
                return;
              }
              this.SelectedAgreementForUpdate = result.data[0] ?? {};

              const [y, m, d] = this.SelectedAgreementForUpdate.u_AgtEDate
                .split('T')[0]
                .split('-')
                .map(Number);
              this.SelectedAgreementForUpdate.isUpdated = true;
              const now = new Date();
              const endDate = new Date(y, m - 1, d, now.getHours(), now.getMinutes(), now.getSeconds());
              //               const endDate = new Date(this.SelectedAgreementForUpdate.u_AgtEDate);

              // endDate.setHours(now.getHours(),now.getMinutes(),now.getSeconds());
              // ✅ Add 1 day
              endDate.setDate(endDate.getDate() + 1);

              this.SelectedAgreementForUpdate.u_AgtSDate = endDate;
              //this.SelectedAgreementForUpdate.u_AgtSDate = this.SelectedAgreementForUpdate.u_AgtEDate
              this.SelectedAgreementForUpdate.u_AgtEDate = null;
              this.showFacilitiesAnaUtilities = true;
              if (this.SelectedAgreementForUpdate.u_AGType === 2) {
                this.GetItemMasterData('Rent')
              } else
                if (this.SelectedAgreementForUpdate.u_AGType === 5) {
                  this.showFacilitiesAnaUtilities = false;
                  this.GetItemMasterData('OP-Sales')
                }

            }
            this.SelectedAgreementForUpdate.agreementItems.forEach((element: any) => {
              element.oldSQMValue = element.u_PerSQMRate;
              element.u_YearlyRent = Number(element.u_UnitSize || 0) * Number(element.u_PerSQMRate || 0);
            });

            // this.SelectedAgreementForUpdate.forEach((el: any) => {

            // });
            // this.SelectedAgreementForUpdate = result.data[0]
            ($('#detailModal') as any).modal('show');
          }
          this.AgreementList = result.data;

          this.rerender();
        }
      },
      error: (err: any) => { },
    });
  }
  PostUpdatedAgreements() {

    let url = '/Agreement/renewagreements';

    let postedData = this.selectedAgreementForQuotation
      .filter((ag: any) => ag.isSelectedQuotation);
    console.log(postedData);

    if (postedData.length === 0) {
      this.toastr.info("Please select atleast one record to update", "Info");
      return;
    }
    let dateCheck = '';
    const now = new Date();
    for (const a of postedData) {
      if (!a.isUpdated) {
        dateCheck = 'Agreement ' + a.u_DocNum + ' not updated';
        break;
      } else if (!a.u_AgtEDate) {
        dateCheck = 'Agreement ' + a.u_DocNum + ' has empty end date';
        break;
      } else if (!this.FindDateDifference(a.u_AgtSDate, a.u_AgtEDate)) {
        dateCheck = 'Agreement ' + a.u_DocNum + ' has start date greater than end';
        break;
      }
      //added time with date to avoide UTC conversion by Muhammad Maqbool 18-12-2025
      a.u_AgtEDate = this._sharedHelper.formatBootstrapDateOnly(a.u_AgtEDate)//new Date(a.u_AgtEDate.getFullYear(),a.u_AgtEDate.getMonth(),a.u_AgtEDate.getDate(),now.getHours(),now.getMinutes(),now.getSeconds());
      this.resetChildAgreementIds(a);
    }
    if (dateCheck) {
      this.toastr.warning(dateCheck, 'Warning');
      return;
    }
    this._service.Post(postedData, url).subscribe({
      next: (result: any) => {
        if (result.status) {
          this.clearForm();
          this.toastr.success(result.message, "Success", {
            progressBar: true,
            closeButton: true
          });
        } else {
          this.toastr.error(result.message, "Error", {
            progressBar: true,
            closeButton: true
          });
        }
      },
      error: (err: any) => {

      },
    });
  }
  loadAgreementDetails(data: any) {

    this.agreementUtilities = data.agreementUtilities || [];

    this.agreementItemFacilities = data.agreementItemFacilities || [];
    ($('#utilFacilModal') as any).modal('show');
  }
  masterSelected = false;
  /** Toggle all rows when header checkbox changes */
  toggleAll() {
    this.AgreementList.forEach((item: any) => item.isSelected = this.masterSelected);
  }
  /** When a row checkbox changes, update header checkbox state */
  checkIfAllSelected() {
    this.masterSelected = this.AgreementList.every((item: any) => item.isSelected);
  }
  GetAgreementByAgreementType(date: Date = new Date(), Id: any = 0) {

    // const agrEdate = date.toISOString();
    const d = date;
    const pad = (n: number) => n.toString().padStart(2, '0');
    const agrEdate =
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    const url = `/Agreement/agreementforrenewal?agrEdate=${agrEdate}&agrType=${Id}`;
    const sub = this._service.Get(url).subscribe({
      next: result => {
        if (result.status) {
          this.AgreementList = result.data;
          this.rerender()
        }
      },
      error: () => { }
    });

  }
  masterSelectedQuotation = false;
  // toggle all rows in second table
  toggleAllQuotation() {
    debugger
    this.selectedAgreementForQuotation
      .forEach((item: any) => item.isSelectedQuotation = this.masterSelectedQuotation);
    this.checkIfAllSelectedQuotation();
  }
  // check if every row is selected → update master checkbox state
  checkIfAllSelectedQuotation() {
    this.masterSelectedQuotation =
      this.selectedAgreementForQuotation.every((item: any) => item.isSelectedQuotation);

  }
  //#region  Generation Installment Plan For Selected Agreement
  switchTab(tabName: string, tabType: string) {
    if (tabType == 'header') {
      this.activeTab = tabName;
    } else {
      this.UnitactiveTab = tabName;
    }

  }
  //#endregion Generate Installment Plan for selected Agreement

  private recalcAgreementItem(item: any): void {

    item = this.UpdateCalculationInCaseOfRent(item);

    const total = +item.u_Total || 0;
    const discAmt = +item.u_DiscAmt || 0;
    const discPrc = +item.u_DiscPrc || 0;
    const taxPrc = +item.u_TaxPrc || 0;

    // --- keep last edited value authoritative ---
    if (item._lastEdited === 'prc') {
      item.u_DiscAmt = total * (discPrc / 100);
    }
    else if (item._lastEdited === 'amt') {
      item.u_DiscPrc = total === 0 ? 0 : (discAmt / total) * 100;
    }

    // --- after discount ---
    item.u_TotAfterDisc = total - (item.u_DiscAmt || 0);

    // --- tax amount & after tax ---
    item.u_TaxAmt = item.u_TotAfterDisc * (taxPrc / 100);
    item.u_TotAfterTax = item.u_TotAfterDisc + item.u_TaxAmt;

    // this.GeneratePlanFromAgreement()
  }
  onPerSQMRateChange(row: any) {

    //row.u_Total = (row.u_UnitSize || 1) * (row.u_PerSQMRate || 1);

    row.u_YearlyRent = (row.u_UnitSize || 1) * (row.u_PerSQMRate || 1);
    // then update all dependent fields
    this.recalcAgreementItem(row);
  }
  increasePercentage() {
    if (!this.SelectedAgreementForUpdate.u_AgtEDate) {
      this.toastr.warning("Please select agreement end date for calculations!", "Warning");
      this.SelectedAgreementForUpdate.U_IncPer = 0;
      return;
    }
    let per = this.SelectedAgreementForUpdate.U_IncPer;

    this.SelectedAgreementForUpdate.agreementItems.forEach((element: any) => {

      let dd = (per / 100) * element.oldSQMValue;
      element.u_PerSQMRate = dd + element.oldSQMValue;

      this.onPerSQMRateChange(element)
    });
  }
  onDiscPrcChange(row: any) {
    row._lastEdited = 'prc';
    this.recalcAgreementItem(row);
  }

  onDiscAmtChange(row: any) {
    row._lastEdited = 'amt';
    this.recalcAgreementItem(row);
  }

  onTaxCodeChange(row: any) {
    // if Tax % depends on selected code:
    const sel = this.TaxCodesList.find((t: any) => t.code === row.u_TaxCode);
    row.u_TaxPrc = sel ? sel.rate : 0;   // adjust property name if needed
    this.recalcAgreementItem(row);
  }
  resetChildAgreementIds(agreement: any): void {
    // top-level child-array property names that hold trnsAgreementId
    const childArrays = [
      'agreementItems',
      'agreementInstallments',
      'agreementRevenuRecPlans',
      'agreementAttachments'
    ];

    // reset header id
    agreement.u_RefAGId = agreement.id;
    agreement.id = 0;

    childArrays.forEach(arr => {
      if (Array.isArray(agreement[arr])) {
        agreement[arr].forEach((item: any) => {
          // reset trnsAgreementId on each child
          item.trnsAgreementId = 0;

          if (arr === 'agreementItems') {
            if (Array.isArray(item.agreementUtilities)) {
              item.agreementUtilities.forEach((util: any) => {
                util.agreementItemsId = 0;
              });
            }
            if (Array.isArray(item.agreementFacilities)) {
              item.agreementFacilities.forEach((fac: any) => {
                fac.agreementItemsId = 0;
              });
            }
          }
        });
      }
    });
  }

  addAgreementItem(afterIndex: number) {

    const blankRow: any = {
      u_UnitCode: '',
      projectName: '',
      buildingName: '',
      zoneName: '',
      subZoneName: '',
      u_UnitSize: 0,
      u_PerSQMRate: 0,
      u_Total: 0,
      u_DiscPrc: 0,
      u_DiscAmt: 0,
      u_TotAfterDisc: 0,
      u_TaxCode: '',
      u_TaxPrc: 0,
      u_TaxAmt: 0,
      u_TotAfterTax: 0,
      createdDate: new Date()
    };

    // insert a new row right after the current one
    this.SelectedAgreementForUpdate.agreementItems.splice(afterIndex + 1, 0, blankRow);
  }

  removeAgreementItem(index: number) {
    this.SelectedAgreementForUpdate.agreementItems.splice(index, 1);
  }

  GetItemMasterData(PropertyItemType = 'Sales') {

    let url = `/MasterData/GetItemMasterData?PropertyItem=Y&UtilityItem=Y&PropertyItemType=${PropertyItemType}&PropertyStatus=Available`;
    this._service.Get(url).subscribe({
      next: result => {
        if (result.status) {

          this.ItemsListData = result.data;
          this.UtilityItemsList = result.data.filter((item: any) => item.u_UtilityItem === 'Y');
          this.PropertyItemsList = result.data.filter((item: any) => item.u_PropertyItem === 'Y');


        }
      },
      error: (err: any) => { },
    });
  }
  onItemCodeChange(itemCode: string, row: any) {
    // find the selected item in your property list
    const exist = this.ItemsListData.find((m: any) => m.itemCode === itemCode);
    if (!exist) { return; }

    const taxsList = this.TaxCodesList.find((m: any) => m.code === exist.taxCode);
    const TotalAMount =
      this._sharedHelper.getFloat(exist.u_UnitSizeSQM, 0) *
      this._sharedHelper.getFloat(exist.salesPriceSQM, 0);

    // now assign the values directly to the row object
    row.projectName = exist.u_ProjectName;
    row.buildingName = exist.u_BuildingName;
    row.zoneName = exist.u_ZoneName;
    row.subZoneName = exist.u_SubZoneName;
    row.u_UnitSize = exist.u_UnitSizeSQM;
    row.u_PerSQMRate = exist.salesPriceSQM;
    row.u_Total = TotalAMount;
    row.u_TaxCode = exist.taxCode;
    row.u_TaxPrc = taxsList?.rate ?? 0;
    row.u_TaxAmt = row.u_TotAfterDisc
      ? row.u_TotAfterDisc * (row.u_TaxPrc / 100)
      : TotalAMount * (row.u_TaxPrc / 100);
    row.u_TotAfterTax = (row.u_TotAfterDisc || TotalAMount) + row.u_TaxAmt;

    // if you have other dependent calculations:
    this.onDiscPrcChange(row);
    // OR this.onPerSQMRateChange(row);
  }
  selectedUnitFacilities: any[] = [];
  selectedUnitUtilities: any[] = [];

  getSelectedItemsUtilFacilities(unit: any) {
    this.selectedItem = unit;
    ($('#UtilFacilitiesModal') as any).modal('show');
  }
  AddRemoveUtility(status: any, data: any) {

    if (status == 'add') {
      // if (!this.F_Occupation || !this.F_Relation) {
      //    this.toastr.warning("Please Select all fields !", "Warning");
      //   return;
      // }
      let Cal = 0;
      if (this.Calculation === 'Fixed') {
        Cal = 1;
      } else if (this.Calculation === 'By Unit Size(Per SQM)') {
        Cal = 2;
      }
      else if (this.Calculation === 'Metered (Per Unit)') {
        Cal = 3;
      }
      let UtilityInfo = {
        u_UtilItemCode: this.Utility,
        u_TaxCode: this.TaxCode,
        u_Calculation: Cal,
        CalculationName: this.Calculation,
        u_Rate: this.UtilityRates,
        u_Occurance: this.Occurance,
        u_Amount: this.UtilityRateTotal,
        u_TaxPrc: this.UtilityTax,
        u_TotAfterTax: this.UtilityAmountAfterTax
      }

      this.selectedItem.agreementUtilities.push(UtilityInfo);
    } else {
      this.selectedItem.agreementUtilities = this.selectedItem.agreementUtilities.filter((item: any) => item !== data)
    }
    //this.BusinessInformationList

    this.ClearUtilityForm();
  }
  ClearUtilityForm() {

    this.Utility = '';
    this.TaxCode = '';
    this.Calculation = '';
    this.UtilityRates = '';
    this.UtilityRates = '';
    this.Amount = '';

  }
  AddRemoveFacilty(status: any, data: any) {
    if (status == 'add') {
      // if (!this.F_Occupation || !this.F_Relation) {
      //    this.toastr.warning("Please Select all fields !", "Warning");
      //   return;
      // }
      let FacilityInfo = {
        u_FcltCode: this.Facility,
        u_Qty: this.Quantity,
        u_Rate: this.Rate,
        u_FacilityName: this.UnitFacilityName
      }

      this.selectedItem.agreementItemFacilities.push(FacilityInfo);
    } else {
      this.selectedItem.agreementItemFacilities = this.selectedItem.agreementItemFacilities.filter((item: any) => item !== data)
    }
    //this.BusinessInformationList
    this.ClearlgForm();
  }
  ClearlgForm() {

    this.Facility = '';
    this.Quantity = '';
    this.Rate = '';
  }
  GetMasterData() {

    let url = '/MasterData/GetMasterData?type=Facility';
    this._service.Get(url).subscribe({
      next: result => {
        if (result.status) {
          this.FacilitiesMasterList = result.data;
        }
      },
      error: (err: any) => { },
    });
  }
  onDropDownChange(data: any, ddType: any) {
    if (ddType === 'UtilityTaxCode') {
      let exist = this.TaxCodesList.find((m: any) => m.code == data);
      if (exist) {
        this.UtilityTax = exist.rate;
        const taxAmt = this.UtilityRateTotal * ((+ this.UtilityTax || 0) / 100);
        this.UtilityAmountAfterTax = this._sharedHelper.getFloat(this.UtilityRateTotal, 0) + this._sharedHelper.getFloat(taxAmt, 0);
      }
    }
    if (ddType === 'UtilityCalculation') {
      this.UtilityCalculation = data;
      this.updateUtilityTotal();
    }
  }
  private updateUtilityTotal(): void {
    const rate = Number(this.UtilityRates) || 0;

    if (this.UtilityCalculation === 'Fixed') {
      // ✅ total = rate itself
      this.UtilityRateTotal = rate;
    } else {
      // ✅ all other calculation types → multiply by 15
      let UnitSize = this.selectedItem.u_UnitSize
      this.UtilityRateTotal = rate * UnitSize;
    }

    const taxAmt = this.UtilityRateTotal * ((+ this.UtilityTax || 0) / 100);
    this.UtilityAmountAfterTax = this._sharedHelper.getFloat(this.UtilityRateTotal, 0) + this._sharedHelper.getFloat(taxAmt, 0);

  }
  onRateChange() {
    this.updateUtilityTotal();
  }
  UpdateFacilityUtility() {
    this.GeneratePlanFromAgreement();
    ($('#UtilFacilitiesModal') as any).modal('hide');
  }
  private updateTotals() {
    let f: any;

    const total = +f['U_Total'].value || 0;
    const discAmt = +f['U_DiscAmt'].value || 0;
    const discPrc = +f['U_DiscPrc'].value || 0;

    // --- recalc discount values if total changes ---
    // if user last edited percentage, keep it authoritative
    if (f['U_DiscPrc'].dirty && !f['U_DiscAmt'].dirty) {
      const amt = total * (discPrc / 100);
      f['U_DiscAmt'].setValue(amt, { emitEvent: false });
    }
    // if user last edited amount, keep it authoritative
    else if (f['U_DiscAmt'].dirty && !f['U_DiscPrc'].dirty) {
      const prc = total === 0 ? 0 : (discAmt / total) * 100;
      f['U_DiscPrc'].setValue(prc, { emitEvent: false });
    }

    // --- total after discount ---
    const afterDisc = total - (+f['U_DiscAmt'].value || 0);
    f['U_TotAfterDisc'].setValue(afterDisc, { emitEvent: false });

    // --- tax amount ---
    const taxAmt = afterDisc * ((+f['U_TaxPrc'].value || 0) / 100);
    f['U_TaxAmt'].setValue(taxAmt, { emitEvent: false });

    const totalAfterTax = afterDisc + taxAmt
    f['U_TotAfterTax'].setValue(totalAfterTax, { emitEvent: false });
  }

}