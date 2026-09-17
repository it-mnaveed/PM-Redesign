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
import { EnumService } from '../../_services/enum.service';

@Component({
  selector: 'app-performa-invoice',
  templateUrl: './performa-invoice.component.html',
  styleUrls: ['./performa-invoice.component.css']
})
export class PerformaInvoiceComponent implements OnInit, AfterViewInit {

  @ViewChild(DataTableDirective)
  dtElement!: DataTableDirective;
  dtOptions: DataTables.Settings = {};
  dtTrigger: Subject<any> = new Subject();

  form!: FormGroup;
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
  PermormaInvoiceLIst: any;
  AgreementList: any;
  bsInlineValue = new Date();
  datePickerConfig: any;
  activeTab: string = 'UnitDetail';
  SeriesList: any;
  SelectedAgreement: any = {};
  AgreementTypeListVlaues: any;
  FileURL: any;
  AttachmentTypeListValues: any;
  Att_Description: any;
  AttachmentType: any;
  AttachmentsList: any = [];
  @Output() saved: EventEmitter<boolean> = new EventEmitter<boolean>();

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
    private enumService: EnumService
  ) {
    this.AllowedPermissions = this._permService.getPermissions();
    this.datePickerConfig = this._sharedHelper.getDateConfiguration();
  }

  ngAfterViewInit(): void {
    this.dtTrigger.next(null); // no need to pass 0
    this.labelHelper.markRequiredFields(this.form, this.el, this.renderer);
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

    this.enumService.getAgreementTypes().subscribe(types => {
      this.AgreementTypeListVlaues = types;
    });

    this.form = this.formBuilder.group({
      Id: [0],
      Name: [''],
      U_AGID: ['', Validators.required],
      U_InstID: ['', Validators.required],
      U_BPCode: [''],
      U_BPName: [''],
      U_CPName: [''],
      U_CustRefNo: [''],
      U_DocDate: [new Date(), Validators.required],
      U_PostingDate: [new Date()],
      U_EntryDate: [null],
      U_DocNum: [''],
      U_Seri: ['', Validators.required],
      U_Stauts: [null],
      U_GLEntry: [''],
      U_CrNote: [''],
      U_GLDraft: [''],
      U_CRNDraft: [''],
      CreatedBy: [parseInt(this.CurrentUserInfo.Id)],
      CreatedDate: [new Date()],
      UpdatedBy: [parseInt(this.CurrentUserInfo.Id)],
      UpdatedDate: [null],
      AgreementType: [''],
      ProjectId: [null],
      ProjectName: [''],
      BuildingId: [null],
      BuildingName: [''],
      ZoneId: [null],
      ZoneName: [''],
      SubZoneId: [null],
      SubZoneName: [''],
      UnitCode: [''],
      UnitSize: [''],
      StatusName: ['Draft'],
      //Extra Fields to set values on installment selection
      inst_Perc: [''],
      inst_HGDate: [''],
      inst_Date: [''],
      inst_ARDP: [''],
      inst_AmountBeforeTax: [''],
      inst_Tax: [''],
      inst_AmountAfterTax: [''],
      inst_AmountReceived: [''],
      inst_UtilAmt: [''],

    });
    // this.GetPermormaInvoiceLIst();

    this.GetLovs();
    // if (history.state && history.state.forward) {

    //   this.GetPerformaList(history.state.forward.data);
    // }

  }

  get f() { return this.form.controls; }
  onSubmit() {
    this.submitted = true;
    if (this.form.invalid) {
      return;
    }
    
    this.loading = true;
    const payload = { ...this.form.value };
    payload.U_AGID = String(payload.U_AGID ?? '');
    payload.U_InstID = String(payload.U_InstID ?? '');
    payload.U_DocNum = String(payload.U_DocNum ?? '');
    payload.U_Seri = String(payload.U_Seri ?? '');
    payload.U_CRNDraft = 'N';
    payload.U_GLDraft = 'N';
    payload.U_DocDate = this._sharedHelper.formatBootstrapDateOnly(payload.U_DocDate)
    payload.Attachements = this.AttachmentsList;

    let url = '/PerformaInvoice/postopi';
    this._service.Post(payload, url).subscribe({
      next: (result: any) => {
        if (result.status) {
          this.clearForm();
          this.toastr.success(result.message, "Success", {
            progressBar: true,
            closeButton: true
          });
          // notify parent that save succeeded
          try { this.saved.emit(true); } catch (e) { }

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
  // GetPermormaInvoiceLIst() {

  //   let url = '/MasterData/GetSAPConnectionSettings';
  //   this._service.Get(url).subscribe({
  //     next: result => {
  //       if (result.status) {
  //         this.PermormaInvoiceLIst = result.data;
  //         this.rerender();
  //       }
  //     },
  //     error: (err: any) => { },
  //   });
  // }
  clearForm() {
    this.submitted = false;
    this.isUpdate = false;
    this.form.reset();
    this.AttachmentsList = []
    this.SelectedAgreement = {}
    this.form.patchValue({
      Id: 0,
      CreatedBy: parseInt(this.CurrentUserInfo.Id),
      UpdatedBy: parseInt(this.CurrentUserInfo.Id),
      CreatedDate: new Date(),
      UpdatedDate: new Date()
    });
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

  GetAgreementFilterList(Id: any = 0) {
    debugger
    let url = '/Agreement/agreements?agrType=' + Id;
    this._service.Get(url).subscribe({
      next: result => {
        if (result.status) {
          

          //  this.AgreementList = result.data.filter((item: any) => item.u_AGStatus === 3);
          this.AgreementList = result.data.filter((item: any) =>
            item.u_AGStatus === 3 ||
            item.u_AGStatus === 7 ||
            (item.isUnderProvision === true && item.u_AGStatus === 2)
          );

          console.log(JSON.stringify(this.AgreementList));
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
  GetAgreementdetailstList(Id: any = 0) {
    debugger
    let url = '/Agreement/agreementDetailforSubDocumentbyAgrid?agrId=' + Id;
    this._service.Get(url).subscribe({
      next: result => {
        if (result.status) {
          if (Id > 0) {
            debugger
            this.SelectedAgreement = result.data[0];

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
  onDropdownChange(data: any, DDType: any) {
    debugger
    if (DDType == 'Agreements') {
      let exist = this.AgreementList.find((m: any) => m.id == data);
      this.GetAgreementdetailstList(data);
      if (exist) {
        let agTypeText = '';

        switch (exist.u_AGType) {
          case 1:
            agTypeText = 'Sale';
            break;
          case 2:
            agTypeText = 'Rent';
            break;
          case 3:
            agTypeText = 'Maintenance';
            break;
          case 5:
            agTypeText = 'Off Plan';
            break;
          default:
            agTypeText = '';
        }

        this.form.patchValue({
          AgreementType: agTypeText,
          U_BPCode: exist.u_BPCode,
          U_BPName: exist.name,
          U_CPName: exist.u_CPName,
          U_CustRefNo: exist.u_CustRefNo,
          // U_Seri: null,
          U_Stauts: exist.status,
          U_InstID: null,
          inst_Perc: null,
          inst_HGDate: '',
          inst_Date: '',
          inst_ARDP: '',
          inst_AmountBeforeTax: null,
          inst_Tax: null,
          inst_AmountAfterTax: null,
          inst_AmountReceived: null,

        });

        //  this.GetDocSeries(exist.u_AGType);

      }
    }
    if (DDType === 'Series') {
      debugger
      let exist = this.SeriesList.find((m: any) => m.id == data);
      if (exist) {
        this.form.patchValue({

          U_DocNum: exist.u_SNext
        });

      }

    }
    if (DDType === 'Installments') {
      let exist = this.SelectedAgreement.agreementInstallments.find((m: any) => m.id == data);
      if (exist) {

        this.form.patchValue({
          inst_Perc: exist.u_PrcUnit,
          inst_HGDate: this.datePipe.transform(exist.u_HDate, 'dd-MM-yyyy'),
          inst_Date: this.datePipe.transform(exist.u_GDate, 'dd-MM-yyyy'),
          inst_ARDP: '',
          inst_AmountBeforeTax: exist.u_AmtBeforeTax,
          inst_Tax: exist.u_Tax,
          inst_AmountAfterTax: exist.u_AmtAfterTax,
          inst_AmountReceived: exist.u_AmtAfterTax,
          inst_UtilAmt: exist.u_UtilAmt
        });
      }
    }
  }
  switchTab(tabName: string, tabType: string) {
    if (tabType == 'header') {
      this.activeTab = tabName;
    }

  }
  GetDocSeries(agrId: any) {
    let url = `/MasterData/GetDocSeries?agrmntId=${agrId}&docType=2`;
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
          // this.AgreementTypeListVlaues = result.data.filter((item: any) => item.field === 'AgreementType');
          this.AttachmentTypeListValues = result.data.filter((item: any) => item.field === 'AttachmentType');
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
  onDropDownChange(data: any, form: any) {
    if (form === 'AgreementType') {
      this.AttachmentsList = []
      this.SelectedAgreement = {}
      this.form.patchValue({
        U_AGID: '',
        U_BPCode: '',
        U_BPName: '',
        U_CPName: '',
        U_CustRefNo: '',
        U_Seri: null,
        U_DocNum: ' '

      });
      this.GetAgreementFilterList(data);
      let exist = this.AgreementTypeListVlaues.find((m: any) => m.fieldValue == data);
      if (exist) {
        this.GetDocSeries(exist.fieldValue)

      }
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
  AddRemoveAttachments(action: any, postdata: any) {

    if (action === 'add') {
      if (!this.AttachmentType || !this.Att_Description || !this.FileURL) {
        this.toastr.warning("All fields are required", "Warning");
        return;
      }
      let data = {
        u_UniqueName: this.AttachmentType,
        name: this.Att_Description,
        u_Path: this.FileURL,
        FileURL2: this.FileURL,
      }

      if (data.u_Path) {
        this.AttachmentsList.push(data);
        this.AttachmentType = "";
        this.Att_Description = "";
        this.FileURL = "";
      }


    } else {
      this.AttachmentsList = this.AttachmentsList.filter((item: any) => item !== postdata);
    }
  }
  // GetPerformaList(data: any){
  //        debugger
  //   this.SelectedAgreement.agreementItems={...data.agreementItems};
  //   this.AttachmentsList=data.attachements






  // }
}