import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { SharedService } from '../../_services/shared.service';
import { InputFieldValidator } from '../../_Helper/InputFieldValidator';
import { DataTableDirective } from 'angular-datatables';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-parent-permissions',
  templateUrl: './parent-permissions.component.html',
  styleUrls: ['./parent-permissions.component.css']
})
export class ParentPermissionsComponent implements OnInit, AfterViewInit {

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
  showForm: boolean = false;
  addBreadcrumb: boolean = false;
  showHidetable: boolean = true;
  baseUrl: any = '/Permissions/';
  p: any;
  constructor(
    private formBuilder: FormBuilder,
    private toastr: ToastrService,
    private _service: SharedService,
    private _inputField: InputFieldValidator
  ) { }

  showModal: boolean = false;

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
      ordering:true,
      // autoWidth:false,
      // scrollCollapse: true,
      scrollX: true

    };

    this.form = this.formBuilder.group({
      Id: [0],
      Title: ['', Validators.required],
      Sorting: [null, Validators.required],
      Icon: ['', Validators.required],
      Url: ['', Validators.required],
    });
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
    let url = this.baseUrl + 'AddParentPermissions';
    this._service.Post(this.form.value, url).subscribe({
      next: (result: any) => {
        if (result.status) {
          this.clearForm();
          this.toastr.success(result.message, "Success", {
            progressBar: true,
            closeButton: true
          });
          this.GetParentPermissionsList();
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
          this.rerender();
          console.log(this.ParentPermissionsList)
        }
      },
      error: (err: any) => { },
    });
  }
  clearForm() {
    this.submitted = false;
    this.isUpdate = false;
    this.form.reset({ Id: 0, Title: '', Sorting: null, Icon: '', Url: '' });
  }
  Update(data: any) {
    
    this.isUpdate = true;
    this.form.controls['Id'].setValue(data['id']);
    this.form.controls['Title'].setValue(data['title']);
    this.form.controls['Sorting'].setValue(data['sorting']);
    this.form.controls['Icon'].setValue(data['icon']);
    this.form.controls['Url'].setValue(data['url']);
    // open modal for editing
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