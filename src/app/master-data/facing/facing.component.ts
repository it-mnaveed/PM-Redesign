import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { SharedService } from '../../_services/shared.service';
import { SharedHelper } from '../../_Helper/SharedHelper';
import { DataTableDirective } from 'angular-datatables';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-facing',
  templateUrl: './facing.component.html',
  styleUrls: ['./facing.component.css']
})
export class FacingComponent implements OnInit, AfterViewInit, OnDestroy {

  form!: FormGroup;
  submitted!: boolean;
  loading!: boolean;
  isUpdate!: boolean;
  RolesList: any;
  searchData = "";
  RecordCount: any;
  showForm: boolean = false;
  addBreadcrumb: boolean = false;
  showHidetable: boolean = true;
  baseUrl: any = '/RoleManagement/';
  p: any;
  typesList: string[] = ['Delivery check List', 'QA Review', 'Testing'];
  CurrentUserInfo: any | { Id: number; UserCode: string; FullName: string; RoleName: string; RoleID: number; UserImage: string; };
  DataList: any;
  @ViewChild(DataTableDirective)
  dtElement!: DataTableDirective;
  dtOptions: DataTables.Settings = {};
  dtTrigger: Subject<any> = new Subject();
  showModal: boolean = false;
  constructor(
    private formBuilder: FormBuilder,
    private toastr: ToastrService,
    private _service: SharedService,
    private _sharedHelper: SharedHelper
  ) { }

  ngOnInit(): void {

    this.CurrentUserInfo = this._sharedHelper.getCurrentUserInfo();

    this.form = this.formBuilder.group({
      id: [0],  // auto identity, usually not editable
      code: ['', [Validators.maxLength(50), Validators.required]],
      name: ['', [Validators.maxLength(50), Validators.required]],
      type: ['', [Validators.maxLength(50)]],
      status: [true],  // bit -> boolean
      createdBy: [parseInt(this.CurrentUserInfo?.Id) || 0],
      createdDate: [new Date()],
      updatedBy: [parseInt(this.CurrentUserInfo?.Id) || 0],
      updatedDate: [new Date()],
      masterDataType: ['Facing', [Validators.maxLength(50)]]
    });
    this.GetMasterData();
      this.dtOptions = {
        pagingType: 'full_numbers',
        pageLength: 10,
        processing: false,
        autoWidth: false,
        ordering: true
      };
  }
  ngAfterViewInit(): void {
    this.dtTrigger.next(null);
  }

  ngOnDestroy(): void {
    this.dtTrigger.unsubscribe();
  }
  get f() { return this.form.controls; }
  onSubmit() {
    
    this.submitted = true;
    if (this.form.invalid) {
      return;
    }
    this.loading = true;
    const { code, name, id } = this.form.value;

    // 🔍 Check duplicate CODE
    const duplicateCode = this.DataList.some((item: any) => item.code?.trim().toLowerCase() === code.trim().toLowerCase()
      && item.id !== id   // allow update of the same record
    );

    // 🔍 Check duplicate NAME
    const duplicateName = this.DataList.some(
      (item: any) => item.name?.trim().toLowerCase() === name.trim().toLowerCase()
        && item.id !== id
    );
    if (duplicateCode) {
      this.toastr.warning('Code already exists. Please use a different code.');
      return;
    }

    if (duplicateName) {
      this.toastr.warning('Name already exists. Please use a different name.');
      return;
    }

    let url = '/MasterData/PostMasterData';
    this._service.Post(this.form.value, url).subscribe({
      next: (result: any) => {
        if (result.status) {

          // this.toastr.success(result.message, "Success", {
          //   progressBar: true,
          //   closeButton: true
          // });
          this.GetMasterData();
          this.clearForm();
          this.closeModal();
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
  GetMasterData() {

    let url = '/MasterData/GetMasterData?type=Facing';
    this._service.Get(url).subscribe({
      next: result => {
        if (result.status) {
          this.DataList = result.data;
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
      id: 0,
      status: true,
      createdBy: parseInt(this.CurrentUserInfo?.Id) || 0,
      createdDate: new Date(),
      updatedBy: parseInt(this.CurrentUserInfo?.Id) || 0,
      updatedDate: new Date(),
      masterDataType: 'Facing'
    });
  }
  Update(data: any) {
    
    this.isUpdate = true;
    this.form.patchValue({
      id: data['id'],
      code: data['code'],
      name: data['name'],
      type: data['type'],
      status: data['status'],
      createdBy: data['createdBy'],
      createdDate: data['createdDate'],
      updatedBy: parseInt(this.CurrentUserInfo?.Id) || 0,
      updatedDate: new Date(),
      masterDataType: 'Facing'
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

  rerender(): void {
    if (!this.dtElement) return;
    this.dtElement.dtInstance.then((dtInstance: DataTables.Api) => {
      dtInstance.destroy();
      this.dtTrigger.next(null);
    });
  }
}