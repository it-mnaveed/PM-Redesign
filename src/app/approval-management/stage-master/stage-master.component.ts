import { AfterViewInit, Component, ElementRef, OnInit, Renderer2, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { SharedService } from '../../_services/shared.service';
import { DataTableDirective } from 'angular-datatables';
import { Subject } from 'rxjs';
import { SharedHelper } from '../../_Helper/SharedHelper';
import { FormLabelHelper } from '../../_Helper/form-lable-helper';
import { PermissionsSharingService } from '../../_services/permissionsharing.service';
import { noWhitespaceValidator } from '../../_services/no-space-validator';

@Component({
  selector: 'app-stage-master',
  templateUrl: './stage-master.component.html',
  styleUrls: ['./stage-master.component.css']
})
export class StageMasterComponent implements OnInit, AfterViewInit {

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
  StageMasterList: any;
  AllowedPermissions: any;
  EmployeeList: any = [];
  stages: any[] = [];   // Local in-memory list
  editIndex: number | null = null;
  StageDetail: any = [];
  md_currentEmployeeId: any;
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

  openAdd() {
    this.isUpdate = false;
    this.clearForm();
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
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
      ordering:true,
      scrollX: true
    };

    this.form = this.formBuilder.group({
      Id: [0],
      StageName: ['', [Validators.required, noWhitespaceValidator]],
      Description: ['', [Validators.required, noWhitespaceValidator]],
      NumApprovals: [, [Validators.required, Validators.min(1)]],
      NumRejections: [, Validators.required],
      //EmployeeId: ['', Validators.required],
      IsActive: [true],
      CreatedBy: [parseInt(this.CurrentUserInfo.Id)],
      UpdatedBy: [parseInt(this.CurrentUserInfo.Id)],
      CreatedDate: [new Date()],
      UpdatedDate: [new Date()],
      StageDetail: []//this.formBuilder.array([])
    });
    // this.form.get('NumApprovals')?.valueChanges.subscribe(val => {
    //   this.setApprovals(val);
    // });
    this.GetUsersList();
    this.GetStageMaster();
  }
  private setApprovals(count: number | null) {
    const approvalsArray = this.approvals;
    const currentCount = approvalsArray.length;


    if (!count || count <= 0) {
      return; // just ignore instead of removing
    }

    // Case 1: Increase approvals → add new empty rows
    if (count > currentCount) {
      for (let i = currentCount; i < count; i++) {
        approvalsArray.push(
          this.formBuilder.group({
            UserId: ['', Validators.required],
            UserName: ['']
          })
        );
      }
    }

    // Case 2: Decrease approvals → remove extra rows but keep the first ones
    else if (count < currentCount) {
      for (let i = currentCount - 1; i >= count; i--) {
        approvalsArray.removeAt(i);
      }
    }

    // Case 3: Equal count → do nothing
  }

  get f() {
    return this.form.controls;
  }
  get approvals(): FormArray {
    return this.form.get('StageDetail') as FormArray;
  }
  onSubmit() {
    
    this.submitted = true;
    if (this.form.invalid) return;

    let formValue = this.form.value;
    if (formValue.NumApprovals != this.StageDetail.length) {
      this.toastr.warning("No of approver not equal to selected approver!", "Warning");
      return;
    }
    let postedData = {
      Id: formValue.Id,
      StageName: formValue.StageName,
      StageDescription: formValue.Description,        // map Description → StageDescription
      NumberOfApprovals: formValue.NumApprovals,      // map NumApprovals → NumberOfApprovals
      NumberOfRejectins: formValue.NumRejections,     // map NumRejections → NumberOfRejectins
      CreatedBy: formValue.CreatedBy,
      UpdatedBy: formValue.UpdatedBy,
      CreatedDate: formValue.CreatedDate,
      UpdatedDate: formValue.UpdatedDate,
      StageDetail: this.StageDetail
    };

    let url = '/DocumentApproval/add-stage';
    this._service.Post(postedData, url).subscribe({
      next: (result: any) => {
        if (result.status) {
          this.clearForm();
          this.toastr.success(result.message, "Success", {
            progressBar: true,
            closeButton: true
          });
          this.GetStageMaster();
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
    this.clearForm();
  }
  clearForm() {
    this.form.reset({
      Id: 0,
      StageName: '',
      Description: '',
      NumApprovals: 0,
      NumRejections: 0,
      IsActive: true
    });
    this.submitted = false;
    this.StageDetail = [];
  }
  GetStageMaster() {

    let url = '/DocumentApproval/get-stages';
    this._service.Get(url).subscribe({
      next: result => {
        if (result.status) {
          this.StageMasterList = result.data;

          this.rerender();
        }
      },
      error: (err: any) => { },
    });
  }
  onEmployeeChangeOld(selectedId: number, index: number) {
    const selectedEmp = this.EmployeeList.find((emp: any) => emp.id === selectedId);
    if (selectedEmp) {
      this.approvals.at(index).patchValue({
        UserName: selectedEmp.firstName + ' ' + selectedEmp.lastName
      });
    }
  }
  onEmployeeChange(selectedId: number) {
    const selectedEmp = this.EmployeeList.find((emp: any) => emp.id === selectedId);
    if (selectedEmp) {

    }
  }
  GetUsersList() {

    let url = '/UserManagement/GetUsersList';
    this._service.Get(url).subscribe({
      next: result => {
        if (result.status) {
          this.EmployeeList = result.data;

        } else {
          this.toastr.error(result.message);
        }
      },
      error: (err: any) => { },
    });
  }
  editStage(stage: any) {
    this.isUpdate = true;
    this.editIndex = this.StageMasterList.findIndex((s: any) => s.id === stage.id);

    // Patch main form fields
    this.form.patchValue({
      Id: stage.id,
      StageName: stage.stageName,
      Description: stage.stageDescription,
      NumApprovals: stage.numberOfApprovals,
      NumRejections: stage.numberOfRejectins,
      IsActive: (stage.isActive ?? stage.IsActive) ?? true,
      CreatedBy: stage.createdBy,
      UpdatedBy: this.CurrentUserInfo.Id,
      CreatedDate: stage.createdDate,
      UpdatedDate: new Date()
    });
    
    // Rebuild StageDetail FormArray
    if (stage.stageDetail && stage.stageDetail.length > 0) {
      // Normalize incoming detail items to expected shape { userId, userName }
      this.StageDetail = stage.stageDetail.map((d: any) => {
        const userId = d.userId ?? d.UserId ?? d.UserID ?? d.id ?? d.Id;
        const userName = d.userName ?? d.UserName ?? d.userNameText ?? d.name ?? (d.user ? (d.user.firstName && d.user.lastName ? d.user.firstName + ' ' + d.user.lastName : d.user.fullName) : undefined);
        return {
          userId: userId,
          userName: userName || ''
        };
      });
    } else {
      this.StageDetail = [];
    }
    // reset any selection in modal
    this.md_currentEmployeeId = null;
    // Open modal so user can edit inside modal
    this.showModal = true;
  }
  addStage() {
    if (!this.md_currentEmployeeId) {
      this.toastr.warning("Please select employee", "Warning")
      return; // no employee selected
    }

    const emp = this.EmployeeList.find((e: any) => e.id === this.md_currentEmployeeId);
    if (!emp) {
      this.toastr.warning("No employee found", "Warning")
      return;
    }

    // Check if already added
    const alreadyExists = this.StageDetail.some((s: any) => s.userId === emp.id);
    if (alreadyExists) {
      this.toastr.warning("Employee already exist", "Warning")
      return;
    }

    this.StageDetail.push({
      userId: emp.id,
      userName: emp.firstName + ' ' + emp.lastName
    });

    // Reset current selection
    this.md_currentEmployeeId = null;
  }
  removeStage(index: number) {
    this.StageDetail.splice(index, 1);
  }

}