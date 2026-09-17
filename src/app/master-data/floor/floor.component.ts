import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { SharedService } from '../../_services/shared.service';
import { SharedHelper } from '../../_Helper/SharedHelper';
import { DataTableDirective } from 'angular-datatables';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-floor',
  templateUrl: './floor.component.html',
  styleUrls: ['./floor.component.css']
})
export class FloorComponent implements OnInit {
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
    showModal: boolean = false; // Added for modal control
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
        masterDataType: ['Floor', [Validators.maxLength(50)]]
      });
      this.dtOptions = {
        pagingType: 'full_numbers',
        pageLength: 10,
        processing: false,
        autoWidth: false,
        ordering: true
      };
      this.GetMasterData();
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
    const duplicateCode = this.DataList.some((item:any) => item.code?.trim().toLowerCase() === code.trim().toLowerCase()
        && item.id !== id   // allow update of the same record
    );

    // 🔍 Check duplicate NAME
    const duplicateName = this.DataList.some(
      (item:any) => item.name?.trim().toLowerCase() === name.trim().toLowerCase()
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
  
      let url = '/MasterData/GetMasterData?type=Floor';
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
  rerender(): void {
    if (!this.dtElement) return;
    this.dtElement.dtInstance.then((dtInstance: DataTables.Api) => {
      dtInstance.destroy();
      this.dtTrigger.next(null);
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
        masterDataType: 'Floor'
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
        masterDataType: 'Floor'
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
}
