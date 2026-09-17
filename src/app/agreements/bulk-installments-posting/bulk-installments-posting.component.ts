import { AfterViewInit, Component, ElementRef, OnInit, Renderer2, ViewChild, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { SharedService } from '../../_services/shared.service';
import { DataTableDirective } from 'angular-datatables';
import { Subject } from 'rxjs';
import { SharedHelper } from '../../_Helper/SharedHelper';
import { FormLabelHelper } from '../../_Helper/form-lable-helper';
import { PermissionsSharingService } from '../../_services/permissionsharing.service';
import { ConfigService } from '../../_services/LoadConfigFile';
import { DatePipe } from '@angular/common';
import { ExcelExportService } from '../../_services/excel-export.service';

@Component({
  selector: 'app-bulk-installments-posting',
  templateUrl: './bulk-installments-posting.component.html',
  styleUrls: ['./bulk-installments-posting.component.css']
})
export class BulkInstallmentsComponent implements OnInit, AfterViewInit {

  @ViewChild(DataTableDirective)
  dtElement: DataTableDirective;
  dtOptions: DataTables.Settings = {};
  dtTrigger: Subject<any> = new Subject();

  Searchform: FormGroup;
  submitted: boolean;
  loading: boolean;
  isUpdate: boolean;
  RolesList: any;
  searchData = "";
  RecordCount: any;
  BPF_code: any;
  BPF_Name: any
  BPT_code: any;
  BPT_Name: any
  Posting_date: any;
  Due_date: any
  Doc_Num: any;
  SirCode: any
  bsInlineValue = new Date();
  datePickerConfig: any;
  masterSelected: boolean = false;
  showForm: boolean = false;
  addBreadcrumb: boolean = false;
  showHidetable: boolean = true;
  baseUrl: any = '/RoleManagement/';
  p: any;
  CurrentUserInfo: any | { Id: number; UserCode: string; FullName: string; RoleName: string; RoleID: number; UserImage: string; };
  SAPSettingList: any;
  GenericForma: { DateFormate: string; };
  BPList: any[] = [];
  AllowedPermissions: any;
  SeriesList: any;
  renualItemList: any = [];
  Document_Date: any = new Date();
  TotalAmount: any = 0;
  @Output() saved: EventEmitter<boolean> = new EventEmitter<boolean>();
  constructor(
    private formBuilder: FormBuilder,
    private toastr: ToastrService,
    private _service: SharedService,
    private _sharedHelper: SharedHelper,
    private labelHelper: FormLabelHelper,
    private el: ElementRef,
    private expExcel: ExcelExportService,
    private datePipe: DatePipe,
    private renderer: Renderer2,

    private _permService: PermissionsSharingService
  ) {
    this.AllowedPermissions = this._permService.getPermissions();
    this.datePickerConfig = this._sharedHelper.getDateConfiguration();
    this.GenericForma = this._sharedHelper.getGenericFormate();
  }


  ngAfterViewInit(): void {
    this.dtTrigger.next(null); // no need to pass 0
    this.labelHelper.markRequiredFields(this.Searchform, this.el, this.renderer);
  }

  ngOnDestroy(): void {
    // ✅ Prevent memory leaks
    this.dtTrigger.unsubscribe();
  }
  rerender(): void {
    this.dtElement.dtInstance.then((dtInstance: DataTables.Api) => {
      dtInstance.destroy();
      this.dtTrigger.next(null);
    });
  }
  ngOnInit(): void {
    this.CurrentUserInfo = this._sharedHelper.getCurrentUserInfo();
    this.dtOptions = {
      pagingType: 'full_numbers',
      pageLength: 10,
      processing: true,
      ordering: true
    };

    this.Searchform = this.formBuilder.group({
      Id: [0],
      FromCustomer: ['', Validators.required],
      ToCustomer: [''],
      DueDate: ['', Validators.required],
      PostingDate: ['', Validators.required],
      DeliveryDate: ['', Validators.required],
      Series: ['', Validators.required],
      DocNum: ['', Validators.required],
    });
    this.GetDocSeries();
  }
  get f() { return this.Searchform.controls; }
  GetSearchquery() {

    this.clearAllValidators();
    this.f['FromCustomer'].setValidators([Validators.required]);
    //this.f['ToCustomer'].setValidators([Validators.required]);
    this.f['DueDate'].setValidators([Validators.required]);

    this.updateValidationState();

    this.submitted = true;

    if (this.Searchform.invalid) return;
    
    let data = this.Searchform.value;
    this.BPF_code = data.FromCustomer;
    this.BPT_code = data.ToCustomer;
    this.Due_date = data.DueDate;

    let formattedDate = this.datePipe.transform(this.Due_date, 'yyyy-MM-dd');
    let url = '/PerformaInvoice/GetBulkInstallments?fromCustomer=' + this.BPF_code + '&toCustomer=' + this.BPT_code + '&duedate=' + formattedDate;
    this._service.Get(url).subscribe({
      next: result => {
        if (result.status) {
          this.renualItemList = result.data;
          this.rerender();
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
  clearAllValidators() {
    Object.keys(this.f).forEach(key => {
      this.f[key].clearValidators();
      this.f[key].setErrors(null);
    });
  }

  updateValidationState() {
    Object.keys(this.f).forEach(key => {
      this.f[key].updateValueAndValidity();
    });
  }
  onSubmit() {

    Object.keys(this.f).forEach(key => {
      if (key != 'ToCustomer' && key != 'Id') {
        this.f[key].setValidators([Validators.required]);
      }
    });

    // Refresh validation state
    this.updateValidationState();

    this.submitted = true;

    if (this.Searchform.invalid) return;

    let selected = this.renualItemList
      .filter((item: any) => item.selected);
    if (selected.length === 0) {
      this.toastr.warning("Please select atleast one record for posting", "Warning");
      return;
    }
    let data = this.Searchform.value;
    this.BPF_code = data.FromCustomer;
    this.BPT_code = data.ToCustomer;
    this.Due_date = data.DueDate;
    this.Posting_date = data.PostingDate;
    this.Doc_Num = data.DocNum;
    this.SirCode = data.Series;

    let formattedDate = this.datePipe.transform(this.Due_date, 'yyyy-MM-dd');
    let postingDate = this.datePipe.transform(this.Posting_date, 'yyyy-MM-dd');
    const payload = {
      id: 0,
      name: "",
      u_AGType: 0,
      u_FBPCode: this.BPF_code,
      u_TBPCode: this.BPT_code,
      u_PDate: postingDate,//this.Posting_date,
      u_DDate: formattedDate,
      u_Seri: String(this.SirCode),
      u_DocNum: String(this.Doc_Num),
      createdBy: this.CurrentUserInfo.Id,
      createdDate: new Date().toISOString(),
      updatedBy: 0,
      updatedDate: new Date().toISOString(),
      PMN_OPI: this.renualItemList
        .filter((item: any) => item.selected)
        .map((item: any) => ({
          id: 0,
          PMN_ORRPId: 0,
          name: " ",
          U_InstID: String(item.instId ?? ''),
          U_BPCode: item.u_BPCode,
          U_DocNum: String(this.Doc_Num ?? ''),
          U_Seri: String(this.SirCode),
          U_AGID: String(item.u_AGID ?? ''),
          U_DocDate: this.Document_Date.toISOString(),
          CreatedBy: parseInt(this.CurrentUserInfo.Id),
          createdDate: new Date().toISOString(),
          updatedBy: 0,
          updatedDate: new Date().toISOString()
        }))
    };


    let url = '/PerformaInvoice/PostBulkProformaInvoices';
    this._service.Post(payload, url).subscribe({
      next: (result: any) => {
        if (result.status) {
          this.clearForm();
          this.toastr.success(result.message, "Success", {
            progressBar: true,
            closeButton: true
          });
          this.GetDocSeries();
          try { this.saved.emit(true); } catch (e) {}

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

  clearForm() {
    this.BPF_Name = null;
    this.BPF_code = null;
    this.BPT_Name = null;
    this.BPT_code = null;
    this.Due_date = null;
    this.SirCode = null;
    this.Doc_Num = null;
    this.renualItemList = [];
    this.masterSelected = false;
    this.TotalAmount = 0;
    this.rerender();
    this.Searchform.reset({
      Id: 0
    });
    this.submitted = false;
  }
  Update(data: any) {

    this.Searchform.patchValue({
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
  onBPfromChange(event: any) {

    let exist = this.BPList.find((m: any) => m.cardCode == event);

    if (exist) {
      this.renualItemList = [];
      this.rerender();
      this.BPF_Name = exist.cardName
    }
  }
  onBPtoChange(event: any) {

    let exist = this.BPList.find((m: any) => m.cardCode == event);
    if (exist) {
      this.renualItemList = [];
      this.rerender();
      this.BPT_Name = exist.cardName
    }
  }
  GetDocSeries() {
    let url = `/MasterData/GetDocSeries?agrmntId=1&docType=2`;
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
  onDropdownChange(data: any, DDType: any) {

    if (DDType === 'Series') {
      let exist = this.SeriesList.find((m: any) => m.id == data);
      if (exist) {
        this.Doc_Num = exist.u_SNext
        this.Searchform.controls['DocNum'].setValue(this.Doc_Num);
      }
    }

  }
  checkUncheckAll() {
    this.renualItemList.forEach((item: any) => {
      item.selected = this.masterSelected;
    });

    this.TotalAmount = this.renualItemList
      .filter((x: any) => x.selected)
      .reduce((sum: any, x: any) => sum + (Number(x.u_AmtAfterTax) || 0), 0);

  }
  isAllSelected() {
    this.masterSelected = this.renualItemList.every(
      (item: any) => item.selected === true
    );

    this.TotalAmount = this.renualItemList
      .filter((x: any) => x.selected)
      .reduce((sum: any, x: any) => sum + (Number(x.u_AmtAfterTax) || 0), 0);

  }

  getSelectedIds() {
    return this.renualItemList
      .filter((item: any) => item.selected)
      .map((item: any) => item.agrItemId);
  }
  exportDataDetail() {
    
    if (!this.renualItemList || this.renualItemList.length == 0) {
      this.toastr.info("There is no data available to export!", "Info");
      return;
    }
    this.expExcel.exportToExcel(this.renualItemList, 'BulkInstallmentDetail')
  }

}