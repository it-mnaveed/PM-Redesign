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
  selector: 'app-series-master',
  templateUrl: './series-master.component.html',
  styleUrls: ['./series-master.component.css']
})
export class SeriesMasterComponent implements OnInit, AfterViewInit {

  @ViewChild(DataTableDirective)
  dtElement: DataTableDirective;
  dtOptions: DataTables.Settings = {};
  dtTrigger: Subject<any> = new Subject();

  form: FormGroup;
  submitted: boolean;
  loading: boolean;
  isUpdate: boolean;
  RolesList: any;
  S_next:any;
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
  SeriesList: any;
  AgreementTypeListVlaues: any;
  ItemGroupListVlaues: any;
  showModal: boolean = false;
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
      scrollX: true
    };


    this.form = this.formBuilder.group({
      id: [0],
      u_SName: ['', Validators.required],
      u_SStart: ['', Validators.required],
      u_SEnd: ['', Validators.required],
      u_SNext: [0],
      u_SPrefix: ['', Validators.required],
      u_AGRType: ['', Validators.required],
      u_DocType: ['', Validators.required],
      u_IsDefault: [false],
      u_Lock: [false],
      u_ItmGrpCode: ['', Validators.required],
      CreatedBy: [parseInt(this.CurrentUserInfo.Id)],
      UpdatedBy: [parseInt(this.CurrentUserInfo.Id)],
      CreatedDate: [new Date()],
      UpdatedDate: [new Date()]
    });


    this.GetDocSeries();
    this.GetLovs();
    this.GetItemgroup();

  }

  get f() { return this.form.controls; }
  onSubmit() {

    debugger
    this.submitted = true;

    if (this.form.invalid) {
      return;
    }

    this.loading = true;

    // Create payload from form
    const payload = { ...this.form.value };

    // Convert checkboxes (true/false) → 'Y'/'N'
    payload.u_IsDefault = payload.u_IsDefault ? 'Y' : 'N';
    payload.u_Lock = payload.u_Lock ? 'Y' : 'N';
    payload.u_SNext=payload.u_SStart;
   

    let url = '/MasterData/PostSeries';
    this._service.Post(payload, url).subscribe({
      next: (result: any) => {
        if (result.status) {
          this.clearForm();
          this.toastr.success(result.message, "Success", {
            progressBar: true,
            closeButton: true
          });
          this.GetDocSeries();
          this.closeModal();
        } else {
          this.toastr.error(result.message, "Error", {
            progressBar: true,
            closeButton: true
          });
        }
        this.loading = false;
      },
      error: (err: any) => {
        this.loading = false;
        this.toastr.error("Something went wrong", "Error");
      }
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
    this.isUpdate = true;
    this.form.patchValue({
      id: data.id,
      u_SName: data.u_SName,
      u_SStart: data.u_SStart,
      u_SEnd: data.u_SEnd,
      u_SNext: data.u_SNext,
      u_SPrefix: data.u_SPrefix,
      u_AGRType: data.u_AGRType,
      u_DocType: data.u_DocType,
      u_IsDefault: data.u_IsDefault === 'Y' || data.u_IsDefault === true,
      u_Lock: data.u_Lock === 'Y' || data.u_Lock === true,
      u_ItmGrpCode: data.u_ItmGrpCode,
      CreatedBy: data.createdBy || this.CurrentUserInfo.Id,
      UpdatedBy: data.updatedBy || this.CurrentUserInfo.Id,
      CreatedDate: data.createdDate || new Date(),
      UpdatedDate: data.updatedDate || new Date()
    });
    this.showModal = true;
  }

  openAdd() {
    this.clearForm();
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.submitted = false;
  }
  GetDocSeries() {
    let url = `/MasterData/GetAllSeries`;
    this._service.Get(url).subscribe({
      next: result => {
        if (result.status) {
          this.SeriesList = result.data;
          this.rerender();
        }
      },
      error: (err: any) => { },
    });
  }
  GetLovs() {

    let url = '/MasterData/GetLovs?Form=All';
    this._service.Get(url).subscribe({
      next: result => {
        if (result.status) {
          
          this.AgreementTypeListVlaues = result.data.filter(
            (item: any) => item.field === 'AgreementType'
          );
          // this.U_ReturnTypeVlaues = result.data.filter((item: any) => item.field === 'ReturnType');
          // this.AttachmentTypeListValues = result.data.filter((item: any) => item.field === 'AttachmentType');
        }
      },
      error: (err: any) => { },
    });
  }

  GetItemgroup() {

    let url = '/MasterData/itemGroup';
    this._service.Get(url).subscribe({
      next: result => {
        if (result.status) {
          
          this.ItemGroupListVlaues = result.data;
          // this.U_ReturnTypeVlaues = result.data.filter((item: any) => item.field === 'ReturnType');
          // this.AttachmentTypeListValues = result.data.filter((item: any) => item.field === 'AttachmentType');
        }
      },
      error: (err: any) => { },
    });
  }
}