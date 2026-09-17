import { AfterViewInit, Component, ElementRef, OnInit, Renderer2, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { SharedService } from '../../_services/shared.service';
import { DataTableDirective } from 'angular-datatables';
import { Subject } from 'rxjs';
import { SharedHelper } from '../../_Helper/SharedHelper';
import { FormLabelHelper } from '../../_Helper/form-lable-helper';
import { PermissionsSharingService } from '../../_services/permissionsharing.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-property-structur-list',
  templateUrl: './property-structur-list.component.html',
  styleUrls: ['./property-structur-list.component.css']
})
export class PropertyStructureListComponent implements OnInit, AfterViewInit {

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
  baseUrl: any = '/RoleManagement/';
  p: any;
  CurrentUserInfo: any | { Id: number; UserCode: string; FullName: string; RoleName: string; RoleID: number; UserImage: string; };
  GenericForma: { DateFormate: string; };
  ProjectsList: any;
  AllowedPermissions: any;
  ProjectDetails: any;
  constructor(
    private formBuilder: FormBuilder,
    private toastr: ToastrService,
    private _service: SharedService,
    private _sharedHelper: SharedHelper,
    private labelHelper: FormLabelHelper,
    private el: ElementRef,
    private renderer: Renderer2,
    private _permService: PermissionsSharingService,
    private router: Router
  ) {
    this.AllowedPermissions = this._permService.getPermissions();
    this.GenericForma = this._sharedHelper.getGenericFormate();
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
      ordering:false,
      // autoWidth:false,
      // scrollCollapse: true,
      scrollX: true
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
      DbName: ['', Validators.required],
      DbServerName: ['', Validators.required],
      ServiceLayerUrl: ['', Validators.required],
      CreatedBy: [parseInt(this.CurrentUserInfo.Id)],
      UpdatedBy: [parseInt(this.CurrentUserInfo.Id)],
      CreatedDate: [new Date()],
      UpdatedDate: [new Date()]
    });

    this.GetProjectListing();
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
          this.toastr.success(result.message, "Success", {
            progressBar: true,
            closeButton: true
          });
          this.GetProjectListing();
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
  GetProjectListing(id: any = 0) {

    let url = '/PropertyStructure/projects?id=' + id;
    this._service.Get(url).subscribe({
      next: result => {
        if (result.status) {
          if (id > 0) {
            
            this.ProjectDetails = result.data[0];
            ($('#detailModal') as any).modal('show');
            return;
          }
          this.ProjectsList = result.data;
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
  GetProjectDetail(id: any = 0, isUpdate: any = false) {

    let url = '/PropertyStructure/GetProjectWithDetailsAsync?projectId=' + id;
    this._service.Get(url).subscribe({
      next: result => {
        if (result.status) {
          if (id > 0) {
            
            this.ProjectDetails = result.data;
            let DataForUpdate = {
              data: this.ProjectDetails
            }
            if (isUpdate) {
              this.router.navigate(['/master/property-structure'], { state: { DataForUpdate } });
              return;
            }
            ($('#detailModal') as any).modal('show');
            return;
          }

        }
      },
      error: (err: any) => { },
    });
  }

}
