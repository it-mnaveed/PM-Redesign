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
  selector: 'app-approval-hierarchy',
  templateUrl: './approval-hierarchy.component.html',
  styleUrls: ['./approval-hierarchy.component.css']
})
export class ApprovalHierarchyComponent implements OnInit, AfterViewInit {

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
  SAPSettingList: any;
  AllowedPermissions: any;
  md_DocumentType: any;
  md_DocumentSubType: any;
  md_stageId: any;
  md_level: any;
  LevelsList: any = [];
  md_activeCheckBox: any;
  DocumentType: any = [
    { name: 'Agreement', value: 'Agreement' },
    { name: 'Proforma Invoice', value: 'Proforma Invoice' },
    { name: 'Unit Return', value: 'Unit Return' },
    { name: 'Ownership Transfer', value: 'Ownership Transfer' },
    { name: 'Suspension', value: 'Suspension' },
    { name: 'Renewal', value: 'Renewal' },
  ]
  DocumentSubType = [
    { name: 'Sales', value: 'Sales' },
    { name: 'Rent', value: 'Rent' },
    { name: 'Maintenance', value: 'Maintenance' },
    { name: 'Off_PlanSales', value: 'Off_PlanSales' }
  ];
  StageMasterList: any;
  TemplateDeatilList: any = [];
  md_id: number = 0;
  TemplateListing: any;
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
    // this.labelHelper.markRequiredFields(this.form, this.el, this.renderer);
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
      scrollX: true
    };
    this.LevelsList = [];
    for (let i = 1; i <= 20; i++) {

      let data = {
        name: i,
        value: i
      }
      this.LevelsList.push(data);
    }
    this.GetStageMaster();
    this.GetTemplateList();
  }

  //get f() { return this.form.controls; }
  onSubmit() {

    this.loading = true;
    if (this.TemplateDeatilList.length <= 0) {
      this.toastr.warning("Add atleast one record to save!", "Warning");
      return;
    }
    let url = '/DocumentApproval/approval-template';
    this._service.Post(this.TemplateDeatilList, url).subscribe({
      next: (result: any) => {
        if (result.status) {
          this.clearForm();
          this.toastr.success(result.message, "Success", {
            progressBar: true,
            closeButton: true
          });
          this.GetTemplateList();
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

  openAdd() {
    this.isUpdate = false;
    this.showModal = true;
    // ensure fields reset for a new entry
    this.resetFields();
    this.md_id = 0;
  }

  closeModal() {
    this.showModal = false;
  }
  GetTemplateList() {

    let url = '/DocumentApproval/getApproval-Template';
    this._service.Get(url).subscribe({
      next: result => {
        if (result.status) {
          this.TemplateListing = result.data;
          this.rerender();
        }
      },
      error: (err: any) => { },
    });
  }
  clearForm() {
    this.submitted = false;
    this.isUpdate = false;
    this.TemplateDeatilList = [];
    this.md_id = 0;
    this.resetFields();
    this.editIndex = null;
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
  GetStageMaster() {

    let url = '/DocumentApproval/get-stages';
    this._service.Get(url).subscribe({
      next: result => {
        if (result.status) {
          this.StageMasterList = result.data;
        }
      },
      error: (err: any) => { },
    });
  }
  editIndex: number | null = null;

  addTemplate() {

    if (
      !this.md_DocumentType ||
      !this.md_DocumentSubType ||
      !this.md_stageId ||
      !this.md_level
    ) {

      this.toastr.warning(
        'Document Type, Document Sub Type, Stage and Level are required.',
        'Validation'
      );

      return;
    }

    
    const newStage = {
      id: this.md_id || 0,
      docType: this.md_DocumentType,
      subType: this.md_DocumentSubType,
      stageId: this.md_stageId,
      level: this.md_level,
      flgActive: this.md_activeCheckBox,
      createdBy: parseInt(this.CurrentUserInfo?.Id) ?? null,
      createdDate: new Date(),
      updatedBy: null,
      updatedDate: null
    };
    let isDuplicate = this.TemplateDeatilList.some((s: any, index: number) =>
      index !== this.editIndex && // ✅ ignore the record being edited
      s.docType === this.md_DocumentType &&
      s.subType === this.md_DocumentSubType &&
      s.stageId === this.md_stageId &&
      s.level === this.md_level
    );
    if (isDuplicate) {
      this.toastr.warning('This combination already exists.', 'Warning');
      return;
    }
    isDuplicate = this.TemplateListing.some((s: any, index: number) =>
      index !== this.editIndex && // ✅ ignore the record being edited
      s.docType === this.md_DocumentType &&
      s.subType === this.md_DocumentSubType &&
      s.stageId === this.md_stageId &&
      s.level === this.md_level
    );
    if (isDuplicate) {
      this.toastr.warning('This combination already exists.', 'Warning');
      return;
    }

    if (this.md_id > 0) {
      this.TemplateDeatilList.push(newStage);
      this.onSubmit();
      return;
    }

    if (this.editIndex !== null) {
      this.TemplateDeatilList[this.editIndex] = { ...newStage };
      // this.toastr.success('Template updated successfully');
      this.editIndex = null; // reset
    } else {
      this.TemplateDeatilList.push(newStage);
      // this.toastr.success('Template added successfully');
    }

    this.resetFields();
  }

  resetFields() {
    // reset all modal/input fields to initial state
    this.md_DocumentType = null;
    this.md_DocumentSubType = null;
    this.md_stageId = null;
    this.md_level = null;
    this.md_activeCheckBox = false;
    this.md_id = 0;
  }
  removeTemplate(index: number) {
    this.TemplateDeatilList.splice(index, 1);
  }
  getStageName(id: any): string {
    const stage = this.StageMasterList.find((s: any) => s.id === id);
    return stage ? stage.stageName : '';
  }
  editTemplate(stage: any, index: number) {
    
    this.md_id = stage.id;
    this.md_DocumentType = stage.docType;
    this.md_DocumentSubType = stage.subType;
    this.md_stageId = stage.stageId;
    this.md_level = stage.level;
    this.md_activeCheckBox = stage.flgActive;
    this.editIndex = index; // mark row being edited
    this.isUpdate = true;
    // Open modal so user can edit values in the modal form
    this.showModal = true;
  }

}