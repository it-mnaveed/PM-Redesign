import { AfterViewInit, Component, ElementRef, OnInit, Renderer2, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { SharedService } from '../../_services/shared.service';
import { DataTableDirective } from 'angular-datatables';
import { Subject } from 'rxjs';
import { SharedHelper } from '../../_Helper/SharedHelper';
import { FormLabelHelper } from '../../_Helper/form-lable-helper';
import { PermissionsSharingService } from '../../_services/permissionsharing.service';
import { stringify } from 'querystring';

@Component({
  selector: 'app-revenue-population',
  templateUrl: './revenue-population.component.html',
  styleUrls: ['./revenue-population.component.css']
})
export class RevenuePopulationComponent implements OnInit, AfterViewInit {

  @ViewChild(DataTableDirective, { static: false })
  dtElement!: DataTableDirective;

  dtOptions: DataTables.Settings = {};
  dtTrigger: Subject<any> = new Subject();


  form: FormGroup;
  submitted: boolean = false;
  loading: boolean = false;
  isUpdate: boolean = false;
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
  datePickerConfig: any;
  bsInlineValue = new Date();



  GenericForma: { DateFormate: string; };
  currentStep: number = 1;
  totalSteps = 3;
  selectedAgreementForQuotation: any = [];
  SelectedAgreementForUpdate: any;
  ProjectList: any = [];
  BuildingList: any = [];
  ZoneList: any = [];
  SubZoneList: any = [];
  BL_Project: any;
  BL_Building: any;
  BL_Zone: any;
  BL_SubZone: any;
  agreementItems: any;
  masterSelected: any;
  draftdata: any;
  masterSelecteddrft: any;
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
    this.datePickerConfig = this._sharedHelper.getDateConfiguration();
    this.GenericForma = this._sharedHelper.getGenericFormate();
  }
  ngAfterViewInit(): void {
    this.dtTrigger.next(null);
    this.labelHelper.markRequiredFields(this.form, this.el, this.renderer);
  }

  rerender(): void {
    if (this.dtTrigger.closed) return;   // avoid ObjectUnsubscribedError
    this.dtElement.dtInstance?.then(dtInstance => {
      dtInstance.destroy();
      this.dtTrigger.next(null);
    });
  }


  ngOnDestroy(): void {
    this.dtTrigger.unsubscribe();
  }
  ngOnInit(): void {

    this.CurrentUserInfo = this._sharedHelper.getCurrentUserInfo();
    this.dtOptions = {
      pagingType: 'full_numbers',
      pageLength: 10,
      processing: true,
      ordering: true
    };


    this.form = this.formBuilder.group({
      Id: [0],
      EndDate: [new Date(), Validators.required],
      AgreementType: ['']
    });


    this.GetProject()
  }
  getStepClass(step: number) {
    if (step < this.currentStep) {
      return 'completed';
    } else if (step === this.currentStep) {
      return 'active';
    } else {
      return 'pending';
    }
  }
  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      if (this.currentStep === 1) {

        setTimeout(() => this.rerender());
      }
    }
  }

  nextStep() {
    
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
      if (this.currentStep === 2) {
        this.GetSearchquery(this.BL_Project, this.BL_Building, this.BL_Zone, this.BL_SubZone)

      }
      if (this.currentStep === 3) {
        this.onDataSubmit();

      }
    }
  }

  get f() { return this.form.controls; }
  onSubmit() {

  }
  clearForm() {

  }






  chnageWizard(step: any) {
    //this.currentStep = step;
  }
  GetProject() {
    debugger
    let url = '/PropertyStructure/projects?id=0';
    this._service.Get(url).subscribe({
      next: result => {
        if (result.status) {
          
          this.ProjectList = result.data
          // this.U_ReturnTypeVlaues = result.data.filter((item: any) => item.field === 'ReturnType');
          // this.AttachmentTypeListValues = result.data.filter((item: any) => item.field === 'AttachmentType');
        }
      },
      error: (err: any) => { },
    });
  }
  GetBuliding(id: any = 0) {


    let url = '/PropertyStructure/buildings?projectid=' + id;

    this._service.Get(url).subscribe({
      next: result => {
        if (result.status) {
          
          this.BuildingList = result.data
          // this.U_ReturnTypeVlaues = result.data.filter((item: any) => item.field === 'ReturnType');
          // this.AttachmentTypeListValues = result.data.filter((item: any) => item.field === 'AttachmentType');
        }
      },
      error: (err: any) => { },
    });
  }
  GetZone(id: any = 0) {

    let url = '/PropertyStructure/zones?buildingid=' + id;


    this._service.Get(url).subscribe({
      next: result => {
        if (result.status) {
          
          this.ZoneList = result.data
          // this.U_ReturnTypeVlaues = result.data.filter((item: any) => item.field === 'ReturnType');
          // this.AttachmentTypeListValues = result.data.filter((item: any) => item.field === 'AttachmentType');
        }
      },
      error: (err: any) => { },
    });
  }
  GetSubZone(id: any = 0) {


    let url = '/PropertyStructure/subzones?zoneid=' + id;

    this._service.Get(url).subscribe({
      next: result => {
        if (result.status) {
          
          this.SubZoneList = result.data
          // this.U_ReturnTypeVlaues = result.data.filter((item: any) => item.field === 'ReturnType');
          // this.AttachmentTypeListValues = result.data.filter((item: any) => item.field === 'AttachmentType');
        }
      },
      error: (err: any) => { },
    });
  }
  onDropdownChange(data: any, DDType: any) {


    debugger
    if (DDType == 'Project') {

      this.GetBuliding(data.id)
    }
    if (DDType === 'Building') {

      this.GetZone(data.id)
    }
    if (DDType === 'Zone') {


      this.GetSubZone(data.id)
    }
  }
  GetSearchquery(ProjectId: any = "", BuildingId: any = "", SectionID: any = "", SubSection: any = "") {


    let url = '/RevenuePopulation/GetRevenuePopulation?ProjectId=' + ProjectId + '&BuildingId=' + BuildingId + '&SectionID=' + SectionID + '&SubSection=' + SubSection;
    this._service.Get(url).subscribe({
      next: result => {
        if (result.status) {
          this.agreementItems = result.data;

        }
      },
      error: (err: any) => { },
    });

  }
  checkUncheckAll() {
    this.agreementItems.forEach((item: any) => {
      item.selected = this.masterSelected;
    });
  }
  isAllSelected() {
    this.masterSelected = this.agreementItems.every(
      (item: any) => item.selected === true
    );
  }

  getSelectedIds() {
    return this.agreementItems
      .filter((item: any) => item.selected)
      .map((item: any) => item.agid);
  }

  onDataSubmit() {
    
    const payload = this.agreementItems
      .filter((item: any) => item.selected)
      .map((item: any) => ({
        id: 0,  // new record
        name: item.itemName || '',
        u_AGID: item.agid || 0,
        u_ProjID: item.projCode || '',
        u_BldID: item.bldCode || '',
        u_SecID: item.secCode || '',
        u_Agr_ItemID: item.itemID || 0,
        u_SubSecID: item.subZoneCode || '',
        u_PrcUnit: item.textValue ? Number(item.textValue) : 0,  // textbox value
        U_GDate: this._sharedHelper.formatBootstrapDateOnly(item.u_GDate),
        U_RevGDate: this._sharedHelper.formatBootstrapDateOnly(item.u_RevGDate),
        u_HDate: '',
        u_AmtBeforeTax: 0,
        u_Tax: 0,
        u_AmtAfterTax: 0,
        u_Status: 0,
        u_RevRecID: 0,
        createdBy: this.CurrentUserInfo.Id,
        createdDate: new Date().toISOString(),
        updatedBy: 0,
        updatedDate: new Date().toISOString()
      }));
    if (payload.length == 0) {
      this.toastr.warning("Please Select Items!", "Required", {
        progressBar: true,
        closeButton: true
      });
      this.currentStep = 2;
      return
    }
    const url = '/RevenuePopulation/PostRevenuePopulationDraft';

    this._service.Post(payload, url).subscribe({
      next: (result: any) => {
        if (result.status) {

          this.draftdata = result.data
          this.rerender()


          this.toastr.success(result.message, 'Success', {
            progressBar: true,
            closeButton: true,
          });
        } else {
          this.toastr.error(result.message, 'Error', {
            progressBar: true,
            closeButton: true,
          });
          this.currentStep = 2;
        }
      },
      error: (err: any) => {
        console.error('Error posting data:', err);
        this.toastr.error('Failed to post data.', 'Error', {
          progressBar: true,
          closeButton: true,
        });
        this.currentStep = 2;
      },
    });
  }
  checkUncheckAlldrft() {
    this.draftdata.forEach((item: any) => {
      item.selected = this.masterSelecteddrft;
    });
  }
  isAllSelecteddrft() {
    this.masterSelecteddrft = this.draftdata.every(
      (item: any) => item.selected === true
    );
  }

  getSelectedIdsdrft() {
    return this.draftdata
      .filter((item: any) => item.selected)
      .map((item: any) => item.agid);
  }

  onDataPost() {
    

    // Collect selected item IDs
    const selectedIds = this.draftdata
      .filter((item: any) => item.selected)
      .map((item: any) => item.id)
      .join(','); // converts [1,2,3] → "1,2,3"

    const payload = {
      IDs: selectedIds
    };

    const url = '/RevenuePopulation/PostRPToAgrRevenue?IDs=' + payload.IDs;

    this._service.Get(url).subscribe({
      next: (result: any) => {
        if (result.status) {
          this.currentStep = 1;
          this.toastr.success(result.message, 'Success', {
            progressBar: true,
            closeButton: true,
          });
        } else {
          this.toastr.error(result.message, 'Error', {
            progressBar: true,
            closeButton: true,
          });
          this.currentStep = 3;
        }
      },
      error: (err: any) => {
        // console.error('Error posting data:', err);
        this.toastr.error('Failed to post data.', 'Error', {
          progressBar: true,
          closeButton: true,
        });
        this.currentStep = 3;
      },
    });
  }
  onCancalPost() {
    

    // Collect selected item IDs
    const selectedIds = this.draftdata
      .filter((item: any) => item.selected)
      .map((item: any) => item.id)
      .join(','); // converts [1,2,3] → "1,2,3"

    const payload = {
      IDs: selectedIds
    };

    const url = '/RevenuePopulation/CancelRevenuePopulationDraft?IDs=' + payload.IDs;

    this._service.Get(url).subscribe({
      next: (result: any) => {
        if (result.status) {
          this.currentStep = 1;
          this.toastr.success(result.message, 'Success', {
            progressBar: true,
            closeButton: true,
          });
        } else {
          this.toastr.error(result.message, 'Error', {
            progressBar: true,
            closeButton: true,
          });
          this.currentStep = 3;
        }
      },
      error: (err: any) => {
        console.error('Error posting data:', err);
        this.toastr.error('Failed to post data.', 'Error', {
          progressBar: true,
          closeButton: true,
        });
        this.currentStep = 3;
      },
    });
  }
  validatePercentage(data:any){
    if(data.textValue > 100){
      data.textValue = 100;
      this.toastr.info("Completion cannot greater than 100.","Info")
    }
  }
}