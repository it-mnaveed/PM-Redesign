import { Component, OnInit, ElementRef, Renderer2, AfterViewInit, DebugElement } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { SharedService } from '../../_services/shared.service';
import { FormLabelHelper } from '../../_Helper/form-lable-helper';
import { SharedHelper } from '../../_Helper/SharedHelper';
import { noWhitespaceValidator } from '../../_services/no-space-validator';
import { dateRangeValidator } from '../../_services/custom-validators.service';
import { combineLatest } from 'rxjs';
import { EnumService } from '../../_services/enum.service';
import { DatePipe, Location } from '@angular/common';
import { ConfigService } from '../../_services/LoadConfigFile';
import { InstallmentGeneratorService } from '../../shared-module/installment-generator.service';

@Component({
  selector: 'app-sale-agreement',
  templateUrl: './sale-agreement.component.html',
  styleUrls: ['./sale-agreement.component.css']
})
export class SaleAgreementComponent implements OnInit, AfterViewInit {
  form: FormGroup;
  UnitDetailform: FormGroup;
  submitted: boolean;
  unitSubmitted: boolean;
  loading: boolean;
  isUpdate: boolean;
  RolesList: any;
  searchData = "";
  RecordCount: any;
  showForm: boolean = false;
  addBreadcrumb: boolean = false;
  showHidetable: boolean = true;
  baseUrl: any = '/RoleManagement/';
  p: any;
  activeTab = 'General';
  BPList: any[] = [];
  datePickerConfig: any;
  bsInlineValue = new Date();
  CurrentUserInfo: any | { Id: number; UserCode: string; FullName: string; RoleName: string; RoleID: number; UserImage: string; };
  LovsList: any;
  InstallmentPlanListValues: any;
  RevenueConfigPlanListValues: any;
  AttachmentTypeListValues: any;
  InstallmentList: any[] = [];
  AttachmentType: any;
  Description: any;
  FileURL: any;
  AttachmentsList: any = [];
  ItemsListData: any;
  UtilityItemsList: any;
  selectedBuildingForDeteal: any = []
  UnitDetailList: any = []
  UnitList: any = [];
  UnitactiveTab: string = 'UnitDetail';
  FacilitiesMasterList: any;
  editIndex: any = null;
  SeriesList: any;
  AgreementTypeListVlaues: any;
  TaxCodesList: any;
  TotalUnitAmount: any;
  GenericForma: any = {};
  UtilityFacilityList: any;
  Facility: string;
  Quantity: string;
  Rate: string;
  FacilityList: any = [];
  UtilityList: any = [];
  Utility: any;
  TaxCode: any;
  Calculation: any;
  UtilityRates: any;
  UtilityRateTotal: any;
  UtilityTax: any;
  UtilityAmountAfterTax: any;
  Occurance: any;
  Amount: any;
  typecheck: any;
  TotalInstallments: number = 0;
  TotalRevConfigInvoice: number = 0;
  UtilityCalculation: any;
  PropertyItemsList: any;
  UnitFacilityName: any;
  calculatedDiff: number | null = null
  TotalSecurityAMount: any;
  UtilTaxName: any;
  u_UtilItemName: any;
  SelectedAgreementForUpdate: any;
  SeriesName: any;
  showUtilFacilities: boolean = true;
  UnitsDetailHeading: string = 'Unit Detail';
  UtilityTaxAmount: number;
  SalesPersonList: any;
  SelectedSPCommissionRate: any;
  SelectedItemMinPrice: any;
  SelectedItemMaxPrice: any;
  AcceptedFormisReadOnly: boolean = false; deleteAttachmentData: any;
  SAPSettingList: any;
  ;
  constructor(
    private formBuilder: FormBuilder,
    private toastr: ToastrService,
    private _service: SharedService,
    private labelHelper: FormLabelHelper,
    private el: ElementRef,
    private renderer: Renderer2,
    private _sharedHelper: SharedHelper,
    private enumService: EnumService,
    private location: Location,
    private configService: ConfigService,
    private datePipe: DatePipe,
    private installmentGeneratorService: InstallmentGeneratorService
  ) {
    this.datePickerConfig = this._sharedHelper.getDateConfiguration();
    this.GenericForma = this._sharedHelper.getGenericFormate();

  }
  switchTab(tabName: string, tabType: string) {
    if (tabType == 'header') {
      this.activeTab = tabName;
    } else {
      if (this.UnitactiveTab == 'UnitDetail') {
        this.labelHelper.markRequiredFields(this.UnitDetailform, this.el, this.renderer);
      }
      this.UnitactiveTab = tabName;
    }

  }
  get isCustomized(): boolean {
    return this.form.get('InstallmentPlan')?.value === 'Customized';
  }
  get RevisCustomized(): boolean {
    return this.form.get('RevenueRecognitionPlan')?.value === 'Customized';
  }
  ngAfterViewInit(): void {
    this.labelHelper.markRequiredFields(this.form, this.el, this.renderer);
    // if (history.state && history.state.forward) {
    //   this.GetAgreementList(history.state.forward.Id);
    // }
  }
  ngOnInit(): void {

    this.UnitsDetailHeading = 'Unit Detail';
    this.showUtilFacilities = true;
    this.CurrentUserInfo = this._sharedHelper.getCurrentUserInfo();
    this.enumService.getAgreementTypes().subscribe(types => {
      this.AgreementTypeListVlaues = types;

    });
    this.form = this.formBuilder.group({
      Id: [0],
      // Customer Info
      CustomerCode: ['', [Validators.required, Validators.maxLength(50)]],
      CustomerName: ['', [Validators.maxLength(200)]],
      AgreementType: [null, [Validators.required, Validators.maxLength(50)]],
      ContactPersonName: ['', [Validators.maxLength(200)]],
      SeriesName: ['', [Validators.maxLength(100), Validators.required]],
      CustRefNo: ['', [Validators.maxLength(100)]],
      Status: ['Draft', [Validators.maxLength(50)]],
      PostingDate: [null, Validators.required],

      U_AgtSDateH: [null],
      U_AgtEDateH: [null],
      // Agreement Details
      AgreementStartDate: [null, Validators.required],
      AgreementEndDate: [null, Validators.required],
      InstallmentPlan: ['', [Validators.maxLength(100), Validators.required]],
      RevenueRecognitionPlan: ['', [Validators.maxLength(100), Validators.required]],
      TotalAmount: [0],        //
      // Tax & Discount Details
      TaxCode: ['', [Validators.maxLength(50)]],
      SalesPerson: ['', [Validators.maxLength(200)]],
      CommissionRate: [null],
      CommissionAmount: [null],
      Notes: [''],
      // Audit Fields
      CreatedBy: [parseInt(this.CurrentUserInfo['Id'])],
      CreatedDate: [new Date()],
      UpdatedBy: [parseInt(this.CurrentUserInfo['Id'])],
      UpdatedDate: [new Date()],

      // Installments (as FormArray)
      AgreementInstallments: this.formBuilder.array([]),
      AgreementRevenuRecPlans: this.formBuilder.array([]),
      AgreementItems: [],
      u_AGStatus: [1],
      U_DocNum: [''],
      U_SecAmt: [null],
      U_DeliveryDate: [null],
      CalculationBasedOn: [''],
      U_RefAGId: [null],
      IsUnderProvision: [false],
      ApprovalStatus:['']
    },
      {
        validators: dateRangeValidator('AgreementStartDate', 'AgreementEndDate')
      }
    );
    // ['AgreementStartDate', 'AgreementEndDate'].forEach(ctrlName => {
    //   this.form.get(ctrlName)!.valueChanges.subscribe(() => {
    //     this.form.updateValueAndValidity({ onlySelf: false });
    //   });
    // });

    // this.form.setValidators([
    //   (group: AbstractControl) => {
    //     const arr = (group.get('AgreementInstallments') as FormArray).controls;
    //     const total = arr
    //       .map(c => Number(c.get('U_PrcUnit')?.value) || 0)
    //       .reduce((a, b) => a + b, 0);
    //     return total > 100 ? { totalPctExceeds: true } : null;
    //   }
    // ]);
    // this.form.setValidators([
    //   (group: AbstractControl) => {
    //     const arr = (group.get('AgreementRevenuRecPlans') as FormArray).controls;
    //     const total = arr
    //       .map(c => Number(c.get('U_PrcUnit')?.value) || 0)
    //       .reduce((a, b) => a + b, 0);

    //     return total > 100 ? { revTotalPctExceeds: true } : null;
    //   }
    // ]);
    this.form.setValidators([
      dateRangeValidator('AgreementStartDate', 'AgreementEndDate'),
      // (group: AbstractControl) => {
      //   const arr = (group.get('AgreementInstallments') as FormArray).controls;
      //   const total = arr
      //     .map(c => Number(c.get('U_PrcUnit')?.value) || 0)
      //     .reduce((a, b) => a + b, 0);

      //   const roundedTotal = Math.round(total * 100) / 100; 

      //   return roundedTotal > 100 ? { totalPctExceeds: true } : null;
      // },
      // (group: AbstractControl) => {
      //   const arr = (group.get('AgreementRevenuRecPlans') as FormArray).controls;
      //   const total = arr
      //     .map(c => Number(c.get('U_PrcUnit')?.value) || 0)
      //     .reduce((a, b) => a + b, 0);

      //   const roundedTotal = Math.round(total * 100) / 100;

      //   return roundedTotal > 100 ? { revTotalPctExceeds: true } : null;
      // }
    ]);
    this.UnitDetailform = this.formBuilder.group({
      Id: [0],
      TrnsAgreementId: [null],
      U_AGID: [null],
      Name: ['', [Validators.maxLength(100), Validators.required]],
      U_UnitCode: ['', [Validators.maxLength(50), Validators.required]],
      U_PrjID: [null],
      U_BldID: [null],
      U_SecID: [null],
      U_SubSecID: [null],
      U_UnitSize: ["", [Validators.maxLength(20)]],
      U_PerSQMRate: [null],
      U_Total: [null],
      U_DiscPrc: [null],
      U_DiscAmt: [null],
      U_TotAfterDisc: [null],
      U_TaxPrc: [null],
      U_TaxAmt: [null],
      U_TotAfterTax: [null],
      CreatedBy: [parseInt(this.CurrentUserInfo.Id)],
      CreatedDate: [new Date()],
      UpdatedBy: [parseInt(this.CurrentUserInfo.Id)],
      UpdatedDate: [new Date()],
      U_SubZoneName: [''],
      U_TaxCode: [''],
      U_ProjectName: [''],
      U_BuildingName: [''],
      U_ZoneName: [''],
      totalRentPerYear: [null],
      U_SecAmt: [null],
      AgreementUtilities: [''],
      AgreementItemFacilities: [],
      AgreementItemInstallments: []

    });

    const f = this.UnitDetailform.controls;

    f['U_PerSQMRate'].valueChanges.subscribe(a => {
      if (a == null) return;
      const p = (f['U_UnitSize'].value || 1) * (f['U_PerSQMRate'].value || 1);
      f['U_Total'].setValue(p, { emitEvent: false });
      f['totalRentPerYear'].setValue(p, { emitEvent: false });
      this.updateTotals();
      this.triggerRecalc();
    });

    f['U_Total'].valueChanges.subscribe(() => {
      this.updateTotals();
    });

    f['U_DiscPrc'].valueChanges.subscribe(p => {
      if (p == null) return;
      const amt = (f['U_Total'].value || 0) * (+p / 100);
      f['U_DiscAmt'].setValue(amt, { emitEvent: false });
      this.updateTotals();
    });

    // when user types Discount Amount
    f['U_DiscAmt'].valueChanges.subscribe(a => {
      if (a == null) return;
      const p = (+a / (f['U_Total'].value || 1)) * 100;
      f['U_DiscPrc'].setValue(p, { emitEvent: false });
      this.updateTotals();
    });

    // when user types Tax %
    f['U_TaxPrc'].valueChanges.subscribe(_ => this.updateTotals());

    this.form.controls['AgreementStartDate'].valueChanges.subscribe(() => {
      this.GenerateInstallments();
      this.GenerateRevenueConfig();
    });
    this.form.controls['AgreementEndDate'].valueChanges.subscribe(() => {
      this.GenerateInstallments();
      this.GenerateRevenueConfig();
    });


    const controls = this.form.controls;
    const trigger$ = combineLatest([
      controls['CalculationBasedOn'].valueChanges,
      controls['AgreementStartDate'].valueChanges,
      controls['AgreementEndDate'].valueChanges
    ]);

    trigger$.subscribe(([basedOn, start, end]) => {
      this.updateCalculatedDiff(basedOn, start, end);
      this.UpdateCalculationInCaseOfRent();
    });
    this.form.get('CalculationBasedOn')?.valueChanges
      .subscribe(() => this.triggerRecalc());
    this.form.get('AgreementStartDate')?.valueChanges
      .subscribe(() => this.triggerRecalc());
    this.form.get('AgreementEndDate')?.valueChanges
      .subscribe(() => this.triggerRecalc());
    // this.form.controls['TotalAmount'].valueChanges.subscribe(() => {
    //   this.GenerateInstallments();
    //   this.GenerateRevenueConfig();
    // });

    // this.form.controls['TotalInvoices'].valueChanges.subscribe(() => {
    //   this.GenerateRevenueConfig();
    // });
    this.GetLovs();
    this.GetItemMasterData();
    this.GetMasterData();
    this.GetTaxCodes();
    this.GetSAPSetting();
  }
  private updateTotals() {
    //this.UpdateCalculationInCaseOfRent();
    const f = this.UnitDetailform.controls;

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


  get AgreementInstallments(): FormArray {
    return this.form.get('AgreementInstallments') as FormArray;
  }
  get AgreementRevenuRecPlans(): FormArray {
    return this.form.get('AgreementRevenuRecPlans') as FormArray;
  }

  createAttachment(): FormGroup {
    return this.formBuilder.group({
      U_DType: ['', Validators.required],   // Attachment Type
      Name: ['', Validators.required],      // Description
      U_AttName: [null, Validators.required] // File Name or File object
    });
  }
  get f() { return this.form.controls; }
  get un() { return this.UnitDetailform.controls; }

  onSubmit() {

    this.submitted = true;
    this.form.updateValueAndValidity({ onlySelf: false });
    if (this.form.invalid) {
      let wrong = this._sharedHelper.findInvalidControls(this.form);
      let errorMessage = 'Please fill out the following fields: ' + wrong.join(', ');
      return;
    }
    this.loading = true;

    this.form.controls['AgreementItems'].setValue(this.UnitList)

    this.form.get('RevenueRecognitionPlan')?.enable();
    this.form.get('InstallmentPlan')?.enable();

    let formValue = this.form.value;
    if (!formValue.AgreementItems.length || formValue.AgreementItems.length === 0) {
      this.toastr.warning("Please add atleast one unit in agreement!", "Warning");
      return;
    }

    if (formValue.Id > 0) {
      if (formValue.u_AGStatus === 3) {
        this.form.enable();
      }
    }

    
    let PostedData = {
      Id: formValue.Id,
      Name: formValue.CustomerName, // if you want to send CustomerName as Name
      U_Seriese: String(formValue.SeriesName ?? ''),
      U_DocNum: String(formValue.U_DocNum ?? ''),
      U_PostDate: this._sharedHelper.formatBootstrapDateOnly(formValue.PostingDate),
      U_AgtSDateH: this._sharedHelper.formatBootstrapDateOnly(formValue.U_AgtSDateH),
      U_AgtEDateH: this._sharedHelper.formatBootstrapDateOnly(formValue.U_AgtEDateH),

      U_MonthDay: formValue.CalculationBasedOn,
      // Customer Info
      U_BPCode: formValue.CustomerCode,
      U_CPName: formValue.ContactPersonName,
      U_CustRefNo: formValue.CustRefNo,
      U_UnitCode: '', // comes from unit details, leave empty if not in this form

      // Agreement Dates
      U_AgtSDate: this._sharedHelper.formatBootstrapDateOnly(formValue.AgreementStartDate),
      U_AgtEDate: this._sharedHelper.formatBootstrapDateOnly(formValue.AgreementEndDate),
      // U_AgtSDateH: '', // if you calculate Hijri date
      // U_AgtEDateH: '',

      // Plans
      U_InstPlanID: formValue.InstallmentPlan,
      U_RevRecPlanID: formValue.RevenueRecognitionPlan,
      U_TotNoInst: this.TotalInstallments,
      U_TotNoInv: this.TotalRevConfigInvoice,

      // Salesperson / Commission
      U_SPName: String(formValue.SalesPerson ?? ''),
      U_CommPrc: formValue.CommissionRate === '' ? null : formValue.CommissionRate,
      U_CommAmt: formValue.CommissionAmount === '' ? null : formValue.CommissionAmount,
      U_SecAmt: formValue.U_SecAmt,

      // Agreement Meta
      U_AGType: formValue.AgreementType,
      U_AGStatus: formValue.u_AGStatus,// formValue.Status,

      // Posting Info
      U_PostedBy: '',
      U_PostingDate: this._sharedHelper.formatBootstrapDateOnly(formValue.PostingDate),
      U_ApprovedBy: '',
      U_ApprovalDate: new Date(),
      U_DeliveryDate: this._sharedHelper.formatBootstrapDateOnly(formValue.U_DeliveryDate),
      // Tax
      U_TaxCode: formValue.TaxCode,
      U_CommAP: '',
      U_SecJE: '',
      U_RetJE: '',


      // Additional
      U_UnitDetailID: null,
      U_Notes: formValue.Notes,
      U_Adj: null,
      U_chkLeapYear: null,
      U_MonthDayVal: String(this.calculatedDiff ?? ''),

      // Audit Fields
      CreatedBy: formValue.CreatedBy,
      CreatedDate: formValue.CreatedDate,
      UpdatedBy: formValue.UpdatedBy,
      UpdatedDate: formValue.UpdatedDate,

      U_RefAGId: formValue.U_RefAGId,
      IsUnderProvision: formValue.IsUnderProvision,
      ApprovalStatus:formValue.ApprovalStatus,
      // Child Collections
      AgreementInstallments: formValue.AgreementInstallments,
      AgreementRevenuRecPlans: formValue.AgreementRevenuRecPlans,
      AgreementItems: formValue.AgreementItems,
      AgreementAttachments: this.AttachmentsList
    };

    PostedData.AgreementInstallments = PostedData.AgreementInstallments.map((x: any) => ({
      ...x,
      //U_GDate: x.U_GDate ? new Date(this.formatDateToISO(x.U_GDate)) : null
      U_GDate: x.U_GDate ? this._sharedHelper.formatBootstrapDateOnly(x.U_GDate) : null
    }));
    PostedData.AgreementRevenuRecPlans = PostedData.AgreementRevenuRecPlans.map((x: any) => ({
      ...x,
      //  U_GDate: x.U_GDate ? new Date(this.formatDateToISO(x.U_GDate)) : null
      U_GDate: x.U_GDate ? this._sharedHelper.formatBootstrapDateOnly(x.U_GDate) : null
    }));
    
    if (formValue.InstallmentPlan == "Customized") {

      const itemsBeforeTax = formValue.AgreementItems
        ?.reduce((s: number, i: any) => s + Number(i.U_TotAfterDisc || 0), 0) || 0;
      const instBeforeTax = formValue.AgreementInstallments
        ?.reduce((s: number, i: any) => s + Number(i.U_AmtBeforeTax || 0), 0) || 0;

      if (instBeforeTax > itemsBeforeTax) {
        this.toastr.warning("Installment before tax amount should not be exceed to units total before tax", "Warning");
        return;
      }
      const itemsTax = formValue.AgreementItems
        ?.reduce((s: number, i: any) => s + Number(i.U_TaxAmt || 0), 0) || 0;

      const instTax = formValue.AgreementInstallments
        ?.reduce((s: number, i: any) => s + Number(i.U_Tax || 0), 0) || 0;

      if (instTax > itemsTax) {
        this.toastr.warning("Installment tax amount should not be exceed to units total tax", "Warning");
        return;
      }

      PostedData.AgreementItems = this.installmentGeneratorService.GenerateItemsCustomizePlan(
        PostedData.AgreementInstallments,
        PostedData.AgreementItems
      );
    }
    
    console.log('UpdatedData', JSON.stringify(PostedData))
    let url = '/Agreement/postagreement';
    this._service.Post(PostedData, url).subscribe({
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
          this.form.get('RevenueRecognitionPlan')?.disable();
        }
      },
      error: (err: any) => {

      },
    });
  }
  GetDocSeries(agId: any) {
    let url = `/MasterData/GetDocSeries?agrmntId=${agId}&docType=1`;
    this._service.Get(url).subscribe({
      next: result => {
        if (result.status) {
          this.SeriesList = result.data;
        } else {

          this.toastr.error(result.message, "Error", {
            progressBar: true,
            closeButton: true
          });
        }
      },
      error: (err: any) => { },
    });
  }
  GetLovs() {
    let url = '/MasterData/GetLovs?Form=SaleAgreement';
    this._service.Get(url).subscribe({
      next: result => {
        if (result.status) {
          this.LovsList = result.data;
          this.InstallmentPlanListValues = result.data.filter((item: any) => item.field === 'Installment Plan');
          this.RevenueConfigPlanListValues = result.data.filter((item: any) => item.field === 'Revenue Recog Plan');
          this.AttachmentTypeListValues = result.data.filter((item: any) => item.field === 'AttachmentType');
          // this.AgreementTypeListVlaues = result.data.filter((item: any) => item.field === 'AgreementType');
          // this.GLCodeURList = result.data.filter((item: any) => item.fatherNum === 'L10108');
          // this.GLCodeRebateList = result.data.filter((item: any) => item.fatherNum === 'R20201');

        } else {

          this.toastr.error(result.message, "Error", {
            progressBar: true,
            closeButton: true
          });
        }
      },
      error: (err: any) => { },
    });
  }
  // formatDateToISO(dateStr: string): string {
  //   const [day, month, year] = dateStr.split('-');
  //   return `${year}-${month}-${day}T00:00:00Z`;
  // }
  formatDateToISO(dateStr: any): string {
    if (!dateStr) return '';

    if (dateStr instanceof Date) {
      // Return ISO without timezone (local date only)
      return dateStr.toISOString().split('T')[0] + 'T00:00:00';
    }

    if (typeof dateStr !== 'string') {
      dateStr = String(dateStr);
    }

    const [day, month, year] = dateStr.split('-');
    if (!day || !month || !year) {
      console.warn('Invalid date format:', dateStr);
      return '';
    }

    // Build local ISO-like date (without UTC shift)
    return `${year}-${month}-${day}T00:00:00`;
  }


  clearForm() {
    this.submitted = false;
    this.isUpdate = false;
    this.UnitList = [];
    this.AttachmentsList = [];
    this.AcceptedFormisReadOnly = false;
    this.form.reset();
    this.UnitDetailform.reset();
    this.form.patchValue({
      Id: 0,
      CreatedBy: parseInt(this.CurrentUserInfo['Id']),
      CreatedDate: new Date(),
      UpdatedBy: parseInt(this.CurrentUserInfo['Id']),
      UpdatedDate: new Date(),
      Status: 'Draft',
      u_AGStatus: [1],
      CustRefNo: ''
    });
  }
  Update(data: any) {

    this.isUpdate = true;
    this.form.controls['Id'].setValue(data['id']);
    this.form.controls['RoleName'].setValue(data['roleName']);
    this.form.controls['Description'].setValue(data['description']);
    this.form.controls['CreatedBy'].setValue(data['createdBy']);
  }
  onBPChange(event: any) {

    let exist = this.BPList.find((m: any) => m.cardCode == event);

    if (exist) {
      this.form.patchValue({
        CustomerName: exist.cardName,
        ContactPersonName: exist.contactPersonName,
        //SeriesName: exist.seriesName
      });
    }
  }

  GetBusinessPartner($event: any = '') {

    let d = $event.term;
    if (d.length < 2) {
      return;
    }
    this.BPList = [];
    let url = '/MasterData/GetBusinessPartnerMasterData?CardCode=' + d;
    this._service.Get(url).subscribe({
      next: result => {
        if (result.status) {
          this.BPList = result.data;

        } else {

          this.toastr.error(result.message, "Error", {
            progressBar: true,
            closeButton: true
          });
        }
      },
      error: (err: any) => { },
    });
  }
  GetSalesPersons($event: any = '') {

    let d = $event.term;
    if (d.length < 2) {
      return;
    }
    this.SalesPersonList = [];
    let url = '/MasterData/GetSalesPerson?Param=' + d;
    this._service.Get(url).subscribe({
      next: result => {
        if (result.status) {
          this.SalesPersonList = result.data;

        } else {

          this.toastr.error(result.message, "Error", {
            progressBar: true,
            closeButton: true
          });
        }
      },
      error: (err: any) => { },
    });
  }
  onSalesPersonChange(event: any) {

    let exist = this.SalesPersonList.find((m: any) => m.slpCode == event);

    if (exist) {
      this.SelectedSPCommissionRate = exist.commission;
      this.form.patchValue({
        CommissionRate: exist.commission,
        CommissionAmount: this.CalculateCommissionAmount(exist.commission)
        //SeriesName: exist.seriesName
      });
    }
  }
  CalculateCommissionAmount(percentage: any) {
    let CommisionAmount = (percentage / 100) * this.TotalUnitAmount;
    return CommisionAmount
  }


  removeInstallmentRow(index: number): void {
    this.AgreementInstallments.removeAt(index);

    // re-index InstallmentNo if you keep a sequence number
    this.AgreementInstallments.controls.forEach((ctrl, i) =>
      ctrl.patchValue({ U_InstallmentNo: i + 1 })
    );
  }

  // optional helper to remove only the last row
  removeLastInstallmentRow(): void {
    if (this.AgreementInstallments.length > 0) {
      this.removeInstallmentRow(this.AgreementInstallments.length - 1);
    }
  }

  GenerateInstallments() {
    
    const startDate = new Date(this.form.controls['AgreementStartDate'].value);
    const endDate = new Date(this.form.controls['AgreementEndDate'].value);
    const plan = this.form.controls['InstallmentPlan'].value;


    let totalAmount = this.TotalUnitAmount;
    const AgType = this.form.controls['AgreementType'].value;

    if (AgType === 5 || AgType === '5') return; //In case of off plan no installment required


    if (AgType === 3 || AgType === '3') {
      totalAmount = 0;
    }

    if (!startDate || !endDate || !plan || totalAmount == null) {
      this.AgreementInstallments.clear();
      return;
    }

    const totalBeforeTax = this.UnitList?.reduce((sum: any, u: any) => sum + (Number(u.U_TotAfterDisc) || 0), 0) || 0;
    const totalTax = this.UnitList?.reduce((sum: any, u: any) => sum + (Number(u.U_TaxAmt) || 0), 0) || 0;
    const totalAfterTax = totalBeforeTax + totalTax;

    if (!this.form.value.Id || this.form.value.Id === 0) {
      const installmentDates: Date[] = [];
      const totalMonths = this.monthDiff(startDate, endDate);

      if (plan === 'Customized') {
        this.AgreementInstallments.clear();
        this.AgreementInstallments.push(this.createCustomInstallment(1, 100));
        this.TotalInstallments = this.AgreementInstallments.length;
        this.applyUtilitiesToInstallments();

        return;
      }

      // ------------------- Month Days (New) -------------------
      if (plan === 'Month Days') {

        this.AgreementInstallments.clear();

        const start = new Date(startDate);
        const end = new Date(endDate);

        const months: { dueDate: Date; days: number }[] = [];
        const current = new Date(start.getFullYear(), start.getMonth(), 1);

        while (current <= end) {
          const year = current.getFullYear();
          const month = current.getMonth();

          const monthStart = new Date(year, month, 1);
          const monthEnd = new Date(year, month + 1, 0);

          let daysInMonth = monthEnd.getDate();
          let days = daysInMonth;

          // First month (partial)
          if (year === start.getFullYear() && month === start.getMonth()) {
            days = monthEnd.getDate() - start.getDate() + 1;
          }

          // Last month (partial)
          if (year === end.getFullYear() && month === end.getMonth()) {
            days = end.getDate();
          }

          months.push({
            dueDate: monthStart,
            days
          });

          current.setMonth(current.getMonth() + 1);
        }

        const totalDays = months.reduce((sum, m) => sum + m.days, 0);

        let index = 1;
        let runningBefore = 0;
        let runningTax = 0;

        months.forEach((m, i) => {
          // weighted allocation based on days
          let beforeTax = (totalBeforeTax * m.days) / totalDays;
          let tax = (totalTax * m.days) / totalDays;

          beforeTax = parseFloat(beforeTax.toFixed(2));
          tax = parseFloat(tax.toFixed(2));

          // adjust last row for rounding
          if (i === months.length - 1) {
            beforeTax = parseFloat((totalBeforeTax - runningBefore).toFixed(2));
            tax = parseFloat((totalTax - runningTax).toFixed(2));
          }

          runningBefore += beforeTax;
          runningTax += tax;

          const afterTax = parseFloat((beforeTax + tax).toFixed(2));
          this.pushInstallmentRow(m.dueDate, beforeTax, tax, afterTax, index++, totalBeforeTax);
        });

        this.TotalRevConfigInvoice = this.AgreementRevenuRecPlans.length;
        this.applyUtilitiesToInstallments();
        this.UpdateItemsIntallments();
        this.TotalInstallments = this.AgreementInstallments.length;
        return;
      }
      // -------------------------------------------------------

      // Determine installment dates for non Month-Days plans
      switch (plan) {
        case 'Annually':
          this.pushDatesByMonths(installmentDates, startDate, endDate, 12);
          break;
        case 'Semi-Annually':
        case 'Semi-Annual':
          this.pushDatesByMonths(installmentDates, startDate, endDate, 6);
          break;
        case 'Quarterly':
          this.pushDatesByMonths(installmentDates, startDate, endDate, 3);
          break;
        case 'One Time':
          installmentDates.push(startDate);
          break;
        default:
          this.pushDatesByMonths(installmentDates, startDate, endDate, 1);
      }

      this.AgreementInstallments.clear();

      const perBeforeTax = parseFloat((totalBeforeTax / installmentDates.length).toFixed(2));
      const perTax = parseFloat((totalTax / installmentDates.length).toFixed(2));
      const perAfterTax = parseFloat((perBeforeTax + perTax).toFixed(2));

      installmentDates.forEach((dueDate, i) => {
        const last = i === installmentDates.length - 1;
        const beforeTax = last
          ? parseFloat((totalBeforeTax - perBeforeTax * (installmentDates.length - 1)).toFixed(2))
          : perBeforeTax;
        const tax = last
          ? parseFloat((totalTax - perTax * (installmentDates.length - 1)).toFixed(2))
          : perTax;
        const afterTax = beforeTax + tax;

        this.pushInstallmentRow(dueDate, beforeTax, tax, afterTax, i + 1, totalBeforeTax);
      });

      this.finalizePercentages('inst');
      this.applyUtilitiesToInstallments();
      this.triggerRecalc();
      this.UpdateItemsIntallments();
      this.TotalInstallments = this.AgreementInstallments.length;
      return;
    }

    // ---------- UPDATE MODE ----------
    if (plan === 'Customized') {
      this.GenerateCustomizeInstallmentInCaseOfUpdate();
      return;
    }
    const inst = this.AgreementInstallments;
    const profSentInstallments = inst.controls.filter(ctrl => {
      const group = ctrl as FormGroup;
      return group.get('U_ProfSent')?.value === 'Y';
    }) as FormGroup[];

    const profSentTotalBeforeTax = profSentInstallments.reduce((sum, grp) =>
      sum + Number(grp.get('U_AmtBeforeTax')?.value || 0), 0
    );

    const profSentTotalTax = profSentInstallments.reduce((sum, grp) =>
      sum + Number(grp.get('U_Tax')?.value || 0), 0
    );

    let remainingBeforeTax = totalBeforeTax - profSentTotalBeforeTax;
    let remainingTax = totalTax - profSentTotalTax;

    if (remainingBeforeTax < 0) remainingBeforeTax = 0;
    if (remainingTax < 0) remainingTax = 0;

    // Keep ProfSent rows as is
    this.AgreementInstallments.clear();
    profSentInstallments.forEach(ctrl => {
      const clone = this.formBuilder.group({ ...ctrl.value });
      (clone as any).__lockedProfSent = true;
      this.AgreementInstallments.push(clone);
    });

    // ------------------- Month Days (Update) -------------------
    if (plan === 'Month Days') {
      // build full months array (same as new)
      const months: { dueDate: Date; days: number }[] = [];
      const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
      while (current <= endDate) {
        const daysInMonth = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate();
        const dueDate = new Date(current.getFullYear(), current.getMonth(), 1);
        months.push({ dueDate, days: daysInMonth });
        current.setMonth(current.getMonth() + 1);
      }

      // alreadyCount = number of profSent rows kept above
      const alreadyCount = this.AgreementInstallments.length;
      // remaining months after the already kept installments
      const remainingMonths = months.slice(alreadyCount);

      if (remainingMonths.length > 0) {
        const totalDays = remainingMonths.reduce((sum, m) => sum + m.days, 0);
        let runningBefore = 0;
        let runningTax = 0;

        remainingMonths.forEach((m, i) => {
          let beforeTax = (remainingBeforeTax * m.days) / totalDays;
          let tax = (remainingTax * m.days) / totalDays;

          beforeTax = parseFloat(beforeTax.toFixed(2));
          tax = parseFloat(tax.toFixed(2));

          // last remaining month -> fix rounding
          if (i === remainingMonths.length - 1) {
            beforeTax = parseFloat((remainingBeforeTax - runningBefore).toFixed(2));
            tax = parseFloat((remainingTax - runningTax).toFixed(2));
          }

          runningBefore += beforeTax;
          runningTax += tax;

          const afterTax = parseFloat((beforeTax + tax).toFixed(2));
          this.pushInstallmentRow(m.dueDate, beforeTax, tax, afterTax, alreadyCount + i + 1, totalBeforeTax);
        });
      }

      this.finalizePercentages('inst');
      this.applyUtilitiesToInstallments();
      this.triggerRecalc();
      this.UpdateItemsIntallments();
      this.TotalInstallments = this.AgreementInstallments.length;
      return;
    }
    // ----------------------------------------------------------

    // Default handling for other plans
    const installmentDates: Date[] = [];
    switch (plan) {
      case 'Semi-Annually':
      case 'Semi-Annual':
        this.pushDatesByMonths(installmentDates, startDate, endDate, 6);
        break;
      case 'Quarterly':
        this.pushDatesByMonths(installmentDates, startDate, endDate, 3);
        break;
      case 'Annually':
        this.pushDatesByMonths(installmentDates, startDate, endDate, 12);
        break;
      case 'One Time':
        installmentDates.push(startDate);
        break;
      default:
        this.pushDatesByMonths(installmentDates, startDate, endDate, 1);
    }

    const alreadyCount = this.AgreementInstallments.length;
    const totalPlanCount = installmentDates.length;
    const newCount = Math.max(totalPlanCount - alreadyCount, 0);

    if (newCount > 0) {
      const perBeforeTax = parseFloat((remainingBeforeTax / newCount).toFixed(2));
      const perTax = parseFloat((remainingTax / newCount).toFixed(2));
      let totalPushedBefore = 0;
      let totalPushedTax = 0;
      const datesToUse = installmentDates.slice(-newCount);

      datesToUse.forEach((dueDate, i) => {
        let beforeTax = perBeforeTax;
        let tax = perTax;
        if (i === datesToUse.length - 1) {
          beforeTax = parseFloat((remainingBeforeTax - totalPushedBefore).toFixed(2));
          tax = parseFloat((remainingTax - totalPushedTax).toFixed(2));
        }
        totalPushedBefore += beforeTax;
        totalPushedTax += tax;
        const afterTax = beforeTax + tax;

        this.pushInstallmentRow(dueDate, beforeTax, tax, afterTax, alreadyCount + i + 1, totalBeforeTax);
      });
    }

    this.finalizePercentages('inst');
    this.applyUtilitiesToInstallments();
    this.triggerRecalc();
    this.TotalInstallments = this.AgreementInstallments.length;

    this.UpdateItemsIntallments();

  }
  UpdateItemsIntallments() {
    const startDate = new Date(this.form.controls['AgreementStartDate'].value);
    const endDate = new Date(this.form.controls['AgreementEndDate'].value);
    const plan = this.form.controls['InstallmentPlan'].value;
    this.UnitList.forEach((element: any) => {
      const installments = this.installmentGeneratorService.generateInstallmentsForUnit(
        element,
        startDate,
        endDate,
        plan,
        'Installment '
      );
      element.AgreementItemInstallments = installments.value;
    });
  }
  private pushInstallmentRow(
    dueDate: Date,
    amtBeforeTax: number,
    tax: number,
    amtAfterTax: number,
    index: number,
    totalBeforeTax: number
  ) {

    const percentage = totalBeforeTax > 0
      ? parseFloat(((amtBeforeTax / totalBeforeTax) * 100).toFixed(2))
      : 0;

    const formattedDate = this.datePipe.transform(dueDate, this.GenericForma.DateFormate);

    this.AgreementInstallments.push(
      this.formBuilder.group({
        Name: [`Installment ${index}`, Validators.required],
        U_AGID: [null],
        U_InstID: [index, Validators.required],
        U_GDate: [formattedDate, Validators.required],
        U_HDate: [''],
        U_AmtBeforeTax: [amtBeforeTax, [Validators.required]],
        U_Tax: [tax, [Validators.min(0)]],
        U_AmtAfterTax: [amtAfterTax, [Validators.required]],
        U_PrcUnit: [percentage, [Validators.min(0), Validators.max(100)]],
        U_AmtRcvd: [0.0, [Validators.min(0)]],
        U_ProfSent: ['N'],
        U_Lock: ['N'],
        U_Canceled: ['N'],
        U_UtilAmt: [0, [Validators.min(0)]],
        U_UtilDetail: ['']
      })
    );
  }

  private applyUtilitiesToInstallments(): void {
    // 🔹 STEP 1: Gather all active utilities
    const allUtilities = this.UnitList
      .filter((item: any) => item?.AgreementUtilities?.length)
      .flatMap((item: any) => item.AgreementUtilities)
      .filter((u: any) => Number(u.amountAfterTax) > 0);

    if (!allUtilities.length) return;

    const instArr = this.AgreementInstallments;
    if (!instArr?.length) return;

    const isUpdateMode = !!this.form.value.Id && this.form.value.Id > 0;
    const existingRows = instArr.controls.filter(c => c.get('U_ProfSent')?.value === 'Y');
    const newRows = instArr.controls.filter(c => c.get('U_ProfSent')?.value !== 'Y');
    if (!newRows.length) return;

    // 🔹 STEP 2: Group utilities by occurrence type
    const groupedUtils: Record<string, number> = allUtilities.reduce(
      (acc: Record<string, number>, u: any) => {
        const occ = (u.u_Occurance || '').trim();
        const amt = Number(u.amountAfterTax) || 0;
        acc[occ] = (acc[occ] || 0) + amt;
        return acc;
      },
      {}
    );

    // 🔹 STEP 3: Reset utilities in new installments
    newRows.forEach(ctrl => {
      const baseAmt = Number(ctrl.get('U_AmtBeforeTax')?.value || 0);
      const tax = Number(ctrl.get('U_Tax')?.value || 0);
      ctrl.patchValue(
        {
          U_UtilAmt: 0,
          U_AmtAfterTax: baseAmt + tax
        },
        { emitEvent: false }
      );
    });

    // 🔹 STEP 4: Compute total utility already applied (for One-Time only)
    const alreadyAppliedUtil = existingRows.reduce(
      (sum, r) => sum + Number(r.get('U_UtilAmt')?.value || 0),
      0
    );

    // 🔹 STEP 5: Apply grouped utilities
    (Object.entries(groupedUtils) as [string, number][]).forEach(([occurance, totalAmt]) => {
      let remainingAmt = Number(totalAmt);

      // Only subtract for One-Time utilities
      if (occurance === 'One Time' || occurance === 'OT') {
        remainingAmt = Math.max(remainingAmt - alreadyAppliedUtil, 0);
      }

      if (remainingAmt <= 0) return;

      if (occurance === 'One Time' || occurance === 'OT') {
        const firstNew = newRows[0];
        if (firstNew) {
          const currUtil = Number(firstNew.get('U_UtilAmt')?.value || 0);
          const currAmtAfterTax = Number(firstNew.get('U_AmtAfterTax')?.value || 0);
          firstNew.patchValue(
            {
              U_UtilAmt: currUtil + remainingAmt,
              U_AmtAfterTax: currAmtAfterTax + remainingAmt
            },
            { emitEvent: false }
          );
        }
      }

      // 🟢 CASE 2: Based-On-Plan utilities
      // New agreement → all installments
      // Update agreement → only new installments
      if (occurance === 'Based On Plan') {
        const targetRows = isUpdateMode ? newRows : instArr.controls;
        const count = targetRows.length;
        if (count > 0) {
          const perInstallment = Math.floor(remainingAmt / count);
          const remainder = remainingAmt - perInstallment * count;

          targetRows.forEach((ctrl, idx) => {
            const currUtil = Number(ctrl.get('U_UtilAmt')?.value || 0);
            const currAmtAfterTax = Number(ctrl.get('U_AmtAfterTax')?.value || 0);
            const extra = perInstallment + (idx === count - 1 ? remainder : 0);
            ctrl.patchValue(
              {
                U_UtilAmt: currUtil + extra,
                U_AmtAfterTax: currAmtAfterTax + extra
              },
              { emitEvent: false }
            );
          });
        }
      }
    });

    // 🔹 STEP 6: Rounding consistency
    let totalOriginal = 0;
    let totalRounded = 0;

    instArr.controls.forEach(ctrl => {
      const amt = Number(ctrl.get('U_AmtAfterTax')?.value || 0);
      const floored = Math.floor(amt);
      ctrl.patchValue({ U_AmtAfterTax: floored }, { emitEvent: false });
      totalOriginal += amt;
      totalRounded += floored;
    });

    const remainder = parseFloat((totalOriginal - totalRounded).toFixed(2));
    if (newRows.length > 0 && remainder !== 0) {
      const last = newRows[newRows.length - 1];
      const adjAmt = Number(last.get('U_AmtAfterTax')!.value) + remainder;
      last.get('U_AmtAfterTax')!.setValue(Math.round(adjAmt), { emitEvent: false });
    }
  }

  private finalizePercentages(instRev: any): void {

    let rows = this.AgreementInstallments.controls;
    if (instRev === 'RevConfig') {
      rows = this.AgreementRevenuRecPlans.controls;
    }
    if (!rows.length) return;
    this.TotalUnitAmount = this.UnitList.reduce((acc: number, item: any) =>
      acc + (Number(item.U_TotAfterDisc) || 0), 0);
    const totalAmount = this.TotalUnitAmount;
    const AgType = this.form.controls['AgreementType'].value;

    if (AgType === 3 || AgType === '3') {
      rows.forEach(r => {
        r.get('U_PrcUnit')!.setValue(0);
        r.get('U_AmtBeforeTax')!.setValue(0);
        r.get('U_Tax')!.setValue(0);
        r.get('U_AmtAfterTax')!.setValue(0);
      });
      return;
    }

    // If new agreement -> keep original behaviour: distribute evenly across all rows
    if (!this.form.value.Id || this.form.value.Id === 0) {

      const numRows = rows.length;
      const baseAmount = Math.floor(totalAmount / numRows);
      const remainder = parseFloat((totalAmount - baseAmount * numRows).toFixed(2));

      const taxList: number[] = [];
      const afterTaxList: number[] = [];
      let totalAfterTax = 0;

      for (let i = 0; i < numRows; i++) {

        let amtBeforeTax = baseAmount;
        if (i === numRows - 1) amtBeforeTax += remainder;
        amtBeforeTax = parseFloat(amtBeforeTax.toFixed(2));

        const taxRate = this.getTaxRateFromRow(rows[i]);
        const tax = parseFloat(((amtBeforeTax * taxRate) / 100).toFixed(2));
        const amtAfterTax = amtBeforeTax + tax;

        rows[i].get('U_AmtBeforeTax')!.setValue(amtBeforeTax);
        rows[i].get('U_Tax')!.setValue(tax);

        taxList.push(tax);
        afterTaxList.push(amtAfterTax);
        totalAfterTax += amtAfterTax;
      }

      const baseTaxList = taxList.map(t => Math.floor(t));
      const distributedTax = baseTaxList.reduce((a, b) => a + b, 0);
      const taxRemainder = parseFloat((taxList.reduce((a, b) => a + b, 0) - distributedTax).toFixed(2));

      for (let i = 0; i < numRows; i++) {
        let taxAmt = baseTaxList[i];
        if (i === numRows - 1) taxAmt += taxRemainder;
        rows[i].get('U_Tax')!.setValue(parseFloat(taxAmt.toFixed(2)));
      }

      const baseAfterTaxList = afterTaxList.map(amt => Math.floor(amt));
      const distributedAfterTax = baseAfterTaxList.reduce((a, b) => a + b, 0);
      const afterTaxRemainder = parseFloat((totalAfterTax - distributedAfterTax).toFixed(2));

      for (let i = 0; i < numRows; i++) {
        let amt = baseAfterTaxList[i];
        if (i === numRows - 1) amt += afterTaxRemainder;
        rows[i].get('U_AmtAfterTax')!.setValue(parseFloat(amt.toFixed(2)));
      }

      for (let i = 0; i < numRows; i++) {
        const amt = rows[i].get('U_AmtBeforeTax')!.value || 0;
        const pct = totalAmount > 0 ? parseFloat(((amt / totalAmount) * 100).toFixed(2)) : 0;
        rows[i].get('U_PrcUnit')!.setValue(pct);
      }

      let totalPct = rows.reduce((sum, r) => sum + (r.get('U_PrcUnit')!.value || 0), 0);
      const diff = parseFloat((100 - totalPct).toFixed(2));
      if (Math.abs(diff) >= 0.01) {
        const last = rows[numRows - 1];
        const corrected = parseFloat((last.get('U_PrcUnit')!.value + diff).toFixed(2));
        last.get('U_PrcUnit')!.setValue(corrected);
      }
      return;
    }

    // ---------- UPDATE MODE: distribute only across editable (non-ProfSent) rows ----------

    if (instRev === 'RevConfig') {

    }
    // const lockedRows = rows.filter(r => r.get('U_ProfSent')?.value === 'Y');
    // const editableRows = rows.filter(r => r.get('U_ProfSent')?.value !== 'Y');

    let lockedRows: FormGroup[] = [];
    let editableRows: FormGroup[] = [];

    if (instRev === 'RevConfig') {
      // For Revenue Config → lock rows based on U_Lock = 'Y'
      lockedRows = rows.filter(r => r.get('U_Lock')?.value === 'Y') as FormGroup[];
      editableRows = rows.filter(r => r.get('U_Lock')?.value !== 'Y') as FormGroup[];
    } else {
      // For Installments → lock rows based on U_ProfSent = 'Y'
      lockedRows = rows.filter(r => r.get('U_ProfSent')?.value === 'Y') as FormGroup[];
      editableRows = rows.filter(r => r.get('U_ProfSent')?.value !== 'Y') as FormGroup[];
    }


    const lockedTotal = lockedRows.reduce((sum, r) => sum + Number(r.get('U_AmtBeforeTax')?.value || 0), 0);
    const remainingTotal = Math.max(totalAmount - lockedTotal, 0);

    if (editableRows.length === 0) {
      // nothing to distribute; just recalc percentages so totals still add to 100
      rows.forEach(r => {

        const amt = r.get('U_AmtBeforeTax')?.value || 0;
        const pct = totalAmount > 0 ? parseFloat(((amt / totalAmount) * 100).toFixed(2)) : 0;
        r.get('U_PrcUnit')!.setValue(pct, { emitEvent: false });
      });
      // adjust final pct
      let totalPct = rows.reduce((sum, r) => sum + (r.get('U_PrcUnit')!.value || 0), 0);
      const diff = parseFloat((100 - totalPct).toFixed(2));
      if (Math.abs(diff) >= 0.01) {
        const last = rows[rows.length - 1];
        last.get('U_PrcUnit')!.setValue(parseFloat((last.get('U_PrcUnit')!.value + diff).toFixed(2)));
      }
      return;
    }

    const numRows = editableRows.length;
    const baseAmount = Math.floor(remainingTotal / numRows);
    const remainder = parseFloat((remainingTotal - baseAmount * numRows).toFixed(2));

    const taxList: number[] = [];
    const afterTaxList: number[] = [];
    let totalAfterTax = 0;

    for (let i = 0; i < numRows; i++) {

      let amtBeforeTax = baseAmount;
      if (i === numRows - 1) amtBeforeTax += remainder;
      amtBeforeTax = parseFloat(amtBeforeTax.toFixed(2));

      const taxRate = this.getTaxRateFromRow(editableRows[i]);
      const tax = parseFloat(((amtBeforeTax * taxRate) / 100).toFixed(2));
      const amtAfterTax = amtBeforeTax + tax;

      editableRows[i].get('U_AmtBeforeTax')!.setValue(amtBeforeTax, { emitEvent: false });
      editableRows[i].get('U_Tax')!.setValue(tax, { emitEvent: false });

      taxList.push(tax);
      afterTaxList.push(amtAfterTax);
      totalAfterTax += amtAfterTax;
    }

    const baseTaxList = taxList.map(t => Math.floor(t));
    const distributedTax = baseTaxList.reduce((a, b) => a + b, 0);
    const taxRemainder = parseFloat((taxList.reduce((a, b) => a + b, 0) - distributedTax).toFixed(2));

    for (let i = 0; i < numRows; i++) {
      let taxAmt = baseTaxList[i];
      if (i === numRows - 1) taxAmt += taxRemainder;
      editableRows[i].get('U_Tax')!.setValue(parseFloat(taxAmt.toFixed(2)), { emitEvent: false });
    }

    const baseAfterTaxList = afterTaxList.map(amt => Math.floor(amt));
    const distributedAfterTax = baseAfterTaxList.reduce((a, b) => a + b, 0);
    const afterTaxRemainder = parseFloat((totalAfterTax - distributedAfterTax).toFixed(2));

    for (let i = 0; i < numRows; i++) {
      let amt = baseAfterTaxList[i];
      if (i === numRows - 1) amt += afterTaxRemainder;
      editableRows[i].get('U_AmtAfterTax')!.setValue(parseFloat(amt.toFixed(2)), { emitEvent: false });
    }

    // recalc percentages for all rows (locked rows keep their amount)
    rows.forEach(r => {
      const amt = Number(r.get('U_AmtBeforeTax')!.value || 0);
      const pct = totalAmount > 0 ? parseFloat(((amt / totalAmount) * 100).toFixed(2)) : 0;
      r.get('U_PrcUnit')!.setValue(pct, { emitEvent: false });
    });

    let totalPct = rows.reduce((sum, r) => sum + (r.get('U_PrcUnit')!.value || 0), 0);
    const diffPct = parseFloat((100 - totalPct).toFixed(2));
    if (Math.abs(diffPct) >= 0.01) {
      const last = editableRows[editableRows.length - 1];
      last.get('U_PrcUnit')!.setValue(parseFloat((last.get('U_PrcUnit')!.value + diffPct).toFixed(2)), { emitEvent: false });
    }
  }
  // --- helper for accurate financial distribution ---
  private distributePrecisely(rows: any[], values: number[], field: string): void {
    const total = values.reduce((a, b) => a + b, 0);
    const rounded = values.map(v => parseFloat(v.toFixed(2)));
    let sumRounded = rounded.reduce((a, b) => a + b, 0);
    const diff = parseFloat((total - sumRounded).toFixed(2));
    if (rows.length > 0) {
      rounded[rounded.length - 1] = parseFloat((rounded[rounded.length - 1] + diff).toFixed(2));
    }
    for (let i = 0; i < rows.length; i++) {
      rows[i].get(field)!.setValue(rounded[i], { emitEvent: false });
    }
  }


  // helper: derive tax % from row
  private getTaxRateFromRow(row: any): number {
    const amtBeforeTax = parseFloat(row.get('U_AmtBeforeTax')?.value) || 0;
    const tax = parseFloat(row.get('U_Tax')?.value) || 0;
    if (amtBeforeTax === 0) return 0;
    return parseFloat(((tax / amtBeforeTax) * 100).toFixed(2));
  }


  // convenience getter
  applyUtil() {
    this.applyUtilitiesToInstallments()
  }

  addCustomRevenueRow(): void {

    const installments = this.form.get('AgreementRevenuRecPlans') as FormArray;

    // 🔎 total % already used
    const usedPct = installments.controls
      .map(c => Number(c.get('U_PrcUnit')?.value) || 0)
      .reduce((a, b) => a + b, 0);

    if (usedPct >= 100) {
      // 🚫 block if already at 100%
      this.toastr.warning('Total percentage cannot exceed 100%');
      return;
    }

    const nextIndex = installments.length + 1;
    const g = this.createRevenueRow(nextIndex, 0);
    installments.push(g);
    this.form.updateValueAndValidity({ onlySelf: false, emitEvent: true });
    this.applyUtilitiesToRevenue();
  }


  private createRevenueRow(index: number, pct: number = 0): FormGroup {


    const taxRate = Number(this.UnitDetailform.controls['U_TaxPrc']?.value || 0);

    const installments = this.form.get('AgreementRevenuRecPlans') as FormArray;

    // 🔹 Total BEFORE TAX amount from UnitList
    const totalBeforeTax = this.UnitList?.reduce((s: any, u: any) =>
      s + Number(u.U_TotAfterDisc || 0), 0) || 0;

    // 🔹 Already consumed BEFORE TAX
    const usedBeforeTax = installments.controls
      .map(c => Number(c.get('U_AmtBeforeTax')?.value) || 0)
      .reduce((a, b) => a + b, 0);

    // 🔥 Remaining BEFORE TAX amount
    const amtBefore = Math.max(0, totalBeforeTax - usedBeforeTax);



    // 🔹 Total  TAX amount from UnitList
    const TotalTaxAmount = this.UnitList?.reduce((s: any, u: any) =>
      s + Number(u.U_TaxAmt || 0), 0) || 0;

    const alreadyUsedTaxAmount = installments.controls
      .map(c => Number(c.get('U_Tax')?.value) || 0)
      .reduce((a, b) => a + b, 0);

    // 🔥 Remaining BEFORE TAX amount
    const RemainingTaxAmount = Math.max(0, TotalTaxAmount - alreadyUsedTaxAmount);


    // 🔥 Tax & AfterTax
    const tax = RemainingTaxAmount; //+(amtBefore * taxRate / 100).toFixed(2);
    const amtAfter = +(amtBefore + tax).toFixed(2);

    // 🔥 Reverse-calculate percentage from remaining amount
    const finalPct = totalBeforeTax === 0
      ? 0
      : +((amtBefore / totalBeforeTax) * 100).toFixed(2);

    const formattedDate = this.datePipe.transform(
      new Date(this.form.controls['AgreementStartDate'].value),
      this.GenericForma.DateFormate
    );

    const g = this.formBuilder.group({
      Name: [`Revenue ${index}`, Validators.required],
      U_AGID: [null],
      U_InstID: [index, Validators.required],
      U_GDate: [formattedDate, Validators.required],
      U_HDate: [''],
      U_AmtBeforeTax: [amtBefore, [Validators.required]],
      U_Tax: [tax, [Validators.min(0)]],
      U_AmtAfterTax: [amtAfter, [Validators.required]],
      U_PrcUnit: [finalPct, [Validators.min(0), Validators.max(100)]],
      U_AmtRcvd: [0.0, [Validators.min(0)]],
      U_ProfSent: ['N'],
      U_Lock: ['N'],
      U_Canceled: ['N'],
      U_UtilAmt: [0, [Validators.min(0)]],
      U_UtilDetail: ['']
    });

    // -------------------------------
    // LIVE CALCULATIONS WHEN USER EDITS
    // -------------------------------


    g.get('U_AmtBeforeTax')!.valueChanges.subscribe((amt: number | null) => {
      const newAmt = amt ?? 0;
      const newPct = totalBeforeTax === 0
        ? 0
        : +((newAmt / totalBeforeTax) * 100).toFixed(2);

      const newTax = +(TotalTaxAmount * taxRate / 100).toFixed(2);

      g.patchValue({
        U_PrcUnit: newPct,
        U_Tax: newTax,
        U_AmtAfterTax: newAmt + newTax
      }, { emitEvent: false });
    });

    return g;
  }
  // create a single blank/parametrized installment group
  addCustomInstallment(): void {

    const installments = this.form.get('AgreementInstallments') as FormArray;

    // 🔎 total % already used
    const usedPct = installments.controls
      .map(c => Number(c.get('U_PrcUnit')?.value) || 0)
      .reduce((a, b) => a + b, 0);

    if (usedPct >= 100) {
      // 🚫 block if already at 100%
      this.toastr.warning('Total percentage cannot exceed 100%');
      return;
    }

    const nextIndex = installments.length + 1;

    // 🆕 pass 0 so createCustomInstallment will auto-fill remaining %
    const g = this.createCustomInstallment(nextIndex, 0);
    installments.push(g);
    this.TotalInstallments = installments.length;
    this.form.updateValueAndValidity({ onlySelf: false, emitEvent: true });
    this.applyUtilitiesToInstallments();
  }
  private createCustomInstallment(index: number, pct: number = 0): FormGroup {


    //const taxRate = Number(this.UnitDetailform.controls['U_TaxPrc']?.value || 0);

    const installments = this.form.get('AgreementInstallments') as FormArray;

    // 🔹 Total BEFORE TAX amount from UnitList
    const totalBeforeTax = this.UnitList?.reduce((s: any, u: any) =>
      s + Number(u.U_TotAfterDisc || 0), 0) || 0;
    // 🔹 Already consumed BEFORE TAX
    const usedBeforeTax = installments.controls
      .map(c => Number(c.get('U_AmtBeforeTax')?.value) || 0)
      .reduce((a, b) => a + b, 0);


    // 🔥 Remaining BEFORE TAX amount
    const amtBefore = Math.max(0, totalBeforeTax - usedBeforeTax);


    // 🔹 Total  TAX amount from UnitList
    const TotalTaxAmount = this.UnitList?.reduce((s: any, u: any) =>
      s + Number(u.U_TaxAmt || 0), 0) || 0;

    const alreadyUsedTaxAmount = installments.controls
      .map(c => Number(c.get('U_Tax')?.value) || 0)
      .reduce((a, b) => a + b, 0);

    // 🔥 Remaining BEFORE TAX amount
    const RemainingTaxAmount = Math.max(0, TotalTaxAmount - alreadyUsedTaxAmount);

    // 🔥 Tax & AfterTax
    const tax = RemainingTaxAmount; //+(amtBefore * taxRate / 100).toFixed(2);
    const amtAfter = +(amtBefore + tax).toFixed(2);

    // 🔥 Reverse-calculate percentage from remaining amount
    const finalPct = totalBeforeTax === 0
      ? 0
      : +((amtBefore / totalBeforeTax) * 100).toFixed(2);

    const formattedDate = this.datePipe.transform(
      new Date(this.form.controls['AgreementStartDate'].value),
      this.GenericForma.DateFormate
    );

    const g = this.formBuilder.group({
      Name: [`Installment ${index}`, Validators.required],
      U_AGID: [null],
      U_InstID: [index, Validators.required],
      U_GDate: [formattedDate, Validators.required],
      U_HDate: [''],
      U_AmtBeforeTax: [amtBefore, [Validators.required]],
      U_Tax: [tax, [Validators.min(0)]],
      U_AmtAfterTax: [amtAfter, [Validators.required]],
      U_PrcUnit: [finalPct, [Validators.min(0), Validators.max(100)]],
      U_AmtRcvd: [0.0, [Validators.min(0)]],
      U_ProfSent: ['N'],
      U_Lock: ['N'],
      U_Canceled: ['N'],
      U_UtilAmt: [0, [Validators.min(0)]],
      U_UtilDetail: ['']
    });

    // -------------------------------
    // LIVE CALCULATIONS WHEN USER EDITS
    // -------------------------------


    g.get('U_AmtBeforeTax')!.valueChanges.subscribe((amt: number | null) => {
      const newAmt = amt ?? 0;
      const newPct = totalBeforeTax === 0 ? 0 : +((newAmt / totalBeforeTax) * 100).toFixed(2);

      const newTax = +(TotalTaxAmount * newPct / 100).toFixed(2);

      g.patchValue({
        U_PrcUnit: newPct,
        U_Tax: newTax,
        U_AmtAfterTax: newAmt + newTax
      }, { emitEvent: false });
    });

    g.get('U_Tax')!.valueChanges.subscribe((amt: number | null) => {
      
      let newAmt = amt ?? 0;
      let beforeTax = g.get('U_AmtBeforeTax')?.value ?? 0;

      // let percent = (15 / 100) * beforeTax;
      // if (newAmt > percent) {
      //   this.toastr.info("Tax amount should be less then 15% of before tax amount of installment!", "Info");
      //   newAmt = percent
      // }
      const newAfterTax = +((beforeTax + newAmt).toFixed(2));

      g.patchValue({
        U_Tax: newAmt,
        U_AmtAfterTax: newAfterTax
      }, { emitEvent: false });
    });

    return g;
  }
  GenerateCustomizeInstallmentInCaseOfUpdate() {


    const totalBeforeTax = this.UnitList?.reduce((sum: any, u: any) =>
      sum + (Number(u.U_TotAfterDisc) || 0), 0) || 0;

    const totalTax = this.UnitList?.reduce((sum: any, u: any) =>
      sum + (Number(u.U_TaxAmt) || 0), 0) || 0;

    const inst = this.AgreementInstallments;

    const profSentInstallments = inst.controls.filter(ctrl =>
      (ctrl as FormGroup).get('U_ProfSent')?.value === 'Y'
    ) as FormGroup[];

    const nonProfSentInstallments = inst.controls.filter(ctrl =>
      (ctrl as FormGroup).get('U_ProfSent')?.value === 'N'
    ) as FormGroup[];

    // Sum ProfSent
    const profSentTotalBeforeTax = profSentInstallments.reduce((sum, grp) =>
      sum + Number(grp.get('U_AmtBeforeTax')?.value || 0), 0
    );

    const profSentTotalTax = profSentInstallments.reduce((sum, grp) =>
      sum + Number(grp.get('U_Tax')?.value || 0), 0
    );

    // Sum non-ProfSent
    const nonProfSentTotalBeforeTax = nonProfSentInstallments.reduce((sum, grp) =>
      sum + Number(grp.get('U_AmtBeforeTax')?.value || 0), 0
    );

    const nonProfSentTotalTax = nonProfSentInstallments.reduce((sum, grp) =>
      sum + Number(grp.get('U_Tax')?.value || 0), 0
    );

    // Remaining amount to distribute among NON-ProfSent
    let newRemainingBeforeTax = totalBeforeTax - profSentTotalBeforeTax - nonProfSentTotalBeforeTax;
    let newRemainingTax = totalTax - profSentTotalTax - nonProfSentTotalTax;

    if (newRemainingBeforeTax < 0) newRemainingBeforeTax = 0;
    if (newRemainingTax < 0) newRemainingTax = 0;

    const countNonProf = nonProfSentInstallments.length;
    if (countNonProf === 0) return;

    const addBeforeTaxEach = +(newRemainingBeforeTax / countNonProf).toFixed(2);
    const addTaxEach = +(newRemainingTax / countNonProf).toFixed(2);

    // Update only Non-ProfSent amounts
    nonProfSentInstallments.forEach(grp => {
      const oldBT = Number(grp.get('U_AmtBeforeTax')?.value || 0);
      const oldTax = Number(grp.get('U_Tax')?.value || 0);

      const newBT = oldBT + addBeforeTaxEach;
      const newTax = oldTax + addTaxEach;

      grp.patchValue({
        U_AmtBeforeTax: newBT,
        U_Tax: newTax,
        U_AmtAfterTax: newBT + newTax
      });
    });

    // 9️⃣ FINAL STEP → Recalculate percentage for BOTH ProfSent and Non-ProfSent
    inst.controls.forEach(ctrl => {
      const grp = ctrl as FormGroup;
      const amtBT = Number(grp.get('U_AmtBeforeTax')?.value || 0);

      const newPct = totalBeforeTax === 0
        ? 0
        : +((amtBT / totalBeforeTax) * 100).toFixed(4);

      grp.patchValue({
        U_PrcUnit: newPct
      }, { emitEvent: false });
    });
    inst.controls.forEach(ctrl => {
      this.attachInstallmentCalculations(ctrl as FormGroup);
    });
  }
  GenerateCustomizeRevenueInCaseOfUpdate() {


    const totalBeforeTax = this.UnitList?.reduce((sum: any, u: any) =>
      sum + (Number(u.U_TotAfterDisc) || 0), 0) || 0;

    const totalTax = this.UnitList?.reduce((sum: any, u: any) =>
      sum + (Number(u.U_TaxAmt) || 0), 0) || 0;

    const inst = this.AgreementRevenuRecPlans;

    const profSentInstallments = inst.controls.filter(ctrl =>
      (ctrl as FormGroup).get('U_Lock')?.value === 'Y'
    ) as FormGroup[];

    const nonProfSentInstallments = inst.controls.filter(ctrl =>
      (ctrl as FormGroup).get('U_Lock')?.value === 'N'
    ) as FormGroup[];

    // Sum ProfSent
    const profSentTotalBeforeTax = profSentInstallments.reduce((sum, grp) =>
      sum + Number(grp.get('U_AmtBeforeTax')?.value || 0), 0
    );

    const profSentTotalTax = profSentInstallments.reduce((sum, grp) =>
      sum + Number(grp.get('U_Tax')?.value || 0), 0
    );

    // Sum non-ProfSent
    const nonProfSentTotalBeforeTax = nonProfSentInstallments.reduce((sum, grp) =>
      sum + Number(grp.get('U_AmtBeforeTax')?.value || 0), 0
    );

    const nonProfSentTotalTax = nonProfSentInstallments.reduce((sum, grp) =>
      sum + Number(grp.get('U_Tax')?.value || 0), 0
    );

    // Remaining amount to distribute among NON-ProfSent
    let newRemainingBeforeTax = totalBeforeTax - profSentTotalBeforeTax - nonProfSentTotalBeforeTax;
    let newRemainingTax = totalTax - profSentTotalTax - nonProfSentTotalTax;

    if (newRemainingBeforeTax < 0) newRemainingBeforeTax = 0;
    if (newRemainingTax < 0) newRemainingTax = 0;

    const countNonProf = nonProfSentInstallments.length;
    if (countNonProf === 0) return;

    const addBeforeTaxEach = +(newRemainingBeforeTax / countNonProf).toFixed(2);
    const addTaxEach = +(newRemainingTax / countNonProf).toFixed(2);

    // Update only Non-ProfSent amounts
    nonProfSentInstallments.forEach(grp => {
      const oldBT = Number(grp.get('U_AmtBeforeTax')?.value || 0);
      const oldTax = Number(grp.get('U_Tax')?.value || 0);

      const newBT = oldBT + addBeforeTaxEach;
      const newTax = oldTax + addTaxEach;

      grp.patchValue({
        U_AmtBeforeTax: newBT,
        U_Tax: newTax,
        U_AmtAfterTax: newBT + newTax
      });
    });

    // 9️⃣ FINAL STEP → Recalculate percentage for BOTH ProfSent and Non-ProfSent
    inst.controls.forEach(ctrl => {
      const grp = ctrl as FormGroup;
      const amtBT = Number(grp.get('U_AmtBeforeTax')?.value || 0);

      const newPct = totalBeforeTax === 0
        ? 0
        : +((amtBT / totalBeforeTax) * 100).toFixed(4);

      grp.patchValue({
        U_PrcUnit: newPct
      }, { emitEvent: false });
    });

  }
  // called from the plus / trash icons
  AddRemoveInstallment(action: 'add' | 'remove', index?: number) {
    if (action === 'add') {
      const next = this.AgreementInstallments.length + 1;
      this.AgreementInstallments.push(this.createCustomInstallment(next, 0));
    } else if (action === 'remove' && index !== undefined) {
      if (this.AgreementInstallments.length == 1) {
        return;
      }
      this.AgreementInstallments.removeAt(index);
      this.TotalInstallments = this.AgreementInstallments.length;
    }
    this.renumberInstallments();
    this.applyUtilitiesToInstallments();
  }
  private renumberInstallments(): void {
    const arr = this.AgreementInstallments;
    arr.controls.forEach((ctrl, idx) => {
      const newIndex = idx + 1; // 1-based numbering
      ctrl.patchValue({
        U_InstID: newIndex,
        Name: `Installment ${newIndex}`
      }, { emitEvent: false }); // don't trigger valueChanges loops
    });
  }

  GenerateRevenueConfig() {

    const AgType = this.form.controls['AgreementType'].value;
    if (AgType === 5 || AgType === '5') return;

    const startDate = new Date(this.form.controls['AgreementStartDate'].value);
    const endDate = new Date(this.form.controls['AgreementEndDate'].value);
    const plan = this.form.controls['RevenueRecognitionPlan'].value;

    let totalAmount = this.TotalUnitAmount;
    const taxRate = Number(this.UnitDetailform.controls['U_TaxPrc']?.value || 0);

    if (AgType === 3 || AgType === '3') totalAmount = 0;

    if (!startDate || !endDate || !plan || totalAmount == null) {
      this.AgreementRevenuRecPlans.clear();
      return;
    }

    // 👉 Collect totals from Unit list
    const totalBeforeTax =
      this.UnitList?.reduce((sum: any, u: any) => sum + (Number(u.U_TotAfterDisc) || 0), 0) || 0;
    const totalTax =
      this.UnitList?.reduce((sum: any, u: any) => sum + (Number(u.U_TaxAmt) || 0), 0) || 0;
    const totalAfterTax = totalBeforeTax + totalTax;

    const isUpdateMode = !!this.form.value.Id && this.form.value.Id > 0;

    // ---------- HELPER: build months inclusively ----------
    const buildMonthsInclusive = (s: Date, e: Date) => {
      //   const months: { dueDate: Date; days: number }[] = [];
      //   const cur = new Date(s.getFullYear(), s.getMonth(), 1);
      //   const end = new Date(e.getFullYear(), e.getMonth(), e.getDate());
      //   while (cur.getTime() <= end.getTime()) {
      //     const daysInMonth = new Date(cur.getFullYear(), cur.getMonth() + 1, 0).getDate();
      //     const dueDate = new Date(cur.getFullYear(), cur.getMonth(), 1);
      //     months.push({ dueDate, days: daysInMonth });
      //     cur.setMonth(cur.getMonth() + 1);
      //   }
      //  return months;
      const start = new Date(s);
      const end = new Date(e);

      const months: { dueDate: Date; days: number }[] = [];
      const current = new Date(start.getFullYear(), start.getMonth(), 1);

      while (current <= end) {
        const year = current.getFullYear();
        const month = current.getMonth();

        const monthStart = new Date(year, month, 1);
        const monthEnd = new Date(year, month + 1, 0);

        let daysInMonth = monthEnd.getDate();
        let days = daysInMonth;

        // First month (partial)
        if (year === start.getFullYear() && month === start.getMonth()) {
          days = monthEnd.getDate() - start.getDate() + 1;
        }

        // Last month (partial)
        if (year === end.getFullYear() && month === end.getMonth()) {
          days = end.getDate();
        }

        months.push({
          dueDate: monthEnd,
          days
        });

        current.setMonth(current.getMonth() + 1);
      }
      return months;
    };
    // ------------------------------------------------------

    // ---------- NEW AGREEMENT ----------
    if (!isUpdateMode) {
      if (plan === 'Customized') {
        this.AgreementRevenuRecPlans.clear();
        this.AgreementRevenuRecPlans.push(this.createRevenueRow(1, 100));
        this.TotalRevConfigInvoice = this.AgreementRevenuRecPlans.length;
        this.applyUtilitiesToRevenue();
        return;
      }

      // ------------------- Month Days (New) -------------------

      if (plan === 'Month Days') {
        this.AgreementRevenuRecPlans.clear();

        const months = buildMonthsInclusive(startDate, endDate);
        if (months.length === 0) {
          // nothing to do
          // this.finalizePercentages('RevConfig');
          this.applyUtilitiesToRevenue();
          this.TotalRevConfigInvoice = this.AgreementRevenuRecPlans.length;
          return;
        }

        const totalDays = months.reduce((sum, m) => sum + m.days, 0) || 0;
        if (totalDays === 0) {
          // fallback: equal split
          const perBeforeTax = parseFloat((totalBeforeTax / months.length).toFixed(2));
          const perTax = parseFloat((totalTax / months.length).toFixed(2));
          months.forEach((m, i) => {
            const last = i === months.length - 1;
            const beforeTax = last
              ? parseFloat((totalBeforeTax - perBeforeTax * (months.length - 1)).toFixed(2))
              : perBeforeTax;
            const tax = last
              ? parseFloat((totalTax - perTax * (months.length - 1)).toFixed(2))
              : perTax;
            const afterTax = beforeTax + tax;
            this.pushRevenueRow(m.dueDate, beforeTax, tax, afterTax, i + 1, totalBeforeTax);
          });
        } else {
          let runningBefore = 0;
          let runningTax = 0;
          months.forEach((m, i) => {
            // weighted
            let beforeTax = (totalBeforeTax * m.days) / totalDays;
            let tax = (totalTax * m.days) / totalDays;

            beforeTax = parseFloat(beforeTax.toFixed(2));
            tax = parseFloat(tax.toFixed(2));

            // last month fix rounding diff
            if (i === months.length - 1) {
              beforeTax = parseFloat((totalBeforeTax - runningBefore).toFixed(2));
              tax = parseFloat((totalTax - runningTax).toFixed(2));
            }

            runningBefore += beforeTax;
            runningTax += tax;
            const afterTax = parseFloat((beforeTax + tax).toFixed(2));
            this.pushRevenueRow(m.dueDate, beforeTax, tax, afterTax, i + 1, totalBeforeTax);
          });
        }

        //this.finalizePercentages('RevConfig');
        this.applyUtilitiesToRevenue();
        this.TotalRevConfigInvoice = this.AgreementRevenuRecPlans.length;
        return;
      }
      // --------------------------------------------------------

      // Other revenue plans (default behavior)
      const revenueDates: Date[] = [];
      switch (plan) {
        case 'Semi-Annually':
        case 'Semi-Annual':
          this.pushDatesByMonths(revenueDates, startDate, endDate, 6); break;
        case 'Quarterly': this.pushDatesByMonths(revenueDates, startDate, endDate, 3); break;
        case 'Annually': this.pushDatesByMonths(revenueDates, startDate, endDate, 12); break;
        case 'One Time': revenueDates.push(startDate); break;
        default: this.pushDatesByMonths(revenueDates, startDate, endDate, 1);
      }

      this.AgreementRevenuRecPlans.clear();

      const perBeforeTax = revenueDates.length ? parseFloat((totalBeforeTax / revenueDates.length).toFixed(2)) : 0;
      const perTax = revenueDates.length ? parseFloat((totalTax / revenueDates.length).toFixed(2)) : 0;

      revenueDates.forEach((dueDate, i) => {
        const last = i === revenueDates.length - 1;
        const beforeTax = last
          ? parseFloat((totalBeforeTax - perBeforeTax * (revenueDates.length - 1)).toFixed(2))
          : perBeforeTax;
        const tax = last
          ? parseFloat((totalTax - perTax * (revenueDates.length - 1)).toFixed(2))
          : perTax;
        const afterTax = beforeTax + tax;

        this.pushRevenueRow(dueDate, beforeTax, tax, afterTax, i + 1, totalBeforeTax);
      });

      this.finalizePercentages('RevConfig');
      this.applyUtilitiesToRevenue();
      this.TotalRevConfigInvoice = this.AgreementRevenuRecPlans.length;
      return;
    }

    // ---------- UPDATE MODE ----------
    if (plan === 'Customized') {
      this.GenerateCustomizeRevenueInCaseOfUpdate();
      return;
    }

    const rev = this.AgreementRevenuRecPlans;
    const lockedRows = rev.controls.filter(ctrl => {
      const group = ctrl as FormGroup;
      return group.get('U_Lock')?.value === 'Y';
    }) as FormGroup[];

    const lockedBeforeTax = lockedRows.reduce(
      (sum, grp) => sum + Number(grp.get('U_AmtBeforeTax')?.value || 0),
      0
    );
    const lockedTax = lockedRows.reduce(
      (sum, grp) => sum + Number(grp.get('U_Tax')?.value || 0),
      0
    );

    let remainingBeforeTax = totalBeforeTax - lockedBeforeTax;
    let remainingTax = totalTax - lockedTax;

    if (remainingBeforeTax < 0) remainingBeforeTax = 0;
    if (remainingTax < 0) remainingTax = 0;

    // Keep locked rows as-is
    this.AgreementRevenuRecPlans.clear();
    lockedRows.forEach(ctrl => {
      const clone = this.formBuilder.group({ ...ctrl.value });
      (clone as any).__lockedRow = true;
      this.AgreementRevenuRecPlans.push(clone);
    });

    // ------------------- Month Days (Update) -------------------
    if (plan === 'Month Days') {
      const months = buildMonthsInclusive(startDate, endDate);
      if (months.length === 0) {
        this.finalizePercentages('RevConfig');
        this.applyUtilitiesToRevenue();
        this.TotalRevConfigInvoice = this.AgreementRevenuRecPlans.length;
        return;
      }

      // alreadyCount = number of locked rows we preserved above
      const alreadyCount = this.AgreementRevenuRecPlans.length;
      const remainingMonths = months.slice(alreadyCount);

      if (remainingMonths.length > 0) {
        const totalDays = remainingMonths.reduce((sum, m) => sum + m.days, 0) || 0;

        if (totalDays === 0) {
          // fallback: equal split of remaining values
          const perBeforeTax = parseFloat((remainingBeforeTax / remainingMonths.length).toFixed(2));
          const perTax = parseFloat((remainingTax / remainingMonths.length).toFixed(2));
          let pushedBefore = 0;
          let pushedTax = 0;
          remainingMonths.forEach((m, i) => {
            let beforeTax = perBeforeTax;
            let tax = perTax;
            if (i === remainingMonths.length - 1) {
              beforeTax = parseFloat((remainingBeforeTax - pushedBefore).toFixed(2));
              tax = parseFloat((remainingTax - pushedTax).toFixed(2));
            }
            pushedBefore += beforeTax;
            pushedTax += tax;
            const afterTax = beforeTax + tax;
            this.pushRevenueRow(m.dueDate, beforeTax, tax, afterTax, alreadyCount + i + 1, totalBeforeTax);
          });
        } else {
          let runningBefore = 0;
          let runningTax = 0;
          remainingMonths.forEach((m, i) => {
            let beforeTax = (remainingBeforeTax * m.days) / totalDays;
            let tax = (remainingTax * m.days) / totalDays;

            beforeTax = parseFloat(beforeTax.toFixed(2));
            tax = parseFloat(tax.toFixed(2));

            if (i === remainingMonths.length - 1) {
              beforeTax = parseFloat((remainingBeforeTax - runningBefore).toFixed(2));
              tax = parseFloat((remainingTax - runningTax).toFixed(2));
            }

            runningBefore += beforeTax;
            runningTax += tax;
            const afterTax = parseFloat((beforeTax + tax).toFixed(2));
            this.pushRevenueRow(m.dueDate, beforeTax, tax, afterTax, alreadyCount + i + 1, totalBeforeTax);
          });
        }
      }

      //this.finalizePercentages('RevConfig');
      this.applyUtilitiesToRevenue();
      this.TotalRevConfigInvoice = this.AgreementRevenuRecPlans.length;
      return;
    }
    // ----------------------------------------------------------

    // Default handling for other plans
    const revenueDates: Date[] = [];
    switch (plan) {
      case 'Semi-Annually':
      case 'Semi-Annual':
        this.pushDatesByMonths(revenueDates, startDate, endDate, 6); break;
      case 'Quarterly': this.pushDatesByMonths(revenueDates, startDate, endDate, 3); break;
      case 'Annually': this.pushDatesByMonths(revenueDates, startDate, endDate, 12); break;
      case 'One Time': revenueDates.push(startDate); break;
      default: this.pushDatesByMonths(revenueDates, startDate, endDate, 1);
    }

    const alreadyCount = this.AgreementRevenuRecPlans.length;
    const totalPlanCount = revenueDates.length;
    const newCount = Math.max(totalPlanCount - alreadyCount, 0);

    if (newCount > 0) {
      const perBeforeTax = parseFloat((remainingBeforeTax / newCount).toFixed(2));
      const perTax = parseFloat((remainingTax / newCount).toFixed(2));
      let totalPushedBefore = 0;
      let totalPushedTax = 0;

      const datesToUse = revenueDates.slice(-newCount);
      datesToUse.forEach((dueDate, i) => {
        let beforeTax = perBeforeTax;
        let tax = perTax;

        if (i === datesToUse.length - 1) {
          beforeTax = parseFloat((remainingBeforeTax - totalPushedBefore).toFixed(2));
          tax = parseFloat((remainingTax - totalPushedTax).toFixed(2));
        }

        totalPushedBefore += beforeTax;
        totalPushedTax += tax;

        const afterTax = beforeTax + tax;
        this.pushRevenueRow(dueDate, beforeTax, tax, afterTax, alreadyCount + i + 1, totalBeforeTax);
      });
    }

    this.finalizePercentages('RevConfig');
    this.applyUtilitiesToRevenue();
    this.TotalRevConfigInvoice = this.AgreementRevenuRecPlans.length;
  }

  // ✅ Updated helper
  private pushRevenueRow(
    dueDate: Date,
    amtBeforeTax: number,
    tax: number,
    amtAfterTax: number,
    index: number,
    totalAmount: number
  ) {

    const percentage = totalAmount > 0
      ? parseFloat(((amtBeforeTax / totalAmount) * 100).toFixed(2))
      : 0;

    const formattedDate = this.datePipe.transform(dueDate, this.GenericForma.DateFormate);

    this.AgreementRevenuRecPlans.push(
      this.formBuilder.group({
        Name: [`Revenue ${index}`, Validators.required],
        U_AGID: [null],
        U_RevRecID: [index, Validators.required],
        U_GDate: [formattedDate, Validators.required],
        U_HDate: [''],
        U_AmtBeforeTax: [amtBeforeTax, [Validators.required]],
        U_Tax: [tax, [Validators.min(0)]],
        U_AmtAfterTax: [amtAfterTax, [Validators.required]],
        U_PrcUnit: [percentage, [Validators.min(0), Validators.max(100)]],
        U_AmtRcvd: [0.0, [Validators.min(0)]],
        U_ProfSent: ['N'],
        U_Lock: ['N'],
        U_Canceled: ['N'],
        U_UtilAmt: [0, [Validators.min(0)]],
        U_UtilDetail: ['']
      })
    );
  }


  private applyUtilitiesToRevenue(): void {
    const allUtilities = this.UnitList
      .filter((item: any) => item?.AgreementUtilities?.length)
      .flatMap((item: any) => item.AgreementUtilities)
      .filter((u: any) => Number(u.amountAfterTax) > 0);

    if (!allUtilities.length) return;

    const revArr = this.AgreementRevenuRecPlans;
    if (!revArr?.length) return;

    const isUpdateMode = !!this.form.value.Id && this.form.value.Id > 0;
    const existingRows = revArr.controls.filter(c => c.get('U_Lock')?.value === 'Y');
    const newRows = revArr.controls.filter(c => c.get('U_Lock')?.value !== 'Y');
    if (!newRows.length) return;

    // group utilities by occurrence
    const groupedUtils: Record<string, number> = allUtilities.reduce((acc: any, u: any) => {
      const occ = (u.u_Occurance || '').trim();
      const amt = Number(u.amountAfterTax) || 0;
      acc[occ] = (acc[occ] || 0) + amt;
      return acc;
    }, {});

    // reset utilities in new rows
    newRows.forEach(ctrl => {
      const baseAmt = Number(ctrl.get('U_AmtBeforeTax')?.value || 0);
      const tax = Number(ctrl.get('U_Tax')?.value || 0);
      ctrl.patchValue({ U_UtilAmt: 0, U_AmtAfterTax: baseAmt + tax }, { emitEvent: false });
    });

    const alreadyAppliedUtil = existingRows.reduce(
      (sum, r) => sum + Number(r.get('U_UtilAmt')?.value || 0),
      0
    );

    (Object.entries(groupedUtils) as [string, number][]).forEach(([occ, totalAmt]) => {
      let remainingAmt = Number(totalAmt);

      if (occ === 'One Time' || occ === 'OT') {
        remainingAmt = Math.max(remainingAmt - alreadyAppliedUtil, 0);
      }

      if (remainingAmt <= 0) return;

      // One-Time utilities → first new row
      if (occ === 'One Time' || occ === 'OT') {
        const first = newRows[0];
        if (first) {
          const currUtil = Number(first.get('U_UtilAmt')?.value || 0);
          const currAmtAfterTax = Number(first.get('U_AmtAfterTax')?.value || 0);
          first.patchValue({
            U_UtilAmt: currUtil + remainingAmt,
            U_AmtAfterTax: currAmtAfterTax + remainingAmt
          }, { emitEvent: false });
        }
      }

      // Based-On-Plan → apply evenly
      if (occ === 'Based On Plan') {
        const targetRows = isUpdateMode ? newRows : revArr.controls;
        const count = targetRows.length;
        if (count > 0) {
          const perRow = Math.floor(remainingAmt / count);
          const remainder = remainingAmt - perRow * count;
          targetRows.forEach((ctrl, i) => {
            const currUtil = Number(ctrl.get('U_UtilAmt')?.value || 0);
            const currAmtAfterTax = Number(ctrl.get('U_AmtAfterTax')?.value || 0);
            const extra = perRow + (i === count - 1 ? remainder : 0);
            ctrl.patchValue({
              U_UtilAmt: currUtil + extra,
              U_AmtAfterTax: currAmtAfterTax + extra
            }, { emitEvent: false });
          });
        }
      }
    });
  }
  private pushDatesByDays(arr: Date[], start: Date, end: Date, gapDays: number) {
    const current = new Date(start);
    while (current <= end) {
      arr.push(new Date(current));
      current.setDate(current.getDate() + gapDays);
    }
  }

  //----------------New section for month days calcuations---------------
  private countDaysBetweenMonths(start: Date, end: Date): number {
    const current = new Date(start.getFullYear(), start.getMonth(), 1);
    let totalDays = 0;
    while (current <= end) {
      totalDays += new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate();
      current.setMonth(current.getMonth() + 1);
    }

    return totalDays;
  }
  private pushDatesByMonthsWithDayWeights(arr: Date[], start: Date, end: Date) {
    const current = new Date(start.getFullYear(), start.getMonth(), 1);
    const totalDaysInRange = this.countDaysBetweenMonths(start, end);

    // We’ll temporarily store month info for weighted calculation
    const months: { date: Date; days: number }[] = [];

    while (current <= end) {
      const daysInMonth = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate();
      months.push({ date: new Date(current.getFullYear(), current.getMonth() + 1, 0), days: daysInMonth }); // last day of month
      current.setMonth(current.getMonth() + 1);
    }

    // Store for later use in main calculation
    (arr as any).monthWeights = { months, totalDaysInRange };
  }

  //------------- End section for month days calculations-----------
  //-------------------------------Custom Rev COnfig--------------------------------
  private renumberRevConfig(): void {
    const arr = this.AgreementRevenuRecPlans;
    arr.controls.forEach((ctrl, idx) => {
      const newIndex = idx + 1; // 1-based numbering
      ctrl.patchValue({
        U_RevRecID: newIndex,
        Name: `Revenue ${newIndex}`
      }, { emitEvent: false }); // don't trigger valueChanges loops
    });
  }


  AddRemoveConfig(action: 'add' | 'remove', index?: number) {
    if (action === 'add') {
      const next = this.AgreementRevenuRecPlans.length + 1;
      this.AgreementInstallments.push(this.createCustomInstallment(next, 0));
    } else if (action === 'remove' && index !== undefined) {
      this.AgreementRevenuRecPlans.removeAt(index);
    }
    this.form.updateValueAndValidity();
    this.renumberRevConfig();
    this.applyUtilitiesToRevenue();
  }
  //-------------------------------End Custom Rev COnfig--------------------------------
  private calculateInstallmentCount(startDate: Date, endDate: Date, plan: string): number {
    if (!startDate || !endDate || !plan) return 0;

    const totalMonths = this.monthDiff(startDate, endDate);

    switch (plan) {
      case 'Annually': {
        // ➡ One installment for every complete 12-month chunk
        // ➡ If there are leftover months, add one more
        const fullYears = Math.floor(totalMonths / 12);
        const remainder = totalMonths % 12;
        return remainder > 0 ? fullYears + 1 : fullYears;
      }

      case 'Semi-Annually':
      case 'Semi-Annual':
        return Math.ceil(totalMonths / 6);

      case 'Quarterly':
        return Math.ceil(totalMonths / 3);

      case 'One Time':
        return 1;

      case 'Month Days':
        // 1 installment per day in the range (inclusive)
        return this.dayDiff(startDate, endDate) + 1;

      case 'Customized':
        return 0; // user will add rows manually

      default: // Monthly
        return totalMonths;
    }
  }

  private dayDiff(d1: Date, d2: Date): number {
    const msPerDay = 1000 * 60 * 60 * 24;
    return Math.floor((d2.getTime() - d1.getTime()) / msPerDay);
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
    // +1 to include both start & end month
  }

  AddRemoveAttachments(action: any, postdata: any) {

    if (action === 'add') {
      if (!this.AttachmentType || !this.Description || !this.FileURL) {
        this.toastr.warning("All fields are required", "Warning");
        return;
      }
      let data = {
        U_DType: this.AttachmentType,
        Name: this.Description,
        U_AttName: this.FileURL,
        FileURL2: this.FileURL,
      }

      if (data.U_AttName) {
        this.AttachmentsList.push(data);
        this.AttachmentType = "";
        this.Description = "";
        this.FileURL = "";
      }


    } else {
      
      if (postdata.Id) {
        ($('#cancelConfirmModal') as any).modal('show');
        this.deleteAttachmentData = postdata;
      } else {
        this.AttachmentsList = this.AttachmentsList.filter((item: any) => item !== postdata);
      }

    }
  }
  DeleteAttachment() {
    let Id = this.deleteAttachmentData.Id;
    let url = '/Agreement/RemoveAttachment?Id=' + Id;
    this._service.Get(url).subscribe({
      next: result => {
        if (result.status) {
          this.AttachmentsList = this.AttachmentsList.filter((item: any) => item !== this.deleteAttachmentData);
          ($('#cancelConfirmModal') as any).modal('hide');
          this.toastr.success(result.message, "Success", {
            progressBar: true,
            closeButton: true
          });

        } else {
          ($('#cancelConfirmModal') as any).modal('hide');
          this.toastr.error(result.message, "Error", {
            progressBar: true,
            closeButton: true
          });

        }
      },
      error: (err: any) => { },
    });
  }
  async onFileChange(event: any, fileInputRef: HTMLInputElement) {
    const base64: any = await this._sharedHelper.preview(event.target.files, 'image');

    if (base64) {
      this.FileURL = base64; // Optional: For <img [src]="previewImage">
    } else {
      this.toastr.error("Invalid file format. Only JPG/PNG/pdf under 10MB allowed.");
      if (fileInputRef) fileInputRef.value = '';
    }
  }
  GetItemMasterData(PropertyItemType = 'Sales') {

    // let url = '/MasterData/GetItemMasterData';
    let url = `/MasterData/GetItemMasterData?PropertyItem=Y&UtilityItem=Y&PropertyItemType=${PropertyItemType}&PropertyStatus=Available`;
    this._service.Get(url).subscribe({
      next: result => {
        if (result.status) {

          this.ItemsListData = result.data;

          this.UtilityItemsList = result.data.filter((item: any) => item.u_UtilityItem === 'Y');
          this.PropertyItemsList = result.data.filter((item: any) => item.u_PropertyItem === 'Y');

        } else {

          this.toastr.error(result.message, "Error", {
            progressBar: true,
            closeButton: true
          });
        }
      },
      error: (err: any) => { },
    });
  }
  GetMasterData() {

    let url = '/MasterData/GetMasterData?type=Facility';
    this._service.Get(url).subscribe({
      next: result => {
        if (result.status) {
          this.FacilitiesMasterList = result.data;
        } else {

          this.toastr.error(result.message, "Error", {
            progressBar: true,
            closeButton: true
          });
        }
      },
      error: (err: any) => { },
    });
  }
  getTaxCodeName(id: any): string {
    let exist = this.TaxCodesList.find((m: any) => m.code == id);
    return exist ? exist.name : '';
  }
  onDropDownChange(data: any, form: any) {

    this.typecheck = data;
    if (form == 'ItemMaster') {


      let exist = this.ItemsListData.find((m: any) => m.itemCode == data);
      let taxsList = this.TaxCodesList.find((m: any) => m.code == exist.taxCode);
      if (!taxsList) {
        taxsList = { rate: 0 };

      }
      if (exist) {
        this.SelectedItemMinPrice = exist.minPrice;
        this.SelectedItemMaxPrice = exist.maxPrice;
        //-------------set default facilities---------------------
        this.FacilityList = (exist.facilities || []).map((x: any) => {

          let matched = this.FacilitiesMasterList.find((f: any) => f.id == parseInt(x.u_FctCode));
          return {
            U_FcltCode: this._sharedHelper.getFloat(x.u_FctCode, 0),
            U_Qty: this._sharedHelper.getFloat(x.u_Qty, 0),
            U_Rate: this._sharedHelper.getFloat(x.u_Rate, 0),
            U_FacilityName: matched ? matched.name : ''
          };
        });
        //---------------End Default facilities-------------------

        //---------------Default Utilities-------------------------
        //  this.UtilityList = exist.utilities?.map((x: any) => {
        // find matching utility from master list (if available)
        this.UtilityList = (exist.utilities || []).map((x: any) => {
          const matched = this.UtilityItemsList?.find((u: any) => u.itemCode == x.u_UtilItemCode);

          // calculation method mapping
          let Cal = '';
          if (x.u_Calculation === 1) Cal = 'Fixed';
          else if (x.u_Calculation === 2) Cal = 'By Unit Size(Per SQM)';
          else if (x.u_Calculation === 3) Cal = 'Metered (Per Unit)';

          // Get current tax info
          const taxInfo = this.TaxCodesList.find((m: any) => m.code == (matched?.taxCode || x.u_TaxCode));
          const taxRate = this._sharedHelper.getFloat(taxInfo?.rate, 0);

          // Calculate base amount depending on calculation type
          let rate = this._sharedHelper.getFloat(x.u_Rate, 0);
          let totalAmount = 0;

          if (Cal === 'Fixed') {
            totalAmount = rate;
          } else if (Cal === 'By Unit Size(Per SQM)') {
            totalAmount = rate * this._sharedHelper.getFloat(this.UnitDetailform.value.U_UnitSize, 0);
          } else if (Cal === 'Metered (Per Unit)') {
            totalAmount = rate * this._sharedHelper.getFloat(x.u_MeterUnits || 0, 0);
          }

          // calculate tax + total after tax
          const taxAmt = totalAmount * (taxRate / 100);
          const afterTax = totalAmount + taxAmt;

          return {
            u_UtilItemCode: x.u_UtilItemCode,
            u_UtilityItemName: matched ? matched.itemName : '',
            u_TaxCode: matched ? matched.taxCode : x.u_TaxCode,
            u_TaxName: taxInfo ? taxInfo.name : matched?.u_TaxName || '',
            u_Calculation: this._sharedHelper.getFloat(x.u_Calculation, 0),
            CalculationName: Cal,
            u_Rate: rate,
            u_Occurance: x.u_Occurance,
            u_Amount: totalAmount,
            tax: taxAmt,
            amountAfterTax: afterTax,
            U_TaxPrc: taxRate,
            U_TaxAmt: taxAmt,
            U_TotAfterTax: afterTax
          };
        });
        //---------------End Default Utilities--------------------
        let TotalAMount = 0;
        let RatePerSQM = 0;
        let AgreementType = this.form.value.AgreementType;
        if (AgreementType == 2) {
          TotalAMount = this._sharedHelper.getFloat(exist.u_UnitSizeSQM, 0) * this._sharedHelper.getFloat(exist.annualRentSQM, 0)
          RatePerSQM = exist.annualRentSQM;
        } else {
          TotalAMount = this._sharedHelper.getFloat(exist.u_UnitSizeSQM, 0) * this._sharedHelper.getFloat(exist.salesPriceSQM, 0);
          RatePerSQM = exist.salesPriceSQM
        }


        this.UnitDetailform.patchValue({
          U_PrjID: exist.u_Project,
          U_BldID: exist.u_Building,
          U_SecID: exist.u_SecZone,
          U_UnitSize: String(exist.u_UnitSizeSQM ?? ''),
          U_SubSecID: exist.u_SubZone,
          U_PerSQMRate: RatePerSQM,
          Name: exist.itemName,
          U_SubZoneName: exist.u_SubZoneName,
          U_TaxCode: exist.taxCode,
          U_TaxPrc: taxsList.rate,
          U_ProjectName: exist.u_ProjectName,
          U_BuildingName: exist.u_BuildingName,
          U_ZoneName: exist.u_ZoneName, //salesPriceSQM
          U_Total: TotalAMount,
          totalRentPerYear: exist.totalRentPerYear
        });
        const basedOn = this.form.get('CalculationBasedOn')?.value;
        const startDate = this.form.get('AgreementStartDate')?.value;
        const endDate = this.form.get('AgreementEndDate')?.value;

        this.updateCalculatedDiff(basedOn, startDate, endDate);

        this.GetItemUtilityFacilityList(exist.itemCode);
        this.updateUtilityTotal()
      }
    }
    if (form === 'TaxCode') {
      let exist = this.TaxCodesList.find((m: any) => m.code == data);
      if (exist) {
        this.UnitDetailform.patchValue({
          U_TaxPrc: exist.rate
        });
      }
    }
    if (form === 'AgreementType') {
      this.UnitList = [];
      this.GenerateInstallments();
      this.GenerateRevenueConfig();
      this.UnitsDetailHeading = 'Unit Detail'
      this.UnitDetailform.controls['U_UnitCode'].setValue('')
      let exist = this.AgreementTypeListVlaues.find((m: any) => m.fieldValue == data);
      if (exist) {

        this.form.get('RevenueRecognitionPlan')?.enable();
        this.showUtilFacilities = true;

        // this.GetItemMasterData();
        if (exist.fieldValue === 5 || exist.fieldValue === '5') { //in case of off plan
          this.form.get('RevenueRecognitionPlan')?.setValue('Customized');
          this.form.get('InstallmentPlan')?.setValue('Customized');

          this.form.get('RevenueRecognitionPlan')?.disable();
          this.form.get('InstallmentPlan')?.disable();
          this.GetItemMasterData('OP-Sales')
          this.showUtilFacilities = false;
        }
        else if (exist.fieldValue === 2 || exist.fieldValue === '2') { // in case of rent
          this.GetItemMasterData('Rent')
        } else {
          this.GetItemMasterData();
        }
        if (exist.fieldValue === 3 || exist.fieldValue === '3') { // in case of mantainance
          this.UnitsDetailHeading = 'Utility Detail'
        }
        this.GetDocSeries(exist.fieldValue)
        this.form.controls['SeriesName'].setValue(null)
        this.form.controls['U_DocNum'].setValue(null)
      }
    }
    if (form === 'Series') {
      let exist = this.SeriesList.find((m: any) => m.id == data);
      if (exist) {
        this.form.controls['U_DocNum'].setValue(exist.u_SNext)
      }
    }
    if (form === 'UtilityCalculation') {
      this.UtilityCalculation = data;
      this.updateUtilityTotal();
    }
    if (form === 'UtilityTaxCode') {

      let exist = this.TaxCodesList.find((m: any) => m.code == data);
      if (exist) {

        this.UtilityTax = exist.rate;
        const taxAmt = this.UtilityRateTotal * ((+ this.UtilityTax || 0) / 100);

        this.UtilityAmountAfterTax = this._sharedHelper.getFloat(this.UtilityRateTotal, 0) + this._sharedHelper.getFloat(taxAmt, 0);
        this.UtilTaxName = exist.name;
      }
    }
    if (form === 'UtilityItemsChange') {

      let exist = this.UtilityItemsList.find((m: any) => m.itemCode == data);
      this.u_UtilItemName = exist.itemName;
    }
    if (form === 'UnitsFacility') {
      let exist = this.FacilitiesMasterList.find((m: any) => m.id == data);
      if (exist) {
        this.UnitFacilityName = exist.code + ' - ' + exist.name;
      }
    }
  }
  GetItemUtilityFacilityList(itemCode: any) {
    let url = '/MasterData/Itemfacilityutility?ItemCode=' + itemCode;
    this._service.Get(url).subscribe({
      next: result => {
        if (result.status) {
          this.UtilityFacilityList = result.data;

        } else {

          this.toastr.error(result.message, "Error", {
            progressBar: true,
            closeButton: true
          });
        }
      },
      error: (err: any) => { },
    });
  }
  ShowAddUnitDetailModal(data: any) {

    let Id = this.form.value.Id;
    if (Id > 0) {
      const instArr = this.AgreementInstallments;
      const existingRows = instArr.controls.filter(c => c.get('U_ProfSent')?.value === 'Y');
      if (instArr.length === existingRows.length) {
        this.toastr.info("You cannot add units int the agreement, All installments paid for the selected agreement!", "Info");
        return;
      }
    }


    this.selectedBuildingForDeteal = data;
    this.labelHelper.markRequiredFields(this.UnitDetailform, this.el, this.renderer);
    this.UnitDetailform.reset(
      {
        Id: 0,
        // U_TaxPrc: taxPercentage,
        CreatedBy: parseInt(this.CurrentUserInfo.Id),
        CreatedDate: new Date(),
        UpdatedBy: parseInt(this.CurrentUserInfo.Id),
        UpdatedDate: new Date(),
      }
    );
    ($('#addUnitDetailModal') as any).modal('show');
  }
  onSubmitUnits(status: any) {

    this.unitSubmitted = true;
    if (this.UnitDetailform.invalid) {
      return;
    }

    let AgreementType = this.form.value.AgreementType;
    let CalBasOn = this.form.value.CalculationBasedOn;
    if (AgreementType === 2 && !CalBasOn) {
      this.toastr.info("Please select calculation based on in general tab", "Info");
      return;
    }
    let formValue = this.UnitDetailform.value;


    this.UnitDetailform.controls['AgreementUtilities'].setValue(this.UtilityList)
    this.UnitDetailform.controls['AgreementItemFacilities'].setValue(this.FacilityList)

    const startDate = new Date(this.form.controls['AgreementStartDate'].value);
    const endDate = new Date(this.form.controls['AgreementEndDate'].value);
    const plan = this.form.controls['InstallmentPlan'].value;
    const Revplan = this.form.controls['RevenueRecognitionPlan'].value;

    // const installments = this.installmentGeneratorService.generateInstallmentsForUnit(
    //   this.UnitDetailform.value,
    //   startDate,
    //   endDate,
    //   plan,
    //   'Installment '
    // );
    // 
    // this.UnitDetailform.controls['AgreementItemInstallments'].setValue(installments.value)
    // const RevInstallments = this.installmentGeneratorService.generateInstallmentsForUnit(
    //   this.UnitDetailform.value,
    //   startDate,
    //   endDate,
    //   Revplan,
    //   'Rev Recog  's
    // );


    if (this.editIndex !== null) {
      // Update existing record

      this.UnitList[this.editIndex] = this.UnitDetailform.value;
      this.toastr.success('Record updated successfully!', 'Success');
      this.editIndex = null;
    } else {
      if (this.form.value.AgreementType == '5' && !this.SAPSettingList[0].offPlanMultiUnit && this.UnitList.length > 0) {
        this.toastr.warning("You are not allowed to add multi units in offPlan Agreement, Please contact your administrator!", "Warning");
        return;
      }
      let exist = this.UnitList.find((m: any) => m.U_UnitCode == formValue.U_UnitCode);
      if (exist) {
        this.toastr.warning("This unit already added in the agreement!", "Warning");
        return;
      }
      // Add new record
      this.UnitList.push(this.UnitDetailform.value);
      this.toastr.success('Record added successfully!', 'Success');
    }

    this.TotalUnitAmount = this.UnitList.reduce((acc: number, item: any) =>
      acc + (Number(item.U_TotAfterDisc) || 0), 0);

    if (this.form.value.AgreementType == '2') {
      this.TotalSecurityAMount = this.UnitList.reduce((acc: number, item: any) =>
        acc + (Number(item.U_SecAmt) || 0), 0);
      this.form.controls['U_SecAmt'].setValue(this.TotalSecurityAMount);
    }


    if (AgreementType != 3) {
      this.form.patchValue({
        CommissionAmount: this.CalculateCommissionAmount(this.SelectedSPCommissionRate)
        //SeriesName: exist.seriesName
      });
    }
    this.GenerateInstallments();
    this.GenerateRevenueConfig();
    this.triggerRecalc();
    // Reset form+
    let taxPercentage = this.UnitDetailform.value.U_TaxPrc
    this.UnitDetailform.reset({
      Id: 0,
      U_TaxPrc: taxPercentage,
      CreatedBy: parseInt(this.CurrentUserInfo.Id),
      CreatedDate: new Date(),
      UpdatedBy: parseInt(this.CurrentUserInfo.Id),
      UpdatedDate: new Date(),
    });
    this.unitSubmitted = false;
    this.UtilityList = [];
    this.FacilityList = [];
    if (status === 'close') {
      ($('#addUnitDetailModal') as any).modal('hide');
    }

  }
  editUnit(index: number) {
    const unit = this.UnitList[index];
    if (this.form.value.Id > 0 && unit.Id > 0) {

      const inst = this.AgreementInstallments;
      const revPlan = this.AgreementRevenuRecPlans;

      // Check in installments
      const hasProfsentInInst = inst.controls.some(ctrl => {
        const group = ctrl as FormGroup;
        return group.get('U_ProfSent')?.value === 'Y';
      });

      // Check in revenue plan
      const hasProfsentInRev = revPlan.controls.some(ctrl => {
        const group = ctrl as FormGroup;
        return group.get('U_Lock')?.value === 'Y';
      });

      if (hasProfsentInInst || hasProfsentInRev) {
        this.toastr.warning(
          'You cannot edit unit, some installments or revenue plans are already processed (Proforma = Y).'
        );
        return;
      }
    }
    //  this.UnitDetailform.controls['AgreementUtilities'].setValue(this.UtilityList)
    // this.UnitDetailform.controls['AgreementItemFacilities'].setValue(this.FacilityList)

    this.FacilityList = unit.AgreementItemFacilities;
    this.UtilityList = unit.AgreementUtilities;
    this.UnitDetailform.patchValue(unit);
    this.editIndex = index; // remember which record we are editing
    ($('#addUnitDetailModal') as any).modal('show');
  }

  // for delete
  deleteUnit(index: number) {

    const unit = this.UnitList[index];

    if (this.form.value.Id > 0 && unit.Id > 0) {

      const inst = this.AgreementInstallments;
      const revPlan = this.AgreementRevenuRecPlans;
      // Check in installments
      const hasProfsentInInst = inst.controls.some(ctrl => {
        const group = ctrl as FormGroup;
        return group.get('U_ProfSent')?.value === 'Y';
      });

      // Check in revenue plan
      const hasProfsentInRev = revPlan.controls.some(ctrl => {
        const group = ctrl as FormGroup;
        return group.get('U_Lock')?.value === 'Y';
      });

      if (hasProfsentInInst || hasProfsentInRev) {
        this.toastr.warning(
          'You cannot delete unit, some installments or revenue plans are already processed (Proforma = Y).'
        );
        return;
      }
    }


    this.UnitList.splice(index, 1);
    this.TotalUnitAmount = this.UnitList.reduce((acc: number, item: any) =>
      acc + (Number(item.U_TotAfterDisc) || 0), 0);
    this.toastr.warning('Record deleted successfully!', 'Deleted');
    this.GenerateInstallments();
    this.GenerateRevenueConfig();
  }
  // Save & Close (example: just add & maybe navigate away)
  onSaveAndClose(): void {
    this.unitSubmitted = true;

    if (this.UnitDetailform.invalid) {
      this.toastr.warning('Please fill required fields');
      return;
    }

    this.UnitList.push(this.UnitDetailform.value);

    this.toastr.success('Record added successfully!', 'Success');

    // TODO: Navigate away or close modal
  }
  AddRemoveFacilty(status: any, data: any) {

    if (status == 'add') {
      if (!this.Facility || !this.Quantity || !this.Rate) {
        this.toastr.warning("Please Select all fields !", "Warning");
        return;
      }
      let alreadyExist = this.FacilityList.find((m: any) => m.U_FcltCode === this.Facility)
      if (alreadyExist) {
        this.toastr.warning("Facility already exist!", "Warning");
        return;
      }
      let FacilityInfo = {
        U_FcltCode: this._sharedHelper.getFloat(this.Facility, 0),
        U_Qty: this._sharedHelper.getFloat(this.Quantity, 0),
        U_Rate: this.Rate,
        U_FacilityName: this.UnitFacilityName
      }

      this.FacilityList.push(FacilityInfo);
    } else {
      this.FacilityList = this.FacilityList.filter((item: any) => item !== data)
    }
    //this.BusinessInformationList
    this.ClearlgForm();
  }
  ClearlgForm() {

    this.Facility = '';
    this.Quantity = '';
    this.Rate = '';
  }
  AddRemoveUtility(status: any, data: any) {

    if (status == 'add') {
      if (!this.Utility || !this.Calculation || !this.UtilityRates || !this.Occurance) {
        this.toastr.warning("Please Select all fields !", "Warning");
        return;
      }
      let alreadyExist = this.UtilityList?.find((m: any) => m.u_UtilItemCode === this.Utility)
      if (alreadyExist) {
        this.toastr.warning("Item already exist!", "Warning");
        return;
      }
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
        u_UtilityItemName: this.u_UtilItemName,
        u_TaxCode: this.TaxCode,
        u_TaxName: this.UtilTaxName,
        u_Calculation: Cal,
        CalculationName: this.Calculation,
        u_Rate: this._sharedHelper.getFloat(this.UtilityRates, 0),
        u_Occurance: this.Occurance,
        u_Amount: this.UtilityRateTotal,
        tax: this.UtilityTaxAmount,
        amountAfterTax: this.UtilityAmountAfterTax,
        U_TaxPrc: this.UtilityTax,
        U_TaxAmt: this.UtilityTaxAmount,
        U_TotAfterTax: this.UtilityAmountAfterTax,
      }

      this.UtilityList.push(UtilityInfo);
    } else {
      this.UtilityList = this.UtilityList.filter((item: any) => item !== data)
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
    this.Occurance = '';
    this.UtilityRateTotal = null;
    this.UtilityTax = null;
    this.UtilityAmountAfterTax = null;
    this.u_UtilItemName = '';
    this.UtilTaxName = '';
  }
  private updateUtilityTotal(): void {

    const rate = Number(this.UtilityRates) || 0;

    if (this.UtilityCalculation === 'Fixed') {
      // ✅ total = rate itself
      this.UtilityRateTotal = rate;
    } else {
      // ✅ all other calculation types → multiply by 15
      let UnitSize = this.UnitDetailform.value.U_UnitSize
      this.UtilityRateTotal = rate * UnitSize;
    }

    const taxAmt = this.UtilityRateTotal * ((+ this.UtilityTax || 0) / 100);
    this.UtilityTaxAmount = taxAmt;
    this.UtilityAmountAfterTax = this._sharedHelper.getFloat(this.UtilityRateTotal, 0) + this._sharedHelper.getFloat(taxAmt, 0);

  }
  onRateChange() {
    this.updateUtilityTotal();
  }

  private updateCalculatedDiff(basedOn: string, start: Date | string, end: Date | string): void {

    if (!basedOn || !start || !end) {
      this.calculatedDiff = null;
      return;
    }
    if (String(this.form.get('AgreementType')?.value ?? '') !== '2') {
      return;
    }
    const s = new Date(start);
    const e = new Date(end);
    if (isNaN(s.getTime()) || isNaN(e.getTime()) || e < s) {
      this.calculatedDiff = null;
      return;
    }

    const YearlyItemValue = this.UnitDetailform.value.totalRentPerYear;
    if (basedOn === 'Daily') {
      this.calculatedDiff = this.dateDiffInDaysInclusive(s, e);
      const dailyRent = YearlyItemValue / 365;
      this.UnitDetailform.controls['U_Total']
        .setValue(dailyRent * this.calculatedDiff);
    } else if (basedOn === 'Monthly') {
      this.calculatedDiff = this.monthDiffInclusive(s, e);
      const monthlyRent = YearlyItemValue / 12;
      this.UnitDetailform.controls['U_Total']
        .setValue(monthlyRent * this.calculatedDiff);
    } else {
      this.calculatedDiff = null;
    }

  }
  private triggerRecalc(): void {

    const basedOn = this.form.get('CalculationBasedOn')?.value;
    const startDate = this.form.get('AgreementStartDate')?.value;
    const endDate = this.form.get('AgreementEndDate')?.value;
    this.updateCalculatedDiff(basedOn, startDate, endDate);
  }


  /** Days difference, inclusive (01-01 -> 01-01 = 1 day) */
  private dateDiffInDaysInclusive(a: Date, b: Date): number {
    const oneDay = 1000 * 60 * 60 * 24;
    const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
    const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
    return Math.floor((utcB - utcA) / oneDay) + 1;
  }

  /**
   * Months difference, inclusive.
   * Example: 01-01-2025 -> 31-12-2025 => 12 months (because 31 >= 1)
   * Logic: base months = yearDelta*12 + monthDelta; add 1 if endDay >= startDay.
   */
  // private monthDiffInclusive(a: Date, b: Date): number {
  //   const yearDiff = b.getFullYear() - a.getFullYear();
  //   const monthDiff = b.getMonth() - a.getMonth();
  //   let months = yearDiff * 12 + monthDiff;
  //   if (b.getDate() >= a.getDate()) months += 1;
  //   return months;
  // }

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

  GetTaxCodes() {

    let url = '/MasterData/GetTaxCodes';
    this._service.Get(url).subscribe({
      next: result => {
        if (result.status) {
          this.TaxCodesList = result.data;

          if (history.state && history.state.forward) {
            this.GetAgreementList(history.state.forward.Id);
          }
        } else {

          this.toastr.error(result.message, "Error", {
            progressBar: true,
            closeButton: true
          });
        }
      },
      error: (err: any) => { },
    });
  }
  async GetAgreementList(Id: any = 0) {

    let url = '/Agreement/agreement?Id=' + Id;
    this._service.Get(url).subscribe({
      next: async result => {
        if (result.status) {
          if (Id > 0) {

            this.SelectedAgreementForUpdate = result.data[0];
            await Promise.all([
              this.UpdateAgreement(this.SelectedAgreementForUpdate)
            ]);
          }

        } else {

          this.toastr.error(result.message, "Error", {
            progressBar: true,
            closeButton: true
          });
        }
      },
      error: (err: any) => { },
    });
  }

  async UpdateAgreement(serverData: any) {
    
    this.GetItemMasterData(serverData.agType);
    this.SeriesName = serverData.series;
    this.form.patchValue({
      Id: serverData.id,
      CustomerCode: serverData.u_BPCode,
      CustomerName: serverData.name,
      AgreementType: serverData.u_AGType, // or serverData.u_AGType if you need numeric
      ContactPersonName: serverData.u_CPName,
      SeriesName: serverData.u_Seriese,
      CustRefNo: serverData.u_CustRefNo,
      ApprovalStatus:serverData.approvalStatus,
      Status: serverData.agStatus,  // or serverData.u_AGStatus if numeric
      PostingDate: serverData.u_PostDate ? new Date(serverData.u_PostDate) : null,

      U_AgtSDateH: serverData.u_AgtSDateH ? new Date(serverData.u_AgtSDateH) : null,
      U_AgtEDateH: serverData.u_AgtEDateH ? new Date(serverData.u_AgtEDateH) : null,

      AgreementStartDate: serverData.u_AgtSDate ? new Date(serverData.u_AgtSDate) : null,
      AgreementEndDate: serverData.u_AgtEDate ? new Date(serverData.u_AgtEDate) : null,

      InstallmentPlan: serverData.u_InstPlanID,
      RevenueRecognitionPlan: serverData.u_RevRecPlanID,
      TotalAmount: serverData.u_TotNoInst,  // adjust if total should come from items instead

      TaxCode: serverData.u_TaxCode,
      SalesPerson: serverData.u_SPName,
      CommissionRate: serverData.u_CommPrc,
      CommissionAmount: serverData.u_CommAmt,
      Notes: serverData.u_Notes,

      CreatedBy: serverData.createdBy,
      CreatedDate: serverData.createdDate ? new Date(serverData.createdDate) : null,
      UpdatedBy: serverData.updatedBy,
      UpdatedDate: serverData.updatedDate ? new Date(serverData.updatedDate) : null,

      U_DocNum: serverData.u_DocNum,
      U_SecAmt: serverData.u_SecAmt,
      U_DeliveryDate: serverData.u_DeliveryDate ? new Date(serverData.u_DeliveryDate) : null,
      CalculationBasedOn: serverData.u_MonthDay,
      u_AGStatus: serverData.u_AGStatus,

      U_RefAGId: serverData.u_RefAGId,
      IsUnderProvision: serverData.isUnderProvision
    });
    this.calculatedDiff = serverData.u_MonthDayVal
    this.triggerRecalc();

    this.UnitList = []; // reset before mapping

    if (serverData.agreementItems && serverData.agreementItems.length > 0) {

      this.UnitList = serverData.agreementItems.map((item: any) => {

        return {
          Id: item.id,
          TrnsAgreementId: item.trnsAgreementId,
          Name: item.name,
          U_UnitCode: item.u_UnitCode,
          U_ProjectName: item.prjname,
          U_BuildingName: item.bldname,
          U_ZoneName: item.zonename,
          U_SubZoneName: item.subZonename,
          U_UnitSize: item.u_UnitSize,
          U_PerSQMRate: item.u_PerSQMRate,
          U_Total: item.u_Total,
          U_DiscPrc: item.u_DiscPrc,
          U_DiscAmt: item.u_DiscAmt,
          U_TotAfterDisc: item.u_TotAfterDisc,
          U_TaxPrc: item.u_TaxPrc,
          U_TaxAmt: item.u_TaxAmt,
          U_TotAfterTax: item.u_TotAfterTax,
          U_TaxCode: item.u_TaxCode,
          U_SecAmt: item.u_SecAmt,
          CreatedDate: item.createdDate ? new Date(item.createdDate) : null,

          U_AGID: item.u_AGID,
          U_PrjID: item.u_PrjID,
          U_BldID: item.u_BldID,
          U_SecID: item.u_SecID,
          U_SubSecID: item.u_SubSecID,
          UpdatedBy: parseInt(this.CurrentUserInfo.Id),
          UpdatedDate: new Date(),
          totalRentPerYear: item.u_Total,

          // 🔹 Map utilities per unit
          AgreementUtilities: (item.agreementUtilities || []).map((u: any) => ({
            Id: u.id,
            u_UtilItemCode: u.u_UtilItemCode,
            u_UtilityItemName: u.utilItemname,
            u_TaxCode: u.u_TaxCode,
            u_TaxName: this.getTaxCodeName(u.u_TaxCode), // map each tax separately
            CalculationName: u.u_Calculation,
            u_Calculation: u.u_Calculation,
            u_Rate: u.u_Rate,
            u_Occurance: u.u_Occurance,
            u_Amount: u.u_Amount,
            tax: u.u_TaxAmt ?? 0,
            amountAfterTax: u.u_TotAfterTax ?? u.u_Amount,
            CreatedDate: u.createdDate ? new Date(u.createdDate) : null
          })),
          // 🔹 Map facilities per unit
          AgreementItemFacilities: (item.agreementItemFacilities || []).map((f: any) => ({
            Id: f.id,
            U_FcltCode: f.u_FcltCode,
            U_FacilityName: f.fcltName,
            U_Qty: this._sharedHelper.getFloat(f.u_Qty, 0),
            U_Rate: this._sharedHelper.getFloat(f.u_Rate, 0),
            CreatedDate: f.createdDate ? new Date(f.createdDate) : null
          })),
          AgreementItemInstallments: item.agreementItemsInstallments
        };

      });

      // 🔹 Calculate total after all units are mapped
      this.TotalUnitAmount = this.UnitList.reduce(
        (acc: number, unit: any) => acc + (Number(unit.U_TotAfterDisc) || 0),
        0
      );
    }

    // ---- Map AgreementInstallments ----
    const installmentsArray = this.form.get('AgreementInstallments') as FormArray;
    installmentsArray.clear();

    if (serverData.agreementInstallments && serverData.agreementInstallments.length > 0) {

      this.TotalInstallments = serverData.agreementInstallments.length;

      serverData.agreementInstallments.forEach((inst: any) => {

        installmentsArray.push(this.formBuilder.group({
          Id: 0,//[inst.id],
          TrnsAgreementId: [inst.trnsAgreementId],
          Name: [inst.name],
          U_InstID: [inst.u_InstID],
          U_PrcUnit: [inst.u_PrcUnit],
          U_GDate: [inst.u_GDate ? this.datePipe.transform(inst.u_GDate, this.GenericForma.DateFormate) : null],
          U_AmtBeforeTax: [inst.u_AmtBeforeTax],
          U_Tax: [inst.u_Tax],
          U_UtilAmt: [inst.u_UtilAmt],   // keep readonly in template
          U_AmtAfterTax: [inst.u_AmtAfterTax],
          U_AmtRcvd: [inst.u_AmtRcvd],
          U_ProfSent: [inst.u_ProfSent],
          U_Lock: [inst.u_Lock],
          U_Canceled: [inst.u_Canceled]
        }));
      });
      installmentsArray.controls.forEach(ctrl => {
        this.attachInstallmentCalculations(ctrl as FormGroup);
      });
    }

    // ---- Map AgreementRevenuRecPlans ----
    const revPlanArray = this.form.get('AgreementRevenuRecPlans') as FormArray;
    revPlanArray.clear();

    if (serverData.agreementRevenuRecPlans && serverData.agreementRevenuRecPlans.length > 0) {
      this.TotalRevConfigInvoice = serverData.agreementRevenuRecPlans.length
      serverData.agreementRevenuRecPlans.forEach((plan: any) => {

        revPlanArray.push(this.formBuilder.group({
          Id: 0,//[plan.id],
          TrnsAgreementId: [plan.trnsAgreementId],
          Name: [plan.name],
          U_RevRecID: [plan.u_RevRecID],
          U_PrcUnit: [plan.u_PrcUnit],
          U_GDate: [plan.u_GDate ? this.datePipe.transform(plan.u_GDate, this.GenericForma.DateFormate) : null],
          U_AmtBeforeTax: [plan.u_AmtBeforeTax],
          U_Tax: [plan.u_Tax],
          U_UtilAmt: [plan.u_UtilAmt],
          U_AmtAfterTax: [plan.u_AmtAfterTax],
          U_AmtRcvd: [plan.u_AmtRcvd],
          U_ProfSent: [plan.u_ProfSent],
          U_Lock: [plan.u_Lock],
          U_Canceled: [plan.u_Canceled]
        }));
      });
    }

    this.AttachmentsList = [];

    // 🔹 Map server attachments first
    if (serverData.agreementAttachments && serverData.agreementAttachments.length > 0) {
      this.AttachmentsList = serverData.agreementAttachments.map((a: any) => ({
        Id: a.id ?? 0, // keep id if exists (for update/delete later)
        U_DType: a.u_DType,
        Name: a.name,
        U_AttName: a.u_AttName || '',  // backend may have different prop name
        FileURL2: this.configService.config.baseUrl + a.u_AttName
      }));
    }

    if (serverData.u_AGStatus === 3) {
      this.AcceptedFormisReadOnly = true;
    }
    if (serverData.u_AGType == 5) {
      this.form.get('RevenueRecognitionPlan')?.disable();
      this.form.get('InstallmentPlan')?.disable();
    }


    const currentUrl = this.location.path()
    // Replace the state with a new state object
    this.location.replaceState(currentUrl, '', { data: null })
  }

  UpdateCalculationInCaseOfRent(): void {

    const basedOn = this.form.value.CalculationBasedOn;
    const start = this.form.value.AgreementStartDate;
    const end = this.form.value.AgreementEndDate;

    // ✅ Basic validation
    if (!basedOn || !start || !end || this.UnitList.length === 0) {
      this.calculatedDiff = null;
      return;
    }

    // ✅ Only run for Rent type agreements
    if (String(this.form.get('AgreementType')?.value ?? '') !== '2') return;

    const s = new Date(start);
    const e = new Date(end);
    if (isNaN(s.getTime()) || isNaN(e.getTime()) || e < s) {
      this.calculatedDiff = null;
      return;
    }

    console.log('UnitList before calc:', JSON.stringify(this.UnitList));

    this.UnitList.forEach((unit: any) => {
      // const match = this.ItemsListData.find((m: any) => m.itemCode === unit.U_UnitCode);
      // if (!match) return;

      //const yearlyValue = Number(unit.totalRentPerYear || 0);

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
      const discountPercent = Number(unit.U_DiscPrc || 0);
      const discountAmount = parseFloat(((newTotal * discountPercent) / 100).toFixed(2));
      const afterDiscount = parseFloat((newTotal - discountAmount).toFixed(2));

      // ✅ Step 3: Apply tax
      const taxPercent = Number(unit.U_TaxPrc || 0);
      const taxAmount = parseFloat(((afterDiscount * taxPercent) / 100).toFixed(2));
      const totalAfterTax = parseFloat((afterDiscount + taxAmount).toFixed(2));

      // ✅ Step 4: Update Unit fields
      unit.U_Total = parseFloat(newTotal.toFixed(2));
      unit.U_DiscAmt = discountAmount;
      unit.U_TotAfterDisc = afterDiscount;
      unit.U_TaxAmt = taxAmount;
      unit.U_TotAfterTax = totalAfterTax;

      // (Optional) Update binding form controls if needed
      // this.UnitDetailform.patchValue(unit, { emitEvent: false });
    });

    console.log('UnitList after calc:', JSON.stringify(this.UnitList));

    this.GenerateInstallments();
    this.GenerateRevenueConfig();
  }
  private attachInstallmentCalculations(g: FormGroup) {
    
    const totalBeforeTax = this.UnitList?.reduce(
      (s: any, u: any) => s + Number(u.U_TotAfterDisc || 0), 0
    ) || 0;

    const TotalTaxAmount = this.UnitList?.reduce(
      (s: any, u: any) => s + Number(u.U_TaxAmt || 0), 0
    ) || 0;

    g.get('U_AmtBeforeTax')!.valueChanges.subscribe((amt: number | null) => {
      
      const newAmt = amt ?? 0;

      const newPct = totalBeforeTax === 0
        ? 0
        : +((newAmt / totalBeforeTax) * 100).toFixed(2);

      // 🔥 Tax proportional to percentage
      const newTax = +(TotalTaxAmount * newPct / 100).toFixed(2);

      g.patchValue({
        U_PrcUnit: newPct,
        U_Tax: newTax,
        U_AmtAfterTax: +(newAmt + newTax).toFixed(2)
      }, { emitEvent: false });
    });

    g.get('U_Tax')!.valueChanges.subscribe((amt: number | null) => {
      
      let newAmt = amt ?? 0;
      let newAfterTax = 0;
      let beforeTax = g.get('U_AmtBeforeTax')?.value;
      // let percent = (15 / 100) * beforeTax;
      // if (newAmt > percent) {
      //   this.toastr.info("Tax amount should be less then 15% of before tax amount of installment!", "Info");
      //   newAmt = percent
      // }
      newAfterTax = (beforeTax + newAmt).toFixed(2);

      g.patchValue({
        U_Tax: newAmt,
        U_AmtAfterTax: newAfterTax
      }, { emitEvent: false });
    });

  }
  onTaxBlur(g: FormGroup) {
    
    let tax = +g.get('U_Tax')!.value || 0;
    const beforeTax = +g.get('U_AmtBeforeTax')!.value || 0;

    const maxTax = +(beforeTax * 0.15).toFixed(2);

    if (tax > maxTax) {
      this.toastr.info(
        'Tax amount should be less than 15% of before tax amount!',
        'Info'
      );
      tax = maxTax;
    }
    const afterTax = +(beforeTax + tax).toFixed(2);
    g.patchValue({
      U_Tax: tax,
      U_AmtAfterTax: afterTax
    }, { emitEvent: false });
  }
  GetSAPSetting() {

    let url = '/MasterData/GetSAPConnectionSettings';
    this._service.Get(url).subscribe({
      next: result => {
        if (result.status) {
          this.SAPSettingList = result.data;
        }
        else {

          this.toastr.error(result.message, "Error", {
            progressBar: true,
            closeButton: true
          });
        }
      },
      error: (err: any) => { },
    });
  }
}
