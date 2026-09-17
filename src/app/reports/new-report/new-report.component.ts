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

@Component({
  selector: 'app-new-report',
  templateUrl: './new-report.component.html',
  styleUrls: ['./new-report.component.css']
})
export class NewReportComponent implements OnInit, AfterViewInit {

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
  showModal: boolean = false;
  baseUrl: any = '/RoleManagement/';
  p: any;
  CurrentUserInfo: any | { Id: number; UserCode: string; FullName: string; RoleName: string; RoleID: number; UserImage: string; };
  ReportsList: any;
  AllowedPermissions: any;
  datePickerConfig: any;
  bsInlineValue = new Date();
  LovsList: any;
  AgreementTypeListVlaues: any;
  AgreementList: any;
  GenericForma: { DateFormate: string; };
  currentStep: number = 1;
  totalSteps = 2;
  FileURL: any;
  constructor(
    private formBuilder: FormBuilder,
    private toastr: ToastrService,
    private _service: SharedService,
    private _sharedHelper: SharedHelper,
    private labelHelper: FormLabelHelper,
    private el: ElementRef,
    private renderer: Renderer2,
    private _permService: PermissionsSharingService,
    private configService:ConfigService
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
    if (!this.dtElement) return;
    this.dtElement.dtInstance?.then((dtInstance: DataTables.Api) => {
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
      ordering:false,
      scrollX: true
    };
    this.form = this.formBuilder.group({
      id: [0],                                  // PK, hidden or disabled
      code: ['', [Validators.required, Validators.maxLength(20)]],
      name: ['', [Validators.required, Validators.maxLength(50)]],
      fileURL: ['', [Validators.required]],                             // optional
      createdBy: [this.CurrentUserInfo.Id],                           // optional – typically set server-side
      updatedBy: [this.CurrentUserInfo.Id],                           // optional – typically set server-side
      createdDate: [new Date()],                 // or leave blank if server sets
      updatedDate: [null]                         // nullable
    });

    this.GetReports();
  }

  get f() { return this.form.controls; }
  onSubmit() {
    this.submitted = true;
    if (this.form.invalid) {
      return;
    }
    this.loading = true;
    let url = '/Reports/PostReports';
    this._service.Post(this.form.value, url).subscribe({
      next: (result: any) => {
        if (result.status) {
          this.clearForm();
          this.closeModal();
          this.toastr.success(result.message, "Success", {
            progressBar: true,
            closeButton: true
          });
          this.GetReports();
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
  GetReports() {
    let url = '/Reports/GetReports';
    this._service.Get(url).subscribe({
      next: result => {
        if (result.status) {
          this.ReportsList = result.data;
          this.ReportsList.forEach((element:any) => {
            element.rptURL = this.configService.config['rptURL']+'ReportViewer/CR_Viewer.aspx?ReportName='+element.fileURL
          });
          
          this.rerender();
        }
      },
      error: (err: any) => { },
    });
  }
  RemoveReport(Id: any) {
    let url = '/Reports/RemoveReport?Id=' + Id;
    this._service.Get(url).subscribe({
      next: result => {
        if (result.status) {
          this.toastr.success(result.message, "Success")
          this.GetReports();
        }
      },
      error: (err: any) => { },
    });
  }
  openReport(reporturl: string) {
  const url = reporturl;//`https://yourdomain.com/Reports/ReportViewer.aspx?id=${id}`;
  window.open(url, '_blank'); // _blank = new tab/window
}
  clearForm() {
    this.submitted = false;
    this.isUpdate = false;
    this.form.reset();

    this.form.patchValue({
      id: 0,
      createdBy: parseInt(this.CurrentUserInfo.Id),
      updatedBy: parseInt(this.CurrentUserInfo.Id),
      createdDate: new Date(),
      updatedDate: new Date()
    });
    this.showModal = false;
  }
  Update(data: any) {
    this.isUpdate = true;
    this.form.patchValue({
      id: data.id,
      code: data.code,
      name: data.name,
      fileURL: data.fileURL,
      createdBy: data.createdBy,
      updatedBy: data.updatedBy,
      createdDate: data.createdDate,
      updatedDate: data.updatedDate
    });
    this.showModal = true;

  }

  openAdd() {
    this.clearForm();
    this.isUpdate = false;
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  async onFileChange(event: any, fileInputRef: HTMLInputElement) {
    const base64: any = await this._sharedHelper.preview(event.target.files, 'rpt');
    if (base64) {
      this.FileURL = base64; // Optional: For <img [src]="previewImage">
      this.form.controls['fileURL'].setValue(this.FileURL);
    } else {
      this.toastr.error("Invalid file. Only RPT under 10MB allowed.");
      if (fileInputRef) fileInputRef.value = '';
    }
  }
}