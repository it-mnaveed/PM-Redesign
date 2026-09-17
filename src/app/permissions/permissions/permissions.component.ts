import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { SharedService } from '../../_services/shared.service';
import { InputFieldValidator } from '../../_Helper/InputFieldValidator';
import { DataTableDirective } from 'angular-datatables';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-permissions',
  templateUrl: './permissions.component.html',
  styleUrls: ['./permissions.component.css']
})
export class PermissionsComponent implements OnInit, AfterViewInit {

  @ViewChild(DataTableDirective)
  dtElement: DataTableDirective;
  dtOptions: DataTables.Settings = {};
  dtTrigger: Subject<any> = new Subject();

  form: FormGroup;
  submitted: boolean;
  loading: boolean;
  isUpdate: boolean;
  ParentPermissionsList: any;
  searchData = "";
  RecordCount: any;
  modelParrentId: any;
  p: any;
  baseUrl: any = '/Permissions/';
  PermissionsList: any;
  showModal: boolean = false;
  constructor(
    private formBuilder: FormBuilder,
    private toastr: ToastrService,
    private _service: SharedService,
    private _inputField: InputFieldValidator
  ) { }

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

    this.dtOptions = {
      pagingType: 'full_numbers',
      pageLength: 10,
      processing: true,
      ordering: true,
      scrollX: true
      // dom: 'lBfrtip'
    };


    this.form = this.formBuilder.group({
      Id: [0],
      ParrentId: [null, Validators.required],
      Title: ['', Validators.required],
      Icon: [''],
      FormUrl: ['', Validators.required],
      Sorting: [null, Validators.required],
      ShowInMenu: [false],
      CreatedBy: [''],
      CreatedDate: [null],
      UpdatedBy: [''],
      UpdatedDate: [null],
    });
    this.GetPermissionsList();
    this.GetParentPermissionsList();
  }
  get f() { return this.form.controls; }
  onSubmit() {
    
    this.submitted = true;
    if (this.form.invalid) {
      return;
    }
    let sorting = parseInt(this.form.value['Sorting']);
    this.form.controls['Sorting'].setValue(sorting)
    this.form.value.CreatedBy = '';
    if (this.form.value.Id == null) {
      this.form.value.Id = 0;
    }
    let url = this.baseUrl + 'AddPermissions';
    this._service.Post(this.form.value, url).subscribe({
      next: (result: any) => {
        if (result.status) {
          this.clearForm();
          this.toastr.success(result.message, "Success", {
            progressBar: true,
            closeButton: true
          });
          this.GetPermissionsList();
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
  onlyNumber(event: any) {

    return this._inputField.numberOnly(event);
  }
  GetParentPermissionsList() {

    let url = this.baseUrl + 'GetParentPermissions';
    this._service.Get(url).subscribe({
      next: result => {
        if (result.status) {
          this.ParentPermissionsList = result.data;
          console.log(this.ParentPermissionsList)
        }
      },
      error: (err: any) => { },
    });
  }
  GetPermissionsList() {

    let url = this.baseUrl + 'GetPermissions';
    this._service.Get(url).subscribe({
      next: result => {
        if (result.status) {
          this.PermissionsList = result.data;
          this.rerender();
        }
      },
      error: (err: any) => { },
    });
  }
  clearForm() {
    this.submitted = false;
    this.isUpdate = false;
    this.form.reset({
      Id: 0,
      ParrentId: null,
      Title: '',
      Icon: '',
      FormUrl: '',
      Sorting: null,
      ShowInMenu: false,
      CreatedBy: '',
      CreatedDate: null,
      UpdatedBy: '',
      UpdatedDate: null
    });
  }
  Update(data: any) {
    
    this.isUpdate = true;
    this.form.controls['Id'].setValue(data['id']);
    this.modelParrentId = parseInt(data['parrentId']);
    this.form.controls['ParrentId'].setValue(this.modelParrentId);
    this.form.controls['Title'].setValue(data['title']);
    this.form.controls['Sorting'].setValue(data['sorting']);
    this.form.controls['Icon'].setValue(data['icon']);
    this.form.controls['FormUrl'].setValue(data['formUrl']);
    this.form.controls['ShowInMenu'].setValue(data['showInMenu']);
    // Open modal for editing
    this.showModal = true;
  }

  openAdd() {
    this.isUpdate = false;
    this.clearForm();
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }
}