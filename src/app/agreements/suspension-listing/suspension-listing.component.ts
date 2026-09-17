import { AfterViewInit, Component, ElementRef, OnInit, Renderer2, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { SharedService } from '../../_services/shared.service';
import { DataTableDirective } from 'angular-datatables';
import { Subject } from 'rxjs';
import { SharedHelper } from '../../_Helper/SharedHelper';
import { FormLabelHelper } from '../../_Helper/form-lable-helper';
import { PermissionsSharingService } from '../../_services/permissionsharing.service';
import { ConfigService } from '../../_services/LoadConfigFile';
import { Router } from '@angular/router';
import { EnumService } from '../../_services/enum.service';
import { DatePipe } from '@angular/common';
import { ExcelExportService } from '../../_services/excel-export.service';

@Component({
  selector: 'app-suspension-listing',
  templateUrl: './suspension-listing.component.html',
  styleUrls: ['./suspension-listing.component.css']
})

export class SuspensionListingComponent implements OnInit, AfterViewInit {
  @ViewChild(DataTableDirective)
  dtElement: DataTableDirective;
  dtOptions: DataTables.Settings = {};
  dtTrigger: Subject<any> = new Subject();

  searchData = "";
  RecordCount: any;
  showForm: boolean = false;
  addBreadcrumb: boolean = false;
  showHidetable: boolean = true;

  p: any;
  CurrentUserInfo: any | { Id: number; UserCode: string; FullName: string; RoleName: string; RoleID: number; UserImage: string; };
  PerformaList: any;
  AllowedPermissions: any;
  SelectedAgreement: any = {};
  activeTab: string = "UnitDetail";
  UnitactiveTab: string = '';
  GenericForma: { DateFormate: string; };
  AgreementTypeListVlaues: any;
  SeriesList: any;
  AgreementList: any;
  TaxCodesList: any;
  U_FltChrgListVlaues: any;
  AttachmentTypeListValues: any;
  AttachmentType: any;
  Description: any;
  FileURL: any;
  currentDate: Date;
  showModal: boolean = false;
  RegularAttachments: any;
  ActivityLogAttachments: any;
  bsInlineValue = new Date();
  datePickerConfig: any;
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
    private router: Router,
    private enumService: EnumService,
    private datePipe: DatePipe,
    private expExcel: ExcelExportService
  ) {
    this.AllowedPermissions = this._permService.getPermissions();
    this.GenericForma = this._sharedHelper.getGenericFormate();
    this.currentDate = new Date();
    this.datePickerConfig = this._sharedHelper.getDateConfiguration();
  }
  ngAfterViewInit(): void {
    this.dtTrigger.next(null); // no need to pass 0

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
      ordering: true,
      scrollX: true
    };
    this.enumService.getAgreementTypes().subscribe(types => {
      this.AgreementTypeListVlaues = types;
    });

    this.GetSuspensionList();
    this.GetLovs();
    this.GetTaxCodes();

  }

  openAdd() {
    if (this.AllowedPermissions && this.AllowedPermissions['canCreate']) {
      // clear any previously selected agreement
      this.SelectedAgreement = {};
      this.showModal = true;
    } else {
      this.toastr.error("You don't have permission to create Suspension", "Permission Denied", {
        progressBar: true,
        closeButton: true
      });
    }
  }

  closeModal() {
    this.showModal = false;
    this.GetSuspensionList();
  }
  GetSuspensionList(Id: any = 0, isUpdate: boolean = false) {

    let url = '/Suspension/suspension?id=' + Id
    this._service.Get(url).subscribe({
      next: result => {
        if (result.status) {

          if (Id > 0) {
            this.SelectedAgreement = result.data[0];
            console.log(JSON.stringify(this.SelectedAgreement))
            
            this.SelectedAgreement.u_FltChrgName = this.getFaultChargeName(this.SelectedAgreement.u_FltChrg);
            this.SelectedAgreement.u_taxCodeName = this.getTaxCodeName(this.SelectedAgreement.u_TaxCode);

            if (this.SelectedAgreement.attachments) {
              for (let i = 0; i < this.SelectedAgreement.attachments.length; i++) {
                if (this.SelectedAgreement.attachments[i].filePath) {

                  this.SelectedAgreement.attachments[i].FileURL2 = this.configService.config.baseUrl + this.SelectedAgreement.attachments[i].filePath;
                }
              }
              const attachments = this.SelectedAgreement.attachments || [];

              // List where activity is true
              this.ActivityLogAttachments = attachments.filter((a: any) => a.isSuspensionActivity);
              // List where activity is false
              this.SelectedAgreement.attachments = attachments.filter((a: any) => !a.isSuspensionActivity);
            }
            this.SelectedAgreement.u_ResDate = this.datePipe.transform(this.SelectedAgreement.u_ResDate, this.GenericForma.DateFormate),

              this.activeTab = 'UnitDetail';
              this.FileURL = '';
              if (isUpdate) {
                // open the embedded modal for editing; toggle to ensure fresh input
                this.showModal = false;
                setTimeout(() => { this.showModal = true; }, 0);
                return;
              }
              ($('#detailModal') as any).modal('show');
              return;
          }

          this.PerformaList = result.data.sort((a: any, b: any) => {
            return new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime();
          });
          //this.PerformaList = result.data;

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


  get ousspItems() {
    return this.SelectedAgreement?.lineItems?.filter((x: any) => x.existsInOussp);
  }
  GetFilterSuspensionByAgreementType(AgreementID: any = 0) {

    let url = '/Suspension/suspension?id= 0&agrType=' + AgreementID;
    this._service.Get(url).subscribe({
      next: result => {
        if (result.status) {

          // this.PerformaList = result.data;

          this.PerformaList = result.data.sort((a: any, b: any) => {
            return new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime();
          });
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

  switchTab(tabName: string, tabType: string) {
    if (tabType == 'header') {
      this.activeTab = tabName;
    } else {
      this.UnitactiveTab = tabName;
    }

  }
  GetLovs() {

    let url = '/MasterData/GetLovs?Form=Suspension';
    this._service.Get(url).subscribe({
      next: result => {

        if (result.status) {

          this.AttachmentTypeListValues = result.data.filter((item: any) => item.field === 'AttachmentType');
          this.U_FltChrgListVlaues = result.data.filter((item: any) => item.field === 'FaultCharges');
          console.log(JSON.stringify(this.U_FltChrgListVlaues))
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
  getFaultChargeName(id: number): string {
    return this.U_FltChrgListVlaues.find((x: any) => x.fieldValue == id)?.fieldName || '-';
  }
  getTaxCodeName(id: any): string {
    
    return this.TaxCodesList.find((x: any) => x.code == id)?.name || '-';
  }
  onDropDownChange(data: 0) {

    this.GetFilterSuspensionByAgreementType(data);
  }
  Update(SusPId: any) {
    // Open the embedded modal for editing
    this.GetSuspensionList(SusPId, true);
  }

  GetAgreementFilterList(Id: any = 0) {

    let url = '/Agreement/agreements?agrType=' + Id;
    this._service.Get(url).subscribe({
      next: result => {
        if (result.status) {
          if (Id > 0) {

            this.SelectedAgreement = result.data[0];
          }
          this.AgreementList = result.data;

          // this.rerender();
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
  GetTaxCodes() {

    let url = '/MasterData/GetTaxCodes';
    this._service.Get(url).subscribe({
      next: result => {
        if (result.status) {
          this.TaxCodesList = result.data;
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
  GetLovsUpdate() {
    let url = '/MasterData/GetLovs?Form=Suspension';
    this._service.Get(url).subscribe({
      next: result => {
        if (result.status) {

          this.AgreementTypeListVlaues = result.data.filter((item: any) => item.field === 'AgreementType');
          this.U_FltChrgListVlaues = result.data.filter((item: any) => item.field === 'FaultCharges');
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
  async onFileChange(event: any, fileInputRef: HTMLInputElement) {
    const base64: any = await this._sharedHelper.preview(event.target.files, 'image');
    if (base64) {
      this.FileURL = base64; // Optional: For <img [src]="previewImage">
    } else {
      this.toastr.error("Invalid file. Only JPG/PNG under 10MB allowed.");
      if (fileInputRef) fileInputRef.value = '';
    }
  }
  AddActivityLog() {

    let PostedData = {
      AttachmentType: this.AttachmentType,
      Description: this.Description,
      FilePath: this.FileURL,
      DocumentId: this.SelectedAgreement.id,
      CreatedBy: parseInt(this.CurrentUserInfo.Id)
    }
    let url = '/Suspension/PostSuspensionActivity';
    this._service.Post(PostedData, url).subscribe({
      next: (result: any) => {
        if (result.status) {
          this.GetSuspensionList();
          this.AttachmentType = '';
          this.Description = '';
          this.FileURL = '';

          ($('#detailModal') as any).modal('hide');
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
  ResumeSuspension() {

    if (!this.SelectedAgreement.u_ResDate) {
      this.toastr.warning("Please fill resume date", "Warning");
      return;
    }
    this.SelectedAgreement.u_ResDate = this._sharedHelper.formatBootstrapDateOnly(this.SelectedAgreement.u_ResDate);
    let url = '/Suspension/ResumeSuspension';

    this._service.Post(this.SelectedAgreement, url).subscribe({
      next: (result: any) => {
        if (result.status) {
          this.GetSuspensionList();

          ($('#detailModal') as any).modal('hide');
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
  exportData() {
    if (!this.AgreementList || this.AgreementList.length == 0) {
      this.toastr.info("There is no data available to export!", "Info");
      return;
    }
    this.expExcel.exportToExcel(this.AgreementList, 'SuspensionList')
  }
}