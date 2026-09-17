import { AfterViewInit, Component, ElementRef, OnInit, Renderer2, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { SharedService } from '../../_services/shared.service';
import { DataTableDirective } from 'angular-datatables';
import { Subject } from 'rxjs';
import { SharedHelper } from '../../_Helper/SharedHelper';
import { FormLabelHelper } from '../../_Helper/form-lable-helper';
import { PermissionsSharingService } from '../../_services/permissionsharing.service';

@Component({
  selector: 'app-sap-connection-settings',
  templateUrl: './sap-connection-settings.component.html',
  styleUrls: ['./sap-connection-settings.component.css']
})
export class SAPConnectionSettingsComponent implements OnInit, AfterViewInit {

  @ViewChild(DataTableDirective)
  dtElement: DataTableDirective;
  dtOptions: DataTables.Settings = {};
  dtTrigger: Subject<any> = new Subject();

  form: FormGroup;
  submitted: boolean;
  loading: boolean;
  isUpdate: boolean;
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
  SAPSettingList: any;
  AllowedPermissions: any;
  constructor(
    private formBuilder: FormBuilder,
    private toastr: ToastrService,
    private _service: SharedService,
    private _sharedHelper: SharedHelper,
    private labelHelper: FormLabelHelper,
    private el: ElementRef,
    private renderer: Renderer2,
    private _permService: PermissionsSharingService
  ) {
    this.AllowedPermissions = this._permService.getPermissions();
  }


  ngAfterViewInit(): void {
    this.dtTrigger.next(null); // no need to pass 0
    this.labelHelper.markRequiredFields(this.form, this.el, this.renderer);
    this.dtElement.dtInstance.then((dtInstance: DataTables.Api) => {
      // Listen for search
      $('#datatable-id').on('search.dt', () => {
        
        const value = dtInstance.search();
        console.log('Current search value:', value);
      });
    });
  }
  onDtSearch(e: Event) {
    
    const val = (e.target as HTMLInputElement).value;
    console.log('CUSTOM full search value:', val);
    this.dtElement.dtInstance.then(dt => {
      dt.search(val).draw();
    });
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
      scrollX: true,
      // language: {
      //   searchPlaceholder: "Search records...",
      // }
    };


    this.form = this.formBuilder.group({
      Id: [0],
      SapUserName: ['', Validators.required],
      SapPassword: ['', Validators.required],
      SapServerAddress: ['', Validators.required],
      SapDbName: ['', Validators.required],
      SapDbType: ['', Validators.required],
      DbUserName: ['', Validators.required],
      DbPassword: ['', Validators.required],
      DbName: [''],
      DbServerName: [''],
      ServiceLayerUrl: ['', Validators.required],
      SAPRevenueAccount: [''],
      SAPDefferedRevenueAccount: [''],
      CreatedBy: [parseInt(this.CurrentUserInfo.Id)],
      UpdatedBy: [parseInt(this.CurrentUserInfo.Id)],
      CreatedDate: [new Date()],
      UpdatedDate: [new Date()],
      //-----------------Email Setting--------------
      FromEmail: ['', Validators.required],
      EmailPassword: ['', Validators.required],
      EmailHost: ['', Validators.required],
      EmailPort: ['', Validators.required],
      OffPlanMultiUnit: [false]
    });

    this.GetSAPSetting();
  }

  get f() { return this.form.controls; }
  onSubmit() {
    this.submitted = true;
    if (this.form.invalid) {
      return;
    }
    this.loading = true;

    let url = '/MasterData/PostSAPConnectionSettings';
    this._service.Post(this.form.value, url).subscribe({
      next: (result: any) => {
        if (result.status) {
          this.clearForm();
          this.closeModal();
          this.toastr.success(result.message, "Success", {
            progressBar: true,
            closeButton: true
          });
          this.GetSAPSetting();
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
  GetSAPSetting() {

    let url = '/MasterData/GetSAPConnectionSettings';
    this._service.Get(url).subscribe({
      next: result => {
        if (result.status) {
          this.SAPSettingList = result.data;
          this.rerender();
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
  clearForm() {
    this.submitted = false;
    this.isUpdate = false;
    this.form.reset();
    this.form.patchValue({
      Id: 0,
      CreatedBy: parseInt(this.CurrentUserInfo.Id),
      UpdatedBy: parseInt(this.CurrentUserInfo.Id),
      CreatedDate: new Date(),
      UpdatedDate: new Date()
    });
    this.showModal = false;
  }
  Update(data: any) {
    
    this.isUpdate = true;
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
      UpdatedDate: data.updatedDate,
      SAPRevenueAccount: data.sapRevenueAccount,
      SAPDefferedRevenueAccount: data.sapDefferedRevenueAccount,

      FromEmail: data.fromEmail,
      EmailPassword: data.emailPassword,
      EmailHost: data.emailHost,
      EmailPort: data.emailPort,
      OffPlanMultiUnit: data.offPlanMultiUnit
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

}