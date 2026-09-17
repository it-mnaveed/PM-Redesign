import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, Renderer2, ViewChild, ChangeDetectorRef, Output, EventEmitter, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { SharedService } from '../../_services/shared.service';
import { DataTableDirective } from 'angular-datatables';
import { Subject, Subscription, lastValueFrom } from 'rxjs';
import { SharedHelper } from '../../_Helper/SharedHelper';
import { FormLabelHelper } from '../../_Helper/form-lable-helper';
import { PermissionsSharingService } from '../../_services/permissionsharing.service';
import { ConfigService } from '../../_services/LoadConfigFile';
import { DatePipe, Location } from '@angular/common';
import { EnumService } from '../../_services/enum.service';

@Component({
  selector: 'app-suspensions',
  templateUrl: './suspensions.component.html',
  styleUrls: ['./suspensions.component.css']
})
export class SuspensionsComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {

  @ViewChild(DataTableDirective) dtElement: DataTableDirective;
  dtOptions: DataTables.Settings = {};
  dtTrigger: Subject<any> = new Subject();

  form: FormGroup;
  submitted = false;
  loading = false;
  isUpdate = false;
  RolesList: any;
  searchData = "";
  RecordCount: any;
  showForm = false;
  addBreadcrumb = false;
  showHidetable = true;
  baseUrl = '/RoleManagement/';
  p: any;
  CurrentUserInfo: any;
  SAPSettingList: any;
  AllowedPermissions: any;
  PermormaInvoiceLIst: any;
  AgreementList: any;
  bsInlineValue = new Date();
  datePickerConfig: any;
  activeTab = 'UnitDetail';
  SeriesList: any = [];
  SelectedAgreement: any = { agreementItems: [] };
  AgreementTypeListVlaues: any = [];
  SuspensionCheckListMaster: any = [];
  U_FltChrgListVlaues: any = [];
  TaxCodesList: any = [];
  SusmasterSelected: any;
  SelectedUnitCheckListMaster: any = [];
  SelectUnitForCheckList: any = { checkListMaster: [] };
  SeriesName: any;

  // subscription tracking to unsubscribe on destroy
  private subs: Subscription[] = [];
  SelectedSuspensionList: any;
  AgreementItemList: any[];
  AttachmentTypeListValues: any;
  AttachmentType: any;
  Description: any;
  FileURL: any;
  AttachmentsList: any = [];
  @Output() saved: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Input() modelData: any;

  constructor(
    private formBuilder: FormBuilder,
    private toastr: ToastrService,
    private _service: SharedService,
    private _sharedHelper: SharedHelper,
    private labelHelper: FormLabelHelper,
    private el: ElementRef,
    private renderer: Renderer2,
    private _permService: PermissionsSharingService,
    private configService: ConfigService,
    private datePipe: DatePipe,
    private cdr: ChangeDetectorRef,
    private enumService: EnumService,
    private location: Location
  ) {
    this.AllowedPermissions = this._permService.getPermissions();
    this.datePickerConfig = this._sharedHelper.getDateConfiguration();
  }

  ngAfterViewInit(): void {
    this.dtTrigger.next(null);
    this.labelHelper.markRequiredFields(this.form, this.el, this.renderer);
  }

  ngOnDestroy(): void {
    this.dtTrigger.unsubscribe();
    this.subs.forEach(s => s.unsubscribe());
  }

  rerender(): void {
    if (!this.dtElement) return;
    this.dtElement.dtInstance.then((dtInstance: DataTables.Api) => {
      dtInstance.destroy();
      this.dtTrigger.next(null);
    });
  }

  ngOnInit(): void {
    this.CurrentUserInfo = this._sharedHelper.getCurrentUserInfo();

    this.enumService.getAgreementTypes().subscribe(types => {
      this.AgreementTypeListVlaues = types;
    });

    this.dtOptions = {
      pagingType: 'full_numbers',
      pageLength: 10,
      processing: true,
      ordering: true
    };

    this.form = this.formBuilder.group({
      Id: [0],
      Name: [''],
      U_Seri: ['', Validators.required],
      U_DocNum: [''],
      U_AGID: [null, Validators.required],
      U_PDate: [new Date()],
      U_ResDate: [null],
      U_FltChrg: [null],
      U_FltChgAmt: [null],
      U_TaxCode: [''],
      U_TaxPrc: [null],
      U_TaxAmt: [null],
      U_TotAfterTax: [null],
      U_Desc: [''],
      CreatedBy: [parseInt(this.CurrentUserInfo.Id)],
      CreatedDate: [null],
      UpdatedBy: [parseInt(this.CurrentUserInfo.Id)],
      UpdatedDate: [null],
      // TODO: convert DocumentLines to FormArray when you implement add/remove UI for lines
      DocumentLines: [],
      AgreementType: ['', Validators.required],
      U_BPCode: [''],
      U_BPName: [''],
      U_CPName: [''],
      U_CustRefNo: [''],
      U_DocDate: [new Date()],
    });

    // get static lists once
    this.GetLovs();
    this.GetTaxCodes();
    this.GetMasterData();

    if (history.state && history.state.forward) {
      this.GetSuspensionList(history.state.forward.Id);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    const m = changes['modelData'];
    if (!m) return;
    const model = m.currentValue;
    if (!model) { try { this.clearForm(); this.isUpdate = false; } catch (e) {} ; return; }
    const id = model.id ?? model.Id;
    if (id) {
      // When modelData provided from parent, load it into form for editing
      try { this.GetSuspensionList(id); this.isUpdate = true; } catch (e) {}
      try { this.cdr.detectChanges(); } catch (e) {}
    }
  }

  get f() { return this.form.controls; }

  async onSubmit() {
    this.submitted = true;
    if (this.form.invalid) {
      return;
    }
    this.loading = true;
    const payload: any = { ...this.form.value };
    payload.U_DocNum = String(payload.U_DocNum ?? '');
    payload.U_Seri = String(payload.U_Seri ?? '');

    // guard for undefined agreementItems
    const items = (this.SelectedAgreement?.agreementItems || []).filter((unit: any) => unit.isSelected);
    console.log('selected units payload items: ', items);

    const agreementItems = items.map((unit: any) => {
      return {
        PMN_OUSSPId: unit.pmN_OUSSPId ?? 0,
        U_AgrItmId: unit.u_AgrItmId ?? unit.u_AgrItmId ?? unit.agrItemId, // try common keys
        Name: unit.u_UnitName ?? unit.Name ?? '',
        U_USID: unit.u_UnitCode,
        CreatedBy: unit.createdBy,
        CreatedDate: unit.createdDate,
        UpdatedBy: unit.updatedBy,
        UpdatedDate: unit.updatedDate,
        CheckListItems: (unit.checklist || unit.checkListMaster || [])
          .filter((chk: any) => chk.isSelected)
          .map((chk: any) => ({
            Name: chk.name,
            U_SuspID: chk.id,
            U_Flag: chk.isSelected ? 'Y' : 'N',
            CreatedBy: chk.createdBy,
            CreatedDate: chk.createdDate,
            UpdatedBy: chk.updatedBy,
            UpdatedDate: chk.updatedDate
          }))
      };
    });

    payload.AgreementItems = agreementItems;
    payload.Attachments = this.AttachmentsList;
    console.log('final payload', JSON.stringify(payload));

    const url = '/Suspension/PostSuspension';
    const sub = this._service.Post(payload, url).subscribe({
      next: (result: any) => {
        this.loading = false;
        if (result.status) {
          this.clearForm();
          this.toastr.success(result.message, "Success", { progressBar: true, closeButton: true });
          try { this.saved.emit(true); } catch (e) {}
        } else {
          this.toastr.error(result.message, "Error", { progressBar: true, closeButton: true });
        }
      },
      error: (err: any) => {
        this.loading = false;
        this.toastr.error('An error occurred while posting suspension', 'Error');
      }
    });
    this.subs.push(sub);
  }

  clearForm() {
    this.submitted = false;
    this.isUpdate = false;
    this.form.reset();
    this.SelectedAgreement = { agreementItems: [] };
    this.AttachmentsList = [];
    this.form.patchValue({
      Id: 0,
      CreatedBy: parseInt(this.CurrentUserInfo.Id),
      UpdatedBy: parseInt(this.CurrentUserInfo.Id),
      CreatedDate: new Date(),
      UpdatedDate: new Date(),
      U_PDate: new Date()
    });
  }

  // ---------- Improved async flow for loading lists ----------
  // Replaced polling with promise that resolves when the http completes
  GetSuspensionList(Id: any = 0) {
    const url = '/Suspension/suspension?id=' + Id;
    const sub = this._service.Get(url).subscribe({
      next: async result => {
        if (!result.status) { return; }

        if (Id > 0) {
          // initialize SelectedAgreement early so template has the property
          this.SelectedSuspensionList = {
            ...result.data[0],
            agreementItems: []    // ensure property exists for template
          };

          this.onDropdownChange(this.SelectedSuspensionList.agType, 'AgreementType');
          this.onDropdownChange(this.SelectedAgreement.u_FltChrg, 'U_FltChrg')
          // Wait for dependent lists & then patch the form. Using promise-wrapped calls below.
          await Promise.all([
            this.GetDocSeriesAsync(this.SelectedSuspensionList.agType),
            this.GetLovsAsync(),
            this.GetTaxCodesAsync(),
            this.Update(this.SelectedSuspensionList)
          ]);

          // Force change detection to ensure view updates (shouldn't be necessary if we replaced object, but safe)
          this.cdr.detectChanges();
          return;
        }

        this.rerender();
      },
      error: err => { /* handle error */ }
    });
    this.subs.push(sub);
  }

  // Convert GetDocSeries into a promise wrapper so callers can await it
  GetDocSeries(agrId: any) {
    const url = `/MasterData/GetDocSeries?agrmntId=${agrId}&docType=2`;
    const sub = this._service.Get(url).subscribe({
      next: result => { if (result.status) this.SeriesList = result.data; },
      error: () => { }
    });
    this.subs.push(sub);
  }

  GetDocSeriesAsync(agrId: any): Promise<void> {
    return new Promise((resolve) => {
      const url = `/MasterData/GetDocSeries?agrmntId=${agrId}&docType=2`;
      const sub = this._service.Get(url).subscribe({
        next: result => {
          if (result.status) this.SeriesList = result.data || [];
          resolve();
        },
        error: () => { resolve(); }
      });
      this.subs.push(sub);
    });
  }

  GetLovs() {
    const url = '/MasterData/GetLovs?Form=Suspension';
    const sub = this._service.Get(url).subscribe({
      next: result => {
        if (result.status) {
          // this.AgreementTypeListVlaues = result.data.filter((item: any) => item.field === 'AgreementType');
          this.U_FltChrgListVlaues = result.data.filter((item: any) => item.field === 'FaultCharges');
          this.AttachmentTypeListValues = result.data.filter((item: any) => item.field === 'AttachmentType');
        } else {

          this.toastr.error(result.message, "Error", {
            progressBar: true,
            closeButton: true
          });
        }
      },
      error: () => { }
    });
    this.subs.push(sub);
  }

  GetLovsAsync(): Promise<void> {
    return new Promise(resolve => {
      const url = '/MasterData/GetLovs?Form=Suspension';
      const sub = this._service.Get(url).subscribe({
        next: result => {
          if (result.status) {
            
            // this.AgreementTypeListVlaues = result.data.filter((item: any) => item.field === 'AgreementType');
            this.U_FltChrgListVlaues = result.data.filter((item: any) => item.field === 'FaultCharges');
          } else {

            this.toastr.error(result.message, "Error", {
              progressBar: true,
              closeButton: true
            });
          }
          resolve();
        },
        error: () => { resolve(); }
      });
      this.subs.push(sub);
    });
  }

  GetTaxCodes() {
    const url = '/MasterData/GetTaxCodes';
    const sub = this._service.Get(url).subscribe({
      next: result => {
        if (result.status) {
          this.TaxCodesList = result.data || [];
        } else {

          this.toastr.error(result.message, "Error", {
            progressBar: true,
            closeButton: true
          });
        }
      },
      error: () => { }
    });
    this.subs.push(sub);
  }

  GetTaxCodesAsync(): Promise<void> {
    return new Promise(resolve => {
      const url = '/MasterData/GetTaxCodes';
      const sub = this._service.Get(url).subscribe({
        next: result => {
          if (result.status) this.TaxCodesList = result.data || [];
          resolve();
        },
        error: () => { resolve(); }
      });
      this.subs.push(sub);
    });
  }

  async Update(res: any) {
    // Patch form
    // this.onDropdownChange(res.u_AGID, 'Agreements')
    
    this.SeriesName = res.u_SeriesName;
    this.form.patchValue({
      Id: res.id,
      Name: res.name,
      U_Seri: res.u_Seri,
      U_DocNum: res.u_DocNum,
      U_AGID: res.u_AGID,
      U_PDate: res.u_PDate ? new Date(res.u_PDate) : null,
      U_ResDate: res.u_ResDate ? new Date(res.u_ResDate) : new Date(),
      U_BPCode: res.u_BPCode,
      U_BPName: res.name,
      U_CPName: res.u_CPName,
      U_CustRefNo: res.u_CustRefNo,
      AgreementType: res.u_AGType,
      U_DocDate: res.u_AgtSDate ? new Date(res.u_AgtSDate) : null,
      U_TaxCode: res.u_TaxCode,
      U_FltChrg: String(res.u_FltChrg ?? ''),
      U_FltChgAmt: res.u_FltChgAmt,
      U_Desc: res.u_Desc
    });

    // assign agreementItems using a new object reference (ensures change detection)
    this.SelectedAgreement = {
      ...this.SelectedAgreement,
      ...res,
      // prefer res.agreementItems if provided, else try res.lineItems
      agreementItems: (res.agreementItems && res.agreementItems.length)
        ? res.agreementItems
        : (res.lineItems || [])
    };

    // If you need checklist mapping to master items, do it here
    if (this.SelectedAgreement.agreementItems && this.SuspensionCheckListMaster?.length) {
      this.SelectedAgreement.agreementItems = this.SelectedAgreement.agreementItems.map((el: any) => {
        const checklist = (el.checklist || []).map((chk: any) => ({
          ...chk,
          isSelected: chk.flag === 'Y' || chk.isSelected === true
        }));

        return {
          ...el,
          checklist,
          // ✅ mark the entire item selected if existsInOussp is true
          isSelected: el.existsInOussp === true,
          // for template backwards-compat: also set checkListMaster if used elsewhere
          checkListMaster: checklist
        };
      });
    }
    this.SelectedAgreement.attachments = this.SelectedAgreement.attachments.filter((a: any) => !a.isSuspensionActivity);

    if (this.SelectedAgreement.attachments) {
      for (let i = 0; i < this.SelectedAgreement.attachments.length; i++) {
        if (this.SelectedAgreement.attachments[i].filePath) {
          debugger
          this.SelectedAgreement.attachments[i].FileURL2 = this.configService.config.baseUrl + this.SelectedAgreement.attachments[i].filePath;
        }
      }
      this.AttachmentsList = this.SelectedAgreement.attachments;
    }
    // ensure Angular sees the changes
    this.cdr.detectChanges();
    const currentUrl = this.location.path()
    // Replace the state with a new state object
    this.location.replaceState(currentUrl, '', { data: null })
  }

  GetAgreementByAgreementType(Id: any = 0) {

    const url = '/Agreement/agreements?agrType=' + Id;
    const sub = this._service.Get(url).subscribe({
      next: result => {
        if (result.status) {

          if (Id > 0) {
            // if(this.form.value.Id > 0){
            //   return
            // }
            // this.SelectedAgreement = result.data[0];
          }
          this.AgreementList = result.data.filter((item: any) => item.approvalStatus === 'Approved');;
        } else {

          this.toastr.error(result.message, "Error", {
            progressBar: true,
            closeButton: true
          });
        }
      },
      error: () => { }
    });
    this.subs.push(sub);
  }

  GetAgreementdetailstList(Id: any = 0) {
    const url = '/Agreement/agreementDetailforSubDocumentbyAgrid?agrId=' + Id;
    const sub = this._service.Get(url).subscribe({
      next: result => {
        if (result.status && Id > 0) {

          this.SelectedAgreement = result.data[0] || { agreementItems: [] };
          // attach checklist master to each agreement item safely
          this.SelectedAgreement.agreementItems = (this.SelectedAgreement.agreementItems || []).map((element: any) => {
            const mapMaster = (this.SuspensionCheckListMaster || []).map((item: any) => {
              const existing = (element.checkListMaster || element.checklist || []).find((x: any) => x.id === item.id);
              return {
                ...item,
                isSelected: existing?.isSelected != null
                  ? existing.isSelected
                  : existing?.flag === 'Y'
              };
            });
            return {
              ...element,
              checkListMaster: mapMaster
            };
          });
        }
      },
      error: () => { }
    });
    this.subs.push(sub);
  }

  onDropdownChange(data: any, DDType: any) {
    if (DDType === 'Agreements') {
      const exist = this.AgreementList?.find((m: any) => m.id == data);
      this.GetAgreementdetailstList(data);
      if (exist) {
        let agTypeText = '';
        switch (exist.u_AGType) {
          case 1: agTypeText = 'Sale'; break;
          case 2: agTypeText = 'Rent'; break;
          case 3: agTypeText = 'Maintenance'; break;
          case 5: agTypeText = 'Off Plan'; break;
          default: agTypeText = '';
        }
        this.form.patchValue({
          AgreementType: agTypeText,
          U_BPCode: exist.u_BPCode,
          U_BPName: exist.name,
          U_CPName: exist.u_CPName,
          U_CustRefNo: exist.u_CustRefNo
        });
      }
    }
    if (DDType === 'Series') {
      const exist = this.SeriesList?.find((m: any) => m.id == data);
      if (exist) this.form.controls['U_DocNum'].setValue(exist.u_SNext);
    }
    if (DDType === 'Installments') {
      const exist = (this.SelectedAgreement?.agreementInstallments || []).find((m: any) => m.id == data);
      if (exist) {
        this.form.patchValue({
          inst_Perc: 100,
          inst_HGDate: this.datePipe.transform(exist.u_HDate, 'dd-MM-yyyy'),
          inst_Date: this.datePipe.transform(exist.u_GDate, 'dd-MM-yyyy'),
          inst_ARDP: '',
          inst_AmountBeforeTax: exist.u_AmtBeforeTax,
          inst_Tax: exist.u_Tax,
          inst_AmountAfterTax: exist.u_AmtAfterTax,
          inst_AmountReceived: exist.u_AmtAfterTax
        });
      }
    }
    if (DDType === 'AgreementType') {
      this.GetAgreementByAgreementType(data);
      let exist = this.AgreementTypeListVlaues.find((m: any) => m.fieldValue == data);
      if (exist) {
        this.GetDocSeries(exist.fieldValue)

      }
    }
  }

  switchTab(tabName: string, tabType: string) {
    if (tabType == 'header') this.activeTab = tabName;
  }

  GetMasterData() {
    const url = '/MasterData/GetMasterData?type=CheckList';
    const sub = this._service.Get(url).subscribe({
      next: result => {
        if (result.status) {
          this.SuspensionCheckListMaster = (result.data || []).filter((item: any) => item.type === 'Suspension');
        } else {

          this.toastr.error(result.message, "Error", {
            progressBar: true,
            closeButton: true
          });
        }
      },
      error: () => { }
    });
    this.subs.push(sub);
  }
  masterSelected = false;

  // header checkbox - toggles all shown rows
  toggleAll(type: any = '') {
    if (type) {
      // type indicates toggling checklist for a selected unit
      if (!this.SelectUnitForCheckList) return;
      (this.SelectUnitForCheckList.checkListMaster || []).forEach((r: any) => r.isSelected = !!this.SelectUnitForCheckList.SusmasterSelected);
    } else {
      (this.SelectedAgreement.agreementItems || []).forEach((r: any) => r.isSelected = !!this.masterSelected);
    }
  }

  checkIfAllSelected() {
    this.masterSelected = (this.SelectedAgreement.agreementItems || []).every((r: any) => r.isSelected);
  }

  AddCheckListMaster(SelectedUnit: any) {
    this.SelectUnitForCheckList = SelectedUnit || { checkListMaster: [] };
    // show modal (works with jQuery modal in your code)
    ($('#CheckListMasterModal') as any).modal('show');
  }

  // trackBy for ngFor for performance & stable identity
  trackByAgreementItem(index: number, item: any) {
    return item?.id ?? index;
  }

  AddRemoveAttachments(action: any, postdata: any) {

    if (action === 'add') {
      if (!this.AttachmentType || !this.Description || !this.FileURL) {
        this.toastr.warning("All fields are required", "Warning");
        return;
      }
      let data = {
        attachmentType: this.AttachmentType,
        description: this.Description,
        filePath: this.FileURL,
        FileURL2: this.FileURL,
        documentType: 'Suspension',
        createdBy: parseInt(this.CurrentUserInfo.Id)
      }

      if (data.filePath) {
        this.AttachmentsList.push(data);
        this.AttachmentType = "";
        this.Description = "";
        this.FileURL = "";
        data.documentType = '';
      }


    } else {
      this.AttachmentsList = this.AttachmentsList.filter((item: any) => item !== postdata);
    }
  }
  async onFileChange(event: any, fileInputRef: HTMLInputElement) {
    const base64: any = await this._sharedHelper.preview(event.target.files, 'image');
    if (base64) {
      this.FileURL = base64; // Optional: For <img [src]="previewImage">
    } else {
      this.toastr.error("Invalid file. Only JPG/PNG under 10MB allowed.");
      if (fileInputRef) fileInputRef.value = '';
    }
  }
}
