import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { SharedService } from '../../_services/shared.service';
import { DataTableDirective } from 'angular-datatables';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-roles',
  templateUrl: './roles.component.html',
  styleUrls: ['./roles.component.css']
})
export class RolesComponent implements OnInit, AfterViewInit {

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
  constructor(
    private formBuilder: FormBuilder,
    private toastr: ToastrService,
    private _service: SharedService
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
      // autoWidth:false,
      // scrollCollapse: true,
      scrollX: true

      // scrollY: '50vh'
    };


    this.form = this.formBuilder.group({
      Id: [0],
      RoleName: ['', Validators.required],
      CreatedBy: [''],
      Description: ['', Validators.required],
      IsActive: [false],
      SaleAgreement: [false],
      RentAgreement: [false],
      OffPlanAgreement: [false],
      MaintenanceAgreement: [false],

    });
    this.GetRolesList();
  }
  get f() { return this.form.controls; }
  onSubmit() {
    this.submitted = true;
    if (this.form.invalid) {
      return;
    }
    this.loading = true;
    this.form.value.CreatedBy = '';
    if (this.form.value.Id == null) {
      this.form.value.Id = 0;
    }
    let url = this.baseUrl + 'PostRoles';
    this._service.Post(this.form.value, url).subscribe({
      next: (result: any) => {
        if (result.status) {
            this.clearForm();
            this.closeModal();
            this.toastr.success(result.message, "Success", {
            progressBar: true,
            closeButton: true
          });
          this.GetRolesList();
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
  GetRolesList() {
    let url = this.baseUrl + 'GetRoles';
    this._service.Get(url).subscribe({
      next: result => {
        if (result.status) {

          this.RolesList = result.data;
          
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
      IsActive: false,
      Id: 0
    });
    this.showModal = false;
  }
  Update(data: any) {
    
    this.isUpdate = true;
    this.form.controls['Id'].setValue(data['id']);
    this.form.controls['RoleName'].setValue(data['roleName']);
    this.form.controls['Description'].setValue(data['description']);
    this.form.controls['CreatedBy'].setValue(data['createdBy']);
    this.form.controls['IsActive'].setValue(data['isActive']);

    this.form.controls['SaleAgreement'].setValue(data['saleAgreement']);
    this.form.controls['RentAgreement'].setValue(data['rentAgreement']);
    this.form.controls['OffPlanAgreement'].setValue(data['offPlanAgreement']);
    this.form.controls['MaintenanceAgreement'].setValue(data['maintenanceAgreement']);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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