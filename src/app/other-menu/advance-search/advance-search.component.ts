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
  selector: 'app-advance-search',
  templateUrl: './advance-search.component.html',
  styleUrls: ['./advance-search.component.css']
})
export class AdvanceSearchComponent implements OnInit, AfterViewInit {

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
  FloorList: any = [];
  PropertyStatuses = [
    { code: 'Suspend', name: 'Suspend' },
    { code: 'Available', name: 'Available' },
    { code: 'Sold', name: 'Sold' },
    { code: 'Rented', name: 'Rented' },
    { code: 'Delivered', name: 'Delivered' },
    { code: 'UnderEvac', name: 'UnderEvac' },
    { code: 'Terminated', name: 'Terminated' },
    { code: 'Returned', name: 'Returned' }
  ];
  ProjectList = [

  ];
  BuildingList = [

  ];
  ZoneList = [

  ];
  SubZoneList = [

  ];
  PropertyTypeList = [
    { code: 'RES', name: 'Residential' },
    { code: 'COM', name: 'Commercial' },
    { code: 'ENT', name: 'Entertainment' }
  ];
  // FloorList = [
  //   { code: 'F1', name: 'Ground Floor' },
  //   { code: 'F2', name: '1st Floor' }
  // ];
  DistrictList = [
    { code: 'D1', name: 'District 1' },
    { code: 'D2', name: 'District 2' }
  ];
  CityList = [
    { code: 'C1', name: 'City 1' },
    { code: 'C2', name: 'City 2' }
  ];
  RegionList = [
    { code: 'R1', name: 'Region 1' },
    { code: 'R2', name: 'Region 2' }
  ];
  FacingList: any = [];
  projectlist: any;
  UnitCategoriesList: any = [];

  constructor(
    private fb: FormBuilder,
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
      ordering: true,
      scrollX: true,
    };


    this.form = this.fb.group({
      project: [''],
      building: [''],
      zone: [''],
      subZone: [''],
      propertyItemType: [''],
      unitCategory: [''],
      propertyStatus: [''],
      floor: [''],
      district: [''],
      city: [''],
      region: [''],
      facingCode: [''],

      // Facilities (Y/N checkboxes)
      electricity: [],
      water: [],
      gas: [],
      furnished: [],
      basement: [],
      swimmingPool: [],
      ac: [],
      fullKitchen: [],
      elevator: [],
      openSpace: [],
      garden: [],
      nearbyPark: [],

      U_Electricity: [],
      U_Water: [],
      U_Gas: [],
      U_Furnished: [],
      U_Basement: [],
      U_SwmPool: [],
      U_AC: [],
      U_FullKitchen: [],
      U_Elevator: [],
      U_OpenSpace: [],
      U_Garden: [],
      U_NearbyPark: [],

      // Ranges
      fromBedrooms: [],
      toBedrooms: [],
      fromOtherRooms: [],
      toOtherRooms: [],
      fromWashRooms: [],
      toWashRooms: [],
      fromParkings: [],
      toParkings: [],
      fromServantQuarter: [],
      toServantQuarter: [],
      fromUnitSizeSQM: [],
      toUnitSizeSQM: [],
      fromAnnualRentSQM: [],
      toAnnualRentSQM: [],
      fromTotalRentPerYear: [],
      toTotalRentPerYear: [],
      fromLastRenovated: [],
      toLastRenovated: [],
      fromPropertyAge: [],
      toPropertyAge: []
    });


    this.GetProject();
    this.GetBuliding();
    this.GetZone();
    this.GetSubZone();
    this.GetMasterData();
    this.GetFacingList();
    this.GetUnitCategories();

  }
  GetUnitCategories() {
    
    let url = '/MasterData/GetUnitCategory';
    this._service.Get(url).subscribe({
      next: result => {
        if (result.status) {
          
          this.UnitCategoriesList = result.data;

        }
      },
      error: (err: any) => { },
    });
  }
  GetFacingList() {

    let url = '/MasterData/GetMasterData?type=Facing';
    this._service.Get(url).subscribe({
      next: result => {
        if (result.status) {
          this.FacingList = result.data;

        }
      },
      error: (err: any) => { },
    });
  }
  GetMasterData() {

    let url = '/MasterData/GetMasterData?type=Floor';
    this._service.Get(url).subscribe({
      next: result => {
        if (result.status) {
          this.FloorList = result.data;

        }
      },
      error: (err: any) => { },
    });
  }
  get f() { return this.form.controls; }

  onSubmit() {
    this.submitted = true;
    if (this.form.invalid) return;

    // let payload = { ...this.form.value };
    // payload.project = String(payload.project);
    // payload.building = String(payload.building);
    // payload.zone = String(payload.zone);
    // payload.subZone = String(payload.subZone);
    // // Convert checkboxes: boolean → 'Y'/'N'
    // [
    //   "U_Electricity", "U_Water", "U_Gas", "U_Furnished", "U_Basement", "U_SwmPool",
    //   "U_AC", "U_FullKitchen", "U_Elevator", "U_OpenSpace", "U_Garden", "U_NearbyPark"
    // ].forEach(key => {
    //   payload[key] = payload[key] ? 'Y' : null;
    // });

    let payload = { ...this.form.value };

    payload.project = String(payload.project);
    payload.building = String(payload.building);
    payload.zone = String(payload.zone);
    payload.subZone = String(payload.subZone);

    // Map U_ keys to backend keys
    const amenityMap: any = {
      U_Electricity: "Electricity",
      U_Water: "Water",
      U_Gas: "Gas",
      U_Furnished: "Furnished",
      U_Basement: "Basement",
      U_SwmPool: "SwimmingPool",
      U_AC: "AC",
      U_FullKitchen: "FullKitchen",
      U_Elevator: "Elevator",
      U_OpenSpace: "OpenSpace",
      U_Garden: "Garden",
      U_NearbyPark: "NearbyPark"
    };

    // Convert boolean → 'Y'/null and rename
    Object.keys(amenityMap).forEach(frontKey => {
      const backKey = amenityMap[frontKey];
      payload[backKey] = payload[frontKey] ? "Y" : null;
      delete payload[frontKey];
    });


    let url = '/MasterData/AdvanceUnitSearch';
    this._service.Post(payload, url).subscribe({
      next: (result: any) => {
        if (result.status) {
          this.projectlist = result.data

          this.rerender();
        } else {
          this.toastr.error(result.message, "Error")
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
    this.projectlist = [];
    this.form.reset({
      project: '',
      building: '',
      zone: '',
      subZone: '',
      propertyItemType: '',
      unitCategory: '',
      propertyStatus: '',
      floor: '',
      district: '',
      city: '',
      region: '',
      facingCode: '',
    });
    this.rerender();
    this.GetProject();
    this.GetBuliding();
    this.GetZone();
    this.GetSubZone();

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
  GetProject() {

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

    let url = '/PropertyStructure/buildings';
    if (id > 0) {
      url = '/PropertyStructure/buildings?projectid=' + id;
    }
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
    let url = '/PropertyStructure/zones';
    if (id > 0) {
      url = '/PropertyStructure/zones?buildingid=' + id;
    }

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

    let url = '/PropertyStructure/subzones';
    if (id > 0) {
      url = '/PropertyStructure/subzones?zoneid=' + id;
    }
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

    if (DDType == 'Project') {

      this.GetBuliding(data.id)
    }
    if (DDType === 'Building') {
      this.GetZone();
      this.GetSubZone();
      this.GetZone(data.id)
    }
    if (DDType === 'Zone') {

      this.GetSubZone();
      this.GetSubZone(data.id)
    }
  }
}
